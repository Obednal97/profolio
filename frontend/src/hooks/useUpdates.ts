import { useState, useEffect, useCallback, useRef } from 'react';
import { useUnifiedAuth } from '@/lib/unifiedAuth';
import { mockReleases } from '@/config/mockReleases';

export interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  releaseNotes: string;
  publishedAt: string;
  downloadUrl: string;
  allReleases?: GitHubRelease[];
}

export interface UpdateProgress {
  stage: 'checking' | 'downloading' | 'installing' | 'restarting' | 'complete' | 'error';
  message: string;
  progress: number; // 0-100
  error?: string;
  logs?: string[];
}

export interface GitHubRelease {
  version: string;
  name: string;
  body: string;
  publishedAt: string;
  downloadUrl: string;
  isLatest: boolean;
}

export interface UseUpdatesReturn {
  updateInfo: UpdateInfo | null;
  updateProgress: UpdateProgress | null;
  isChecking: boolean;
  isUpdating: boolean;
  hasUpdate: boolean;
  checkForUpdates: (force?: boolean, includeAllReleases?: boolean) => Promise<void>;
  startUpdate: (version?: string) => Promise<void>;
  cancelUpdate: () => Promise<void>;
  clearUpdateStatus: () => void;
  lastChecked: Date | null;
  isDemoMode: boolean;
}

