"use client";

import React, { useCallback, useMemo, useEffect, useState, useRef } from "react";
import { useAuth } from '@/lib/unifiedAuth';
import { BaseModal as Modal } from "@/components/modals/modal";
import { AssetModal } from "@/components/modals/AssetModal";
import { AssetApiConfigModal } from "@/components/modals/AssetApiConfigModal";
import { AssetCard } from "@/components/cards/AssetCard";
import { Button } from "@/components/ui/button/button";
import type { Asset } from "@/types/global";
import { motion, AnimatePresence } from "framer-motion";
import LineChart from "@/components/charts/line";
import PieChart from "@/components/charts/pie";
import { FinancialCalculator } from '@/lib/financial';

// Asset type configuration
const assetTypeConfig = {
  stock: { icon: "fa-chart-line", color: "#22c55e", gradient: "from-green-400 to-green-600" },
  crypto: { icon: "fa-bitcoin", color: "#f59e0b", gradient: "from-yellow-400 to-yellow-600" },
  savings: { icon: "fa-piggy-bank", color: "#3b82f6", gradient: "from-blue-400 to-blue-600" },
  stock_options: { icon: "fa-chart-bar", color: "#a855f7", gradient: "from-purple-400 to-purple-600" },
  cash: { icon: "fa-dollar-sign", color: "#10b981", gradient: "from-emerald-400 to-emerald-600" },
  bond: { icon: "fa-file-contract", color: "#6366f1", gradient: "from-indigo-400 to-indigo-600" },
  other: { icon: "fa-coins", color: "#64748b", gradient: "from-slate-400 to-slate-600" },
};

// Crypto-specific icons
const getCryptoIcon = (symbol: string) => {
  const cryptoIcons: Record<string, string> = {
    BTC: 'fa-bitcoin',
    ETH: 'fa-ethereum',
    ADA: 'fa-coins',
    DOT: 'fa-circle',
    LINK: 'fa-link',
    XRP: 'fa-coins',
    LTC: 'fa-coins',
    BCH: 'fa-coins',
    BNB: 'fa-coins',
    SOL: 'fa-sun',
    DOGE: 'fa-dog',
    AVAX: 'fa-mountain',
    MATIC: 'fa-coins',
    ATOM: 'fa-atom',
  };
  return cryptoIcons[symbol.toUpperCase()] || 'fa-coins';
};

