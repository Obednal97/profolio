"use client";

import React, {
  useCallback,
  useMemo,
  useEffect,
  useState,
  useRef,
} from "react";
import { useAuth } from "@/lib/unifiedAuth";
import { BaseModal as Modal } from "@/components/modals/modal";
import { AssetModal } from "@/components/modals/AssetModal";
import { AssetApiConfigModal } from "@/components/modals/AssetApiConfigModal";
import { AssetCard } from "@/components/cards/AssetCard";
import { EnhancedGlassCard } from "@/components/ui/enhanced-glass/EnhancedGlassCard";
import { StatCard } from "@/components/cards/StatCard";
import { Button } from "@/components/ui/button";
import { EnhancedTabs } from "@/components/ui/enhanced-tabs";
import { ViewSwitcher } from "@/components/ui/ViewSwitcher";
import type { Asset } from "@/types/global";
import dynamic from "next/dynamic";
import { FinancialCalculator } from "@/lib/financial";
import {
  ChartLoadingSkeleton,
  AssetManagerSkeleton,
} from "@/components/ui/skeleton";

// 🚀 PERFORMANCE: Dynamic imports for heavy components to reduce initial bundle size
const MotionDiv = dynamic(
  () => import("framer-motion").then((mod) => ({ default: mod.motion.div })),
  {
    ssr: false,
    loading: () => <div style={{ minHeight: "200px" }} />,
  }
);

const AnimatePresence = dynamic(
  () =>
    import("framer-motion").then((mod) => ({ default: mod.AnimatePresence })),
  {
    ssr: false,
    loading: () => null,
  }
);

// 🚀 PERFORMANCE: Dynamic chart components to reduce initial page load
const LineChart = dynamic(() => import("@/components/charts/line"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-gray-400 text-center">
        <i className="fas fa-chart-line text-3xl mb-2 opacity-50"></i>
        <p className="text-sm">Loading chart...</p>
      </div>
    </div>
  ),
});

const PieChart = dynamic(() => import("@/components/charts/pie"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-gray-400 text-center">
        <i className="fas fa-chart-pie text-3xl mb-2 opacity-50"></i>
        <p className="text-sm">Loading chart...</p>
      </div>
    </div>
  ),
});

// Asset type configuration
const assetTypeConfig = {
  stock: {
    icon: "fa-chart-line",
    color: "#22c55e",
    gradient: "from-green-400 to-green-600",
  },
  crypto: {
    icon: "fa-coins",
    color: "#f59e0b",
    gradient: "from-yellow-400 to-yellow-600",
  },
  savings: {
    icon: "fa-piggy-bank",
    color: "#3b82f6",
    gradient: "from-blue-400 to-blue-600",
  },
  stock_options: {
    icon: "fa-chart-bar",
    color: "#a855f7",
    gradient: "from-purple-400 to-purple-600",
  },
  cash: {
    icon: "fa-dollar-sign",
    color: "#10b981",
    gradient: "from-emerald-400 to-emerald-600",
  },
  bond: {
    icon: "fa-file-contract",
    color: "#6366f1",
    gradient: "from-indigo-400 to-indigo-600",
  },
  other: {
    icon: "fa-coins",
    color: "#64748b",
    gradient: "from-slate-400 to-slate-600",
  },
};

// Crypto-specific icons
const getCryptoIcon = (symbol: string) => {
  const cryptoIcons: Record<string, string> = {
    BTC: "fab fa-bitcoin",
    ETH: "fab fa-ethereum",
    ADA: "fas fa-coins",
    DOT: "fas fa-circle-dot",
    LINK: "fas fa-link",
    XRP: "fas fa-water",
    LTC: "fab fa-litecoin-sign",
    BCH: "fab fa-bitcoin",
    BNB: "fas fa-fire",
    SOL: "fas fa-sun",
    DOGE: "fas fa-dog",
    MATIC: "fas fa-diamond",
    UNI: "fas fa-unicorn",
    AVAX: "fas fa-mountain",
    ATOM: "fas fa-atom",
    FTM: "fas fa-ghost",
    ALGO: "fas fa-cubes",
    VET: "fas fa-shield",
    NEAR: "fas fa-infinity",
    FLOW: "fas fa-river",
    USDT: "fas fa-dollar-sign",
    USDC: "fas fa-dollar-sign",
    DAI: "fas fa-dollar-sign",
  };
  return cryptoIcons[symbol?.toUpperCase()] || "fas fa-coins";
};

