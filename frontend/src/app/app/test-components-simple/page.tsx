"use client";

import React from "react";
import { StatsGrid, ChartContainer } from "@/components/common";
import { DollarSign } from "lucide-react";

export default function SimpleTestPage() {
  const testStats = [
    {
      label: "Test Metric 1",
      value: 1000,
      format: "currency" as const,
      trend: 5,
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      label: "Test Metric 2",
      value: 50,
      format: "percentage" as const,
      trend: -2.5,
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">Simple Component Test</h1>

      <div className="space-y-8">
        <div>
          <h2 className="text-xl mb-4">StatsGrid Test</h2>
          <StatsGrid items={testStats} variant="glass" />
        </div>

        <div>
          <h2 className="text-xl mb-4">ChartContainer Test</h2>
          <ChartContainer
            title="Test Chart"
            subtitle="Basic test"
            variant="standard"
            size="md"
          >
            <div className="h-48 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded">
              Chart content goes here
            </div>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
