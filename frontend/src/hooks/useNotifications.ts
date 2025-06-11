import { useState, useEffect, useCallback, useRef } from "react";
import { logger } from "@/lib/logger";
import { useUnifiedAuth } from "@/lib/unifiedAuth";

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

// Global cache to prevent multiple hooks from making duplicate requests
const globalUnreadCountCache = {
  count: 0,
  lastFetch: 0,
  inProgress: false,
};

// Global interval management to prevent multiple intervals
let globalInterval: NodeJS.Timeout | null = null;
let activeHooks = 0;

export function useNotifications(): UseNotificationsReturn {
  const { token, loading: authLoading } = useUnifiedAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref to avoid recreating functions and track mounted state
  const notificationsRef = useRef<Notification[]>([]);
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Update ref when notifications change
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  // Track component lifecycle for global interval management
  useEffect(() => {
    activeHooks++;
    return () => {
      activeHooks--;
      mountedRef.current = false;

      // Cancel any in-progress requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Clear global interval if this is the last hook
      if (activeHooks === 0 && globalInterval) {
        clearInterval(globalInterval);
        globalInterval = null;
      }
    };
  }, []);

  const getApiBase = () => {
    // Use environment variable if available
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }

    // Auto-detect protocol and host for production
    if (typeof window !== "undefined") {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;

      // In production, use same protocol as frontend
      if (protocol === "https:") {
        // For HTTPS, assume backend is on port 3001 with HTTPS
        return `https://${hostname}:3001`;
      }
    }

    // Development fallback
    return "http://localhost:3001";
  };

  const API_BASE = getApiBase();

  // Stable token cache to prevent Firebase calls on every request
  const tokenCacheRef = useRef<{ token: string | null; expires: number }>({
    token: null,
    expires: 0,
  });

  // Get backend token with caching to prevent excessive Firebase calls
  const getBackendToken = useCallback(async (): Promise<string | null> => {
    try {
      // Check cache first (valid for 5 minutes)
      const now = Date.now();
      if (tokenCacheRef.current.token && tokenCacheRef.current.expires > now) {
        return tokenCacheRef.current.token;
      }

      // Try stored token first
      const backendToken = localStorage.getItem("auth-token");
      if (backendToken) {
        tokenCacheRef.current = { token: backendToken, expires: now + 300000 }; // 5 min cache
        return backendToken;
      }

      // If no stored token, try to exchange Firebase token
      const { getFirebaseAuth } = await import("@/lib/firebase");
      const auth = await getFirebaseAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        tokenCacheRef.current = { token: null, expires: now + 60000 }; // 1 min cache for null
        return null;
      }

      const firebaseToken = await currentUser.getIdToken();

      const response = await fetch("/api/auth/firebase-exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firebaseToken }),
        signal: abortControllerRef.current?.signal,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.token) {
          localStorage.setItem("auth-token", data.token);
          tokenCacheRef.current = { token: data.token, expires: now + 300000 }; // 5 min cache
          return data.token;
        }
      }

      tokenCacheRef.current = { token: null, expires: now + 60000 }; // 1 min cache for null
      return null;
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        logger.auth("Failed to get backend token:", error);
      }
      return null;
    }
  }, []);

  // Stable API headers function
  const getHeaders = useCallback(async () => {
    const backendToken = await getBackendToken();
    return {
      "Content-Type": "application/json",
      ...(backendToken && { Authorization: `Bearer ${backendToken}` }),
    };
  }, [getBackendToken]);

  // Fetch notifications with request cancellation
  const fetchNotifications = useCallback(
    async (filters: NotificationFilters = {}) => {
      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      if (!token) {
        // Demo mode - show example notifications (reduced set for performance)
        const demoNotifications: Notification[] = [
          {
            id: "demo-signup-cta",
            type: "ACCOUNT_ACTIVITY",
            title: "Unlock Full Access",
            message:
              "Experience the complete Profolio platform with unlimited portfolios, real-time data, and advanced analytics. Sign up now!",
            data: { action: "signup_cta" },
            isRead: false,
            priority: "HIGH",
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          },
          {
            id: "demo-welcome",
            type: "SYSTEM_UPDATE",
            title: "Welcome to Profolio Demo",
            message:
              "You're exploring Profolio in demo mode. All data shown is simulated for demonstration purposes.",
            data: {},
            isRead: false,
            priority: "NORMAL",
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          },
        ];

        // Apply filters efficiently
        let filteredNotifications = demoNotifications;
        if (filters.isRead !== undefined) {
          filteredNotifications = filteredNotifications.filter(
            (n) => n.isRead === filters.isRead
          );
        }

        const unreadCount = demoNotifications.filter((n) => !n.isRead).length;

        if (mountedRef.current) {
          setNotifications(filteredNotifications);
          setUnreadCount(unreadCount);
          setTotalCount(filteredNotifications.length);
          setHasMore(false);
        }
        return;
      }

      if (!mountedRef.current) return;

      setIsLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();
        if (filters.isRead !== undefined)
          queryParams.set("isRead", filters.isRead.toString());
        if (filters.type) queryParams.set("type", filters.type);
        if (filters.priority) queryParams.set("priority", filters.priority);
        if (filters.limit) queryParams.set("limit", filters.limit.toString());
        if (filters.offset)
          queryParams.set("offset", filters.offset.toString());

        const response = await fetch(
          `${API_BASE}/api/notifications?${queryParams}`,
          {
            headers: await getHeaders(),
            signal: abortControllerRef.current.signal,
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            // Auth error - clear cache and data
            tokenCacheRef.current = { token: null, expires: 0 };
            if (mountedRef.current) {
              setNotifications([]);
              setUnreadCount(0);
              setTotalCount(0);
              setHasMore(false);
            }
            return;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: NotificationsResponse = await response.json();

        if (mountedRef.current) {
          if (filters.offset && filters.offset > 0) {
            setNotifications((prev) => [...prev, ...data.notifications]);
          } else {
            setNotifications(data.notifications);
          }
          setUnreadCount(data.unreadCount);
          setTotalCount(data.totalCount);
          setHasMore(data.hasMore);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return; // Request was cancelled, ignore
        }

        logger.auth("Failed to fetch notifications:", err);
        if (mountedRef.current) {
          const errorMessage =
            err instanceof Error ? err.message : "Unknown error";
          if (!errorMessage.includes("401")) {
            setError("Unable to load notifications. Please try again later.");
          }
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [token, API_BASE, getHeaders]
  );

  // Optimized unread count refresh with global deduplication
  const refreshUnreadCount = useCallback(async () => {
    if (!token || !mountedRef.current) {
      // Demo mode - calculate from current notifications
      const currentUnreadCount = notificationsRef.current.filter(
        (n) => !n.isRead
      ).length;
      if (mountedRef.current) {
        setUnreadCount(currentUnreadCount);
      }
      return;
    }

    const now = Date.now();

    // Use global cache to prevent duplicate requests (cache for 60 seconds)
    if (globalUnreadCountCache.lastFetch > now - 60000) {
      if (mountedRef.current) {
        setUnreadCount(globalUnreadCountCache.count);
      }
      return;
    }

    // Prevent concurrent requests
    if (globalUnreadCountCache.inProgress) {
      return;
    }

    globalUnreadCountCache.inProgress = true;

    try {
      const response = await fetch(
        `${API_BASE}/api/notifications/unread-count`,
        {
          headers: await getHeaders(),
          signal: abortControllerRef.current?.signal,
        }
      );

      if (response.ok) {
        const data = await response.json();
        globalUnreadCountCache.count = data.count;
        globalUnreadCountCache.lastFetch = now;

        if (mountedRef.current) {
          setUnreadCount(data.count);
        }
      } else if (response.status === 401) {
        // Auth error - clear cache
        tokenCacheRef.current = { token: null, expires: 0 };
        globalUnreadCountCache.count = 0;
        if (mountedRef.current) {
          setUnreadCount(0);
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        logger.auth("Failed to refresh unread count:", err);
      }
    } finally {
      globalUnreadCountCache.inProgress = false;
    }
  }, [token, API_BASE, getHeaders]);

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!token) {
        // Demo mode
        if (notificationId === "demo-signup-cta") {
          localStorage.removeItem("demo_session");
          window.location.href = "/auth/signIn";
          return;
        }

        if (mountedRef.current) {
          setNotifications((prev) =>
            prev.map((notif) =>
              notif.id === notificationId
                ? { ...notif, isRead: true, readAt: new Date().toISOString() }
                : notif
            )
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE}/api/notifications/${notificationId}/read`,
          {
            method: "PUT",
            headers: await getHeaders(),
            signal: abortControllerRef.current?.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (mountedRef.current) {
          setNotifications((prev) =>
            prev.map((notif) =>
              notif.id === notificationId
                ? { ...notif, isRead: true, readAt: new Date().toISOString() }
                : notif
            )
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));

          // Update global cache
          globalUnreadCountCache.count = Math.max(
            0,
            globalUnreadCountCache.count - 1
          );
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          logger.auth("Failed to mark notification as read:", err);
          throw err;
        }
      }
    },
    [token, API_BASE, getHeaders]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!token) {
      if (mountedRef.current) {
        setNotifications((prev) =>
          prev.map((notif) => ({
            ...notif,
            isRead: true,
            readAt: new Date().toISOString(),
          }))
        );
        setUnreadCount(0);
      }
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/notifications/mark-all-read`,
        {
          method: "PUT",
          headers: await getHeaders(),
          signal: abortControllerRef.current?.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (mountedRef.current) {
        setNotifications((prev) =>
          prev.map((notif) => ({
            ...notif,
            isRead: true,
            readAt: new Date().toISOString(),
          }))
        );
        setUnreadCount(0);

        // Update global cache
        globalUnreadCountCache.count = 0;
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        logger.auth("Failed to mark all notifications as read:", err);
        throw err;
      }
    }
  }, [token, API_BASE, getHeaders]);

  // Delete notification
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (!token) {
        const deletedNotification = notificationsRef.current.find(
          (n) => n.id === notificationId
        );
        if (mountedRef.current) {
          setNotifications((prev) =>
            prev.filter((notif) => notif.id !== notificationId)
          );
          setTotalCount((prev) => prev - 1);

          if (deletedNotification && !deletedNotification.isRead) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE}/api/notifications/${notificationId}`,
          {
            method: "DELETE",
            headers: await getHeaders(),
            signal: abortControllerRef.current?.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const deletedNotification = notificationsRef.current.find(
          (n) => n.id === notificationId
        );
        if (mountedRef.current) {
          setNotifications((prev) =>
            prev.filter((notif) => notif.id !== notificationId)
          );
          setTotalCount((prev) => prev - 1);

          if (deletedNotification && !deletedNotification.isRead) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
            globalUnreadCountCache.count = Math.max(
              0,
              globalUnreadCountCache.count - 1
            );
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          logger.auth("Failed to delete notification:", err);
          throw err;
        }
      }
    },
    [token, API_BASE, getHeaders]
  );

  // Delete all read notifications
  const deleteAllRead = useCallback(async () => {
    if (!token) {
      if (mountedRef.current) {
        setNotifications((prev) => prev.filter((notif) => !notif.isRead));
        setTotalCount(() => unreadCount);
      }
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/notifications/read`, {
        method: "DELETE",
        headers: await getHeaders(),
        signal: abortControllerRef.current?.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (mountedRef.current) {
        setNotifications((prev) => prev.filter((notif) => !notif.isRead));
        setTotalCount(() => unreadCount);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        logger.auth("Failed to delete read notifications:", err);
        throw err;
      }
    }
  }, [token, API_BASE, getHeaders, unreadCount]);

  // PERFORMANCE FIX: Auto-refresh every 10 MINUTES instead of 30 seconds
  useEffect(() => {
    if (!token || authLoading) {
      return;
    }

    // Initial refresh
    refreshUnreadCount();

    // Only create global interval if none exists
    if (!globalInterval) {
      globalInterval = setInterval(() => {
        // Only refresh if there are active hooks
        if (activeHooks > 0) {
          // Refresh using a simple fetch without the hook's dependencies
          const quickRefresh = async () => {
            try {
              const response = await fetch(
                `${API_BASE}/api/notifications/unread-count`,
                {
                  headers: {
                    "Content-Type": "application/json",
                    ...(localStorage.getItem("auth-token") && {
                      Authorization: `Bearer ${localStorage.getItem(
                        "auth-token"
                      )}`,
                    }),
                  },
                }
              );

              if (response.ok) {
                const data = await response.json();
                globalUnreadCountCache.count = data.count;
                globalUnreadCountCache.lastFetch = Date.now();
              }
            } catch (err) {
              logger.auth("Background unread count refresh failed:", err);
            }
          };

          quickRefresh();
        }
      }, 600000); // 10 MINUTES instead of 30 seconds!!!
    }

    return () => {
      // Don't clear global interval here - let the lifecycle effect handle it
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, authLoading, API_BASE]); // refreshUnreadCount intentionally excluded for performance

  // Initial load effect - simplified and stable
  useEffect(() => {
    if (authLoading) {
      return;
    }

    const loadInitialNotifications = async () => {
      try {
        await fetchNotifications();
      } catch (error) {
        logger.auth("Failed to load initial notifications:", error);
      }
    };

    loadInitialNotifications();
  }, [token, authLoading, fetchNotifications]);

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
    refreshUnreadCount,
  };
}
