"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ChartLoadingSkeletonProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function ChartLoadingSkeleton({
  size = "md",
  className,
}: ChartLoadingSkeletonProps) {
  const getHeight = () => {
    switch (size) {
      case "sm":
        return "h-32";
      case "lg":
        return "h-64";
      case "xl":
        return "h-80";
      default:
        return "h-48";
    }
  };

  return (
    <div className={cn("w-full", getHeight(), className)}>
      <div className="h-full flex items-end justify-between gap-2 px-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-t animate-pulse"
            style={{
              height: `${Math.random() * 80 + 20}%`,
              animationDelay: `${i * 100}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
