import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';
import { NotificationType, NotificationPriority, Prisma } from '@prisma/client';

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  priority?: NotificationPriority;
}

export interface NotificationFilters {
  isRead?: boolean;
  type?: NotificationType;
  priority?: NotificationPriority;
  limit?: number;
  offset?: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new notification
   */
  async createNotification(data: CreateNotificationDto) {
    try {
      return await this.prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data || {},
          priority: data.priority || NotificationPriority.NORMAL
        }
      });
    } catch (error) {
      this.logger.error('Failed to create notification:', error);
      throw error;
    }
  }

  /**
   * Create notifications for multiple users
   */
  async createBulkNotifications(userIds: string[], notificationData: Omit<CreateNotificationDto, 'userId'>) {
    try {
      const notifications = userIds.map(userId => ({
        userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data || {},
        priority: notificationData.priority || NotificationPriority.NORMAL
      }));

      return await this.prisma.notification.createMany({
        data: notifications
      });
    } catch (error) {
      this.logger.error('Failed to create bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId: string, filters: NotificationFilters = {}) {
    try {
      const where: Prisma.NotificationWhereInput = {
        userId,
        ...(filters.isRead !== undefined && { isRead: filters.isRead }),
        ...(filters.type && { type: filters.type }),
        ...(filters.priority && { priority: filters.priority })
      };

      const [notifications, totalCount, unreadCount] = await Promise.all([
        this.prisma.notification.findMany({
          where,
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' }
          ],
          take: filters.limit || 50,
          skip: filters.offset || 0
        }),
        this.prisma.notification.count({ where }),
        this.prisma.notification.count({
          where: { userId, isRead: false }
        })
      ]);

      return {
        notifications,
        totalCount,
        unreadCount,
        hasMore: (filters.offset || 0) + notifications.length < totalCount
      };
    } catch (error) {
      this.logger.error('Failed to get user notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await this.prisma.notification.count({
        where: {
          userId,
          isRead: false
        }
      });
    } catch (error) {
      this.logger.error('Failed to get unread count:', error);
      return 0;
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    try {
      return await this.prisma.notification.update({
        where: {
          id: notificationId,
          userId // Ensure user can only mark their own notifications
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
    } catch (error) {
      this.logger.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    try {
      return await this.prisma.notification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
    } catch (error) {
      this.logger.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string) {
    try {
      return await this.prisma.notification.delete({
        where: {
          id: notificationId,
          userId // Ensure user can only delete their own notifications
        }
      });
    } catch (error) {
      this.logger.error('Failed to delete notification:', error);
      throw error;
    }
  }

  /**
   * Delete all read notifications for a user
   */
  async deleteAllRead(userId: string) {
    try {
      return await this.prisma.notification.deleteMany({
        where: {
          userId,
          isRead: true
        }
      });
    } catch (error) {
      this.logger.error('Failed to delete read notifications:', error);
      throw error;
    }
  }

  /**
   * Clean up old notifications (older than 30 days and read)
   */
  async cleanupOldNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.prisma.notification.deleteMany({
        where: {
          isRead: true,
          readAt: {
            lt: thirtyDaysAgo
          }
        }
      });

      this.logger.log(`Cleaned up ${result.count} old notifications`);
      return result;
    } catch (error) {
      this.logger.error('Failed to cleanup old notifications:', error);
      throw error;
    }
  }

  /**
   * Create system notification for updates
   */
  async createUpdateNotification(userIds: string[], version: string, releaseNotes: string) {
    return this.createBulkNotifications(userIds, {
      type: NotificationType.SYSTEM_UPDATE,
      title: `Profolio Updated to v${version}`,
      message: `Your system has been successfully updated to version ${version}. Check out the latest features and improvements.`,
      data: {
        version,
        releaseNotes: releaseNotes.substring(0, 500) // Truncate for storage
      },
      priority: NotificationPriority.NORMAL
    });
  }

  /**
   * Create asset sync notification
   */
  async createAssetSyncNotification(userId: string, assetName: string, success: boolean, message?: string) {
    return this.createNotification({
      userId,
      type: NotificationType.ASSET_SYNC,
      title: success ? 'Asset Sync Successful' : 'Asset Sync Failed',
      message: success 
        ? `${assetName} has been synchronized successfully.`
        : `Failed to sync ${assetName}. ${message || 'Please check your API keys and try again.'}`,
      data: {
        assetName,
        success,
        syncedAt: new Date().toISOString()
      },
      priority: success ? NotificationPriority.LOW : NotificationPriority.HIGH
    });
  }

  /**
   * Create API key expiry notification
   */
  async createApiKeyExpiryNotification(userId: string, provider: string, daysUntilExpiry: number) {
    return this.createNotification({
      userId,
      type: NotificationType.API_KEY_EXPIRY,
      title: 'API Key Expiring Soon',
      message: `Your ${provider} API key will expire in ${daysUntilExpiry} days. Please renew it to continue syncing data.`,
      data: {
        provider,
        daysUntilExpiry,
        expiryWarning: true
      },
      priority: daysUntilExpiry <= 7 ? NotificationPriority.HIGH : NotificationPriority.NORMAL
    });
  }
} 