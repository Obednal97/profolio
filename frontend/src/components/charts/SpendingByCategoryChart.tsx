"use client";

import React from "react";
import { ChartContainer } from "@/components/common/ChartContainer";
import PieChart from "./pie";

interface SpendingByCategoryChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  title?: string;
  subtitle?: string;
  variant?: "subtle" | "standard" | "prominent";
  size?: "sm" | "md" | "lg" | "xl";
  actions?: React.ReactNode;
  loading?: boolean;
  error?: string;
  className?: string;
  showLegend?: boolean;
  maxCategories?: number;
}

export function SpendingByCategoryChart({
  data,
  title = "Spending by Category",
  subtitle,
  variant = "standard",
  size = "md",
  actions,
  loading,
  error,
  className,
  showLegend = true,
  maxCategories = 8,
}: SpendingByCategoryChartProps) {
  // Sort by value and limit to top categories
  const chartData = React.useMemo(() => {
    const sorted = [...data].sort((a, b) => b.value - a.value);
    
    if (sorted.length <= maxCategories) {
      return sorted;
    }
    
    const top = sorted.slice(0, maxCategories - 1);
    const otherValue = sorted
      .slice(maxCategories - 1)
      .reduce((sum, item) => sum + item.value, 0);
    
    if (otherValue > 0) {
      top.push({
        name: "Other",
        value: otherValue,
        color: "#9ca3af", // gray-400
      });
    }
    
    return top;
  }, [data, maxCategories]);

  return (
    <ChartContainer
      title={title}
      subtitle={subtitle}
      variant={variant}
      size={size}
      actions={actions}
      loading={loading}
      error={error}
      className={className}
    >
      <PieChart data={chartData} />
      {showLegend && (
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {chartData.slice(0, 6).map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
            </div>
          ))}
        </div>
      )}
    </ChartContainer>
  );
}