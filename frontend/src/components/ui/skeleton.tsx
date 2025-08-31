import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/cards/GlassCard";

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
  // Extract onClick to convert type if needed
  const { onClick } = props;
  
  return (
    <GlassCard
      variant="standard"
      padding="md"
      animate
      animationDelay={0.1}
      className={cn("space-y-4", className)}
      onClick={onClick ? () => onClick({} as React.MouseEvent<HTMLDivElement>) : undefined}
    >
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </GlassCard>
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
  // Extract onClick to convert type if needed
  const { onClick } = props;
  
  return (
    <GlassCard
      variant="standard"
      padding="md"
      animate
      animationDelay={0.1}
      className={cn("space-y-2", className)}
      onClick={onClick ? () => onClick({} as React.MouseEvent<HTMLDivElement>) : undefined}
    >
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-32" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-16" />
      </div>
    </GlassCard>
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
          <GlassCard variant="standard" padding="md" animate animationDelay={0.1}>
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
          </GlassCard>

          {/* Preferences section */}
          <GlassCard variant="standard" padding="md" animate animationDelay={0.15}>
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
          </GlassCard>

          {/* Security section */}
          <GlassCard variant="standard" padding="md" animate animationDelay={0.2}>
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
          </GlassCard>
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
            <GlassCard
              key={i}
              variant="standard"
              padding="md"
              animate
              animationDelay={0.1 + i * 0.05}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-32" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Charts Section skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <GlassCard variant="standard" padding="lg" animate animationDelay={0.3}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
              <Skeleton className="h-6 w-48" />
              <div className="flex gap-1 sm:gap-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-12 rounded-lg" />
                ))}
              </div>
            </div>
            <Skeleton className="h-48 sm:h-64 rounded-lg" />
          </GlassCard>

          <GlassCard variant="standard" padding="lg" animate animationDelay={0.35}>
            <Skeleton className="h-6 w-40 mb-4 sm:mb-6" />
            <Skeleton className="h-48 sm:h-64 rounded-lg" />
          </GlassCard>
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

// Portfolio skeleton
function PortfolioSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      {/* Header skeleton */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <SkeletonButton size="lg" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <SkeletonStat key={i} />
        ))}
      </div>

      {/* Portfolio overview skeleton */}
      <div className="mb-8">
        <GlassCard variant="standard" padding="md" animate animationDelay={0.1}>
          <Skeleton className="h-6 w-48 mb-4" />
          <SkeletonChart height="h-64" />
        </GlassCard>
      </div>

      {/* Assets grid skeleton */}
      <div className="mb-4 flex justify-between items-center">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-lg" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <SkeletonCard key={i} className="h-48" />
        ))}
      </div>
    </div>
  );
}

// Properties skeleton
function PropertiesSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      {/* Header skeleton */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <SkeletonButton size="lg" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <SkeletonStat key={i} />
        ))}
      </div>

      {/* Properties grid skeleton */}
      <div className="mb-4">
        <Skeleton className="h-8 w-40 mb-4" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <SkeletonCard key={i} className="h-64" />
        ))}
      </div>
    </div>
  );
}

// ExpenseManager skeleton
function ExpenseManagerSkeleton() {
  return (
    <div className="min-h-screen text-gray-900 dark:text-white">
      <div className="relative z-10 p-4 md:p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-5 w-48" />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <SkeletonButton size="lg" className="w-40" />
              <SkeletonButton size="lg" className="w-36" />
              <SkeletonButton size="lg" className="w-36" />
            </div>
          </div>
        </div>

        {/* Stats Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <SkeletonStat key={i} />
          ))}
        </div>

        {/* Tab navigation skeleton */}
        <div className="flex space-x-1 mb-6">
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>

        {/* Filters skeleton */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search skeleton */}
            <div className="flex-1 max-w-md">
              <SkeletonInput className="w-full" />
            </div>

            {/* Filter controls skeleton */}
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-10 w-28 rounded-lg" />
              <Skeleton className="h-10 w-20 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Content area skeleton based on view mode */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} className="h-48" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Dashboard skeleton
function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      {/* Header skeleton */}
      <div className="mb-8">
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>

      {/* Net Worth skeleton */}
      <div className="mb-8">
        <SkeletonCard className="h-32" />
      </div>

      {/* Stats Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <SkeletonStat key={i} />
        ))}
      </div>

      {/* Main content grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart skeleton */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard variant="standard" padding="md" animate animationDelay={0.1}>
            <Skeleton className="h-6 w-48 mb-4" />
            <SkeletonChart height="h-80" />
          </GlassCard>

          {/* Quick Actions skeleton */}
          <GlassCard variant="standard" padding="md" animate animationDelay={0.1}>
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <SkeletonButton key={i} size="lg" className="w-full" />
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Sidebar skeleton */}
        <div className="space-y-6">
          {/* Recent Transactions skeleton */}
          <GlassCard variant="standard" padding="md" animate animationDelay={0.1}>
            <Skeleton className="h-6 w-40 mb-4" />
            <SkeletonList items={5} />
          </GlassCard>

          {/* Market Data skeleton */}
          <GlassCard variant="standard" padding="md" animate animationDelay={0.1}>
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          </GlassCard>

          {/* News skeleton */}
          <GlassCard variant="standard" padding="md" animate animationDelay={0.1}>
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <div className="flex gap-4">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
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
  DashboardSkeleton,
  ExpenseManagerSkeleton,
  PortfolioSkeleton,
  PropertiesSkeleton,
};
