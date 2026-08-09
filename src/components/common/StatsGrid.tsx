"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { EnhancedMetricCard, EnhancedMetricCardProps } from "./EnhancedMetricCard";

export interface StatItem
  extends Omit<EnhancedMetricCardProps, "variant" | "className"> {
  key?: string;
}

export interface StatsGridProps {
  items: StatItem[];
  variant?: "glass" | "performance" | "minimal";
  columns?: 2 | 3 | 4 | "auto";
  className?: string;
  "data-testid"?: string;
}

export function StatsGrid({
  items,
  variant = "glass",
  columns = "auto",
  className,
  ...props
}: StatsGridProps) {
  const getGridColumns = () => {
    switch (columns) {
      case 2:
        return "grid-cols-1 md:grid-cols-2";
      case 3:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
      case 4:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";
      case "auto":
      default:
        // Auto layout based on number of items
        if (items.length <= 2) return "grid-cols-1 md:grid-cols-2";
        if (items.length === 3)
          return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";
    }
  };

  return (
    <div
      className={cn("grid gap-6", getGridColumns(), className)}
      data-testid={props["data-testid"]}
    >
      {items.map((item, index) => (
        <EnhancedMetricCard
          key={item.key || `${item.label}-${index}`}
          {...item}
          variant={variant}
          animate={true}
          animationDelay={index * 0.05}
          data-testid={`${props["data-testid"]}-item-${index}`}
        />
      ))}
    </div>
  );
}
