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
  private readonly INSTALLER_PATH = '/opt/profolio/install-or-update.sh';

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
    const parts1 = v1.split('.').map(n => parseInt(n, 10));
    const parts2 = v2.split('.').map(n => parseInt(n, 10));
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      
      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }
    
    return 0;
  }

  /**
   * Fetch latest release from GitHub
   */
  private async fetchLatestRelease(): Promise<GitHubRelease | null> {
    try {
      const response = await fetch(`${this.GITHUB_API}/releases/latest`);
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
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
   * Start update process
   */
  async startUpdate(version?: string): Promise<boolean> {
    if (!this.isSelfHosted()) {
      throw new Error('Updates not available in this deployment mode');
    }

    if (this.isUpdateInProgress()) {
      throw new Error('Update already in progress');
    }

    try {
      this.logger.log(`Starting update process${version ? ` to ${version}` : ''}...`);
      
      this.updateProgress = {
        stage: 'checking',
        message: 'Preparing update...',
        progress: 0,
        logs: []
      };

      // Verify installer exists
      try {
        await fs.access(this.INSTALLER_PATH);
      } catch {
        throw new Error('Installer script not found. Manual update required.');
      }

      // Build installer command
      const args = ['--auto', '--no-interaction'];
      if (version) {
        args.push('--version', version);
      }

      this.updateProgress = {
        stage: 'downloading',
        message: 'Downloading update...',
        progress: 25,
        logs: ['Starting installer...']
      };

      // Execute installer
      this.updateProcess = spawn('sudo', [this.INSTALLER_PATH, ...args], {
        stdio: 'pipe',
        env: { ...process.env, SKIP_SERVICE_RESTART: 'true' }
      });

      this.setupUpdateProcessHandlers();
      return true;

    } catch (error) {
      this.logger.error('Failed to start update:', error);
      this.updateProgress = {
        stage: 'error',
        message: 'Failed to start update',
        progress: 0,
        error: error instanceof Error ? error.message : String(error)
      };
      return false;
    }
  }

  /**
   * Setup handlers for update process
   */
  private setupUpdateProcessHandlers() {
    if (!this.updateProcess) return;

    let logBuffer = '';

    this.updateProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      logBuffer += output;
      
      // Update progress based on installer output
      this.parseInstallerOutput(output);
      
      if (this.updateProgress?.logs) {
        this.updateProgress.logs.push(output.trim());
      }
    });

    this.updateProcess.stderr?.on('data', (data) => {
      const error = data.toString();
      this.logger.error('Update process error:', error);
      
      if (this.updateProgress?.logs) {
        this.updateProgress.logs.push(`ERROR: ${error.trim()}`);
      }
    });

    this.updateProcess.on('close', async (code) => {
      this.logger.log(`Update process exited with code ${code}`);
      
      if (code === 0) {
        this.updateProgress = {
          stage: 'complete',
          message: 'Update completed successfully',
          progress: 100,
          logs: this.updateProgress?.logs || []
        };
        
        // Schedule service restart
        setTimeout(() => {
          this.restartServices();
        }, 2000);
      } else {
        this.updateProgress = {
          stage: 'error',
          message: 'Update failed',
          progress: this.updateProgress?.progress || 0,
          error: `Installer exited with code ${code}`,
          logs: this.updateProgress?.logs || []
        };
      }
      
      this.updateProcess = null;
    });

    this.updateProcess.on('error', (error) => {
      this.logger.error('Update process error:', error);
      this.updateProgress = {
        stage: 'error',
        message: 'Update process failed',
        progress: this.updateProgress?.progress || 0,
        error: error.message,
        logs: this.updateProgress?.logs || []
      };
      this.updateProcess = null;
    });
  }

  /**
   * Parse installer output to update progress
   */
  private parseInstallerOutput(output: string) {
    if (!this.updateProgress) return;

    const lines = output.split('\n').map(line => line.trim()).filter(Boolean);
    
    for (const line of lines) {
      if (line.includes('Downloading')) {
        this.updateProgress.stage = 'downloading';
        this.updateProgress.message = 'Downloading update...';
        this.updateProgress.progress = 30;
      } else if (line.includes('Installing') || line.includes('Building')) {
        this.updateProgress.stage = 'installing';
        this.updateProgress.message = 'Installing update...';
        this.updateProgress.progress = 60;
      } else if (line.includes('Starting services') || line.includes('Restarting')) {
        this.updateProgress.stage = 'restarting';
        this.updateProgress.message = 'Restarting services...';
        this.updateProgress.progress = 90;
      } else if (line.includes('INSTALLATION COMPLETE') || line.includes('UPDATE COMPLETE')) {
        this.updateProgress.stage = 'complete';
        this.updateProgress.message = 'Update completed successfully';
        this.updateProgress.progress = 100;
      }
    }
  }

  /**
   * Restart Profolio services
   */
  private async restartServices() {
    try {
      this.logger.log('Restarting Profolio services...');
      
      // Restart backend and frontend services
      spawn('sudo', ['systemctl', 'restart', 'profolio-backend', 'profolio-frontend'], {
        detached: true,
        stdio: 'ignore'
      });
      
      // Exit current process to allow restart
      setTimeout(() => {
        process.exit(0);
      }, 1000);
      
    } catch (error) {
      this.logger.error('Failed to restart services:', error);
    }
  }

  /**
   * Cancel ongoing update
   */
  async cancelUpdate(): Promise<boolean> {
    if (!this.updateProcess) {
      return false;
    }

    try {
      this.logger.log('Cancelling update process...');
      this.updateProcess.kill('SIGTERM');
      
      setTimeout(() => {
        if (this.updateProcess) {
          this.updateProcess.kill('SIGKILL');
        }
      }, 5000);

      this.updateProgress = {
        stage: 'error',
        message: 'Update cancelled by user',
        progress: this.updateProgress?.progress || 0,
        error: 'Cancelled',
        logs: this.updateProgress?.logs || []
      };

      return true;
    } catch (error) {
      this.logger.error('Failed to cancel update:', error);
      return false;
    }
  }

  /**
   * Clear update progress/status
   */
  clearUpdateStatus() {
    this.updateProgress = null;
  }

  /**
   * Get update history from installer logs
   */
  async getUpdateHistory(): Promise<Array<{ version: string; date: string; success: boolean }>> {
    // This could read from installer logs or a dedicated update history file
    // For now, return empty array as placeholder
    return [];
  }
} 