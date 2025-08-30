"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Asset } from "@/types/global";
import { AssetCard } from "@/components/cards/AssetCard";
import { AssetModal } from "@/components/modals/AssetModal";
import { Tile } from "@/components/ui/tile/tile";
import { useAuth } from "@/lib/unifiedAuth";
import { PortfolioSkeleton } from "@/components/ui/skeleton";
import { EnhancedGlassCard } from "@/components/ui/enhanced-glass/EnhancedGlassCard";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

// 🚀 PERFORMANCE: Dynamic import for animations to reduce initial bundle size
const AnimatePresence = dynamic(
  () =>
    import("framer-motion").then((mod) => ({ default: mod.AnimatePresence })),
  {
    ssr: false,
    loading: () => null,
  }
);

// Asset type configuration
const assetTypeConfig = {
  stock: {
    icon: "fa-chart-line",
    color: "blue",
    gradient: "from-blue-500 to-blue-600",
  },
  crypto: {
    icon: "fa-bitcoin",
    color: "orange",
    gradient: "from-orange-500 to-orange-600",
  },
  property: {
    icon: "fa-home",
    color: "green",
    gradient: "from-green-500 to-green-600",
  },
  cash: {
    icon: "fa-dollar-sign",
    color: "purple",
    gradient: "from-purple-500 to-purple-600",
  },
  savings: {
    icon: "fa-piggy-bank",
    color: "emerald",
    gradient: "from-emerald-500 to-emerald-600",
  },
  bond: {
    icon: "fa-university",
    color: "indigo",
    gradient: "from-indigo-500 to-indigo-600",
  },
  stock_options: {
    icon: "fa-certificate",
    color: "pink",
    gradient: "from-pink-500 to-pink-600",
  },
  other: {
    icon: "fa-box",
    color: "gray",
    gradient: "from-gray-500 to-gray-600",
  },
};

// Crypto-specific icons
const getCryptoIcon = (symbol: string) => {
  const symbolUpper = symbol?.toUpperCase();
  switch (symbolUpper) {
    case "BTC":
    case "BITCOIN":
      return "fa-bitcoin";
    case "ETH":
    case "ETHEREUM":
      return "fa-ethereum";
    default:
      return "fa-coins"; // Generic crypto icon for other cryptocurrencies
  }
};


