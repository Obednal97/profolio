import { useMemo } from "react";
import { useAuth } from "@/lib/unifiedAuth";

interface StableUser {
  id: string;
  name: string;
  email: string;
  token: string | null;
  isDemoMode: boolean;
}

/**
 * 🚀 PERFORMANCE: Provides stable user object that only changes when essential fields change
 * Prevents unnecessary re-renders caused by object reference changes
 */
export function useStableUser(): StableUser | null {
  const { user, token } = useAuth();

  // Check demo mode once and memoize it
  const isDemoMode = useMemo(() => {
    return (
      typeof window !== "undefined" &&
      localStorage.getItem("demo-mode") === "true"
    );
  }, []);

  // Create stable user object that only recreates when actual values change
  return useMemo(() => {
    if (user) {
      return {
        id: user.id,
        name:
          user.displayName || user.name || user.email?.split("@")[0] || "User",
        email: user.email || "",
        token: token || null,
        isDemoMode: false,
      };
    } else if (isDemoMode) {
      return {
        id: "demo-user-id",
        name: "Demo User",
        email: "demo@profolio.com",
        token: "demo-token",
        isDemoMode: true,
      };
    }
    return null;
  }, [
    // Only recreate when these primitive values actually change
    user?.id,
    user?.email,
    user?.displayName,
    user?.name,
    token,
    isDemoMode,
  ]);
}

/**
 * 🚀 PERFORMANCE: Hook for stable user ID only (most common use case)
 * Prevents re-renders when only ID is needed
 */
export function useStableUserId(): string | null {
  const stableUser = useStableUser();
  return stableUser?.id || null;
}

/**
 * 🚀 PERFORMANCE: Hook for stable auth token only
 * Prevents re-renders when only token is needed
 */
export function useStableAuthToken(): string | null {
  const stableUser = useStableUser();
  return stableUser?.token || null;
}
