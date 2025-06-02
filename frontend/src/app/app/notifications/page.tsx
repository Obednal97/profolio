'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { 
  Bell, 
  AlertCircle, 
  Info, 
  Settings, 
  Trash2, 
  Clock,
  Filter,
  MoreVertical,
  RefreshCw,
  Check
} from 'lucide-react';

const NotificationIcon = ({ type }: { type: string; priority?: string }) => {
  const getIconAndColor = () => {
    switch (type) {
      case 'SYSTEM_UPDATE':
        return { icon: Settings, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/20' };
      case 'ASSET_SYNC':
        return { icon: RefreshCw, color: 'text-green-500 bg-green-100 dark:bg-green-900/20' };
      case 'API_KEY_EXPIRY':
        return { icon: AlertCircle, color: 'text-red-500 bg-red-100 dark:bg-red-900/20' };
      case 'MARKET_ALERT':
        return { icon: AlertCircle, color: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20' };
      default:
        return { icon: Info, color: 'text-gray-500 bg-gray-100 dark:bg-gray-900/20' };
    }
  };

  const { icon: IconComponent, color } = getIconAndColor();
  
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
      <IconComponent className="h-5 w-5" />
    </div>
  );
};

const NotificationItem = ({ 
  notification, 
  onMarkAsRead, 
  onDelete 
}: { 
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleNotificationClick = () => {
    // Mark as read if unread
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'SYSTEM_UPDATE':
        // Navigate to updates page/modal
        router.push('/app/updates');
        break;
      case 'ASSET_SYNC':
        router.push('/app/dashboard');
        break;
      case 'API_KEY_EXPIRY':
        router.push('/app/settings?tab=integrations');
        break;
      case 'MARKET_ALERT':
        router.push('/app/dashboard');
        break;
      case 'ACCOUNT_ACTIVITY':
        router.push('/app/settings?tab=security');
        break;
      case 'EXPENSE_REMINDER':
        router.push('/app/expenseManager');
        break;
      case 'PROPERTY_UPDATE':
        router.push('/app/propertyManager');
        break;
      default:
        // For unknown types, just mark as read without navigation
        break;
    }
  };

  return (
    <div 
      className={`p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
        !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-gray-800'
      }`}
      onClick={handleNotificationClick}
    >
      <div className="flex items-start gap-3">
        <NotificationIcon type={notification.type} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className={`text-sm font-medium ${
                !notification.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {notification.title}
                {!notification.isRead && (
                  <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
                )}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {notification.message}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(notification.createdAt)}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  notification.priority === 'HIGH' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                  notification.priority === 'NORMAL' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                }`}>
                  {notification.priority?.toLowerCase() || 'unknown'}
                </span>
              </div>
            </div>
            
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <MoreVertical className="h-4 w-4 text-gray-500" />
              </button>
              
              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                    }}
                  />
                  <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-[60]">
                    {!notification.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsRead(notification.id);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Mark as read
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(notification.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    totalCount,
    hasMore,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Load notifications when filter changes
  useEffect(() => {
    const filters = {
      ...(filter !== 'all' && { isRead: filter === 'read' }),
      ...(typeFilter && { type: typeFilter }),
      limit: 50
    };
    
    fetchNotifications(filters);
  }, [filter, typeFilter]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleDeleteAllRead = async () => {
    try {
      await deleteAllRead();
    } catch (error) {
      console.error('Failed to delete read notifications:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Notifications
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Stay updated with your portfolio activities and system updates
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'read'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Read ({totalCount - unreadCount})
            </button>
          </div>

          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
            
            {unreadCount > 0 && (
              <button
                onClick={async () => {
                  try {
                    await markAllAsRead();
                  } catch (error) {
                    console.error('Failed to mark all as read:', error);
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Mark All as Read
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mb-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">All Types</option>
                  <option value="SYSTEM_UPDATE">System Updates</option>
                  <option value="ASSET_SYNC">Asset Sync</option>
                  <option value="API_KEY_EXPIRY">API Key Expiry</option>
                  <option value="MARKET_ALERT">Market Alerts</option>
                  <option value="GENERAL">General</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <p className="text-red-800 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && notifications.length === 0 && (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600 dark:text-gray-400">Loading notifications...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && notifications.length === 0 && !error && (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No notifications yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {filter === 'all' 
                ? "When you receive notifications, they'll appear here. You'll be notified about system updates, portfolio changes, and important account activity."
                : `No ${filter} notifications found.`
              }
            </p>
          </div>
        )}

        {/* Notifications List */}
        {notifications.length > 0 && (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))}
            
            {hasMore && (
              <div className="text-center py-4">
                <button
                  onClick={() => fetchNotifications({ 
                    ...(filter !== 'all' && { isRead: filter === 'read' }),
                    ...(typeFilter && { type: typeFilter }),
                    limit: 50,
                    offset: notifications.length
                  })}
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  {isLoading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 