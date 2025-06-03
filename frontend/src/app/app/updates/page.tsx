'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  ChevronDown,
  Settings,
  Cloud,
  Server
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
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [autoUpdatesEnabled, setAutoUpdatesEnabled] = useState(false);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string>('');

  // Detect deployment mode - cloud vs self-hosted
  const isCloudMode = isDemoMode || (
    typeof window !== 'undefined' && 
    !window.location.hostname.includes('localhost') &&
    !window.location.hostname.includes('127.0.0.1') &&
    !window.location.hostname.includes('local')
  );
  
  const isSelfHosted = !isCloudMode;

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

  // Auto-check for updates on page load (only for self-hosted)
  useEffect(() => {
    if (!updateInfo && !isChecking && isSelfHosted) {
      checkForUpdates(false, true); // Request all releases for changelog
    }
  }, [updateInfo, isChecking, checkForUpdates, isSelfHosted]);

  // Parse changelog from GitHub releases
  useEffect(() => {
    if (updateInfo?.allReleases) {
      const parsedChangelog = parseChangelog(updateInfo.allReleases);
      setChangelog(parsedChangelog);
      // Auto-select latest version if none selected
      if (!selectedVersion && parsedChangelog.length > 0) {
        setSelectedVersion(parsedChangelog[0].version);
      }
    } else if (updateInfo?.releaseNotes) {
      // Fallback to single release if allReleases not available
      const parsedChangelog = parseChangelogFromReleaseNotes(updateInfo.releaseNotes, updateInfo.latestVersion, updateInfo.publishedAt);
      setChangelog(parsedChangelog);
      if (!selectedVersion && parsedChangelog.length > 0) {
        setSelectedVersion(parsedChangelog[0].version);
      }
    }
  }, [updateInfo, selectedVersion]);

  // Parse multiple GitHub releases into structured changelog
  const parseChangelog = (releases: GitHubRelease[]): ChangelogEntry[] => {
    // Sort releases by date in descending order (newest first)
    const sortedReleases = [...releases].sort((a, b) => {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    return sortedReleases.map(release => {
      const sections: { id: string; title: string; items: string[] }[] = [];
      let currentSection: { id: string; title: string; items: string[] } | null = null;
      let inCodeBlock = false;
      let codeBlockContent = '';

      const lines = release.body.split('\n');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Handle code block start/end
        if (trimmedLine.startsWith('```')) {
          if (inCodeBlock) {
            // End of code block
            if (currentSection && codeBlockContent.trim()) {
              currentSection.items.push('```\n' + codeBlockContent + '\n```');
            }
            inCodeBlock = false;
            codeBlockContent = '';
          } else {
            // Start of code block
            inCodeBlock = true;
            codeBlockContent = '';
          }
          continue;
        }
        
        // If we're in a code block, accumulate content
        if (inCodeBlock) {
          codeBlockContent += line + '\n';
          continue;
        }
        
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
      
      // Handle any remaining code block
      if (inCodeBlock && currentSection && codeBlockContent.trim()) {
        currentSection.items.push('```\n' + codeBlockContent + '\n```');
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
    return new Date(dateString).toLocaleDateString('en-GB', {
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

  // Get selected release for display
  const selectedRelease = useMemo(() => {
    return changelog.find(release => release.version === selectedVersion);
  }, [changelog, selectedVersion]);

  // Enhanced function to process and format release note items with markdown support
  const formatReleaseItem = (item: string) => {
    // Detect if the item contains code patterns
    const codePatterns = [
      /^```[\s\S]*```$/m, // Fenced code blocks
      /^[\s]*[\w-]+\s*-c\s*["`].*["`]$/m, // Shell commands with -c flag
      /^[\s]*curl\s+.*$/m, // curl commands
      /^[\s]*bash\s+.*$/m, // bash commands
      /^[\s]*npm\s+.*$/m, // npm commands
      /^[\s]*git\s+.*$/m, // git commands
      /^[\s]*docker\s+.*$/m, // docker commands
      /^[\s]*https?:\/\/.*\.(sh|js|ts|py|rb).*$/m, // Script URLs
    ];

    const isCode = codePatterns.some(pattern => pattern.test(item));
    
    if (isCode) {
      // Remove markdown code fences if present
      const cleanCode = item.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '');
      
      return (
        <div className="bg-gray-900 dark:bg-black rounded-lg p-3 mt-2 overflow-x-auto">
          <code className="text-green-400 font-mono text-sm whitespace-pre-wrap break-all">
            {cleanCode}
          </code>
        </div>
      );
    }

    // Enhanced markdown parsing with better overlap handling
    const parseMarkdown = (text: string) => {
      const parts: (string | React.ReactElement)[] = [];
      
      // Process markdown step by step to avoid conflicts
      let processedText = text;
      let elementCounter = 0;
      
      // Step 1: Handle links first (they can contain other formatting)
      processedText = processedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
        const placeholder = `__LINK_${elementCounter}__`;
        parts.push(
          <a
            key={`link-${elementCounter}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline break-all"
          >
            {linkText}
          </a>
        );
        elementCounter++;
        return placeholder;
      });
      
      // Step 2: Handle inline code (prevent other formatting inside)
      processedText = processedText.replace(/`([^`]+)`/g, (match, codeText) => {
        const placeholder = `__CODE_${elementCounter}__`;
        parts.push(
          <code key={`code-${elementCounter}`} className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">
            {codeText}
          </code>
        );
        elementCounter++;
        return placeholder;
      });
      
      // Step 3: Handle bold text
      processedText = processedText.replace(/\*\*([^*]+)\*\*/g, (match, boldText) => {
        const placeholder = `__BOLD_${elementCounter}__`;
        parts.push(
          <strong key={`bold-${elementCounter}`} className="font-semibold">
            {boldText}
          </strong>
        );
        elementCounter++;
        return placeholder;
      });
      
      // Step 4: Handle italic text
      processedText = processedText.replace(/\*([^*]+)\*/g, (match, italicText) => {
        const placeholder = `__ITALIC_${elementCounter}__`;
        parts.push(
          <em key={`italic-${elementCounter}`} className="italic">
            {italicText}
          </em>
        );
        elementCounter++;
        return placeholder;
      });
      
      // Step 5: Handle strikethrough
      processedText = processedText.replace(/~~([^~]+)~~/g, (match, strikeText) => {
        const placeholder = `__STRIKE_${elementCounter}__`;
        parts.push(
          <span key={`strike-${elementCounter}`} className="line-through">
            {strikeText}
          </span>
        );
        elementCounter++;
        return placeholder;
      });
      
      // Step 6: Reconstruct the final content with placeholders replaced
      const finalParts: (string | React.ReactElement)[] = [];
      const textParts = processedText.split(/(__\w+_\d+__)/);
      
      textParts.forEach((part) => {
        if (part.match(/^__\w+_\d+__$/)) {
          // Find the corresponding React element
          const elementIndex = parseInt(part.match(/\d+/)?.[0] || '0');
          const element = parts.find((_, i) => i === elementIndex);
          if (element && typeof element !== 'string') {
            finalParts.push(element);
          }
        } else if (part.trim()) {
          finalParts.push(part);
        }
      });
      
      return finalParts.length > 0 ? finalParts : [text];
    };

    // Check if it's a standalone URL
    const urlRegex = /^https?:\/\/[^\s]+$/;
    if (urlRegex.test(item.trim())) {
      return (
        <a 
          href={item.trim()} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline break-all"
        >
          {item.trim()}
        </a>
      );
    }

    // Parse and render markdown
    const formattedContent = parseMarkdown(item);
    
    return (
      <span>
        {formattedContent.map((part, index) => 
          typeof part === 'string' ? part : React.cloneElement(part as React.ReactElement, { key: `final-${index}` })
        )}
      </span>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Mobile-First Layout: Single column on mobile, Sidebar on desktop */}
      <div className="relative z-10">
        {/* Mobile Header - Visible only on mobile */}
        <div className="lg:hidden">
          <div className="sticky top-0 backdrop-blur-sm border-b border-white/10 dark:border-gray-700/30 p-4 z-20">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                {isCloudMode ? (
                  <Cloud className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Server className="h-6 w-6 text-green-600 dark:text-green-400" />
                )}
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Updates
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {isCloudMode ? 'Managed updates and release history' : 'System updates and release history'}
              </p>
            </div>
          </div>
        </div>

        {/* Desktop Layout with Sidebar */}
        <div className="max-w-7xl mx-auto lg:flex lg:gap-8 p-4 lg:p-6">
          {/* Desktop Sidebar - Hidden on mobile */}
          <div className="hidden lg:block w-80 flex-shrink-0">
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
                  ) : hasUpdate && isSelfHosted ? (
                    <Download className="h-6 w-6 text-orange-500" />
                  ) : (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {hasUpdate && isSelfHosted ? 'Update Available' : 'Up to Date'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {updateInfo ? `v${updateInfo.currentVersion}` : 'v1.7.1'}
                    </p>
                  </div>
                  {isCloudMode && (
                    <div className="ml-auto">
                      <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                        Cloud Managed
                      </div>
                    </div>
                  )}
                </div>

                {hasUpdate && isSelfHosted && updateInfo && (
                  <div className="space-y-3">
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Latest Version</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        v{updateInfo.latestVersion}
                      </p>
                    </div>
                    
                    {!isUpdating && !updateProgress && (
                      <button
                        onClick={handleStartUpdate}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                      >
                        <Play className="h-4 w-4" />
                        Install Update
                      </button>
                    )}
                  </div>
                )}

                {isSelfHosted && (
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
                )}
              </div>

              {/* System Info */}
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
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Auto Updates:</span>
                    {isCloudMode ? (
                      <span className="text-gray-500 dark:text-gray-500">Cloud Managed</span>
                    ) : (
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
                    )}
                  </div>
                </div>
              </div>

              {/* Release Selection - Desktop */}
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
                          onClick={() => setSelectedVersion(release.version)}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                            selectedVersion === release.version
                              ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className="min-w-0 break-words">
                            <div className="text-sm font-medium truncate">Version {release.version}</div>
                            <div className="text-xs opacity-75 break-words">{formatDate(release.date)}</div>
                          </div>
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-4 lg:space-y-6">
            {/* Desktop Header - Hidden on mobile */}
            <div className="hidden lg:block mb-8">
              <div className="flex items-center gap-3 mb-2">
                {isCloudMode ? (
                  <Cloud className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Server className="h-8 w-8 text-green-600 dark:text-green-400" />
                )}
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Updates
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {isCloudMode ? 'Managed updates and release history' : 'System updates and release history'}
              </p>
            </div>

            {/* Mobile Cards - Visible only on mobile */}
            <div className="lg:hidden space-y-3">
              {/* Current Version Status - Mobile */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-4">
                  {updateProgress?.stage === 'complete' ? (
                    <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
                  ) : updateProgress?.stage === 'error' ? (
                    <AlertCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
                  ) : isChecking || isUpdating ? (
                    <RefreshCw className="h-8 w-8 text-blue-500 animate-spin flex-shrink-0" />
                  ) : hasUpdate && isSelfHosted ? (
                    <Download className="h-8 w-8 text-orange-500 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {hasUpdate && isSelfHosted ? 'Update Available' : 'Up to Date'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {updateInfo ? `v${updateInfo.currentVersion}` : 'v1.7.1'}
                    </p>
                  </div>
                  {isCloudMode && (
                    <div className="text-right">
                      <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                        Cloud Managed
                      </div>
                    </div>
                  )}
                </div>

                {hasUpdate && isSelfHosted && updateInfo && (
                  <div className="space-y-4 mt-4">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Latest Version</p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        v{updateInfo.latestVersion}
                      </p>
                    </div>
                    
                    {!isUpdating && !updateProgress && (
                      <button
                        onClick={handleStartUpdate}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                      >
                        <Play className="h-5 w-5" />
                        Install Update
                      </button>
                    )}
                  </div>
                )}

                {isSelfHosted && (
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
                )}
              </div>

              {/* System Info - Mobile */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Info
                </h3>
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Last Checked:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {lastChecked ? formatDate(lastChecked.toISOString()) : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Channel:</span>
                    <span className="text-gray-900 dark:text-white font-medium">Stable</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Auto Updates:</span>
                    {isCloudMode ? (
                      <span className="text-gray-500 dark:text-gray-500">Cloud Managed</span>
                    ) : (
                      <button
                        onClick={handleAutoUpdatesToggle}
                        disabled={isUpdatingSettings}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                          autoUpdatesEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                        aria-label="Toggle auto updates"
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            autoUpdatesEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Release Selection - Mobile */}
              {changelog.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    Releases
                  </h3>
                  
                  {/* Version Dropdown */}
                  <div className="relative">
                    <select
                      value={selectedVersion}
                      onChange={(e) => setSelectedVersion(e.target.value)}
                      className="w-full appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors break-words"
                    >
                      {changelog.map((release) => (
                        <option key={release.version} value={release.version} className="break-words">
                          Version {release.version} - {formatDate(release.date)}
                          {hasUpdate && updateInfo?.latestVersion === release.version ? ' (Latest)' : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>

            {/* Update Progress */}
            {updateProgress && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white break-words">
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
                    <p className="text-sm text-red-800 dark:text-red-400 mb-3 break-words">
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
                      <div className="p-3 bg-black text-green-400 rounded-lg text-xs font-mono max-h-40 overflow-y-auto break-all">
                        {updateProgress.logs.map((log, index) => (
                          <div key={index} className="break-all">{log}</div>
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

            {/* Selected Release Details */}
            {selectedRelease ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Version Header */}
                <div className="p-3 lg:p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Tag className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
                          Version {selectedRelease.version}
                        </h2>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">{formatDate(selectedRelease.date)}</span>
                          {hasUpdate && updateInfo?.latestVersion === selectedRelease.version && (
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
                      className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded"
                      title="View on GitHub"
                    >
                      <ExternalLink className="h-5 w-5" />
                    </a>
                  </div>
                </div>

                {/* Sections */}
                <div className="p-4 lg:p-6">
                  {selectedRelease.sections.map((section) => (
                    <div key={section.id} className="mb-8 last:mb-0">
                      <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Hash className="h-5 w-5 text-gray-400" />
                        {section.title}
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                        <ul className="space-y-3">
                          {section.items.map((item, index) => (
                            <li key={index} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2.5 flex-shrink-0" />
                              <span className="leading-relaxed text-sm lg:text-base break-words overflow-hidden">{formatReleaseItem(item)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : isChecking ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 lg:p-12">
                <div className="text-center">
                  <RefreshCw className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Loading Releases
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Fetching the latest release information...
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 lg:p-12">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Releases Available
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {isCloudMode ? 'Release information will be displayed here.' : 'Unable to load release information. Please check for updates.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Bottom Padding for Navigation */}
        <div className="h-20 lg:hidden"></div>
      </div>
    </div>
  );
} 