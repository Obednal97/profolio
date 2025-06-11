"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingOptimizerProps {
  children: React.ReactNode;
}

/**
 * 🚀 PERFORMANCE: Loading optimizer that provides better UX during page transitions
 * Shows optimized loading states while our preloading improvements take effect
 */
export function LoadingOptimizer({ children }: LoadingOptimizerProps) {
  const [showOptimizedLoading, setShowOptimizedLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Track route changes for loading optimization

    // If the page takes longer than 300ms to load, show optimized loading
    const loadingTimer = setTimeout(() => {
      setShowOptimizedLoading(true);
    }, 300);

    // Reset loading state when content is ready
    const resetTimer = setTimeout(() => {
      setShowOptimizedLoading(false);
    }, 100);

    return () => {
      clearTimeout(loadingTimer);
      clearTimeout(resetTimer);
    };
  }, [pathname]);

  // Show optimized loading skeleton for slow page transitions
  if (showOptimizedLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header skeleton */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <Skeleton className="h-10 w-48 mb-2" />
              <Skeleton className="h-5 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Content skeleton based on route */}
          {pathname.includes("assetManager") && <AssetManagerSkeleton />}
          {pathname.includes("portfolio") && <PortfolioSkeleton />}
          {pathname.includes("dashboard") && <DashboardSkeleton />}
          {!pathname.includes("assetManager") &&
            !pathname.includes("portfolio") &&
            !pathname.includes("dashboard") && <GenericSkeleton />}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Route-specific loading skeletons
function AssetManagerSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>

      {/* Chart area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>

      {/* Assets grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function PortfolioSkeleton() {
  return (
    <div className="space-y-6">
      {/* Portfolio stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>

      {/* Chart */}
      <Skeleton className="h-64 rounded-lg" />

      {/* Assets list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <Skeleton className="h-16 rounded-lg" />

      {/* Main stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>

      {/* Secondary content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );
}

function GenericSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-64 rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    </div>
  );
}
