"use client";

import React, { useState } from "react";
import {
  StatsGrid,
  ChartContainer,
  FilterPanel,
  type StatItem,
  type FilterOption,
  type FilterValue,
} from "@/components/common";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Download,
  Maximize2,
  DollarSign,
  TrendingUp,
  Home,
  Receipt,
} from "lucide-react";

// Sample data for charts
const lineChartData = [
  { month: "Jan", value: 65000, expenses: 12000 },
  { month: "Feb", value: 68000, expenses: 13000 },
  { month: "Mar", value: 72000, expenses: 11500 },
  { month: "Apr", value: 78000, expenses: 14000 },
  { month: "May", value: 82000, expenses: 12500 },
  { month: "Jun", value: 85000, expenses: 13500 },
];

const pieChartData = [
  { name: "Stocks", value: 45000, color: "#22c55e" },
  { name: "Bonds", value: 30000, color: "#3b82f6" },
  { name: "Property", value: 20000, color: "#8b5cf6" },
  { name: "Cash", value: 5000, color: "#f59e0b" },
];

export default function TestComponentsPublicPage() {
  const [filters, setFilters] = useState<Record<string, FilterValue>>({
    search: "",
    category: null,
    dateFrom: null,
    dateTo: null,
  });

  // Stats data for different scenarios
  const portfolioStats: StatItem[] = [
    {
      label: "Total Portfolio Value",
      value: 125500,
      format: "currency",
      trend: 5.2,
      icon: <DollarSign className="h-5 w-5" />,
      subtitle: "All assets combined",
    },
    {
      label: "Monthly Income",
      value: 8500,
      format: "currency",
      trend: -2.1,
      icon: <TrendingUp className="h-5 w-5" />,
      subtitle: "From all sources",
    },
    {
      label: "Properties",
      value: 3,
      format: "number",
      trend: 0,
      icon: <Home className="h-5 w-5" />,
      subtitle: "Residential properties",
    },
    {
      label: "Monthly Expenses",
      value: 3200,
      format: "currency",
      trend: 8.5,
      icon: <Receipt className="h-5 w-5" />,
      subtitle: "Average this quarter",
    },
  ];

  const performanceStats: StatItem[] = [
    { label: "YTD Return", value: 12.5, format: "percentage", trend: 12.5 },
    {
      label: "Best Performer",
      value: "AAPL +32%",
      format: "custom",
      trend: 32,
    },
    {
      label: "Worst Performer",
      value: "BONDS -5%",
      format: "custom",
      trend: -5,
    },
    { label: "Win Rate", value: 68, format: "percentage", trend: 3.2 },
  ];

  const filterOptions: FilterOption[] = [
    {
      key: "category",
      label: "Category",
      type: "select",
      placeholder: "All Categories",
      options: [
        { label: "Stocks", value: "stocks" },
        { label: "Bonds", value: "bonds" },
        { label: "Property", value: "property" },
        { label: "Cash", value: "cash" },
      ],
    },
    {
      key: "dateFrom",
      label: "From Date",
      type: "date",
      placeholder: "Start date",
    },
    {
      key: "dateTo",
      label: "To Date",
      type: "date",
      placeholder: "End date",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-8 space-y-12 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Generic Component Showcase
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Demonstrating reusable components with different data configurations
          </p>
        </div>

        {/* StatsGrid Examples */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            StatsGrid Component
          </h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                Glass Variant (Portfolio Stats)
              </h3>
              <StatsGrid
                items={portfolioStats}
                variant="glass"
                data-testid="portfolio-stats"
              />
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                Performance Variant (With Tinting)
              </h3>
              <StatsGrid
                items={performanceStats}
                variant="performance"
                columns={4}
                data-testid="performance-stats"
              />
            </div>
          </div>
        </section>

        {/* ChartContainer Examples */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            ChartContainer Component
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartContainer
              title="Portfolio Performance"
              subtitle="Last 6 months"
              variant="prominent"
              size="lg"
              actions={
                <>
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <Maximize2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <Download className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </>
              }
              data-testid="performance-chart"
            >
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.8)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#22c55e"
                    strokeWidth={2}
                    name="Portfolio Value"
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Expenses"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>

            <ChartContainer
              title="Asset Allocation"
              subtitle="Current distribution"
              variant="standard"
              size="lg"
              data-testid="allocation-chart"
            >
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.8)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* Loading and Error States */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ChartContainer
              title="Loading State Example"
              variant="subtle"
              size="md"
              loading={true}
              data-testid="loading-chart"
            >
              <div />
            </ChartContainer>

            <ChartContainer
              title="Error State Example"
              variant="subtle"
              size="md"
              error="Failed to load chart data. Please try again later."
              data-testid="error-chart"
            >
              <div />
            </ChartContainer>
          </div>
        </section>

        {/* FilterPanel Examples */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            FilterPanel Component
          </h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                Horizontal Layout (Default)
              </h3>
              <FilterPanel
                filters={filters}
                onFilterChange={setFilters}
                options={filterOptions}
                variant="glass"
                data-testid="horizontal-filters"
              />
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                Grid Layout
              </h3>
              <FilterPanel
                filters={filters}
                onFilterChange={setFilters}
                options={filterOptions}
                variant="glass"
                layout="grid"
                data-testid="grid-filters"
              />
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                Current Filter Values:
              </h3>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto">
                {JSON.stringify(filters, null, 2)}
              </pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
