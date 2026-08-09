"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { EnhancedGlassCard } from "@/components/ui/enhanced-glass/EnhancedGlassCard";

export interface EnhancedMetricCardProps {
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
  iconColor?: string; // Custom icon color class
  animate?: boolean;
  animationDelay?: number;
}

export function EnhancedMetricCard({
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
  iconColor,
  animate = true,
  animationDelay = 0,
  ...props
}: EnhancedMetricCardProps) {
  // Format the value based on type
  const formatValue = (val: number | string): string => {
    if (typeof val === "string") return val;

    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
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

  // Get trend icon
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend > 0) return <TrendingUp className="h-4 w-4" />;
    return <TrendingDown className="h-4 w-4" />;
  };

  // Get trend color
  const getTrendColor = () => {
    if (!trend) return "text-gray-500 dark:text-gray-400";
    if (trend > 0) return "text-green-600 dark:text-green-400";
    return "text-red-600 dark:text-red-400";
  };

  if (loading) {
    return (
      <EnhancedGlassCard
        variant="standard"
        padding="md"
        className={className}
        data-testid={`${props["data-testid"]}-loading`}
      >
        <div className="space-y-3 animate-pulse">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </EnhancedGlassCard>
    );
  }

  if (error) {
    return (
      <EnhancedGlassCard
        variant="standard"
        padding="md"
        className={className}
        data-testid={`${props["data-testid"]}-error`}
      >
        <p className="text-sm text-red-500">{error}</p>
      </EnhancedGlassCard>
    );
  }

  // For minimal variant, don't use glass card
  if (variant === "minimal") {
    return (
      <div
        className={cn(
          "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-xl",
          className
        )}
        data-testid={props["data-testid"]}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatValue(value)}
            </p>
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {icon && (
            <div className={cn("text-3xl", iconColor || "text-gray-500")}>
              {icon}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <EnhancedGlassCard
      variant="standard"
      padding="md"
      enableLensing
      hoverable
      animate={animate}
      animationDelay={animationDelay}
      enablePerformanceTinting={variant === "performance"}
      performance={variant === "performance" ? trend || 0 : undefined}
      className={className}
      data-testid={props["data-testid"]}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatValue(value)}
          </p>
          {(trend !== undefined || subtitle) && (
            <p className={cn("text-sm mt-1", getTrendColor())}>
              {trend !== undefined && (
                <>
                  {getTrendIcon() && (
                    <span className="inline-flex items-center mr-1">
                      {getTrendIcon()}
                    </span>
                  )}
                  {trend > 0 ? "+" : ""}
                  {trend.toFixed(1)}%
                  {subtitle && " "}
                </>
              )}
              {subtitle && (
                <span className="text-gray-500 dark:text-gray-400">
                  {subtitle}
                </span>
              )}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn("text-3xl", iconColor || "text-gray-500")}>
            {icon}
          </div>
        )}
      </div>
    </EnhancedGlassCard>
  );
}