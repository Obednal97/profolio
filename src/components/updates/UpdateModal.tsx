'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  ExternalLink,
  Play,
  Square,
  RotateCcw
} from 'lucide-react';
import { useUpdates } from '@/hooks/useUpdates';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpdateModal({ isOpen, onClose }: UpdateModalProps) {
  const {
    updateInfo,
    updateProgress,
    isChecking,
    isUpdating,
    hasUpdate,
    checkForUpdates,
    startUpdate,
    cancelUpdate,
    clearUpdateStatus
  } = useUpdates();

  const [showLogs, setShowLogs] = useState(false);

  // Close modal when update completes successfully
  useEffect(() => {
    if (updateProgress?.stage === 'complete') {
      setTimeout(() => {
        onClose();
      }, 3000);
    }
  }, [updateProgress?.stage, onClose]);

  if (!isOpen) return null;

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderReleaseNotes = (notes: string) => {
    // Simple markdown-like rendering for release notes
    return notes
      .split('\n')
      .map((line, index) => {
        if (line.startsWith('##')) {
          return (
            <h3 key={index} className="text-lg font-semibold mt-4 mb-2 text-gray-900 dark:text-white">
              {line.replace('##', '').trim()}
            </h3>
          );
        }
        if (line.startsWith('###')) {
          return (
            <h4 key={index} className="text-md font-medium mt-3 mb-1 text-gray-800 dark:text-gray-200">
              {line.replace('###', '').trim()}
            </h4>
          );
        }
        if (line.startsWith('- ')) {
          return (
            <li key={index} className="text-sm text-gray-600 dark:text-gray-400 ml-4">
              {line.replace('- ', '').trim()}
            </li>
          );
        }
        if (line.trim()) {
          return (
            <p key={index} className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {line.trim()}
            </p>
          );
        }
        return <br key={index} />;
      });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Download className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              System Updates
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isUpdating}
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Update Progress */}
          {updateProgress && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                {updateProgress.stage === 'complete' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : updateProgress.stage === 'error' ? (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
                )}
                <span className="font-medium text-gray-900 dark:text-white">
                  {updateProgress.message}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
                  style={{ width: `${updateProgress.progress}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {updateProgress.progress}% complete
                </span>
                
                {isUpdating && (
                  <button
                    onClick={cancelUpdate}
                    className="flex items-center gap-2 px-3 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Square className="h-4 w-4" />
                    Cancel
                  </button>
                )}
              </div>

              {/* Error Details */}
              {updateProgress.stage === 'error' && updateProgress.error && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-400">
                    {updateProgress.error}
                  </p>
                  <button
                    onClick={clearUpdateStatus}
                    className="mt-2 flex items-center gap-2 px-3 py-1 text-sm text-red-600 hover:bg-red-100 dark:hover:bg-red-800/20 rounded-lg transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Clear Error
                  </button>
                </div>
              )}

              {/* Show Logs Toggle */}
              {updateProgress.logs && updateProgress.logs.length > 0 && (
                <button
                  onClick={() => setShowLogs(!showLogs)}
                  className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  {showLogs ? 'Hide' : 'Show'} installation logs
                </button>
              )}

              {/* Logs Display */}
              {showLogs && updateProgress.logs && (
                <div className="mt-3 p-3 bg-black text-green-400 rounded-lg text-xs font-mono max-h-40 overflow-y-auto">
                  {updateProgress.logs.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Update Information */}
          {updateInfo && (
            <div className="space-y-6">
              {/* Version Comparison */}
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                    Current Version
                  </h3>
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    v{updateInfo.currentVersion}
                  </p>
                </div>
                
                <div className="text-center px-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <RefreshCw className="h-4 w-4 text-white" />
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                    Latest Version
                  </h3>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    v{updateInfo.latestVersion}
                  </p>
                </div>
              </div>

              {/* Release Information */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Release Information
                  </h3>
                  <a
                    href={updateInfo.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    View on GitHub
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Released on {formatDate(updateInfo.publishedAt)}
                </p>

                {/* Release Notes */}
                {updateInfo.releaseNotes && (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg max-h-60 overflow-y-auto">
                      {renderReleaseNotes(updateInfo.releaseNotes)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No Update Available */}
          {!hasUpdate && !isChecking && !updateProgress && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Your system is up to date
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {updateInfo && `You're running the latest version v${updateInfo.currentVersion}`}
              </p>
            </div>
          )}

          {/* Checking for Updates */}
          {isChecking && (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Checking for updates...
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we check for the latest version
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={handleCheckForUpdates}
            disabled={isChecking || isUpdating}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
            Check for Updates
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isUpdating}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Close
            </button>
            
            {hasUpdate && !isUpdating && !updateProgress && (
              <button
                onClick={handleStartUpdate}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                <Play className="h-4 w-4" />
                Install Update
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 