'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
  const { user, token } = useAuth();
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use ref to track abort controller for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);

  // Global cache to prevent duplicate requests
  const cacheRef = useRef(new Map<string, { data: { price: number; change: number; changePercent: number }; expires: number }>());
  const CACHE_DURATION = 60000; // 1 minute cache

  // Check if user is in demo mode
  const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('demo-mode') === 'true';
  
  // Use Firebase user data or demo user data - memoized
  const currentUser = useMemo(() => {
    if (user) {
      return {
        id: user.id,
        name: user.displayName || user.name || user.email?.split('@')[0] || 'User',
        email: user.email || ''
      };
    } else if (isDemoMode) {
      return {
        id: 'demo-user-id',
        name: 'Demo User',
        email: 'demo@profolio.com'
      };
    }
    return null;
  }, [user?.id, user?.displayName, user?.name, user?.email, isDemoMode]);

  // Cleanup function for abort controller
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Default top index funds for new users
  const defaultSymbols = [
    { symbol: 'SPY', name: 'S&P 500 ETF' },
    { symbol: 'QQQ', name: 'NASDAQ 100 ETF' },
    { symbol: 'VTI', name: 'Total Stock Market ETF' }
  ];

  // Enhanced demo price data with more realistic mock prices
  const demoMockPrices: Record<string, { basePrice: number; name: string }> = {
    'SPY': { basePrice: 589.75, name: 'S&P 500 ETF' },
    'QQQ': { basePrice: 429.88, name: 'NASDAQ 100 ETF' },
    'VTI': { basePrice: 278.92, name: 'Total Stock Market ETF' },
    'VOO': { basePrice: 521.34, name: 'Vanguard S&P 500 ETF' },
    'VEA': { basePrice: 52.87, name: 'Vanguard FTSE Developed ETF' },
    'AAPL': { basePrice: 245.18, name: 'Apple Inc.' },
    'GOOGL': { basePrice: 175.37, name: 'Alphabet Inc.' },
    'MSFT': { basePrice: 415.26, name: 'Microsoft Corporation' },
    'AMZN': { basePrice: 186.51, name: 'Amazon.com Inc.' },
    'TSLA': { basePrice: 248.42, name: 'Tesla Inc.' },
    'META': { basePrice: 558.79, name: 'Meta Platforms Inc.' },
    'NVDA': { basePrice: 138.07, name: 'NVIDIA Corporation' },
    'NFLX': { basePrice: 755.28, name: 'Netflix Inc.' },
    'JPM': { basePrice: 223.16, name: 'JPMorgan Chase & Co.' },
    'V': { basePrice: 311.83, name: 'Visa Inc.' },
    'BTC-USD': { basePrice: 95847.23, name: 'Bitcoin USD' },
    'ETH-USD': { basePrice: 3456.78, name: 'Ethereum USD' },
  };

  const generateRealisticMockData = (symbol: string): { price: number; change: number; changePercent: number } => {
    const mockData = demoMockPrices[symbol];
    const basePrice = mockData?.basePrice || (Math.random() * 500 + 50);
    
    // Generate realistic daily variation (-5% to +5%)
    const seed = symbol.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const seedRandom = ((seed * 9301 + 49297) % 233280) / 233280;
    const variation = (seedRandom - 0.5) * 0.1; // -5% to +5%
    
    const currentPrice = basePrice * (1 + variation * (Date.now() % 86400000) / 86400000);
    const change = currentPrice - basePrice;
    const changePercent = (change / basePrice) * 100;
    
    return {
      price: parseFloat(currentPrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2))
    };
  };

  const fetchLivePrice = async (symbol: string): Promise<{ price: number; change: number; changePercent: number } | null> => {
    try {
      // Check cache first
      const cached = cacheRef.current.get(symbol);
      if (cached && cached.expires > Date.now()) {
        return cached.data;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header for authenticated requests
      if (token && !isDemoMode) {
        headers['Authorization'] = `Bearer ${token}`;
      } else if (isDemoMode) {
        // Use the correct demo token for demo mode
        headers['Authorization'] = 'Bearer demo-token-secure-123';
      }
      
      // Call backend directly for better performance and reliability
      const backendUrl = process.env.NODE_ENV === 'production'
        ? `${process.env.NEXT_PUBLIC_API_URL || window.location.origin}/api/market-data/cached-price/${encodeURIComponent(symbol)}`
        : `http://localhost:3001/api/market-data/cached-price/${encodeURIComponent(symbol)}`;
      
      const response = await fetch(backendUrl, { 
        headers,
        signal: abortControllerRef.current?.signal
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.price) {
          const result = {
            price: data.price,
            change: data.change || 0,
            changePercent: data.changePercent || 0
          };

          // Cache the result
          cacheRef.current.set(symbol, {
            data: result,
            expires: Date.now() + CACHE_DURATION
          });
          
          return result;
        }
      }
      
      // Fallback to mock data if API unavailable
      return generateRealisticMockData(symbol);
      
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      // Always fallback to mock data on error
      return generateRealisticMockData(symbol);
    }
  };

  useEffect(() => {
    const fetchMarketData = async () => {
      if (!currentUser?.id) {
        setLoading(false);
        return;
      }

      // Cancel any ongoing request
      cleanup();

      // Create new AbortController for this request
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        setLoading(true);
        setError(null);

        let symbolsToFetch: { symbol: string; name: string; isUserAsset: boolean; userValue?: number }[] = [];

        // Fetch user's assets for both demo and real users (demo users get temporary data)
        const { apiCall } = await import('@/lib/mockApi');
        
        // Skip asset fetching for demo mode to improve performance
        if (isDemoMode) {
          symbolsToFetch = defaultSymbols.map(def => ({ ...def, isUserAsset: false }));
        } else {
          const response = await apiCall('/api/assets', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify({ method: 'read', userId: currentUser.id }),
            signal: controller.signal,
          });

          if (controller.signal.aborted) return;
          
          const assetsData = await response.json();
          const userAssets: Asset[] = assetsData.assets || [];

          // Filter assets with symbols and sort by value
          const assetsWithSymbols = userAssets
            .filter(asset => asset.symbol && ['stock', 'crypto'].includes(asset.type))
            .sort((a, b) => (b.current_value || 0) - (a.current_value || 0))
            .slice(0, 3);

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
        }

        if (isDemoMode) {
          console.log('🎭 Demo mode: Fetching real market data with temporary session');
        }

        // Fetch live prices for all symbols (uses backend APIs for both demo and real users)
        const marketDataPromises = symbolsToFetch.map(async (item) => {
          const priceData = await fetchLivePrice(item.symbol);
          
          if (priceData) {
            return {
              symbol: item.symbol,
              name: demoMockPrices[item.symbol]?.name || item.name,
              price: priceData.price,
              change: priceData.change,
              changePercent: priceData.changePercent,
              isUserAsset: item.isUserAsset,
              userValue: item.userValue
            };
          } else {
            // This should rarely happen now with improved fallbacks
            const mockData = generateRealisticMockData(item.symbol);
            return {
              symbol: item.symbol,
              name: demoMockPrices[item.symbol]?.name || item.name,
              price: mockData.price,
              change: mockData.change,
              changePercent: mockData.changePercent,
              isUserAsset: item.isUserAsset,
              userValue: item.userValue
            };
          }
        });

        const marketDataResults = await Promise.all(marketDataPromises);
        setMarketData(marketDataResults.filter(Boolean));

      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Request was aborted, this is expected
          return;
        }
        console.error('Error fetching market data:', error);
        
        // Enhanced error handling with fallback to demo data
        if (isDemoMode) {
          console.log('🎭 Demo mode: Error occurred, using fallback mock data');
        } else {
          setError('Live data temporarily unavailable');
        }
        
        // Always provide fallback data
        const fallbackData = defaultSymbols.map(item => {
          const mockData = generateRealisticMockData(item.symbol);
          return {
            symbol: item.symbol,
            name: demoMockPrices[item.symbol]?.name || item.name,
            price: mockData.price,
            change: mockData.change,
            changePercent: mockData.changePercent,
            isUserAsset: false
          };
        });
        
        setMarketData(fallbackData);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchMarketData();
  }, [currentUser?.id, isDemoMode, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

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