export default function PortfolioPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"value" | "change" | "name">("value");

  // Use ref to track abort controller for cleanup
  const fetchAbortControllerRef = useRef<AbortController | null>(null);

  // Check if user is in demo mode
  const isDemoMode = useMemo(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem("demo-mode") === "true",
    []
  );

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

  // Cleanup function for abort controller
  const cleanup = useCallback(() => {
    if (fetchAbortControllerRef.current) {
      fetchAbortControllerRef.current.abort();
      fetchAbortControllerRef.current = null;
    }
  }, []);

  const fetchAssets = useCallback(async () => {
    if (!currentUser?.id) return;

    // Cancel any ongoing fetch request
    cleanup();

    // Create new AbortController for this request
    const controller = new AbortController();
    fetchAbortControllerRef.current = controller;

    try {
      setLoading(true);
      setError(null);

      // Use the proxy endpoint with authentication
      const authToken = (isDemoMode ? "demo-token" : user?.token) || null;

      const response = await fetch("/api/assets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ method: "READ", userId: currentUser.id }),
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (!controller.signal.aborted) {
        setAssets(data.assets || []);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return; // Expected cancellation
      }
      console.error("Error fetching assets:", err);
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err.message : "Failed to fetch assets");
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [currentUser?.id, cleanup, isDemoMode, user?.token]);

  useEffect(() => {
    if (currentUser?.id) {
      fetchAssets();
    }
  }, [currentUser?.id, fetchAssets]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Memoized calculations for performance
  const portfolioMetrics = useMemo(() => {
    const totalValue = assets.reduce(
      (sum, asset) => sum + (asset.current_value || 0),
      0
    );
    const totalInvested = assets.reduce((sum, asset) => {
      return (
        sum +
        (asset.purchase_price && asset.quantity
          ? asset.purchase_price * asset.quantity
          : 0)
      );
    }, 0);
    const totalGainLoss = totalValue - totalInvested;
    const gainLossPercent =
      totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

    return {
      totalValue,
      totalInvested,
      totalGainLoss,
      gainLossPercent,
      assetCount: assets.length,
    };
  }, [assets]);

  // Memoized filtered and sorted assets
  const filteredAndSortedAssets = useMemo(() => {
    let filtered = assets;

    if (filter !== "all") {
      filtered = assets.filter((asset) => asset.type === filter);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "value":
          return (b.current_value || 0) - (a.current_value || 0);
        case "change":
          const aGain =
            a.current_value && a.purchase_price && a.quantity
              ? a.current_value - a.purchase_price * a.quantity
              : 0;
          const bGain =
            b.current_value && b.purchase_price && b.quantity
              ? b.current_value - b.purchase_price * b.quantity
              : 0;
          return bGain - aGain;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [assets, filter, sortBy]);

  const handleEdit = useCallback((asset: Asset) => {
    setSelectedAsset(asset);
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(
    async (assetId: string) => {
      if (
        !currentUser ||
        !confirm("Are you sure you want to delete this asset?")
      )
        return;

      try {
        // Use the proxy endpoint with authentication
        const authToken = (isDemoMode ? "demo-token" : user?.token) || null;

        const response = await fetch("/api/assets", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            method: "DELETE",
            userId: currentUser.id,
            id: assetId,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        fetchAssets();
      } catch (err) {
        console.error("Error deleting asset:", err);
        setError("Failed to delete asset");
      }
    },
    [currentUser, fetchAssets, isDemoMode, user?.token]
  );

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }, []);

  if (loading) {
    return <PortfolioSkeleton />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <i className="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Failed to Load Portfolio
          </h3>
          <p className="text-red-600 dark:text-red-300">{error}</p>
          <Button
            onClick={() => fetchAssets()}
            variant="danger"
            size="md"
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Portfolio
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track and manage your investment portfolio
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedAsset(null);
            setShowModal(true);
          }}
          variant="primary"
          size="md"
          icon="fa-plus"
        >
          Add Asset
        </Button>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <EnhancedGlassCard variant="standard" padding="md" animate animationDelay={0.1} enableLensing hoverable>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total Value
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(portfolioMetrics.totalValue)}
          </p>
        </EnhancedGlassCard>
        <EnhancedGlassCard variant="standard" padding="md" animate animationDelay={0.2} enableLensing hoverable>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total Invested
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(portfolioMetrics.totalInvested)}
          </p>
        </EnhancedGlassCard>
        <EnhancedGlassCard variant="standard" padding="md" animate animationDelay={0.3} enableLensing hoverable>
          <p className="text-sm text-gray-600 dark:text-gray-400">Gain/Loss</p>
          <p
            className={`text-2xl font-bold ${
              portfolioMetrics.totalGainLoss >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {portfolioMetrics.totalGainLoss >= 0 ? "+" : ""}
            {formatCurrency(portfolioMetrics.totalGainLoss)}
          </p>
        </EnhancedGlassCard>
        <EnhancedGlassCard variant="standard" padding="md" animate animationDelay={0.4} enableLensing hoverable>
          <p className="text-sm text-gray-600 dark:text-gray-400">Return</p>
          <p
            className={`text-2xl font-bold ${
              portfolioMetrics.gainLossPercent >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {portfolioMetrics.gainLossPercent >= 0 ? "+" : ""}
            {portfolioMetrics.gainLossPercent.toFixed(2)}%
          </p>
        </EnhancedGlassCard>
        <EnhancedGlassCard variant="standard" padding="md" animate animationDelay={0.5} enableLensing hoverable>
          <p className="text-sm text-gray-600 dark:text-gray-400">Assets</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {portfolioMetrics.assetCount}
          </p>
        </EnhancedGlassCard>
      </div>

      {/* Asset Allocation Chart Placeholder */}
      <div className="mb-8">
        <Tile>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Asset Allocation
          </h2>
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <i className="fas fa-chart-pie text-6xl opacity-20"></i>
          </div>
        </Tile>
      </div>

      {/* Filters and Sort */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Your Assets
        </h2>
        <div className="flex flex-wrap gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Types</option>
            <option value="stock">Stocks</option>
            <option value="crypto">Crypto</option>
            <option value="cash">Cash</option>
            <option value="savings">Savings</option>
            <option value="stock_options">Options</option>
            <option value="bond">Bonds</option>
            <option value="other">Other</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "value" | "change" | "name")
            }
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="value">Sort by Value</option>
            <option value="change">Sort by Change</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </div>

      {/* Assets Grid */}
      {filteredAndSortedAssets.length === 0 ? (
        <div className="text-center py-12">
          <i className="fas fa-inbox text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
            {filter === "all" ? "No assets found" : `No ${filter} assets found`}
          </p>
          <Button
            onClick={() => {
              setSelectedAsset(null);
              setShowModal(true);
            }}
            variant="primary"
            size="md"
          >
            Add Your First Asset
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredAndSortedAssets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                config={
                  assetTypeConfig[asset.type as keyof typeof assetTypeConfig] ||
                  assetTypeConfig.other
                }
                getCryptoIcon={getCryptoIcon}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Asset Modal */}
      {showModal && (
        <AssetModal
          asset={selectedAsset}
          onSave={handleEdit}
          onClose={() => {
            setShowModal(false);
            setSelectedAsset(null);
          }}
        />
      )}
    </div>
  );
}
