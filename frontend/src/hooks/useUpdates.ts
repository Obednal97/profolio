import { useState, useEffect, useCallback } from 'react';
import { useUnifiedAuth } from '@/lib/unifiedAuth';

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

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Check if we're in self-hosted mode or development (for testing)
  const isSelfHosted = () => {
    // Allow in development mode for testing
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    
    return process.env.NEXT_PUBLIC_DEPLOYMENT_MODE !== 'cloud' && 
           !process.env.NEXT_PUBLIC_DISABLE_UPDATES;
  };

  // Check if we're in demo mode (no actual updates allowed)
  const isDemoMode = () => {
    return process.env.NODE_ENV === 'development' || !token;
  };

  // API headers with auth
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  });

  // Fetch real GitHub releases for demo purposes
  const fetchGitHubReleases = async () => {
    try {
      // Use the actual Profolio repository
      const response = await fetch('https://api.github.com/repos/Obednal97/profolio/releases?per_page=10');
      if (response.ok) {
        const releases = await response.json() as Array<{
          tag_name: string;
          name?: string;
          body?: string;
          published_at: string;
          html_url: string;
          prerelease: boolean;
        }>;
        
        // Filter out prereleases and map to our format
        const stableReleases = releases
          .filter(release => !release.prerelease)
          .map((release, index) => ({
            version: release.tag_name.replace(/^v/, ''), // Remove 'v' prefix if present
            name: release.name || `Release ${release.tag_name}`,
            body: release.body || 'No release notes available.',
            publishedAt: release.published_at,
            downloadUrl: release.html_url,
            isLatest: index === 0 // First release is latest
          }));
          
        return stableReleases;
      }
    } catch {
      console.log('GitHub API not available, using mock data for demo');
    }
    return null;
  };

  // Check for updates
  const checkForUpdates = useCallback(async (force = false, includeAllReleases = false) => {
    setIsChecking(true);
    
    try {
      // Always try to fetch from GitHub first (works for all installation types including demo)
      const githubReleases = await fetchGitHubReleases();
      
      if (githubReleases && githubReleases.length > 0) {
        // Use real GitHub data
        const latestRelease = githubReleases[0];
        const currentVersion = '2.1.2'; // This should come from your app's package.json or environment
        
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
    } catch {
      console.log('Failed to fetch from GitHub, using mock data');
    }
    
    // Fallback to backend API only for self-hosted installations with auth
    if (isSelfHosted() && token) {
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
          headers: getHeaders()
        });

        if (response.ok) {
          const data: UpdateInfo | null = await response.json();
          setUpdateInfo(data);
          setLastChecked(new Date());
          setIsChecking(false);
          return;
        }
      } catch {
        console.log('Backend API failed, falling back to mock data');
      }
    }
    
    // Final fallback to mock data for development/demo
    const mockReleases = [
      {
        version: '2.2.0',
        name: 'Profolio v2.2.0 - Major Update',
        body: `## 🚀 New Features
- Advanced notification system with real-time updates
- Comprehensive changelog with sidebar navigation
- Improved update management interface
- Enhanced dark mode theme support
- Mobile-responsive design improvements

## ✨ Improvements  
- Faster asset synchronization
- Better error handling and user feedback
- Optimized API performance
- Improved accessibility features
- Enhanced security measures

## 🐛 Bug Fixes
- Fixed authentication token refresh issues
- Resolved dashboard loading performance
- Fixed notification badge counter accuracy
- Corrected timezone handling in date displays
- Fixed responsive layout issues on mobile`,
        publishedAt: new Date().toISOString(),
        downloadUrl: 'https://github.com/Obednal97/profolio/releases/latest',
        isLatest: true
      },
      {
        version: '2.1.2',
        name: 'Profolio v2.1.2 - Hotfix Release',
        body: `## 🐛 Bug Fixes
- Critical security patch for authentication
- Fixed portfolio sync timeout issues
- Resolved API rate limiting problems
- Fixed dashboard crash on large portfolios

## ✨ Improvements
- Better error messages for failed operations
- Improved logging for debugging
- Enhanced performance monitoring`,
        publishedAt: '2024-05-28T10:00:00Z',
        downloadUrl: 'https://github.com/Obednal97/profolio/releases/tag/v2.1.2',
        isLatest: false
      },
      {
        version: '2.1.1',
        name: 'Profolio v2.1.1 - Stability Update',
        body: `## 🐛 Bug Fixes
- Fixed asset import validation errors
- Resolved memory leaks in portfolio calculations
- Fixed timezone issues in transaction history
- Corrected currency conversion edge cases

## ✨ Improvements
- Enhanced CSV import performance
- Better validation for manual asset entries
- Improved error recovery mechanisms`,
        publishedAt: '2024-05-20T14:30:00Z',
        downloadUrl: 'https://github.com/Obednal97/profolio/releases/tag/v2.1.1',
        isLatest: false
      },
      {
        version: '2.1.0',
        name: 'Profolio v2.1.0 - Feature Release',
        body: `## 🚀 New Features
- Real-time portfolio notifications
- Advanced filtering and search capabilities
- Bulk asset management operations
- Export functionality for reports
- Custom dashboard widgets

## ✨ Improvements
- Enhanced portfolio dashboard performance
- Improved API key management interface
- Better error messages for failed syncs
- Updated asset pricing accuracy
- Faster data synchronization

## 🐛 Bug Fixes
- Fixed asset sync timeout issues
- Resolved chart rendering on Safari
- Fixed settings page validation
- Corrected currency conversion accuracy`,
        publishedAt: '2024-05-15T10:00:00Z',
        downloadUrl: 'https://github.com/Obednal97/profolio/releases/tag/v2.1.0',
        isLatest: false
      },
      {
        version: '2.0.8',
        name: 'Profolio v2.0.8 - Maintenance Release',
        body: `## 🐛 Bug Fixes
- Fixed authentication session expiry handling
- Resolved duplicate transaction imports
- Fixed portfolio value calculation edge cases
- Corrected asset allocation percentages

## ✨ Improvements
- Better error handling for API failures
- Enhanced logging for troubleshooting
- Improved data validation`,
        publishedAt: '2024-05-05T16:00:00Z',
        downloadUrl: 'https://github.com/Obednal97/profolio/releases/tag/v2.0.8',
        isLatest: false
      },
      {
        version: '2.0.7',
        name: 'Profolio v2.0.7 - Security Update',
        body: `## 🔒 Security
- Updated dependencies with security patches
- Enhanced authentication security
- Improved API key protection
- Better session management

## 🐛 Bug Fixes
- Fixed cross-browser compatibility issues
- Resolved mobile layout problems
- Fixed date picker timezone issues`,
        publishedAt: '2024-04-25T12:00:00Z',
        downloadUrl: 'https://github.com/Obednal97/profolio/releases/tag/v2.0.7',
        isLatest: false
      },
      {
        version: '2.0.5',
        name: 'Profolio v2.0.5 - Performance Update',
        body: `## ✨ Improvements
- Enhanced portfolio dashboard performance
- Improved API key management interface
- Better error messages for failed syncs
- Faster asset price updates
- Optimized database queries

## 🐛 Bug Fixes
- Fixed asset sync timeout issues
- Resolved chart rendering on Safari
- Fixed settings page validation
- Corrected currency conversion accuracy
- Fixed notification display issues`,
        publishedAt: '2024-04-15T10:00:00Z',
        downloadUrl: 'https://github.com/Obednal97/profolio/releases/tag/v2.0.5',
        isLatest: false
      },
      {
        version: '2.0.0',
        name: 'Profolio v2.0.0 - Major Release',
        body: `## 🎉 Major Release
- Complete UI/UX redesign with modern interface
- New portfolio analytics and insights
- Advanced asset management capabilities
- Multi-currency support
- Real-time market data integration

## ✨ New Features
- Interactive portfolio charts
- Advanced filtering and sorting
- Bulk operations for assets
- Customizable dashboard
- Dark mode support

## ⚠️ Breaking Changes
- Updated API endpoints for better REST compliance
- Changed configuration file format
- Migrated to new authentication system
- Updated database schema (automatic migration included)

## 🐛 Bug Fixes
- Fixed numerous legacy issues
- Improved error handling
- Better mobile responsiveness`,
        publishedAt: '2024-04-01T10:00:00Z',
        downloadUrl: 'https://github.com/Obednal97/profolio/releases/tag/v2.0.0',
        isLatest: false
      }
    ];
    
    const mockUpdateInfo: UpdateInfo = {
      currentVersion: '2.1.2',
      latestVersion: '2.2.0',
      hasUpdate: true,
      releaseNotes: `## 🚀 New Features
- Advanced notification system with real-time updates
- Comprehensive changelog with sidebar navigation
- Improved update management interface
- Enhanced dark mode theme support
- Mobile-responsive design improvements

## ✨ Improvements  
- Faster asset synchronization
- Better error handling and user feedback
- Optimized API performance
- Improved accessibility features
- Enhanced security measures

## 🐛 Bug Fixes
- Fixed authentication token refresh issues
- Resolved dashboard loading performance
- Fixed notification badge counter accuracy
- Corrected timezone handling in date displays
- Fixed responsive layout issues on mobile`,
      publishedAt: new Date().toISOString(),
      downloadUrl: 'https://github.com/Obednal97/profolio/releases/latest',
      allReleases: mockReleases
    };
    
    setUpdateInfo(mockUpdateInfo);
    setLastChecked(new Date());
    setIsChecking(false);
  }, [token, API_BASE]);

  // Start update process
  const startUpdate = useCallback(async (version?: string) => {
    // Prevent updates in demo mode
    if (isDemoMode()) {
      console.log('Updates disabled in demo mode');
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
  }, [token, API_BASE, checkForUpdates, isDemoMode]);

  // Cancel ongoing update
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
  }, [token, API_BASE, eventSource]);

  // Clear update status
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
        if (eventSource) {
          eventSource.close();
        }
      };
    }

    // Cleanup for demo mode
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []); // Remove checkForUpdates from dependencies to prevent infinite loop

  // Get current update status on mount
  useEffect(() => {
    // Only check update status for non-demo installations
    if (isDemoMode() || !isSelfHosted() || !token) return;

    const getUpdateStatus = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/api/updates/status`, {
          headers: getHeaders()
        });

        if (response.ok) {
          const progress: UpdateProgress | null = await response.json();
          if (progress) {
            setUpdateProgress(progress);
            setIsUpdating(!['complete', 'error'].includes(progress.stage));
          }
        }
      } catch {
        // Error handling removed for cleaner development experience
      }
    };

    getUpdateStatus();
  }, [token, API_BASE]); // Remove isDemoMode from dependencies

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