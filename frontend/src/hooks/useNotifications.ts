import { useState, useEffect, useCallback, useRef } from 'react';
import { useUnifiedAuth } from '@/lib/unifiedAuth';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationFilters {
  isRead?: boolean;
  type?: string;
  priority?: string;
  limit?: number;
  offset?: number;
}

export interface NotificationsResponse {
  notifications: Notification[];
  totalCount: number;
  unreadCount: number;
  hasMore: boolean;
}

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllRead: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const { token, loading: authLoading } = useUnifiedAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref to avoid recreating the interval when notifications change
  const notificationsRef = useRef<Notification[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update ref when notifications change
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Get backend token with Firebase exchange if needed
  const getBackendToken = useCallback(async (): Promise<string | null> => {
    try {
      // Try stored token first
      const backendToken = localStorage.getItem('auth-token');
      if (backendToken) {
        return backendToken;
      }

      // If no stored token, try to exchange Firebase token
      const { getFirebaseAuth } = await import('@/lib/firebase');
      const auth = await getFirebaseAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        return null;
      }

      const firebaseToken = await currentUser.getIdToken();
      
      const response = await fetch('/api/auth/firebase-exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firebaseToken }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.token) {
          localStorage.setItem('auth-token', data.token);
          return data.token;
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to get backend token:', error);
      return null;
    }
  }, []);

  // API headers with auth - memoized to prevent recreation
  const getHeaders = useCallback(async () => {
    const backendToken = await getBackendToken();
    return {
      'Content-Type': 'application/json',
      ...(backendToken && { 'Authorization': `Bearer ${backendToken}` })
    };
  }, [getBackendToken]);

  // Fetch notifications
  const fetchNotifications = useCallback(async (filters: NotificationFilters = {}) => {
    if (!token) {
      // Demo mode - show example notifications
      const demoNotifications: Notification[] = [
        {
          id: 'demo-signup-cta',
          type: 'ACCOUNT_ACTIVITY',
          title: 'Unlock Full Access',
          message: 'Experience the complete Profolio platform with unlimited portfolios, real-time data, and advanced analytics. Sign up now!',
          data: { action: 'signup_cta' },
          isRead: false,
          priority: 'HIGH',
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
        },
        {
          id: 'demo-welcome',
          type: 'SYSTEM_UPDATE',
          title: 'Welcome to Profolio Demo',
          message: 'You\'re exploring Profolio in demo mode. All data shown is simulated for demonstration purposes.',
          data: {},
          isRead: false,
          priority: 'NORMAL',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
        },
        {
          id: 'demo-portfolio-sync',
          type: 'ASSET_SYNC',
          title: 'Portfolio Sync Complete',
          message: 'Your demo portfolio has been synchronized with the latest market data. 15 assets updated successfully.',
          data: { assetsUpdated: 15, portfolioValue: '$245,678.90' },
          isRead: true,
          readAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          priority: 'NORMAL',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
          updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
        },
        {
          id: 'demo-market-alert',
          type: 'MARKET_ALERT',
          title: 'Market Alert: AAPL',
          message: 'Apple Inc. (AAPL) has increased by 5.2% today, reaching $185.50. Consider reviewing your position.',
          data: { symbol: 'AAPL', change: '+5.2%', price: '$185.50' },
          isRead: true,
          readAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          priority: 'NORMAL',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
          updatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString()
        },
        {
          id: 'demo-expense-reminder',
          type: 'EXPENSE_REMINDER',
          title: 'Monthly Expense Report Ready',
          message: 'Your monthly expense report for November 2024 is ready for review. Total expenses: $3,247.50',
          data: { month: 'November 2024', totalExpenses: '$3,247.50' },
          isRead: false,
          priority: 'LOW',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 24 hours ago
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
        },
        {
          id: 'demo-api-key',
          type: 'API_KEY_EXPIRY',
          title: 'Demo Data Integration Active',
          message: 'Demo data sources are providing simulated market information. Sign up to connect real financial data providers.',
          data: { daysUntilExpiry: 'N/A - Demo Mode' },
          isRead: true,
          readAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
          priority: 'LOW',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 48 hours ago
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
        }
      ];

      // Apply filters
      let filteredNotifications = demoNotifications;
      
      if (filters.isRead !== undefined) {
        filteredNotifications = filteredNotifications.filter(n => n.isRead === filters.isRead);
      }
      
      if (filters.type) {
        filteredNotifications = filteredNotifications.filter(n => n.type === filters.type);
      }
      
      if (filters.priority) {
        filteredNotifications = filteredNotifications.filter(n => n.priority === filters.priority);
      }

      // Apply pagination
      const offset = filters.offset || 0;
      const limit = filters.limit || 50;
      const paginatedNotifications = filteredNotifications.slice(offset, offset + limit);
      
      const unreadCount = demoNotifications.filter(n => !n.isRead).length;
      const totalCount = filteredNotifications.length;
      const hasMore = offset + limit < totalCount;

      // Simulate loading delay
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // If this is a paginated request (offset > 0), append to existing notifications
      if (filters.offset && filters.offset > 0) {
        setNotifications(prev => [...prev, ...paginatedNotifications]);
      } else {
        setNotifications(paginatedNotifications);
      }
      
      setUnreadCount(unreadCount);
      setTotalCount(totalCount);
      setHasMore(hasMore);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (filters.isRead !== undefined) queryParams.set('isRead', filters.isRead.toString());
      if (filters.type) queryParams.set('type', filters.type);
      if (filters.priority) queryParams.set('priority', filters.priority);
      if (filters.limit) queryParams.set('limit', filters.limit.toString());
      if (filters.offset) queryParams.set('offset', filters.offset.toString());

      const response = await fetch(`${API_BASE}/api/notifications?${queryParams}`, {
        headers: await getHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Don't show 401 errors to user, just clear data
          setNotifications([]);
          setUnreadCount(0);
          setTotalCount(0);
          setHasMore(false);
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: NotificationsResponse = await response.json();
      
      // If this is a paginated request (offset > 0), append to existing notifications
      if (filters.offset && filters.offset > 0) {
        setNotifications(prev => [...prev, ...data.notifications]);
      } else {
        setNotifications(data.notifications);
      }
      
      setUnreadCount(data.unreadCount);
      setTotalCount(data.totalCount);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      // Only set user-facing error for non-auth issues
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (!errorMessage.includes('401')) {
        setError('Unable to load notifications. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, API_BASE, getHeaders]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!token) {
      // Demo mode - handle signup CTA
      if (notificationId === 'demo-signup-cta') {
        // Clear any stored demo data and redirect to signup
        localStorage.removeItem('demo_session');
        window.location.href = '/auth/signIn';
        return;
      }
      
      // For other demo notifications, just update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true, readAt: new Date().toISOString() }
            : notif
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: await getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true, readAt: new Date().toISOString() }
            : notif
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      throw err;
    }
  }, [token, API_BASE, getHeaders]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!token) {
      // Demo mode - update local state
      setNotifications(prev => 
        prev.map(notif => ({ 
          ...notif, 
          isRead: true, 
          readAt: new Date().toISOString() 
        }))
      );
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/notifications/mark-all-read`, {
        method: 'PUT',
        headers: await getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ 
          ...notif, 
          isRead: true, 
          readAt: new Date().toISOString() 
        }))
      );
      
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      throw err;
    }
  }, [token, API_BASE, getHeaders]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!token) {
      // Demo mode - update local state
      const deletedNotification = notificationsRef.current.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      setTotalCount(prev => prev - 1);
      
      // Update unread count if the deleted notification was unread
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: await getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Update local state
      const deletedNotification = notificationsRef.current.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      setTotalCount(prev => prev - 1);
      
      // Update unread count if the deleted notification was unread
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
      throw err;
    }
  }, [token, API_BASE, getHeaders]);

  // Delete all read notifications
  const deleteAllRead = useCallback(async () => {
    if (!token) {
      // Demo mode - update local state
      setNotifications(prev => prev.filter(notif => !notif.isRead));
      setTotalCount(() => unreadCount); // Total count becomes unread count
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/notifications/read`, {
        method: 'DELETE',
        headers: await getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Update local state - remove all read notifications
      setNotifications(prev => prev.filter(notif => !notif.isRead));
      setTotalCount(() => unreadCount); // Total count becomes unread count
    } catch (err) {
      console.error('Failed to delete read notifications:', err);
      throw err;
    }
  }, [token, API_BASE, getHeaders, unreadCount]);

  // Refresh unread count only - stable function that doesn't depend on notifications
  const refreshUnreadCount = useCallback(async () => {
    if (!token) {
      // Demo mode - calculate from current notifications using ref
      const currentUnreadCount = notificationsRef.current.filter(n => !n.isRead).length;
      setUnreadCount(currentUnreadCount);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/notifications/unread-count`, {
        headers: await getHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      } else if (response.status === 401) {
        // Auth error, silently reset count
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to refresh unread count:', err);
      // Don't show error to user for count refresh failures
    }
  }, [token, API_BASE, getHeaders]);

  // Auto-refresh unread count every 30 seconds - MEMORY LEAK FIX
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!token) {
      // Demo mode - calculate unread count from current notifications
      const currentUnreadCount = notifications.filter(n => !n.isRead).length;
      setUnreadCount(currentUnreadCount);
      return;
    }

    // Initial load
    refreshUnreadCount();

    // Set up interval for periodic refresh - store in ref for cleanup
    intervalRef.current = setInterval(refreshUnreadCount, 30000); // 30 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [token, refreshUnreadCount]); // Stable dependencies

  // Initial load effect - load notifications on mount
  useEffect(() => {
    // Don't load notifications while auth is still loading
    if (authLoading) {
      return;
    }

    const loadInitialNotifications = async () => {
      try {
        await fetchNotifications();
      } catch (error) {
        console.error('Failed to load initial notifications:', error);
      }
    };
    
    loadInitialNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, authLoading]); // Wait for both token and loading state

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return {
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
    deleteAllRead,
    refreshUnreadCount
  };
} 