"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface MetricCardProps {
  label: string;
  value: number | string;
  format?: "currency" | "number" | "percentage" | "custom";
  trend?: number; // Percentage change
  icon?: React.ReactNode;
  subtitle?: string;
  loading?: boolean;
  error?: string;
  variant?: "glass" | "performance" | "minimal";
  className?: string;
  "data-testid"?: string;
  formatOptions?: Intl.NumberFormatOptions;
}

export function MetricCard({
  label,
  value,
  format = "custom",
  trend,
  icon,
  subtitle,
  loading,
  error,
  variant = "glass",
  className,
  formatOptions,
  ...props
}: MetricCardProps) {
  // Format the value based on type
  const formatValue = (val: number | string): string => {
    if (typeof val === "string") return val;

    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-UK", {
          style: "currency",
          currency: "GBP",
          ...formatOptions,
        }).format(val);
      case "number":
        return new Intl.NumberFormat("en-UK", formatOptions).format(val);
      case "percentage":
        return `${val.toFixed(2)}%`;
      default:
        return val.toString();
    }
  };

  // Determine performance class based on trend
  const getPerformanceClass = () => {
    if (!trend || variant !== "performance") return "";
    if (trend > 0) return "liquid-glass--performance-positive";
    if (trend < 0) return "liquid-glass--performance-negative";
    return "";
  };

  // Get trend icon
  const getTrendIcon = () => {
    if (!trend) return <Minus className="h-4 w-4 text-gray-400" />;
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  // Get trend color
  const getTrendColor = () => {
    if (!trend) return "text-gray-500";
    if (trend > 0) return "text-green-600 dark:text-green-400";
    return "text-red-600 dark:text-red-400";
  };

  const baseClass =
    variant === "glass" || variant === "performance"
      ? "liquid-glass"
      : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700";

  if (loading) {
    return (
      <div
        className={cn(baseClass, "p-6 rounded-2xl", className)}
        data-testid={`${props["data-testid"]}-loading`}
      >
        <div className="space-y-3 animate-pulse">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(baseClass, "p-6 rounded-2xl", className)}
        data-testid={`${props["data-testid"]}-error`}
      >
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        baseClass,
        getPerformanceClass(),
        "p-6 rounded-2xl transition-all duration-200 hover:scale-[1.02]",
        className
      )}
      data-testid={props["data-testid"]}
    >
      {/* Header with icon and label */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="text-gray-600 dark:text-gray-400">{icon}</div>
          )}
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {label}
          </h3>
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1">
            {getTrendIcon()}
            <span className={cn("text-sm font-medium", getTrendColor())}>
              {trend > 0 ? "+" : ""}
              {trend.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Value */}
      <div className="space-y-1">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {formatValue(value)}
        </p>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}
      </div>

      {/* Optional trend bar */}
      {trend !== undefined && variant === "performance" && (
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                trend > 0
                  ? "bg-green-500"
                  : trend < 0
                  ? "bg-red-500"
                  : "bg-gray-400"
              )}
              style={{ width: `${Math.min(Math.abs(trend) * 10, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