// 🚀 PERFORMANCE: Pre-calculate metrics to avoid expensive calculations on every render
interface AssetMetrics {
  totalValue: number;
  totalGainLoss: number;
  collectiveAPY: number;
  assetsByType: Record<string, { count: number; value: number }>;
}

const calculateAssetMetrics = (assets: Asset[]): AssetMetrics => {
  console.log("📊 Calculating asset metrics for", assets.length, "assets");

  let totalValue = 0;
  let totalGainLoss = 0;
  let totalInvestment = 0;
  let weightedAPYSum = 0;
  const assetsByType: Record<string, { count: number; value: number }> = {};

  assets.forEach((asset) => {
    // Total value calculation
    const valueInDollars = asset.current_value || 0;
    totalValue += valueInDollars;

    // Assets by type
    const type = asset.type ?? "other";
    if (!assetsByType[type]) assetsByType[type] = { count: 0, value: 0 };
    assetsByType[type].count++;
    assetsByType[type].value += valueInDollars;

    // Gain/loss and APY calculations (only for assets with complete data)
    if (asset.purchase_price && asset.current_value && asset.quantity) {
      const currentValueDollars =
        asset.current_value > 1000
          ? parseFloat(FinancialCalculator.centsToDollars(asset.current_value))
          : asset.current_value;

      // Gain/loss calculation
      const calculation = FinancialCalculator.calculateAssetGainLoss(
        currentValueDollars,
        asset.purchase_price,
        asset.quantity
      );
      totalGainLoss += calculation.gain;

      // APY calculation (only if purchase date exists)
      if (asset.purchase_date) {
        const apy = FinancialCalculator.calculateAPY(
          currentValueDollars,
          asset.purchase_price,
          asset.quantity,
          asset.purchase_date
        );

        const investment = asset.purchase_price * asset.quantity;
        totalInvestment += investment;
        weightedAPYSum += apy * investment;
      }
    }
  });

  const collectiveAPY =
    totalInvestment > 0 ? weightedAPYSum / totalInvestment : 0;

  return {
    totalValue,
    totalGainLoss,
    collectiveAPY,
    assetsByType,
  };
};

