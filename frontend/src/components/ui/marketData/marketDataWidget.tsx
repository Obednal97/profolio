'use client';

import React, { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export function MarketDataWidget() {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching market data
    const timer = setTimeout(() => {
      setMarketData([
        {
          symbol: 'SPY',
          name: 'S&P 500',
          price: 485.23,
          change: 3.45,
          changePercent: 0.72,
        },
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          price: 68234.50,
          change: 1234.00,
          changePercent: 1.84,
        },
        {
          symbol: 'ETH',
          name: 'Ethereum',
          price: 3456.78,
          change: -56.32,
          changePercent: -1.60,
        },
      ]);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="space-y-1">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="text-right space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Market Data
      </h2>
      <div className="space-y-3">
        {marketData.map((item) => (
          <div key={item.symbol} className="flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {item.symbol}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {item.name}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900 dark:text-white">
                ${item.price.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              <p className={`text-xs font-medium ${
                item.change >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {item.change >= 0 ? '+' : ''}
                {item.changePercent.toFixed(2)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 