import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  HttpException, 
  HttpStatus,
  Sse,
  MessageEvent
} from '@nestjs/common';
import { Observable, interval, map } from 'rxjs';
import { UpdatesService, UpdateInfo, UpdateProgress } from './updates.service';

export class StartUpdateDto {
  version?: string;
}

@Controller('api/updates')
export class UpdatesController {
  constructor(private readonly updatesService: UpdatesService) {}

  /**
   * Check for available updates
   */
  @Get('check')
  async checkUpdates(): Promise<UpdateInfo | null> {
    try {
      return await this.updatesService.checkForUpdates();
    } catch (error) {
      throw new HttpException(
        'Failed to check for updates',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Force check for updates (bypass cache)
   */
  @Post('check')
  async forceCheckUpdates(): Promise<UpdateInfo | null> {
    try {
      return await this.updatesService.checkForUpdates(true);
    } catch (error) {
      throw new HttpException(
        'Failed to check for updates',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get current update status/progress
   */
  @Get('status')
  getUpdateStatus(): UpdateProgress | null {
    return this.updatesService.getUpdateProgress();
  }

  /**
   * Start update process
   */
  @Post('start')
  async startUpdate(@Body() body: StartUpdateDto): Promise<{ success: boolean; message: string }> {
    try {
      if (this.updatesService.isUpdateInProgress()) {
        throw new HttpException(
          'Update already in progress',
          HttpStatus.CONFLICT
        );
      }

      const success = await this.updatesService.startUpdate(body.version);
      
      if (!success) {
        throw new HttpException(
          'Failed to start update',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return {
        success: true,
        message: 'Update started successfully'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to start update',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Cancel ongoing update
   */
  @Post('cancel')
  async cancelUpdate(): Promise<{ success: boolean; message: string }> {
    try {
      const success = await this.updatesService.cancelUpdate();
      
      return {
        success,
        message: success ? 'Update cancelled successfully' : 'No update to cancel'
      };
    } catch (error) {
      throw new HttpException(
        'Failed to cancel update',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Clear update status/progress
   */
  @Post('clear')
  clearUpdateStatus(): { success: boolean; message: string } {
    this.updatesService.clearUpdateStatus();
    return {
      success: true,
      message: 'Update status cleared'
    };
  }

  /**
   * Server-Sent Events for real-time update progress
   */
  @Sse('progress')
  getUpdateProgress(): Observable<MessageEvent> {
    return interval(1000).pipe(
      map(() => {
        const progress = this.updatesService.getUpdateProgress();
        return {
          data: JSON.stringify(progress),
          type: 'update-progress'
        } as MessageEvent;
      })
    );
  }

  /**
   * Get update history
   */
  @Get('history')
  async getUpdateHistory(): Promise<Array<{ version: string; date: string; success: boolean }>> {
    try {
      return await this.updatesService.getUpdateHistory();
    } catch (error) {
      throw new HttpException(
        'Failed to get update history',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 