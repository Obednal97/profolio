"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import LineChart from '@/components/charts/line';
import PieChart from '@/components/charts/pie';

interface ChartHistoryItem {
  date: string;
  totalValue: number;
}

interface Asset {
  id: string;
  name: string;
  type: string;
  symbol?: string;
  quantity: number;
  current_value: number;
  purchase_price?: number;
  gainLoss?: number;
  gainLossPercent?: number;
}

interface PerformanceMetrics {
  totalValue: number;
  totalInvested: number;
  totalGainLoss: number;
  percentageChange: number;
  assetsByType: Record<string, { count: number; value: number; allocation: number }>;
  topPerformers: Asset[];
  lastUpdated: Date;
}

interface PerformanceDashboardProps {
  userId?: string;
  formatCurrency: (amount: number) => string;
}

export default function PerformanceDashboard({ userId, formatCurrency }: PerformanceDashboardProps) {
  const [timeframe, setTimeframe] = useState('30');
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [chartData, setChartData] = useState<Array<{ date: string; value: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'allocation'>('overview');

  useEffect(() => {
    loadPerformanceData();
  }, [timeframe, userId]);

  const loadPerformanceData = async () => {
    setLoading(true);
    try {
      // Load performance metrics
      const metricsResponse = await fetch('/api/assets/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId || 'demo-user-id' }),
      });
      const metricsData = await metricsResponse.json();
      setMetrics(metricsData);

      // Load chart data
      const chartResponse = await fetch('/api/assets/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: userId || 'demo-user-id',
          days: timeframe === 'max' ? null : parseInt(timeframe)
        }),
      });
      const chartData = await chartResponse.json();
      
      if (chartData.history) {
        setChartData(chartData.history.map((item: ChartHistoryItem) => ({
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: item.totalValue
        })));
      }
    } catch (error) {
      console.error('Failed to load performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadPerformanceData();
    setRefreshing(false);
  };

  const timeFrameOptions = [
    { value: '7', label: '7D' },
    { value: '30', label: '30D' },
    { value: '90', label: '3M' },
    { value: '180', label: '6M' },
    { value: '365', label: '1Y' },
    { value: 'max', label: 'All' },
  ];

  const allocationData = useMemo(() => {
    if (!metrics?.assetsByType) return [];
    
    return Object.entries(metrics.assetsByType).map(([type, data]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1).toLowerCase(),
      value: data.value,
      percentage: data.allocation,
      count: data.count,
      color: getTypeColor(type),
    }));
  }, [metrics]);

  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      STOCK: '#3B82F6',
      CRYPTO: '#F59E0B',
      PROPERTY: '#10B981',
      SAVINGS: '#8B5CF6',
      BOND: '#EF4444',
      OTHER: '#6B7280',
    };
    return colors[type] || '#6B7280';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Portfolio Performance</h2>
          <p className="text-sm text-gray-600">
            Track your asset performance and allocation over time
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <i className={`fas fa-sync-alt mr-2 ${refreshing ? 'animate-spin' : ''}`}></i>
            Refresh
          </button>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'overview', label: 'Overview', icon: 'fa-chart-line' },
          { key: 'detailed', label: 'Detailed', icon: 'fa-list' },
          { key: 'allocation', label: 'Allocation', icon: 'fa-chart-pie' },
        ].map((mode) => (
          <button
            key={mode.key}
            onClick={() => setViewMode(mode.key as 'overview' | 'detailed' | 'allocation')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === mode.key
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <i className={`fas ${mode.icon} mr-2`}></i>
            {mode.label}
          </button>
        ))}
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(metrics?.totalValue || 0)}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-wallet text-blue-600"></i>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Invested</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(metrics?.totalInvested || 0)}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-arrow-down text-green-600"></i>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gain/Loss</p>
              <p className={`text-2xl font-bold ${
                (metrics?.totalGainLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(metrics?.totalGainLoss || 0)}
              </p>
            </div>
            <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
              (metrics?.totalGainLoss || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <i className={`fas ${
                (metrics?.totalGainLoss || 0) >= 0 ? 'fa-arrow-up text-green-600' : 'fa-arrow-down text-red-600'
              }`}></i>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Percentage Change</p>
              <p className={`text-2xl font-bold ${
                (metrics?.percentageChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(metrics?.percentageChange || 0).toFixed(2)}%
              </p>
            </div>
            <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
              (metrics?.percentageChange || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <i className={`fas fa-percentage ${
                (metrics?.percentageChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}></i>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Portfolio Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Portfolio Growth</h3>
              <div className="flex space-x-1">
                {timeFrameOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTimeframe(option.value)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      timeframe === option.value
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <LineChart
              data={chartData}
              xKey="date"
              lines={[{ dataKey: "value", color: "#3B82F6" }]}
            />
          </div>

          {/* Asset Allocation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Asset Allocation</h3>
            <PieChart
              data={allocationData}
              nameKey="name"
              dataKey="value"
            />
            <div className="mt-4 space-y-2">
              {allocationData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span>{item.name} ({item.count})</span>
                  </div>
                  <span className="font-medium">{item.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Performers */}
      {viewMode === 'detailed' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Performers</h3>
          <div className="space-y-4">
            {metrics?.topPerformers?.slice(0, 5).map((asset, index) => (
              <div key={asset.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-yellow-600' : 'bg-gray-300'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{asset.name}</h4>
                    <p className="text-sm text-gray-600">
                      {asset.symbol} • {asset.type}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {formatCurrency(asset.current_value)}
                  </p>
                  <p className={`text-sm ${
                    (asset.gainLossPercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(asset.gainLossPercent || 0) >= 0 ? '+' : ''}
                    {(asset.gainLossPercent || 0).toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {metrics?.lastUpdated ? new Date(metrics.lastUpdated).toLocaleString() : 'Never'}
      </div>
    </div>
  );
} 