import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  HttpException, 
  HttpStatus,
  Sse,
  MessageEvent,
  UseGuards,
  Req,
  ForbiddenException
} from '@nestjs/common';
import { Observable, interval, map } from 'rxjs';
import { UpdatesService, UpdateInfo, UpdateProgress } from './updates.service';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { AuthUser } from '@/common/auth/jwt.strategy';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export class StartUpdateDto {
  version?: string;
}

@ApiTags('updates')
@ApiBearerAuth()
@Controller('api/updates')
@UseGuards(JwtAuthGuard)
export class UpdatesController {
  constructor(private readonly updatesService: UpdatesService) {}

  /**
   * Verify admin access - in a production system this would check for admin role
   */
  private verifyAdminAccess(user: AuthUser) {
    // TODO: Implement proper role-based access control
    // For now, restrict update operations to specific admin emails
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['admin@profolio.com'];
    
    if (!adminEmails.includes(user.email)) {
      throw new ForbiddenException('Admin access required for update operations');
    }
  }

  /**
   * Check for available updates - read-only operation, available to all authenticated users
   */
  @Get('check')
  @ApiOperation({ summary: 'Check for available updates' })
  @ApiResponse({ status: 200, description: 'Update check completed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkUpdates(@Req() req: { user: AuthUser }): Promise<UpdateInfo | null> {
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
   * Force check for updates (bypass cache) - admin only
   */
  @Post('check')
  @ApiOperation({ summary: 'Force check for updates (admin only)' })
  @ApiResponse({ status: 200, description: 'Update check completed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async forceCheckUpdates(@Req() req: { user: AuthUser }): Promise<UpdateInfo | null> {
    try {
      this.verifyAdminAccess(req.user);
      return await this.updatesService.checkForUpdates(true);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new HttpException(
        'Failed to check for updates',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get current update status/progress - available to all authenticated users
   */
  @Get('status')
  @ApiOperation({ summary: 'Get current update status' })
  @ApiResponse({ status: 200, description: 'Update status retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getUpdateStatus(@Req() req: { user: AuthUser }): UpdateProgress | null {
    return this.updatesService.getUpdateProgress();
  }

  /**
   * Start update process - admin only and now disabled for security
   */
  @Post('start')
  @ApiOperation({ summary: 'Start update process (admin only, currently disabled for security)' })
  @ApiResponse({ status: 200, description: 'Update response' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async startUpdate(@Body() body: StartUpdateDto, @Req() req: { user: AuthUser }): Promise<{ success: boolean; message: string }> {
    try {
      this.verifyAdminAccess(req.user);

      if (this.updatesService.isUpdateInProgress()) {
        throw new HttpException(
          'Update already in progress',
          HttpStatus.CONFLICT
        );
      }

      const success = await this.updatesService.startUpdate(body.version);
      
      // Note: startUpdate now always returns false for security reasons
      return {
        success,
        message: success ? 'Update started successfully' : 'Automatic updates disabled for security. Manual update required.'
      };
    } catch (error) {
      if (error instanceof HttpException || error instanceof ForbiddenException) {
        throw error;
      }
      
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to start update',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Cancel ongoing update - admin only
   */
  @Post('cancel')
  @ApiOperation({ summary: 'Cancel ongoing update (admin only)' })
  @ApiResponse({ status: 200, description: 'Update cancelled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async cancelUpdate(@Req() req: { user: AuthUser }): Promise<{ success: boolean; message: string }> {
    try {
      this.verifyAdminAccess(req.user);
      
      const success = await this.updatesService.cancelUpdate();
      
      return {
        success,
        message: success ? 'Update cancelled successfully' : 'No update to cancel'
      };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new HttpException(
        'Failed to cancel update',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Clear update status/progress - admin only
   */
  @Post('clear')
  @ApiOperation({ summary: 'Clear update status (admin only)' })
  @ApiResponse({ status: 200, description: 'Update status cleared' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  clearUpdateStatus(@Req() req: { user: AuthUser }): { success: boolean; message: string } {
    try {
      this.verifyAdminAccess(req.user);
      
      this.updatesService.clearUpdateStatus();
      return {
        success: true,
        message: 'Update status cleared'
      };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new HttpException(
        'Failed to clear update status',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Server-Sent Events for real-time update progress - admin only
   */
  @Sse('progress')
  @ApiOperation({ summary: 'Real-time update progress (admin only)' })
  @ApiResponse({ status: 200, description: 'Update progress stream' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  getUpdateProgress(@Req() req: { user: AuthUser }): Observable<MessageEvent> {
    this.verifyAdminAccess(req.user);
    
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
   * Get update history - admin only
   */
  @Get('history')
  @ApiOperation({ summary: 'Get update history (admin only)' })
  @ApiResponse({ status: 200, description: 'Update history retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getUpdateHistory(@Req() req: { user: AuthUser }): Promise<Array<{ version: string; date: string; success: boolean }>> {
    try {
      this.verifyAdminAccess(req.user);
      return await this.updatesService.getUpdateHistory();
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new HttpException(
        'Failed to get update history',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 