export default function AssetManager() {
  const [error, setError] = useState<string | null>(null);
  const { user, token } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [timeframe, setTimeframe] = useState("30");
  const [chartData, setChartData] = useState<{ date: string; total_value: number }[] | null>(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "table">("grid");
  const [filterType, setFilterType] = useState<string>("all");
  const [showApiConfig, setShowApiConfig] = useState(false);

  // Use refs to track abort controllers for cleanup
  const chartAbortControllerRef = useRef<AbortController | null>(null);

  // Check if user is in demo mode
  const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('demo-mode') === 'true';
  
  // Use Firebase user data or demo user data - memoized
  const currentUser = useMemo(() => {
    if (user) {
      return {
        id: user.id,
        name: user.displayName || user.name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
      };
    } else if (isDemoMode) {
      return {
    id: 'demo-user-id',
    name: 'Demo User',
        email: 'demo@profolio.com',
      };
    }
    return null;
  }, [user?.id, user?.displayName, user?.name, user?.email, isDemoMode]);

  // Cleanup function for chart requests
  const cleanupChartRequest = useCallback(() => {
    if (chartAbortControllerRef.current) {
      chartAbortControllerRef.current.abort();
      chartAbortControllerRef.current = null;
    }
  }, []);

  const fetchAssets = useCallback(async () => {
    if (!currentUser?.id) return;
    
    setLoading(true);
    try {
      const { apiCall } = await import('@/lib/mockApi');

      const response = await apiCall("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "READ", userId: currentUser.id }),
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setAssets(data.assets || []);
      setError(null);
    } catch (err) {
      console.error("Asset fetch error:", err);
      setError("Failed to load assets");
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
      fetchAssets();
  }, [fetchAssets]);

  const fetchChartData = useCallback(async () => {
    // Cancel any ongoing chart request
    cleanupChartRequest();

    // Create new AbortController for this request
    const controller = new AbortController();
    chartAbortControllerRef.current = controller;

    setChartLoading(true);
    try {
      if (!currentUser?.id) {
        setChartData([]);
        return;
      }

      // Calculate current total value for fallback scenarios - memoized
      const currentTotalValue = assets.reduce((sum, asset) => {
        const valueInDollars = asset.current_value || 0;
        return sum + valueInDollars;
      }, 0);

      // Call the real historical data API
      const days = timeframe === "max" ? 365 : parseInt(timeframe);
      const authToken = token || (isDemoMode ? 'demo-token' : null);
      const response = await fetch(`/api/market-data/portfolio-history/${currentUser.id}?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      if (!response.ok) {
        throw new Error('Failed to fetch portfolio history');
      }

      const data = await response.json();
      
      if (controller.signal.aborted) return;
      
      if (data.status === 'OK' && data.data) {
        setChartData(data.data);
        console.log(`📈 Loaded ${data.data.length} historical data points for ${timeframe} period`);
      } else {
        // Fallback: Generate simple data points for current portfolio value
        console.log('📊 No historical data available, using current portfolio snapshot');
        const fallbackData = [];
        const currentDate = new Date();
        const daysBack = timeframe === "max" ? 30 : parseInt(timeframe);
        
        // Create a few data points showing current total value
        for (let i = daysBack; i >= 0; i -= Math.max(1, Math.floor(daysBack / 10))) {
          const date = new Date(currentDate);
          date.setDate(date.getDate() - i);
          
          fallbackData.push({
            date: date.toISOString(),
            total_value: Math.round(currentTotalValue * 100), // Convert to cents
          });
        }
        
        if (!controller.signal.aborted) {
          setChartData(fallbackData);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was aborted, this is expected
        return;
      }
      
      console.error('Chart data fetch error:', error);
      
      // Calculate current total value for error fallback
      const currentTotalValue = assets.reduce((sum, asset) => {
        const valueInDollars = asset.current_value || 0;
        return sum + valueInDollars;
      }, 0);
      
      // Fallback for errors: Create simple progression
      const fallbackData = [];
      const currentDate = new Date();
      const daysBack = timeframe === "max" ? 30 : parseInt(timeframe);
      
      for (let i = daysBack; i >= 0; i -= Math.max(1, Math.floor(daysBack / 5))) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() - i);
        
        fallbackData.push({
          date: date.toISOString(),
          total_value: Math.round(currentTotalValue * 100),
        });
      }
      
      if (!controller.signal.aborted) {
        setChartData(fallbackData);
      }
      console.log(`📊 Using fallback data due to API error: ${error}`);
    } finally {
      if (!controller.signal.aborted) {
      setChartLoading(false);
    }
    }
  }, [timeframe, currentUser?.id, assets, token, isDemoMode, cleanupChartRequest]);

  useEffect(() => {
      fetchChartData();
  }, [timeframe, fetchChartData]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanupChartRequest;
  }, [cleanupChartRequest]);

  const handleEdit = useCallback((asset: Asset) => {
      setEditingAsset(asset);
      setShowAddModal(true);
  }, []);

  const handleDelete = useCallback(
    async (assetId: string) => {
      if (!currentUser) return;
      
      if (!confirm("Are you sure you want to delete this asset?")) return;

      try {
        const { apiCall } = await import('@/lib/mockApi');
        
        const response = await apiCall("/api/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "DELETE",
            userId: currentUser.id,
            id: assetId,
          }),
        });
        
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        fetchAssets();
      } catch (err) {
        console.error("Asset deletion error:", err);
        setError("Failed to delete asset");
      }
    },
    [currentUser, fetchAssets]
  );

  const handleOpenModal = useCallback(() => {
    setShowAddModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowAddModal(false);
    setEditingAsset(null);
  }, []);

  const handleSubmit = useCallback(
    async (assetData: Partial<Asset>) => {
      if (!currentUser) return;
      try {
        const { apiCall } = await import('@/lib/mockApi');
        
        const method = editingAsset ? "UPDATE" : "CREATE";
        const response = await apiCall("/api/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method,
            ...(currentUser?.id && { userId: currentUser.id }),
            ...assetData,
            id: editingAsset?.id,
          }),
        });
        
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        setShowAddModal(false);
        setEditingAsset(null);
        fetchAssets();
      } catch (err) {
        console.error("Asset save error:", err);
        setError("Failed to save asset");
      }
    },
    [editingAsset, currentUser, fetchAssets]
  );

  // Calculate metrics
  const totalValue = useMemo(() => {
    return assets.reduce((sum, asset) => {
      // For all asset types, current_value should be used directly
      // The API should already be providing current_value in dollars
      const valueInDollars = asset.current_value || 0;
      return sum + valueInDollars;
    }, 0);
  }, [assets]);

  const totalGainLoss = useMemo(() => {
    return assets.reduce((sum, asset) => {
      if (!asset.purchase_price || !asset.current_value || !asset.quantity) return sum;
      
      // Check if current_value is already in dollars or cents
      const currentValueDollars = asset.current_value > 1000
        ? parseFloat(FinancialCalculator.centsToDollars(asset.current_value))
        : asset.current_value;
      
      const calculation = FinancialCalculator.calculateAssetGainLoss(
        currentValueDollars,
        asset.purchase_price,
        asset.quantity
      );
      
      return sum + calculation.gain;
    }, 0);
  }, [assets]);

  // Calculate collective APY for all assets
  const collectiveAPY = useMemo(() => {
    const assetsWithAPY = assets.filter(asset => 
      asset.purchase_price && 
      asset.current_value && 
      asset.quantity && 
      asset.purchase_date
    );
    
    if (assetsWithAPY.length === 0) return 0;
    
    // Calculate weighted average APY based on investment amounts
    let totalInvestment = 0;
    let weightedAPYSum = 0;
    
    assetsWithAPY.forEach(asset => {
      // Check if current_value is already in dollars or cents
      const currentValueDollars = asset.current_value! > 1000
        ? parseFloat(FinancialCalculator.centsToDollars(asset.current_value!))
        : asset.current_value!;
      
      const apy = FinancialCalculator.calculateAPY(
        currentValueDollars,
        asset.purchase_price!,
        asset.quantity!,
        asset.purchase_date!
      );
      
      const investment = asset.purchase_price! * asset.quantity!;
      totalInvestment += investment;
      weightedAPYSum += apy * investment;
    });
    
    return totalInvestment > 0 ? weightedAPYSum / totalInvestment : 0;
  }, [assets]);

  const assetsByType = useMemo(() => {
    return assets.reduce((acc, asset) => {
      const type = asset.type ?? 'other';
      if (!acc[type]) acc[type] = { count: 0, value: 0 };
      acc[type].count++;
      acc[type].value += asset.current_value ?? 0;
      return acc;
    }, {} as Record<string, { count: number; value: number }>);
  }, [assets]);

  const filteredAssets = useMemo(() => {
    if (filterType === "all") return assets;
    return assets.filter(asset => asset.type === filterType);
  }, [assets, filterType]);

  const chartDataFormatted = useMemo(() => {
    if (!chartData) return [];
    return chartData.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: item.total_value / 100
    }));
  }, [chartData]);

  // Memoized AssetTable component to prevent unnecessary re-renders
  const AssetTable = useCallback(({
    assets: tableAssets,
    onEdit,
    onDelete,
  }: {
    assets: Asset[];
    onEdit: (asset: Asset) => void;
    onDelete: (id: string) => void;
  }) => {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Asset</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Symbol</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current Value</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gain/Loss</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {tableAssets.map((asset) => {
                const config = assetTypeConfig[asset.type as keyof typeof assetTypeConfig] || assetTypeConfig.other;
                const iconClass = asset.type === 'crypto' && asset.symbol 
                  ? getCryptoIcon(asset.symbol) 
                  : config.icon;
                
                // Calculate appreciation for each asset
                const appreciation = asset.purchase_price && asset.current_value && asset.quantity 
                  ? FinancialCalculator.calculateAssetGainLoss(
                      asset.current_value,
                      asset.purchase_price,
                      asset.quantity
                    )
                  : null;

                return (
                  <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className={`p-2 bg-gradient-to-r ${config.gradient} rounded-lg mr-3 flex-shrink-0`}>
                          <i className={`fas ${iconClass} text-white text-sm`}></i>
            </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{asset.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {asset.type?.charAt(0).toUpperCase() + asset.type?.slice(1).replace('_', ' ')}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {asset.symbol || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-white text-right">
                      {asset.quantity || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white text-right">
                      {FinancialCalculator.formatCurrency(asset.current_value || 0)}
                    </td>
                    <td className="px-4 py-4 text-sm text-right">
                      {appreciation ? (
                        <div>
                          <div className={`font-medium ${appreciation.gain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {appreciation.gain >= 0 ? '+' : ''}{FinancialCalculator.formatCurrency(appreciation.gain)}
                          </div>
                          <div className={`text-xs sm:text-sm ${appreciation.gain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {FinancialCalculator.formatPercentage(appreciation.gainPercent, 2, true)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => onEdit(asset)}
                          className="p-1 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                          aria-label="Edit asset"
                        >
                          <i className="fas fa-edit text-sm"></i>
                        </button>
                        <button
                          onClick={() => asset.id && onDelete(asset.id)}
                          className="p-1 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          aria-label="Delete asset"
                        >
                          <i className="fas fa-trash text-sm"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }, []); // Memoized to prevent unnecessary re-renders

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#101828]">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-900 dark:text-white">
      <div className="relative z-10 p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Asset Manager
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">Track and manage your investment portfolio</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowApiConfig(true)}
                variant="outline"
                className="px-4 py-3 touch-manipulation"
              >
                <i className="fas fa-cog mr-2"></i>
                API Config
              </Button>
              <Button
                onClick={handleOpenModal}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium shadow-lg px-4 sm:px-6 py-3 touch-manipulation"
              >
                <i className="fas fa-plus mr-2"></i>
                Add Asset
              </Button>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-900/20 backdrop-blur-sm border border-red-800 rounded-xl p-4 mb-6"
          >
            <p className="text-red-400 flex items-center">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </p>
          </motion.div>
        )}

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-400 transition-all duration-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Total Asset Value</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-500 mt-1">
                  {FinancialCalculator.formatCurrency(totalValue)}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <i className="fas fa-wallet text-green-500 text-lg sm:text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-400 transition-all duration-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Total Assets</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-500 mt-1">
                  {assets.length}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <i className="fas fa-chart-pie text-blue-500 text-lg sm:text-xl"></i>
              </div>
            </div>
          </div>

          <div className={`bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 hover:border-${totalGainLoss >= 0 ? 'green' : 'red'}-400 dark:hover:border-${totalGainLoss >= 0 ? 'green' : 'red'}-400 transition-all duration-200`}>
            <div className="flex justify-between items-start">
          <div>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Total Gain/Loss</p>
                <p className={`text-2xl sm:text-3xl font-bold mt-1 ${totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {totalGainLoss >= 0 ? '+' : ''}{FinancialCalculator.formatCurrency(totalGainLoss)}
            </p>
          </div>
              <div className={`p-2 sm:p-3 ${totalGainLoss >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'} rounded-lg`}>
                <i className={`fas fa-chart-line ${totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'} text-lg sm:text-xl`}></i>
              </div>
            </div>
          </div>

          <div className={`bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 hover:border-${collectiveAPY >= 0 ? 'green' : 'red'}-400 dark:hover:border-${collectiveAPY >= 0 ? 'green' : 'red'}-400 transition-all duration-200`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Portfolio APY</p>
                <p className={`text-2xl sm:text-3xl font-bold mt-1 ${collectiveAPY >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {FinancialCalculator.formatAPY(collectiveAPY)}
                </p>
              </div>
              <div className={`p-2 sm:p-3 ${collectiveAPY >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'} rounded-lg`}>
                <i className={`fas fa-percentage ${collectiveAPY >= 0 ? 'text-green-500' : 'text-red-500'} text-lg sm:text-xl`}></i>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Charts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Portfolio Performance</h3>
              <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-1">
                {["7", "30", "90", "365", "max"].map((days) => (
              <button
                    key={days}
                    onClick={() => setTimeframe(days)}
                    className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap touch-manipulation ${
                      timeframe === days
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {days === "max" ? "Max" : `${days}D`}
              </button>
            ))}
          </div>
        </div>
        {chartLoading ? (
              <div className="h-48 sm:h-64 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
              <div className="h-48 sm:h-64">
                <LineChart
                  data={chartDataFormatted}
                  xKey="date"
                  lines={[{ dataKey: "value", color: "#3b82f6" }]}
                />
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">Asset Distribution</h3>
            <div className="h-48 sm:h-64">
              <PieChart
                data={Object.entries(assetsByType).map(([type, data]) => ({
                  name: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
                  value: data.value / 100,
                  color: assetTypeConfig[type as keyof typeof assetTypeConfig]?.color || "#gray",
                }))}
              />
            </div>
          </div>
        </motion.div>

        {/* Filter and View Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4"
        >
          <div className="flex gap-2 overflow-x-auto pb-2 w-full lg:w-auto">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap touch-manipulation ${
                filterType === "all"
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              All Assets
            </button>
            {Object.keys(assetsByType).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap touch-manipulation ${
                  filterType === type
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')} ({assetsByType[type].count})
              </button>
            ))}
      </div>

          <div className="flex gap-2 self-end lg:self-auto">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 sm:p-3 rounded-lg transition-all duration-200 touch-manipulation ${
                viewMode === "grid"
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              aria-label="Grid view"
            >
              <i className="fas fa-th text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 sm:p-3 rounded-lg transition-all duration-200 touch-manipulation ${
                viewMode === "list"
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              aria-label="List view"
            >
              <i className="fas fa-list text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 sm:p-3 rounded-lg transition-all duration-200 touch-manipulation ${
                viewMode === "table"
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              aria-label="Table view"
            >
              <i className="fas fa-table text-sm sm:text-base"></i>
            </button>
      </div>
        </motion.div>

        {/* Assets Grid/List */}
        <AnimatePresence mode="wait">
          {filteredAssets.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 sm:py-16 px-4"
            >
              <div className="text-gray-500 text-4xl sm:text-6xl mb-4">
                <i className="fas fa-wallet"></i>
        </div>
              <h3 className="text-lg sm:text-xl font-medium text-gray-600 dark:text-gray-400 mb-2">
                {filterType === "all" ? "No Assets Yet" : `No ${filterType} assets`}
              </h3>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-500 mb-6 max-w-md mx-auto">
                {filterType === "all" 
                  ? "Start building your portfolio by adding your first asset."
                  : "You don't have any assets of this type yet."}
              </p>
              <Button
                onClick={handleOpenModal}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium touch-manipulation"
              >
                <i className="fas fa-plus mr-2"></i>
                Add Your First Asset
              </Button>
            </motion.div>
          ) : (
            <motion.div
              layout
              className={viewMode === "grid" 
                ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6" 
                : viewMode === "list"
                  ? "space-y-4"
                  : "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              }
            >
              {viewMode === "grid" ? (
                filteredAssets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onEdit={handleEdit}
                onDelete={handleDelete}
                    config={assetTypeConfig[asset.type as keyof typeof assetTypeConfig] || assetTypeConfig.other}
                    getCryptoIcon={getCryptoIcon}
              />
                ))
              ) : viewMode === "list" ? (
                filteredAssets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    config={assetTypeConfig[asset.type as keyof typeof assetTypeConfig] || assetTypeConfig.other}
                    getCryptoIcon={getCryptoIcon}
                  />
                ))
              ) : (
                <AssetTable
                  assets={filteredAssets}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal - Moved outside the relative z-10 container */}
      {showAddModal && (
        <Modal isOpen={showAddModal} onClose={handleCloseModal}>
          <AssetModal
            onClose={handleCloseModal}
            onSave={handleSubmit}
            asset={editingAsset}
          />
        </Modal>
      )}

      {/* API Configuration Modal */}
      {showApiConfig && (
        <Modal isOpen={showApiConfig} onClose={() => setShowApiConfig(false)}>
          <AssetApiConfigModal 
            onClose={() => setShowApiConfig(false)} 
            onApiKeysUpdated={fetchAssets}
          />
        </Modal>
      )}
    </div>
  );
}