'use client';

import { useEffect, useState } from 'react';
import { useUpdates, GitHubRelease } from '@/hooks/useUpdates';
import { 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Play,
  Square,
  RotateCcw,
  Calendar,
  Tag,
  Hash,
  ChevronRight,
  Settings
} from 'lucide-react';

interface ChangelogEntry {
  version: string;
  date: string;
  sections: {
    id: string;
    title: string;
    items: string[];
  }[];
}

export default function UpdatesPage() {
  const {
    updateInfo,
    updateProgress,
    isChecking,
    isUpdating,
    hasUpdate,
    checkForUpdates,
    startUpdate,
    cancelUpdate,
    clearUpdateStatus,
    lastChecked,
    isDemoMode
  } = useUpdates();

  const [showLogs, setShowLogs] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [autoUpdatesEnabled, setAutoUpdatesEnabled] = useState(false);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  // Check if this is a self-hosted deployment
  const isSelfHosted = !isDemoMode && (
    typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname.includes('local'))
  );

  // Load auto-updates setting on mount
  useEffect(() => {
    const loadAutoUpdatesSettings = async () => {
      if (!isSelfHosted) return;
      
      try {
        // Try to load from localStorage first (fallback)
        const stored = localStorage.getItem('autoUpdatesEnabled');
        if (stored) {
          setAutoUpdatesEnabled(JSON.parse(stored));
        }
        
        // TODO: Load from backend settings API when available
        // const response = await fetch('/api/settings/auto-updates');
        // if (response.ok) {
        //   const data = await response.json();
        //   setAutoUpdatesEnabled(data.enabled);
        // }
      } catch (error) {
        console.error('Failed to load auto-updates setting:', error);
      }
    };
    
    loadAutoUpdatesSettings();
  }, [isSelfHosted]);

  // Handle auto-updates toggle
  const handleAutoUpdatesToggle = async () => {
    if (!isSelfHosted || isUpdatingSettings) return;
    
    setIsUpdatingSettings(true);
    const newValue = !autoUpdatesEnabled;
    
    try {
      // Update localStorage immediately for responsiveness
      localStorage.setItem('autoUpdatesEnabled', JSON.stringify(newValue));
      setAutoUpdatesEnabled(newValue);
      
      // TODO: Update backend settings when API is available
      // await fetch('/api/settings/auto-updates', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ enabled: newValue })
      // });
      
    } catch (error) {
      console.error('Failed to update auto-updates setting:', error);
      // Revert on error
      setAutoUpdatesEnabled(!newValue);
      localStorage.setItem('autoUpdatesEnabled', JSON.stringify(!newValue));
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  // Auto-check for updates on page load
  useEffect(() => {
    if (!updateInfo && !isChecking) {
      checkForUpdates(false, true); // Request all releases for changelog
    }
  }, [updateInfo, isChecking, checkForUpdates]);

  // Parse changelog from GitHub releases
  useEffect(() => {
    if (updateInfo?.allReleases) {
      const parsedChangelog = parseChangelog(updateInfo.allReleases);
      setChangelog(parsedChangelog);
    } else if (updateInfo?.releaseNotes) {
      // Fallback to single release if allReleases not available
      const parsedChangelog = parseChangelogFromReleaseNotes(updateInfo.releaseNotes, updateInfo.latestVersion, updateInfo.publishedAt);
      setChangelog(parsedChangelog);
    }
  }, [updateInfo]);

  // Handle smooth scrolling to sections
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // Account for header height (approximately 80px) plus some padding
      const headerOffset = 120; // Increased to match sticky top-24 (96px) + extra padding
      const elementPosition = element.offsetTop;
      const offsetPosition = elementPosition - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveSection(sectionId);
    }
  };

  // Set up intersection observer to track active sections
  useEffect(() => {
    const observerOptions = {
      rootMargin: '-120px 0px -60% 0px', // Increased to match new header offset
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all release elements (now using version IDs)
    const releaseElements = document.querySelectorAll('[id^="v"]');
    releaseElements.forEach((el) => observer.observe(el));

    return () => {
      releaseElements.forEach((el) => observer.unobserve(el));
    };
  }, [changelog]);

  // Parse multiple GitHub releases into structured changelog
  const parseChangelog = (releases: GitHubRelease[]): ChangelogEntry[] => {
    return releases.map(release => {
      const sections: { id: string; title: string; items: string[] }[] = [];
      let currentSection: { id: string; title: string; items: string[] } | null = null;

      const lines = release.body.split('\n');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Section headers (### or ##)
        if (trimmedLine.startsWith('###') || trimmedLine.startsWith('##')) {
          if (currentSection && currentSection.items.length > 0) {
            sections.push(currentSection);
          }
          
          const title = trimmedLine.replace(/#{2,3}\s*/, '').trim();
          const id = `${release.version}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
          
          currentSection = {
            id,
            title,
            items: []
          };
        }
        // List items
        else if (trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
          if (currentSection) {
            const item = trimmedLine.replace(/^[-*]\s*/, '').trim();
            if (item) {
              currentSection.items.push(item);
            }
          }
        }
        // Regular paragraphs (if no current section, create a "Changes" section)
        else if (trimmedLine && !currentSection) {
          currentSection = {
            id: `${release.version}-changes`,
            title: 'Changes',
            items: []
          };
          if (trimmedLine) {
            currentSection.items.push(trimmedLine);
          }
        }
        // Add paragraphs to current section
        else if (trimmedLine && currentSection) {
          currentSection.items.push(trimmedLine);
        }
      }
      
      // Add the last section
      if (currentSection && currentSection.items.length > 0) {
        sections.push(currentSection);
      }
      
      // If no sections found, create a basic one
      if (sections.length === 0 && release.body.trim()) {
        sections.push({
          id: `${release.version}-overview`,
          title: 'Overview',
          items: [release.body.trim()]
        });
      }

      return {
        version: release.version,
        date: release.publishedAt,
        sections
      };
    });
  };

  // Parse release notes into structured changelog
  const parseChangelogFromReleaseNotes = (notes: string, version: string, date: string): ChangelogEntry[] => {
    const sections: { id: string; title: string; items: string[] }[] = [];
    let currentSection: { id: string; title: string; items: string[] } | null = null;

    const lines = notes.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Section headers (### or ##)
      if (trimmedLine.startsWith('###') || trimmedLine.startsWith('##')) {
        if (currentSection && currentSection.items.length > 0) {
          sections.push(currentSection);
        }
        
        const title = trimmedLine.replace(/#{2,3}\s*/, '').trim();
        const id = `${version}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        
        currentSection = {
          id,
          title,
          items: []
        };
      }
      // List items
      else if (trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        if (currentSection) {
          const item = trimmedLine.replace(/^[-*]\s*/, '').trim();
          if (item) {
            currentSection.items.push(item);
          }
        }
      }
      // Regular paragraphs (if no current section, create a "Changes" section)
      else if (trimmedLine && !currentSection) {
        currentSection = {
          id: `${version}-changes`,
          title: 'Changes',
          items: []
        };
      }
    }
    
    // Add the last section
    if (currentSection && currentSection.items.length > 0) {
      sections.push(currentSection);
    }
    
    // If no sections found, create a basic one
    if (sections.length === 0 && notes.trim()) {
      sections.push({
        id: `${version}-overview`,
        title: 'Overview',
        items: [notes.trim()]
      });
    }

    return [{
      version,
      date,
      sections
    }];
  };

  const handleStartUpdate = async () => {
    try {
      await startUpdate();
    } catch (error) {
      console.error('Failed to start update:', error);
    }
  };

  const handleCheckForUpdates = async () => {
    await checkForUpdates(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getProgressColor = () => {
    switch (updateProgress?.stage) {
      case 'complete': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'installing': return 'bg-blue-500';
      case 'downloading': return 'bg-blue-500';
      case 'restarting': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto flex gap-8 p-6">
        {/* Sidebar Navigation - Fixed below header */}
        <div className="w-80 flex-shrink-0">
          <div className="sticky top-24 h-[calc(100vh-8rem)] flex flex-col gap-4">
            {/* Update Status Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex-shrink-0">
              <div className="flex items-center gap-3 mb-4">
                {updateProgress?.stage === 'complete' ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : updateProgress?.stage === 'error' ? (
                  <AlertCircle className="h-6 w-6 text-red-500" />
                ) : isChecking || isUpdating ? (
                  <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
                ) : hasUpdate ? (
                  <Download className="h-6 w-6 text-orange-500" />
                ) : (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                )}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {hasUpdate ? 'Update Available' : 'Up to Date'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {updateInfo ? `v${updateInfo.currentVersion}` : 'Checking...'}
                  </p>
                </div>
              </div>

              {hasUpdate && updateInfo && (
                <div className="space-y-3">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Latest Version</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      v{updateInfo.latestVersion}
                    </p>
                  </div>
                  
                  {!isUpdating && !updateProgress && (
                    <>
                      {isDemoMode ? (
                        <div className="w-full text-center">
                          <button
                            disabled
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed font-medium"
                          >
                            <Play className="h-4 w-4" />
                            Install Update (Demo Mode)
                          </button>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Updates disabled in demo mode
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={handleStartUpdate}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                        >
                          <Play className="h-4 w-4" />
                          Install Update
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleCheckForUpdates}
                  disabled={isChecking || isUpdating}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
                  {isChecking ? 'Checking...' : 'Check for Updates'}
                </button>
              </div>
            </div>

            {/* Navigation Menu - Scrollable Releases */}
            {changelog.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col min-h-0 flex-1">
                <div className="p-4 pb-2 flex-shrink-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    Releases
                  </h3>
                </div>
                <div className="px-4 pb-4 overflow-y-auto flex-1 min-h-0">
                  <nav className="space-y-1">
                    {changelog.map((release) => (
                      <button
                        key={release.version}
                        onClick={() => scrollToSection(`v${release.version}`)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                          activeSection === `v${release.version}`
                            ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <ChevronRight className="h-4 w-4 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">Version {release.version}</div>
                          <div className="text-xs opacity-75">{formatDate(release.date)}</div>
                        </div>
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            )}

            {/* System Info - Always visible at bottom */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Info
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Last Checked:</span>
                  <span className="text-gray-900 dark:text-white">
                    {lastChecked ? formatDate(lastChecked.toISOString()) : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Channel:</span>
                  <span className="text-gray-900 dark:text-white">Stable</span>
                </div>
                {isSelfHosted ? (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Auto Updates:</span>
                    <button
                      onClick={handleAutoUpdatesToggle}
                      disabled={isUpdatingSettings}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                        autoUpdatesEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                      aria-label="Toggle auto updates"
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          autoUpdatesEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Auto Updates:</span>
                    <span className="text-gray-500 dark:text-gray-500">Cloud Managed</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Download className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Changelog
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Complete history of Profolio updates, features, and improvements
            </p>
          </div>

          {/* Update Progress */}
          {updateProgress && (
            <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {updateProgress.message}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {updateProgress.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
                    style={{ width: `${updateProgress.progress}%` }}
                  />
                </div>
              </div>

              {updateProgress.stage === 'error' && updateProgress.error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-400 mb-3">
                    {updateProgress.error}
                  </p>
                  <button
                    onClick={clearUpdateStatus}
                    className="flex items-center gap-2 px-3 py-1 text-sm text-red-600 hover:bg-red-100 dark:hover:bg-red-800/20 rounded-lg transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Try Again
                  </button>
                </div>
              )}

              {updateProgress.logs && updateProgress.logs.length > 0 && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowLogs(!showLogs)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2"
                  >
                    {showLogs ? 'Hide' : 'Show'} installation logs
                  </button>
                  {showLogs && (
                    <div className="p-3 bg-black text-green-400 rounded-lg text-xs font-mono max-h-40 overflow-y-auto">
                      {updateProgress.logs.map((log, index) => (
                        <div key={index}>{log}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {isUpdating && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={cancelUpdate}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Square className="h-4 w-4" />
                    Cancel Update
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Changelog Content */}
          {changelog.length > 0 ? (
            <div className="space-y-8">
              {changelog.map((entry) => (
                <div key={entry.version} id={`v${entry.version}`} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Version Header */}
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                          <Tag className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Version {entry.version}
                          </h2>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(entry.date)}</span>
                            {hasUpdate && updateInfo?.latestVersion === entry.version && (
                              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                                Latest
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <a
                        href={updateInfo?.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View on GitHub
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>

                  {/* Sections */}
                  <div className="p-6">
                    {entry.sections.map((section) => (
                      <div key={section.id} className="mb-8 last:mb-0">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <Hash className="h-5 w-5 text-gray-400" />
                          {section.title}
                        </h3>
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                          <ul className="space-y-2">
                            {section.items.map((item, index) => (
                              <li key={index} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                                <span className="leading-relaxed">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : isChecking ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12">
              <div className="text-center">
                <RefreshCw className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Loading Changelog
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Fetching the latest release information from GitHub...
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Changelog Available
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Unable to load changelog information. Please check for updates.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 