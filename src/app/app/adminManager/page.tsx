"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/unifiedAuth";
import { EnhancedGlassCard } from "@/components/ui/enhanced-glass/EnhancedGlassCard";
import { StatsGrid } from "@/components/common/StatsGrid";
import { Users, ShieldAlert, Bot, Ban } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  emailVerified: boolean;
  provider: string | null;
  createdAt: string;
  lastSignIn: string | null;
}

interface RateLimitStats {
  summary?: {
    totalRequests?: number;
    blockedRequests?: number;
    botDetections?: number;
    uniqueIdentifiers?: number;
  };
}

interface BlockedIdentifier {
  identifier: string;
  identifierType?: string;
  endpoint?: string;
  blockedUntil?: string;
}

/** Distinguishes "you are not an admin" from "something broke". */
type LoadState =
  | { status: "loading" }
  | { status: "forbidden" }
  | { status: "error"; message: string }
  | { status: "ready" };

function formatDate(value: string | null | undefined): string {
  if (!value) return "Never";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function AdminManager() {
  const { user } = useAuth();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<RateLimitStats | null>(null);
  const [blocked, setBlocked] = useState<BlockedIdentifier[]>([]);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const usersRes = await fetch("/api/admin/users", {
        credentials: "same-origin",
      });

      // The backend's RoleGuard is the authority on access; the UI just
      // reports what it said rather than guessing from the local user object.
      if (usersRes.status === 401 || usersRes.status === 403) {
        setState({ status: "forbidden" });
        return;
      }
      if (!usersRes.ok) {
        throw new Error(`Failed to load users (${usersRes.status})`);
      }

      setUsers(await usersRes.json());

      // Rate limit panels are supplementary - a failure there should not hide
      // the user list.
      const [statsRes, blockedRes] = await Promise.all([
        fetch("/api/admin/rate-limit/stats?hours=24", {
          credentials: "same-origin",
        }).catch(() => null),
        fetch("/api/admin/rate-limit/blocked-identifiers", {
          credentials: "same-origin",
        }).catch(() => null),
      ]);

      if (statsRes?.ok) setStats(await statsRes.json());
      if (blockedRes?.ok) {
        const payload = await blockedRes.json();
        setBlocked(payload?.blocked ?? payload?.identifiers ?? []);
      }

      setState({ status: "ready" });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to load admin data",
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const unlock = useCallback(
    async (identifier: string) => {
      await fetch("/api/admin/rate-limit/unlock", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      void load();
    },
    [load]
  );

  if (state.status === "loading") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6" />
        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (state.status === "forbidden") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-amber-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Administrator access required
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {user?.email
            ? `${user.email} does not have an administrator role.`
            : "Sign in with an administrator account to view this page."}
        </p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Could not load admin data
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{state.message}</p>
        <button
          onClick={() => void load()}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
          data-testid="admin-retry"
        >
          Try again
        </button>
      </div>
    );
  }

  const admins = users.filter(
    (u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN"
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Administration
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Accounts and abuse protection for this instance.
      </p>

      <StatsGrid
        items={[
          {
            label: "Users",
            value: users.length,
            format: "number" as const,
            icon: <Users />,
            iconColor: "text-blue-500",
          },
          {
            label: "Administrators",
            value: admins,
            format: "number" as const,
            icon: <ShieldAlert />,
            iconColor: "text-amber-500",
          },
          {
            label: "Blocked (24h)",
            value: stats?.summary?.blockedRequests ?? 0,
            format: "number" as const,
            icon: <Ban />,
            iconColor: "text-red-500",
          },
          {
            label: "Bot detections (24h)",
            value: stats?.summary?.botDetections ?? 0,
            format: "number" as const,
            icon: <Bot />,
            iconColor: "text-purple-500",
          },
        ]}
        variant="performance"
        columns={4}
        className="mb-8"
        data-testid="admin-stats"
      />

      <EnhancedGlassCard className="mb-8 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Users
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm" data-testid="admin-users-table">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Role</th>
                <th className="py-2 pr-4 font-medium">Verified</th>
                <th className="py-2 pr-4 font-medium">Joined</th>
                <th className="py-2 pr-4 font-medium">Last sign-in</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="py-2 pr-4 text-gray-900 dark:text-gray-100">
                    {u.email}
                  </td>
                  <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">
                    {u.name || "-"}
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={
                        u.role === "USER"
                          ? "text-gray-600 dark:text-gray-400"
                          : "text-amber-600 dark:text-amber-400 font-medium"
                      }
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">
                    {u.emailVerified ? "Yes" : "No"}
                  </td>
                  <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">
                    {formatDate(u.lastSignIn)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </EnhancedGlassCard>

      <EnhancedGlassCard className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Blocked identifiers
        </h2>
        {blocked.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            Nothing is currently rate limited.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {blocked.map((entry) => (
              <li
                key={`${entry.identifier}-${entry.endpoint ?? ""}`}
                className="py-3 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {entry.identifier}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {entry.endpoint || "all endpoints"}
                    {entry.blockedUntil
                      ? ` - until ${new Date(entry.blockedUntil).toLocaleString("en-GB")}`
                      : ""}
                  </p>
                </div>
                <button
                  onClick={() => void unlock(entry.identifier)}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
                  data-testid="admin-unlock"
                >
                  Unlock
                </button>
              </li>
            ))}
          </ul>
        )}
      </EnhancedGlassCard>
    </div>
  );
}
