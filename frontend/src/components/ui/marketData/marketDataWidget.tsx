'use client';

import React, { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/unifiedAuth';

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  isUserAsset: boolean;
  userValue?: number;
}

interface Asset {
  id: string;
  name: string;
  symbol?: string;
  type: string;
  current_value: number;
  quantity?: number;
}

export function MarketDataWidget() {
  const { user } = useAuth();
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is in demo mode
  const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('demo-mode') === 'true';
  
  // Use Firebase user data or demo user data
  const currentUser = user ? {
    id: user.id,
    name: user.displayName || user.name || user.email?.split('@')[0] || 'User',
    email: user.email || ''
  } : (isDemoMode ? {
    id: 'demo-user-id',
    name: 'Demo User',
    email: 'demo@profolio.com'
  } : null);

  // Default top index funds for new users
  const defaultSymbols = [
    { symbol: 'SPY', name: 'S&P 500 ETF' },
    { symbol: 'QQQ', name: 'NASDAQ 100 ETF' },
    { symbol: 'VTI', name: 'Total Stock Market ETF' }
  ];

  const fetchLivePrice = async (symbol: string): Promise<{ price: number; change: number; changePercent: number } | null> => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add demo mode header if in demo mode
      if (isDemoMode) {
        headers['x-demo-mode'] = 'true';
      }
      
      // Use the backend's cached symbol data instead of triggering live searches
      const response = await fetch(
        `/api/integrations/symbols/cached-price/${encodeURIComponent(symbol)}`,
        { headers }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.price) {
          // Calculate mock change (in real app, this would come from historical data)
          const mockChange = (Math.random() - 0.5) * data.price * 0.05; // ±2.5% random change
          const changePercent = (mockChange / data.price) * 100;
          
          return {
            price: data.price,
            change: mockChange,
            changePercent
          };
        }
      }
      
      // Fallback to mock data if cached price not available
      const mockPrice = symbol === 'SPY' ? 589 : symbol === 'QQQ' ? 429 : symbol === 'VTI' ? 278 : Math.random() * 500 + 50;
      const mockChange = (Math.random() - 0.5) * mockPrice * 0.02;
      
      return {
        price: mockPrice,
        change: mockChange,
        changePercent: (mockChange / mockPrice) * 100
      };
      
    } catch (error) {
      console.error(`Error fetching cached price for ${symbol}:`, error);
      
      // Fallback to mock data on error
      const mockPrice = symbol === 'SPY' ? 589 : symbol === 'QQQ' ? 429 : symbol === 'VTI' ? 278 : Math.random() * 500 + 50;
      const mockChange = (Math.random() - 0.5) * mockPrice * 0.02;
      
      return {
        price: mockPrice,
        change: mockChange,
        changePercent: (mockChange / mockPrice) * 100
      };
    }
  };

  useEffect(() => {
    const fetchMarketData = async () => {
      if (!currentUser?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch user's assets
        const { apiCall } = await import('@/lib/mockApi');
        const response = await apiCall('/api/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ method: 'READ', userId: currentUser.id }),
        });
        
        const assetsData = await response.json();
        const userAssets: Asset[] = assetsData.assets || [];

        // Filter assets with symbols and sort by value
        const assetsWithSymbols = userAssets
          .filter(asset => asset.symbol && ['stock', 'crypto'].includes(asset.type))
          .sort((a, b) => (b.current_value || 0) - (a.current_value || 0))
          .slice(0, 3);

        let symbolsToFetch: { symbol: string; name: string; isUserAsset: boolean; userValue?: number }[] = [];

        if (assetsWithSymbols.length > 0) {
          // Use user's top assets
          symbolsToFetch = assetsWithSymbols.map(asset => ({
            symbol: asset.symbol!,
            name: asset.name,
            isUserAsset: true,
            userValue: asset.current_value
          }));
          
          // Fill remaining slots with default symbols if needed
          const remainingSlots = 3 - symbolsToFetch.length;
          if (remainingSlots > 0) {
            const defaultToAdd = defaultSymbols
              .filter(def => !symbolsToFetch.some(s => s.symbol === def.symbol))
              .slice(0, remainingSlots)
              .map(def => ({ ...def, isUserAsset: false }));
            symbolsToFetch.push(...defaultToAdd);
          }
        } else {
          // Use default index funds for new users
          symbolsToFetch = defaultSymbols.map(def => ({ ...def, isUserAsset: false }));
        }

        // Fetch live prices for all symbols
        const marketDataPromises = symbolsToFetch.map(async (item) => {
          const priceData = await fetchLivePrice(item.symbol);
          
          if (priceData) {
            return {
              symbol: item.symbol,
              name: item.name,
              price: priceData.price,
              change: priceData.change,
              changePercent: priceData.changePercent,
              isUserAsset: item.isUserAsset,
              userValue: item.userValue
            };
          } else {
            // Fallback to mock data if live price fails
            const mockPrice = Math.random() * 500 + 50;
            const mockChange = (Math.random() - 0.5) * mockPrice * 0.05;
            
            return {
              symbol: item.symbol,
              name: item.name,
              price: mockPrice,
              change: mockChange,
              changePercent: (mockChange / mockPrice) * 100,
              isUserAsset: item.isUserAsset,
              userValue: item.userValue
            };
          }
        });

        const marketDataResults = await Promise.all(marketDataPromises);
        setMarketData(marketDataResults.filter(Boolean));

      } catch (err) {
        console.error('Error fetching market data:', err);
        setError('Failed to load market data');
        
        // Fallback to default symbols with mock data
        const fallbackData = defaultSymbols.map(item => {
          const mockPrice = Math.random() * 500 + 50;
          const mockChange = (Math.random() - 0.5) * mockPrice * 0.05;
          
          return {
            symbol: item.symbol,
            name: item.name,
            price: mockPrice,
            change: mockChange,
            changePercent: (mockChange / mockPrice) * 100,
            isUserAsset: false
          };
        });
        
        setMarketData(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
  }, [currentUser?.id, isDemoMode]);

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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Market Data
        </h2>
        {error && (
          <div className="text-xs text-yellow-500 flex items-center gap-1">
            <i className="fas fa-exclamation-triangle"></i>
            Live data unavailable
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        {marketData.map((item) => (
          <div key={item.symbol} className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900 dark:text-white">
                  {item.symbol}
                </p>
                {item.isUserAsset && (
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                    Your Asset
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {item.name}
              </p>
              {item.isUserAsset && item.userValue && (
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Portfolio: ${(item.userValue / 100).toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
              )}
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
      
      {marketData.length === 0 && !loading && (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          <i className="fas fa-chart-line text-2xl mb-2 opacity-50"></i>
          <p className="text-sm">No market data available</p>
        </div>
      )}
    </div>
  );
} 