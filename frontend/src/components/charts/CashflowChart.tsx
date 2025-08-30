"use client";

import React from "react";
import { ChartContainer } from "@/components/common/ChartContainer";
import LineChart from "./line";

interface CashflowChartProps {
  data: Array<{
    month: string;
    income: number;
    expenses: number;
    savings: number;
    [key: string]: string | number;
  }>;
  title?: string;
  subtitle?: string;
  variant?: "subtle" | "standard" | "prominent";
  size?: "sm" | "md" | "lg" | "xl";
  actions?: React.ReactNode;
  loading?: boolean;
  error?: string;
  className?: string;
}

export function CashflowChart({
  data,
  title = "Cashflow Trend",
  subtitle,
  variant = "prominent",
  size = "md",
  actions,
  loading,
  error,
  className,
}: CashflowChartProps) {
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
      <LineChart
        data={data}
        xKey="month"
        lines={[
          { dataKey: "income", color: "#10b981" },
          { dataKey: "expenses", color: "#ef4444" },
          { dataKey: "savings", color: "#3b82f6" },
        ]}
      />
    </ChartContainer>
  );
}