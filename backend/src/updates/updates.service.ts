import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  prerelease: boolean;
  draft: boolean;
  html_url: string;
  assets: Array<{
    name: string;
    download_url: string;
    size: number;
  }>;
}

export interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  releaseNotes: string;
  publishedAt: string;
  downloadUrl: string;
}

export interface UpdateProgress {
  stage: 'checking' | 'downloading' | 'installing' | 'restarting' | 'complete' | 'error';
  message: string;
  progress: number; // 0-100
  error?: string;
  logs?: string[];
}

@Injectable()
export class UpdatesService {
  private readonly logger = new Logger(UpdatesService.name);
  private updateProgress: UpdateProgress | null = null;
  private updateProcess: ChildProcess | null = null;
  private cachedUpdateInfo: UpdateInfo | null = null;
  private lastChecked: Date | null = null;
  
  private readonly GITHUB_API = 'https://api.github.com/repos/Obednal97/profolio';
  private readonly UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {}

  /**
   * Check if we're running in self-hosted mode
   */
  private isSelfHosted(): boolean {
    return process.env.DEPLOYMENT_MODE !== 'cloud' && 
           process.env.NODE_ENV !== 'development' &&
           !process.env.DISABLE_UPDATES;
  }

  /**
   * Get current version from package.json
   */
  private async getCurrentVersion(): Promise<string> {
    try {
      const packagePath = join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf-8'));
      return packageJson.version || '1.0.0';
    } catch (error) {
      this.logger.error('Failed to read current version:', error);
      return '1.0.0';
    }
  }

  /**
   * Simple version comparison (semver alternative)
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.replace(/^v/, '').split('.').map(n => parseInt(n, 10));
    const parts2 = v2.replace(/^v/, '').split('.').map(n => parseInt(n, 10));
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      
      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }
    
    return 0;
  }

  /**
   * Fetch latest release from GitHub with proper error handling
   */
  private async fetchLatestRelease(): Promise<GitHubRelease | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${this.GITHUB_API}/releases/latest`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Profolio-Update-Checker'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json() as GitHubRelease;
    } catch (error) {
      this.logger.error('Failed to fetch latest release:', error);
      return null;
    }
  }

  /**
   * Check for available updates
   */
  async checkForUpdates(force = false): Promise<UpdateInfo | null> {
    if (!this.isSelfHosted()) {
      this.logger.debug('Updates disabled - not in self-hosted mode');
      return null;
    }

    // Use cached result if recent and not forced
    if (!force && this.cachedUpdateInfo && this.lastChecked) {
      const timeSinceCheck = Date.now() - this.lastChecked.getTime();
      if (timeSinceCheck < this.UPDATE_CHECK_INTERVAL) {
        return this.cachedUpdateInfo;
      }
    }

    try {
      this.logger.log('Checking for updates...');
      
      const [currentVersion, latestRelease] = await Promise.all([
        this.getCurrentVersion(),
        this.fetchLatestRelease()
      ]);

      if (!latestRelease) {
        return null;
      }

      const latestVersion = latestRelease.tag_name.replace(/^v/, '');
      const hasUpdate = this.compareVersions(latestVersion, currentVersion) > 0;

      const updateInfo: UpdateInfo = {
        currentVersion,
        latestVersion,
        hasUpdate,
        releaseNotes: latestRelease.body,
        publishedAt: latestRelease.published_at,
        downloadUrl: latestRelease.html_url
      };

      this.cachedUpdateInfo = updateInfo;
      this.lastChecked = new Date();

      if (hasUpdate) {
        this.logger.log(`Update available: ${currentVersion} → ${latestVersion}`);
      } else {
        this.logger.log(`No updates available (current: ${currentVersion})`);
      }

      return updateInfo;
    } catch (error) {
      this.logger.error('Error checking for updates:', error);
      return null;
    }
  }

  /**
   * Scheduled task to check for updates every 24 hours
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduledUpdateCheck() {
    if (!this.isSelfHosted()) {
      return;
    }

    this.logger.log('Running scheduled update check...');
    await this.checkForUpdates(true);
  }

  /**
   * Get current update progress
   */
  getUpdateProgress(): UpdateProgress | null {
    return this.updateProgress;
  }

  /**
   * Check if update is currently in progress
   */
  isUpdateInProgress(): boolean {
    return this.updateProgress !== null && 
           !['complete', 'error'].includes(this.updateProgress.stage);
  }

  /**
   * SECURITY: Updates now require manual intervention or external orchestration
   * This removes the dangerous sudo execution capabilities
   */
  async startUpdate(version?: string): Promise<boolean> {
    if (!this.isSelfHosted()) {
      throw new Error('Updates not available in this deployment mode');
    }

    if (this.isUpdateInProgress()) {
      throw new Error('Update already in progress');
    }

    try {
      this.logger.log(`Update requested${version ? ` to ${version}` : ''}...`);
      
      this.updateProgress = {
        stage: 'checking',
        message: 'Update request received. Manual intervention required.',
        progress: 0,
        logs: [
          'SECURITY NOTICE: Automatic updates have been disabled for security reasons.',
          'Please update manually using one of these methods:',
          '1. Docker: Pull latest image and restart containers',
          '2. Git: Pull latest code and restart services externally',
          '3. Package manager: Update via your distribution\'s package manager',
          '',
          'This change prevents privilege escalation vulnerabilities.'
        ]
      };

      // Instead of executing dangerous sudo commands, we provide safe instructions
      setTimeout(() => {
        if (this.updateProgress) {
          this.updateProgress = {
            stage: 'error',
            message: 'Manual update required - automatic updates disabled for security',
            progress: 0,
            error: 'Automatic updates disabled. Please update manually.',
            logs: this.updateProgress.logs
          };
        }
      }, 3000);

      return false; // Always return false as automatic updates are disabled

    } catch (error) {
      this.logger.error('Update request failed:', error);
      this.updateProgress = {
        stage: 'error',
        message: 'Update request failed',
        progress: 0,
        error: error instanceof Error ? error.message : String(error)
      };
      return false;
    }
  }

  /**
   * Cancel ongoing update
   */
  async cancelUpdate(): Promise<boolean> {
    if (this.updateProgress) {
      this.updateProgress = {
        stage: 'error',
        message: 'Update cancelled',
        progress: 0,
        error: 'Cancelled by user',
        logs: this.updateProgress.logs || []
      };
      return true;
    }
    return false;
  }

  /**
   * Clear update progress/status
   */
  clearUpdateStatus() {
    this.updateProgress = null;
  }

  /**
   * Get update history - now safer implementation
   */
  async getUpdateHistory(): Promise<Array<{ version: string; date: string; success: boolean }>> {
    try {
      // Read from safe log file instead of executing system commands
      const logPath = join(process.cwd(), 'logs', 'update-history.json');
      
      try {
        const historyData = await fs.readFile(logPath, 'utf-8');
        return JSON.parse(historyData);
      } catch {
        // Return empty array if file doesn't exist
        return [];
      }
    } catch (error) {
      this.logger.error('Failed to read update history:', error);
      return [];
    }
  }

  /**
   * SECURITY: Remove all privileged operations
   * This method previously executed dangerous sudo commands
   */
  private async logSecurityNotice() {
    this.logger.warn('SECURITY NOTICE: Privileged update operations have been removed');
    this.logger.warn('For security reasons, automatic system updates are disabled');
    this.logger.warn('Please update the application manually or use containerized deployment');
  }
} 