export function useUpdates(): UseUpdatesReturn {
  const { token } = useUnifiedAuth();
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [updateProgress, setUpdateProgress] = useState<UpdateProgress | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  // Use refs to track abort controllers for cleanup
  const githubAbortControllerRef = useRef<AbortController | null>(null);
  const backendAbortControllerRef = useRef<AbortController | null>(null);
  const statusAbortControllerRef = useRef<AbortController | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Check if we're in self-hosted mode or development (for testing)
  const isSelfHosted = useCallback(() => {
    // Allow in development mode for testing
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    
    return process.env.NEXT_PUBLIC_DEPLOYMENT_MODE !== 'cloud' && 
           !process.env.NEXT_PUBLIC_DISABLE_UPDATES;
  }, []);

  // Check if we're in demo mode (no actual updates allowed)
  const isDemoMode = useCallback(() => {
    return process.env.NODE_ENV === 'development' || !token;
  }, [token]);

  // API headers with auth - memoized
  const getHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }), [token]);

  // Cleanup function for all abort controllers
  const cleanup = useCallback(() => {
    if (githubAbortControllerRef.current) {
      githubAbortControllerRef.current.abort();
      githubAbortControllerRef.current = null;
    }
    if (backendAbortControllerRef.current) {
      backendAbortControllerRef.current.abort();
      backendAbortControllerRef.current = null;
    }
    if (statusAbortControllerRef.current) {
      statusAbortControllerRef.current.abort();
      statusAbortControllerRef.current = null;
    }
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
  }, [eventSource]);

  // Fetch real GitHub releases for demo purposes - optimized with proper cleanup
  const fetchGitHubReleases = useCallback(async () => {
    // Cancel any ongoing GitHub request
    if (githubAbortControllerRef.current) {
      githubAbortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const controller = new AbortController();
    githubAbortControllerRef.current = controller;

    try {
      // Increase limit to get more releases and ensure we capture the latest ones
      const response = await fetch('https://api.github.com/repos/Obednal97/profolio/releases?per_page=30', {
        signal: controller.signal,
      });
      
      if (controller.signal.aborted) return null;
      
      if (response.ok) {
        const releases = await response.json() as Array<{
          tag_name: string;
          name?: string;
          body?: string;
          published_at: string;
          html_url: string;
          prerelease: boolean;
          draft: boolean;
        }>;
        
        if (controller.signal.aborted) return null;
        
        // Filter out prereleases and drafts, then sort by published date (newest first)
        const stableReleases = releases
          .filter(release => !release.prerelease && !release.draft)
          .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
          .map((release, index) => ({
            version: release.tag_name.replace(/^v/, ''), // Remove 'v' prefix if present
            name: release.name || `Release ${release.tag_name}`,
            body: release.body || 'No release notes available.',
            publishedAt: release.published_at,
            downloadUrl: release.html_url,
            isLatest: index === 0 // First release after sorting is latest
          }));
          
        // Debug log to help troubleshoot if still having issues
        if (process.env.NODE_ENV === 'development') {
          console.log('GitHub Releases fetched:', stableReleases.map(r => `v${r.version} (${r.publishedAt})`));
        }
          
        return stableReleases;
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('GitHub API response not ok:', response.status, response.statusText);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was aborted, this is expected
        return null;
      }
      if (process.env.NODE_ENV === 'development') {
        console.log('GitHub API error:', error);
        console.log('GitHub API not available, using mock data for demo');
      }
    }
    return null;
  }, []);

  // Check for updates - optimized with proper cleanup
  const checkForUpdates = useCallback(async (force = false, includeAllReleases = false) => {
    setIsChecking(true);
    
    try {
      // Always try to fetch from GitHub first (works for all installation types including demo)
      const githubReleases = await fetchGitHubReleases();
      
      if (githubReleases && githubReleases.length > 0) {
        // Use real GitHub data
        const latestRelease = githubReleases[0];
        // Get current version from environment variable set at build time or fallback
        const currentVersion = process.env.NEXT_PUBLIC_APP_VERSION || '1.3.0';
        
        const updateInfo: UpdateInfo = {
          currentVersion,
          latestVersion: latestRelease.version,
          hasUpdate: latestRelease.version !== currentVersion,
          releaseNotes: latestRelease.body,
          publishedAt: latestRelease.publishedAt,
          downloadUrl: latestRelease.downloadUrl,
          allReleases: githubReleases
        };
        
        setUpdateInfo(updateInfo);
        setLastChecked(new Date());
        setIsChecking(false);
        return;
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was aborted, this is expected
        return;
      }
      if (process.env.NODE_ENV === 'development') {
        console.log('Failed to fetch from GitHub, using mock data');
      }
    }
    
    // Fallback to backend API only for self-hosted installations with auth
    if (isSelfHosted() && token) {
      // Cancel any ongoing backend request
      if (backendAbortControllerRef.current) {
        backendAbortControllerRef.current.abort();
      }

      // Create new AbortController for this request
      const controller = new AbortController();
      backendAbortControllerRef.current = controller;

      try {
        const endpoint = force ? '/api/api/updates/check' : '/api/api/updates/check';
        const method = force ? 'POST' : 'GET';
        
        const params = new URLSearchParams();
        if (includeAllReleases) {
          params.append('includeAllReleases', 'true');
        }
        
        const url = `${API_BASE}${endpoint}${params.toString() ? `?${params}` : ''}`;
        
        const response = await fetch(url, {
          method,
          headers: getHeaders(),
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        if (response.ok) {
          const data: UpdateInfo | null = await response.json();
          if (!controller.signal.aborted) {
            setUpdateInfo(data);
            setLastChecked(new Date());
            setIsChecking(false);
          }
          return;
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Request was aborted, this is expected
          return;
        }
        if (process.env.NODE_ENV === 'development') {
          console.log('Backend API failed, falling back to mock data');
        }
      }
    }
    
    // Final fallback to mock data for development/demo
    const mockUpdateInfo: UpdateInfo = {
      currentVersion: '1.7.1',
      latestVersion: '1.7.1',
      hasUpdate: false,
      releaseNotes: `## 🚀 New Features
- Mobile navigation bar for seamless app navigation
- Enhanced authentication flow with Google OAuth priority
- Responsive pricing page with feature comparison tables
- FAQ sections with smooth animations
- Demo mode consistency across all pages

## ✨ Improvements  
- Mobile-first responsive design across all pages
- Optimised spacing and typography for mobile devices
- Enhanced glass effects and visual polish
- Improved footer layout and mobile navigation spacing
- Better text wrapping and markdown support in release notes

## 🐛 Bug Fixes
- Fixed footer overlap issues on mobile devices
- Resolved authentication page layout inconsistencies
- Fixed apostrophe rendering in UI text
- Corrected pricing card height alignment
- Fixed release sorting and filtering issues`,
      publishedAt: '2025-01-06T14:00:00Z',
      downloadUrl: 'https://github.com/Obednal97/profolio/releases/latest',
      allReleases: mockReleases
    };
    
    setUpdateInfo(mockUpdateInfo);
    setLastChecked(new Date());
    setIsChecking(false);
  }, [token, API_BASE, fetchGitHubReleases, getHeaders, isSelfHosted]);

  // Start update process - optimized
  const startUpdate = useCallback(async (version?: string) => {
    // Prevent updates in demo mode
    if (isDemoMode()) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Updates disabled in demo mode');
      }
      return;
    }

    if (!isSelfHosted() || !token) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`${API_BASE}/api/api/updates/start`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ version })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Set up Server-Sent Events for progress tracking
      const sse = new EventSource(`${API_BASE}/api/api/updates/progress`, {
        withCredentials: true
      });

      sse.onmessage = (event) => {
        try {
          const progress: UpdateProgress = JSON.parse(event.data);
          setUpdateProgress(progress);
          
          // Stop listening when update is complete or failed
          if (progress && ['complete', 'error'].includes(progress.stage)) {
            sse.close();
            setEventSource(null);
            setIsUpdating(false);
            
            // If successful, refresh update info
            if (progress.stage === 'complete') {
              setTimeout(() => {
                checkForUpdates(true);
              }, 2000);
            }
          }
        } catch {
          // Error parsing handled silently
        }
      };

      sse.onerror = () => {
        sse.close();
        setEventSource(null);
        setIsUpdating(false);
      };

      setEventSource(sse);

    } catch {
      setIsUpdating(false);
      throw new Error('Failed to start update');
    }
  }, [token, API_BASE, checkForUpdates, isDemoMode, getHeaders, isSelfHosted]);

  // Cancel ongoing update - optimized
  const cancelUpdate = useCallback(async () => {
    if (!isSelfHosted() || !token) return;

    try {
      await fetch(`${API_BASE}/api/api/updates/cancel`, {
        method: 'POST',
        headers: getHeaders()
      });

      // Close SSE connection
      if (eventSource) {
        eventSource.close();
        setEventSource(null);
      }

      setIsUpdating(false);
      setUpdateProgress(null);
    } catch {
      // Error handling removed for cleaner development experience
    }
  }, [token, API_BASE, eventSource, getHeaders, isSelfHosted]);

  // Clear update status - optimized
  const clearUpdateStatus = useCallback(() => {
    setUpdateProgress(null);
    
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
    
    setIsUpdating(false);
  }, [eventSource]);

  // Periodic update checking (every 24 hours)
  useEffect(() => {
    // Always check for updates (including demo mode for changelog)
    checkForUpdates();

    // Set up 24-hour interval only for non-demo installations
    if (!isDemoMode()) {
      const interval = setInterval(() => {
        checkForUpdates();
      }, 24 * 60 * 60 * 1000); // 24 hours

      return () => {
        clearInterval(interval);
        cleanup();
      };
    }

    // Cleanup for demo mode
    return cleanup;
  }, [checkForUpdates, isDemoMode, cleanup]); // Remove checkForUpdates from dependencies to prevent infinite loop

  // Get current update status on mount - optimized with cleanup
  useEffect(() => {
    // Only check update status for non-demo installations
    if (isDemoMode() || !isSelfHosted() || !token) return;

    const getUpdateStatus = async () => {
      // Cancel any ongoing status request
      if (statusAbortControllerRef.current) {
        statusAbortControllerRef.current.abort();
      }

      // Create new AbortController for this request
      const controller = new AbortController();
      statusAbortControllerRef.current = controller;

      try {
        const response = await fetch(`${API_BASE}/api/api/updates/status`, {
          headers: getHeaders(),
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        if (response.ok) {
          const progress: UpdateProgress | null = await response.json();
          if (progress && !controller.signal.aborted) {
            setUpdateProgress(progress);
            setIsUpdating(!['complete', 'error'].includes(progress.stage));
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Request was aborted, this is expected
          return;
        }
        // Error handling removed for cleaner development experience
      }
    };

    getUpdateStatus();
  }, [token, API_BASE, getHeaders, isDemoMode, isSelfHosted]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    updateInfo,
    updateProgress,
    isChecking,
    isUpdating,
    hasUpdate: updateInfo?.hasUpdate || false,
    checkForUpdates,
    startUpdate,
    cancelUpdate,
    clearUpdateStatus,
    lastChecked,
    isDemoMode: isDemoMode() // Expose demo mode status to UI
  };
} 