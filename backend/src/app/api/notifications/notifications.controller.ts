import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
  UseGuards,
  Request
} from '@nestjs/common';
import { NotificationsService, CreateNotificationDto, NotificationFilters } from './notifications.service';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';

export interface CreateNotificationRequestDto {
  type: string;
  title: string;
  message: string;
  data?: any;
  priority?: string;
}

export interface NotificationQueryDto {
  isRead?: string;
  type?: string;
  priority?: string;
  limit?: string;
  offset?: string;
}

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Get notifications for the authenticated user
   */
  @Get()
  async getUserNotifications(
    @Request() req: any,
    @Query() query: NotificationQueryDto
  ) {
    try {
      const userId = req.user.id;
      
      const filters: NotificationFilters = {
        ...(query.isRead !== undefined && { isRead: query.isRead === 'true' }),
        ...(query.type && { type: query.type as any }),
        ...(query.priority && { priority: query.priority as any }),
        ...(query.limit && { limit: parseInt(query.limit, 10) }),
        ...(query.offset && { offset: parseInt(query.offset, 10) })
      };

      return await this.notificationsService.getUserNotifications(userId, filters);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch notifications',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get unread notification count
   */
  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    try {
      const userId = req.user.id;
      const count = await this.notificationsService.getUnreadCount(userId);
      return { count };
    } catch (error) {
      throw new HttpException(
        'Failed to get unread count',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Create a new notification (for admin/system use)
   */
  @Post()
  async createNotification(
    @Request() req: any,
    @Body() body: CreateNotificationRequestDto
  ) {
    try {
      const userId = req.user.id;
      
      const notificationData: CreateNotificationDto = {
        userId,
        type: body.type as any,
        title: body.title,
        message: body.message,
        data: body.data,
        priority: body.priority as any
      };

      return await this.notificationsService.createNotification(notificationData);
    } catch (error) {
      throw new HttpException(
        'Failed to create notification',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Mark a notification as read
   */
  @Put(':id/read')
  async markAsRead(@Request() req: any, @Param('id') notificationId: string) {
    try {
      const userId = req.user.id;
      return await this.notificationsService.markAsRead(notificationId, userId);
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new HttpException(
          'Notification not found',
          HttpStatus.NOT_FOUND
        );
      }
      throw new HttpException(
        'Failed to mark notification as read',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Mark all notifications as read
   */
  @Put('mark-all-read')
  async markAllAsRead(@Request() req: any) {
    try {
      const userId = req.user.id;
      const result = await this.notificationsService.markAllAsRead(userId);
      return {
        success: true,
        updatedCount: result.count,
        message: `Marked ${result.count} notifications as read`
      };
    } catch (error) {
      throw new HttpException(
        'Failed to mark all notifications as read',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Delete a notification
   */
  @Delete(':id')
  async deleteNotification(@Request() req: any, @Param('id') notificationId: string) {
    try {
      const userId = req.user.id;
      await this.notificationsService.deleteNotification(notificationId, userId);
      return {
        success: true,
        message: 'Notification deleted successfully'
      };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new HttpException(
          'Notification not found',
          HttpStatus.NOT_FOUND
        );
      }
      throw new HttpException(
        'Failed to delete notification',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Delete all read notifications
   */
  @Delete('read')
  async deleteAllRead(@Request() req: any) {
    try {
      const userId = req.user.id;
      const result = await this.notificationsService.deleteAllRead(userId);
      return {
        success: true,
        deletedCount: result.count,
        message: `Deleted ${result.count} read notifications`
      };
    } catch (error) {
      throw new HttpException(
        'Failed to delete read notifications',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Create a test notification (for development/testing)
   */
  @Post('test')
  async createTestNotification(@Request() req: any) {
    try {
      const userId = req.user.id;
      
      const testNotifications = [
        {
          type: 'SYSTEM_UPDATE' as any,
          title: 'System Update Available',
          message: 'A new version of Profolio is available. Click to learn more.',
          priority: 'NORMAL' as any
        },
        {
          type: 'ASSET_SYNC' as any,
          title: 'Asset Sync Complete',
          message: 'Your portfolio has been updated with the latest market data.',
          priority: 'LOW' as any
        },
        {
          type: 'API_KEY_EXPIRY' as any,
          title: 'API Key Expiring Soon',
          message: 'Your Alpha Vantage API key will expire in 7 days. Please renew it to continue syncing data.',
          priority: 'HIGH' as any
        }
      ];

      const notifications = await Promise.all(
        testNotifications.map(notification =>
          this.notificationsService.createNotification({
            userId,
            ...notification,
            data: { test: true, createdAt: new Date().toISOString() }
          })
        )
      );

      return {
        success: true,
        message: 'Test notifications created',
        notifications
      };
    } catch (error) {
      throw new HttpException(
        'Failed to create test notifications',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 