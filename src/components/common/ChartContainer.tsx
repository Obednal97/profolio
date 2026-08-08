"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ChartLoadingSkeleton } from "./ChartLoadingSkeleton";

export interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  variant?: "subtle" | "standard" | "prominent";
  size?: "sm" | "md" | "lg" | "xl";
  actions?: React.ReactNode; // Export, fullscreen, etc.
  loading?: boolean;
  error?: string;
  className?: string;
  "data-testid"?: string;
}

export function ChartContainer({
  title,
  subtitle,
  children,
  variant = "standard",
  size = "md",
  actions,
  loading,
  error,
  className,
  ...props
}: ChartContainerProps) {
  const getGlassClass = () => {
    switch (variant) {
      case "subtle":
        return "liquid-glass--subtle";
      case "prominent":
        return "liquid-glass--prominent";
      default:
        return "liquid-glass";
    }
  };

  const getMinHeight = () => {
    switch (size) {
      case "sm":
        return "min-h-[200px]";
      case "lg":
        return "min-h-[400px]";
      case "xl":
        return "min-h-[500px]";
      default:
        return "min-h-[300px]";
    }
  };

  const getPadding = () => {
    switch (size) {
      case "sm":
        return "p-4";
      case "lg":
      case "xl":
        return "p-8";
      default:
        return "p-6";
    }
  };

  return (
    <div
      className={cn(
        getGlassClass(),
        getPadding(),
        getMinHeight(),
        "rounded-2xl chart-container",
        className
      )}
      data-testid={props["data-testid"]}
    >
      {/* Header */}
      <div className="chart-header flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {actions && !loading && !error && (
          <div className="chart-actions flex items-center gap-2">{actions}</div>
        )}
      </div>

      {/* Content */}
      <div className="chart-content relative h-full">
        {loading ? (
          <ChartLoadingSkeleton size={size} />
        ) : error ? (
          <div className="chart-error flex items-center justify-center h-full min-h-[inherit]">
            <div className="text-center">
              <p className="text-red-500 dark:text-red-400 mb-2">
                Unable to load chart
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {error}
              </p>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