export default function AssetManager() {
  const [error, setError] = useState<string | null>(null);
  const { user, token } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [timeframe, setTimeframe] = useState("30");
  const [chartData, setChartData] = useState<
    { date: string; total_value: number }[] | null
  >(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "table">("grid");
  const [filterType, setFilterType] = useState<string>("all");
  const [openCategoryDropdown, setOpenCategoryDropdown] = useState(false);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("value");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // 🚀 PERFORMANCE: Cache calculated metrics and only recalculate when assets change
  const [cachedMetrics, setCachedMetrics] = useState<AssetMetrics | null>(null);
  const [lastAssetHash, setLastAssetHash] = useState<string>("");

  // Use refs to track abort controllers for cleanup
  const chartAbortControllerRef = useRef<AbortController | null>(null);

  // Check if user is in demo mode
  const isDemoMode =
    typeof window !== "undefined" &&
    localStorage.getItem("demo-mode") === "true";

  // Use Firebase user data or demo user data - memoized
  const currentUser = useMemo(() => {
    if (user) {
      return {
        id: user.id,
        name:
          user.displayName || user.name || user.email?.split("@")[0] || "User",
        email: user.email || "",
      };
    } else if (isDemoMode) {
      return {
        id: "demo-user-id",
        name: "Demo User",
        email: "demo@profolio.com",
      };
    }
    return null;
  }, [user, isDemoMode]);

  // 🚀 PERFORMANCE: Optimized metrics calculation with caching
  const metrics = useMemo(() => {
    // Create a simple hash of the assets array to detect changes
    const assetHash = assets
      .map((a) => `${a.id}-${a.current_value}-${a.quantity}`)
      .join("|");

    // Only recalculate if assets actually changed
    if (cachedMetrics && lastAssetHash === assetHash) {
      return cachedMetrics;
    }

    console.log("♻️ Recalculating asset metrics (assets changed)");
    const newMetrics = calculateAssetMetrics(assets);
    setCachedMetrics(newMetrics);
    setLastAssetHash(assetHash);
    return newMetrics;
  }, [assets, cachedMetrics, lastAssetHash]);

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
      // Use the proxy endpoint that's already set up
      const authToken = token || (isDemoMode ? "demo-token" : null);

      const response = await fetch("/api/assets", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

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
  }, [currentUser?.id, token, isDemoMode]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // 🚀 PERFORMANCE: Optimize chart data fetching with reduced dependencies
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

      // 🚀 PERFORMANCE: Use current total from cached metrics instead of recalculating
      const currentTotalValue = metrics?.totalValue || 0;

      // Call the real historical data API
      const days = timeframe === "max" ? 365 : parseInt(timeframe);
      const authToken = token || (isDemoMode ? "demo-token" : null);

      console.log(`📈 Fetching portfolio history for ${days} days...`);

      const response = await fetch(
        `/api/market-data/portfolio-history/${currentUser.id}?days=${days}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        }
      );

      if (controller.signal.aborted) return;

      if (!response.ok) {
        throw new Error("Failed to fetch portfolio history");
      }

      const data = await response.json();

      if (controller.signal.aborted) return;

      if (data.status === "OK" && data.data) {
        setChartData(data.data);
        console.log(
          `✅ Loaded ${data.data.length} historical data points for ${timeframe} period`
        );
      } else {
        // Fallback: Generate simple data points for current portfolio value
        console.log(
          "📊 No historical data available, using current portfolio snapshot"
        );
        const fallbackData = [];
        const currentDate = new Date();
        const daysBack = timeframe === "max" ? 30 : parseInt(timeframe);

        // Create a few data points showing current total value
        for (
          let i = daysBack;
          i >= 0;
          i -= Math.max(1, Math.floor(daysBack / 10))
        ) {
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
      if (error instanceof Error && error.name === "AbortError") {
        // Request was aborted, this is expected
        return;
      }

      // Don't log error if user is not authenticated
      if (currentUser?.id) {
        console.error("Chart data fetch error:", error);
      }

      // 🚀 PERFORMANCE: Use cached total value for error fallback
      const currentTotalValue = metrics?.totalValue || 0;

      // Fallback for errors: Create simple progression
      const fallbackData = [];
      const currentDate = new Date();
      const daysBack = timeframe === "max" ? 30 : parseInt(timeframe);

      for (
        let i = daysBack;
        i >= 0;
        i -= Math.max(1, Math.floor(daysBack / 5))
      ) {
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
  }, [
    timeframe,
    currentUser?.id,
    metrics?.totalValue,
    token,
    isDemoMode,
    cleanupChartRequest,
  ]);

  // 🚀 PERFORMANCE: Only fetch chart data when timeframe changes or user changes (not on every asset change)
  useEffect(() => {
    // Only fetch chart data if we have metrics calculated (means assets loaded)
    if (metrics && currentUser?.id) {
      fetchChartData();
    }
  }, [timeframe, currentUser?.id, metrics, fetchChartData]); // Added metrics dependency

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
        const authToken = token || (isDemoMode ? "demo-token" : null);

        const response = await fetch("/api/assets", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: assetId,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.error) throw new Error(data.error);
        fetchAssets();
      } catch (err) {
        console.error("Asset deletion error:", err);
        setError("Failed to delete asset");
      }
    },
    [currentUser, fetchAssets, token, isDemoMode]
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
        const authToken = token || (isDemoMode ? "demo-token" : null);

        const method = editingAsset ? "PUT" : "POST";
        const endpoint = editingAsset
          ? `/api/assets/${editingAsset.id}`
          : "/api/assets";

        const response = await fetch(endpoint, {
          method,
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...assetData,
            userId: currentUser.id,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

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
    [editingAsset, currentUser, fetchAssets, token, isDemoMode]
  );

  // 🚀 PERFORMANCE: Use cached metrics instead of expensive calculations
  const { totalValue, totalGainLoss, collectiveAPY, assetsByType } =
    metrics || {
      totalValue: 0,
      totalGainLoss: 0,
      collectiveAPY: 0,
      assetsByType: {},
    };

  const filteredAssets = useMemo(() => {
    let filtered = [...assets];
    
    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((asset) => asset.type === filterType);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((asset) => 
        asset.name.toLowerCase().includes(query) ||
        asset.symbol?.toLowerCase().includes(query) ||
        asset.type.toLowerCase().includes(query)
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "type":
          return a.type.localeCompare(b.type);
        case "performance":
          const perfA = a.purchase_price ? ((a.current_value - a.purchase_price) / a.purchase_price) : 0;
          const perfB = b.purchase_price ? ((b.current_value - b.purchase_price) / b.purchase_price) : 0;
          return perfB - perfA;
        case "value":
        default:
          return b.current_value - a.current_value;
      }
    });
    
    return filtered;
  }, [assets, filterType, searchQuery, sortBy]);

  const chartDataFormatted = useMemo(() => {
    if (!chartData) return [];
    return chartData.map((item) => ({
      date: new Date(item.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      value: item.total_value / 100,
    }));
  }, [chartData]);

  // 🚀 PERFORMANCE: Pre-calculate table row data to avoid calculations during render
  const tableRowData = useMemo(() => {
    console.log(
      "📊 Pre-calculating table row data for",
      filteredAssets.length,
      "assets"
    );

    return filteredAssets.map((asset) => {
      const config =
        assetTypeConfig[asset.type as keyof typeof assetTypeConfig] ||
        assetTypeConfig.other;
      const iconClass =
        asset.type === "crypto" && asset.symbol
          ? getCryptoIcon(asset.symbol)
          : `fas ${config.icon}`;

      // Pre-calculate appreciation to avoid doing it during render
      const appreciation =
        asset.purchase_price && asset.current_value && asset.quantity
          ? FinancialCalculator.calculateAssetGainLoss(
              asset.current_value,
              asset.purchase_price,
              asset.quantity
            )
          : null;

      return {
        asset,
        config,
        iconClass,
        appreciation,
      };
    });
  }, [filteredAssets]);

  // 🚀 PERFORMANCE: Memoized AssetTable component with pre-calculated data
  const AssetTable = useCallback(
    ({
      rowData,
      onEdit,
      onDelete,
    }: {
      rowData: typeof tableRowData;
      onEdit: (asset: Asset) => void;
      onDelete: (id: string) => void;
    }) => {
      return (
        <EnhancedGlassCard enableLensing hoverable variant="standard" padding="sm" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Asset
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Current Value
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Gain/Loss
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {rowData.map(({ asset, config, iconClass, appreciation }) => (
                  <tr
                    key={asset.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div
                          className={`p-2 bg-gradient-to-r ${config.gradient} rounded-lg mr-3 flex-shrink-0`}
                        >
                          <i
                            className={`${iconClass} text-white text-sm`}
                          ></i>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {asset.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {asset.type?.charAt(0).toUpperCase() +
                        asset.type?.slice(1).replace("_", " ")}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {asset.symbol || "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-white text-right">
                      {asset.quantity || "-"}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white text-right">
                      {FinancialCalculator.formatCurrency(
                        asset.current_value || 0
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-right">
                      {appreciation ? (
                        <div>
                          <div
                            className={`font-medium ${
                              appreciation.gain >= 0
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          >
                            {appreciation.gain >= 0 ? "+" : ""}
                            {FinancialCalculator.formatCurrency(
                              appreciation.gain
                            )}
                          </div>
                          <div
                            className={`text-xs sm:text-sm ${
                              appreciation.gain >= 0
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          >
                            {FinancialCalculator.formatPercentage(
                              appreciation.gainPercent,
                              2,
                              true
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex justify-center space-x-2">
                        <Button
                          onClick={() => onEdit(asset)}
                          variant="ghost"
                          size="sm"
                          icon="fa-edit"
                          className="text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                          aria-label="Edit asset"
                        />
                        <Button
                          onClick={() => asset.id && onDelete(asset.id)}
                          variant="ghost"
                          size="sm"
                          icon="fa-trash"
                          className="text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                          aria-label="Delete asset"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </EnhancedGlassCard>
      );
    },
    []
  ); // Empty dependencies since we're passing data as props

  if (loading) {
    return <AssetManagerSkeleton />;
  }

  return (
    <div className="min-h-screen text-gray-900 dark:text-white">
      <div className="relative z-10 p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <MotionDiv
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Asset Manager
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">
                Track and manage your investment portfolio
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowApiConfig(true)}
                variant="glass"
                animate
                className="touch-manipulation bg-gradient-to-r from-gray-600/80 to-gray-700/80 hover:from-gray-600 hover:to-gray-700 text-white border-white/20"
              >
                <i className="fas fa-cog mr-2"></i>
                API Config
              </Button>
              <Button
                onClick={handleOpenModal}
                variant="glass-primary"
                animate
                className="touch-manipulation"
              >
                <i className="fas fa-plus mr-2"></i>
                Add Asset
              </Button>
            </div>
          </div>
        </MotionDiv>

        {error && (
          <MotionDiv
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-900/20 backdrop-blur-sm border border-red-800 rounded-xl p-4 mb-6"
          >
            <p className="text-red-400 flex items-center">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </p>
          </MotionDiv>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <StatCard
            title="Total Asset Value"
            value={FinancialCalculator.formatCurrency(totalValue)}
            icon="fa-wallet"
            colorScheme="green"
          />
          
          <StatCard
            title="Total Assets"
            value={assets.length}
            icon="fa-chart-pie"
            colorScheme="blue"
          />
          
          <StatCard
            title="Total Gain/Loss"
            value={`${totalGainLoss >= 0 ? "+" : ""}${FinancialCalculator.formatCurrency(totalGainLoss)}`}
            icon={totalGainLoss >= 0 ? "fa-arrow-trend-up" : "fa-arrow-trend-down"}
            colorScheme={totalGainLoss >= 0 ? "green" : "red"}
          />
          
          <StatCard
            title="Portfolio APY"
            value={FinancialCalculator.formatAPY(collectiveAPY)}
            icon="fa-percentage"
            colorScheme={collectiveAPY >= 0 ? "purple" : "red"}
          />
        </div>

        {/* Charts Section */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8"
        >
          <EnhancedGlassCard enableLensing hoverable variant="standard" padding="lg" animate animationDelay={0.3}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                Portfolio Performance
              </h3>
              <EnhancedTabs
                tabs={["7", "30", "90", "365", "max"].map((days) => ({
                  id: days,
                  label: days === "max" ? "Max" : `${days}D`,
                }))}
                activeTab={timeframe}
                onTabChange={setTimeframe}
                variant="glass"
                size="sm"
              />
            </div>
            {chartLoading ? (
              <ChartLoadingSkeleton height="h-48 sm:h-64" />
            ) : (
              <div className="h-48 sm:h-64">
                <LineChart
                  data={chartDataFormatted}
                  xKey="date"
                  lines={[{ dataKey: "value", color: "#3b82f6" }]}
                />
              </div>
            )}
          </EnhancedGlassCard>

          <EnhancedGlassCard enableLensing hoverable variant="standard" padding="lg" animate animationDelay={0.3}>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
              Asset Distribution
            </h3>
            <div className="h-48 sm:h-64">
              <PieChart
                data={Object.entries(assetsByType).map(([type, data]) => ({
                  name:
                    type.charAt(0).toUpperCase() +
                    type.slice(1).replace("_", " "),
                  value: data.value / 100,
                  color:
                    assetTypeConfig[type as keyof typeof assetTypeConfig]
                      ?.color || "#gray",
                }))}
              />
            </div>
          </EnhancedGlassCard>
        </MotionDiv>

        {/* New Filter Bar Design - like Expense Manager */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div className="flex items-center gap-3 flex-1">
              {/* Category Dropdown */}
              <div className="relative">
                <Button
                  onClick={() => setOpenCategoryDropdown(!openCategoryDropdown)}
                  variant="glass"
                  size="md"
                  animate
                  className="min-w-[180px] justify-between"
                >
                  <span className="flex items-center gap-2">
                    <i className={`fas ${filterType === "all" ? "fa-layer-group" : assetTypeConfig[filterType as keyof typeof assetTypeConfig]?.icon || "fa-coins"} text-sm`}></i>
                    {filterType === "all" ? "All Assets" : filterType.charAt(0).toUpperCase() + filterType.slice(1).replace("_", " ")}
                  </span>
                  <i className="fas fa-chevron-down text-xs"></i>
                </Button>
                
                {openCategoryDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-64 liquid-glass rounded-lg shadow-xl z-20 max-h-80 overflow-y-auto">
                    <Button
                      onClick={() => {
                        setFilterType("all");
                        setOpenCategoryDropdown(false);
                      }}
                      variant="dropdown-item"
                      className="border-b-0"
                    >
                      <i className="fas fa-layer-group mr-2"></i>
                      All Assets
                    </Button>
                    
                    {Object.entries(assetTypeConfig).map(([type, config]) => {
                      const assetCount = assets.filter(a => a.type === type).length;
                      if (assetCount === 0 && filterType !== type) return null;
                      
                      return (
                        <Button
                          key={type}
                          onClick={() => {
                            setFilterType(type);
                            setOpenCategoryDropdown(false);
                          }}
                          variant="dropdown-item"
                          className="flex items-center justify-between border-b-0"
                        >
                          <span className="flex items-center">
                            <i className={`fas ${config.icon} mr-2`}></i>
                            {type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ")}
                          </span>
                          <span className="text-sm text-gray-500">({assetCount})</span>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Expandable Search Field */}
              <div className={`relative transition-all duration-300 ${searchExpanded ? 'flex-1' : ''}`}>
                <Button
                  onClick={() => setSearchExpanded(!searchExpanded)}
                  variant="glass"
                  size="md"
                  animate
                  icon="fa-search"
                  iconOnly
                  className={`${searchExpanded ? 'hidden' : 'flex'}`}
                />
                
                {searchExpanded && (
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full liquid-glass--subtle rounded-lg pl-10 pr-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                        placeholder="Search assets..."
                        autoFocus
                      />
                      <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    </div>
                    <Button
                      onClick={() => {
                        setSearchExpanded(false);
                        setSearchQuery("");
                      }}
                      variant="ghost"
                      size="sm"
                      icon="fa-times"
                      iconOnly
                    />
                  </div>
                )}
              </div>

              {/* Advanced Filters Button */}
              <Button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                variant="glass"
                size="md"
                animate
                icon={showAdvancedFilters ? "fa-times" : "fa-sliders-h"}
                className=""
              >
                <span className="hidden sm:inline">Advanced Filters</span>
              </Button>
            </div>

            {/* View Mode Switcher */}
            <ViewSwitcher
              activeView={viewMode}
              onViewChange={setViewMode}
              variant="subtle"
            />
          </div>

          {/* Search Results Count */}
          {searchQuery && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Found {filteredAssets.length} {filteredAssets.length === 1 ? 'asset' : 'assets'} matching &quot;{searchQuery}&quot;
            </p>
          )}

          {/* Collapsible Advanced Filters */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <MotionDiv
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 liquid-glass--subtle rounded-lg mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Sort By
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full liquid-glass--subtle rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        <option value="value">Value</option>
                        <option value="name">Name</option>
                        <option value="type">Type</option>
                        <option value="performance">Performance</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Min Value
                      </label>
                      <input
                        type="number"
                        placeholder="$ 0"
                        className="w-full liquid-glass--subtle rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Max Value
                      </label>
                      <input
                        type="number"
                        placeholder="$ ∞"
                        className="w-full liquid-glass--subtle rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                  </div>
                </div>
              </MotionDiv>
            )}
          </AnimatePresence>
        </MotionDiv>


        {/* Assets Grid/List */}
        <AnimatePresence mode="wait">
          {filteredAssets.length === 0 ? (
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 sm:py-16 px-4"
            >
              <div className="text-gray-500 text-4xl sm:text-6xl mb-4">
                <i className="fas fa-wallet"></i>
              </div>
              <h3 className="text-lg sm:text-xl font-medium text-gray-600 dark:text-gray-400 mb-2">
                {filterType === "all"
                  ? "No Assets Yet"
                  : `No ${filterType} assets`}
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
            </MotionDiv>
          ) : (
            <MotionDiv
              layout
              className={
                viewMode === "grid"
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
                    config={
                      assetTypeConfig[
                        asset.type as keyof typeof assetTypeConfig
                      ] || assetTypeConfig.other
                    }
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
                    config={
                      assetTypeConfig[
                        asset.type as keyof typeof assetTypeConfig
                      ] || assetTypeConfig.other
                    }
                    getCryptoIcon={getCryptoIcon}
                  />
                ))
              ) : (
                <AssetTable
                  rowData={tableRowData}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}
            </MotionDiv>
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
        <AssetApiConfigModal
          onClose={() => setShowApiConfig(false)}
          onApiKeysUpdated={fetchAssets}
        />
      )}
    </div>
  );
}
