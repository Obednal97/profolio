import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200 dark:bg-gray-700",
        className
      )}
      {...props}
    />
  );
}

// Text skeleton with different sizes
function SkeletonText({
  className,
  lines = 1,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { lines?: number }) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 && lines > 1 && "w-3/4" // Last line shorter
          )}
        />
      ))}
    </div>
  );
}

// Card skeleton
function SkeletonCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4",
        className
      )}
      {...props}
    >
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

// Chart skeleton
function SkeletonChart({
  className,
  height = "h-64",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { height?: string }) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-lg", height, className)}
      {...props}
    >
      <Skeleton className="absolute inset-0" />
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around h-3/4 p-4 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              "flex-1 bg-gray-300 dark:bg-gray-600",
              `h-${Math.floor(Math.random() * 75) + 25}%`
            )}
            style={{ height: `${Math.random() * 75 + 25}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// Table skeleton
function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { rows?: number; columns?: number }) {
  return (
    <div className={cn("w-full", className)} {...props}>
      {/* Header */}
      <div className="flex gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-4 p-4 border-b border-gray-200 dark:border-gray-700"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className={cn("h-4 flex-1", colIndex === 0 && "w-1/4 flex-none")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// List skeleton
function SkeletonList({
  items = 3,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { items?: number }) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Button skeleton
function SkeletonButton({
  className,
  size = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { size?: "sm" | "default" | "lg" }) {
  const sizeClasses = {
    sm: "h-8 w-20",
    default: "h-10 w-24",
    lg: "h-12 w-32",
  };

  return (
    <Skeleton
      className={cn(sizeClasses[size], "rounded-md", className)}
      {...props}
    />
  );
}

// Avatar skeleton
function SkeletonAvatar({
  className,
  size = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { size?: "sm" | "default" | "lg" }) {
  const sizeClasses = {
    sm: "h-8 w-8",
    default: "h-10 w-10",
    lg: "h-16 w-16",
  };

  return (
    <Skeleton
      className={cn(sizeClasses[size], "rounded-full", className)}
      {...props}
    />
  );
}

// Input skeleton
function SkeletonInput({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Skeleton className={cn("h-10 w-full rounded-md", className)} {...props} />
  );
}

// Badge skeleton
function SkeletonBadge({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Skeleton className={cn("h-6 w-16 rounded-full", className)} {...props} />
  );
}

// Stat card skeleton
function SkeletonStat({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-2",
        className
      )}
      {...props}
    >
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-32" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

// Grid skeleton
function SkeletonGrid({
  cols = 1,
  rows = 3,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { cols?: number; rows?: number }) {
  return (
    <div className={cn(`grid grid-cols-${cols} gap-4`, className)} {...props}>
      {[...Array(rows * cols)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// Settings page skeleton
function SettingsSkeleton() {
  return (
    <div className="min-h-screen text-gray-900 dark:text-white">
      <div className="relative z-10 p-4 md:p-6 max-w-4xl mx-auto animate-in fade-in duration-500">
        {/* Header skeleton */}
        <div className="mb-8">
          <Skeleton className="h-10 w-32 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>

        {/* Settings sections */}
        <div className="space-y-8">
          {/* Profile section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="flex items-center gap-4 mb-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>

          {/* Preferences section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-11 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Security section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <Skeleton className="h-6 w-24 mb-4" />
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-10 w-24 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Property Manager skeleton
function PropertyManagerSkeleton() {
  return (
    <div className="min-h-screen text-gray-900 dark:text-white">
      <div className="relative z-10 p-4 md:p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <Skeleton className="h-10 w-56 mb-2" />
              <Skeleton className="h-5 w-40" />
            </div>
            <SkeletonButton size="lg" className="w-40" />
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <SkeletonStat key={i} />
          ))}
        </div>

        {/* Properties grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} className="h-64" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Chart loading skeleton
function ChartLoadingSkeleton({ height = "h-48" }: { height?: string }) {
  return (
    <div className={cn("flex items-center justify-center", height)}>
      <div className="space-y-4 w-full max-w-md">
        <div className="flex items-center justify-center mb-4">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-end gap-1">
              <Skeleton
                className={`w-8 ${
                  i === 2 ? "h-16" : i === 1 || i === 3 ? "h-12" : "h-8"
                }`}
              />
              <Skeleton
                className={`w-8 ${
                  i === 1 ? "h-20" : i === 0 || i === 4 ? "h-10" : "h-14"
                }`}
              />
              <Skeleton
                className={`w-8 ${
                  i === 3 ? "h-18" : i === 2 ? "h-22" : "h-12"
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Asset Manager skeleton
function AssetManagerSkeleton() {
  return (
    <div className="min-h-screen text-gray-900 dark:text-white">
      <div className="relative z-10 p-4 md:p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
        {/* Header skeleton */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <Skeleton className="h-10 w-56 mb-2" />
              <Skeleton className="h-5 w-80" />
            </div>
            <div className="flex gap-2">
              <SkeletonButton size="lg" className="w-32" />
              <SkeletonButton size="lg" className="w-32" />
            </div>
          </div>
        </div>

        {/* Summary Cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-32" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
              <Skeleton className="h-6 w-48" />
              <div className="flex gap-1 sm:gap-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-12 rounded-lg" />
                ))}
              </div>
            </div>
            <Skeleton className="h-48 sm:h-64 rounded-lg" />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <Skeleton className="h-6 w-40 mb-4 sm:mb-6" />
            <Skeleton className="h-48 sm:h-64 rounded-lg" />
          </div>
        </div>

        {/* Filter Controls skeleton */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div className="flex gap-2 overflow-x-auto pb-2 w-full lg:w-auto">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-24 rounded-lg" />
            ))}
          </div>
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-10 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Assets Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} className="h-48" />
          ))}
        </div>
      </div>
    </div>
  );
}

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonChart,
  SkeletonTable,
  SkeletonList,
  SkeletonButton,
  SkeletonAvatar,
  SkeletonInput,
  SkeletonBadge,
  SkeletonStat,
  SkeletonGrid,
  SettingsSkeleton,
  PropertyManagerSkeleton,
  ChartLoadingSkeleton,
  AssetManagerSkeleton,
};
