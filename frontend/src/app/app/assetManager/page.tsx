"use client";

import React, { useCallback, useMemo, useEffect, useState } from "react";
import { useAuth } from '@/lib/auth';
import { useAppContext } from "@/components/layout/layoutWrapper";
import { BaseModal as Modal } from "@/components/modals/modal";
import { Button } from "@/components/ui/button/button";
import type { Asset } from "@/types/global";
import { motion, AnimatePresence } from "framer-motion";
import LineChart from "@/components/charts/line";
import PieChart from "@/components/charts/pie";

// Asset type configuration
const assetTypeConfig = {
  stock: { icon: "fa-chart-line", color: "blue", gradient: "from-blue-500 to-blue-600" },
  crypto: { icon: "fa-bitcoin", color: "orange", gradient: "from-orange-500 to-orange-600" },
  property: { icon: "fa-home", color: "green", gradient: "from-green-500 to-green-600" },
  cash: { icon: "fa-dollar-sign", color: "purple", gradient: "from-purple-500 to-purple-600" },
  stock_options: { icon: "fa-certificate", color: "pink", gradient: "from-pink-500 to-pink-600" },
  other: { icon: "fa-box", color: "gray", gradient: "from-gray-500 to-gray-600" },
};

// Crypto-specific icons
const getCryptoIcon = (symbol: string) => {
  const symbolUpper = symbol?.toUpperCase();
  switch (symbolUpper) {
    case 'BTC':
    case 'BITCOIN':
      return 'fa-bitcoin';
    case 'ETH':
    case 'ETHEREUM':
      return 'fa-ethereum';
    default:
      return 'fa-coins'; // Generic crypto icon for other cryptocurrencies
  }
};

export default function AssetManager() {
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { formatCurrency } = useAppContext();
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

  // Check if user is in demo mode
  const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('demo-mode') === 'true';
  
  // Use Firebase user data or demo user data
  const currentUser = user ? {
    id: user.uid,
    name: user.displayName || user.email?.split('@')[0] || 'User',
    email: user.email || ''
  } : (isDemoMode ? {
    id: 'demo-user-id',
    name: 'Demo User',
    email: 'demo@profolio.com'
  } : null);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const { apiCall } = await import('@/lib/mockApi');

      const response = await apiCall("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "READ", userId: currentUser?.id || "demo-user-id" }),
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setAssets(data.assets || []);
      setError(null); // Clear any previous errors
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
    setChartLoading(true);
    try {
      const { apiCall } = await import('@/lib/mockApi');
      
      const response = await apiCall("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "GET_HISTORY",
          userId: currentUser?.id || "demo-user-id",
          days: timeframe === "max" ? null : parseInt(timeframe),
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setChartData(data.history || []);
    } catch (err) {
      console.error("Chart data fetch error:", err);
      setError("Failed to load chart data");
    } finally {
      setChartLoading(false);
    }
  }, [timeframe, currentUser?.id]);

  useEffect(() => {
      fetchChartData();
  }, [timeframe, fetchChartData]);

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
    return assets.reduce((sum, asset) => sum + (asset.current_value ?? 0), 0);
  }, [assets]);

  const totalGainLoss = useMemo(() => {
    return assets.reduce((sum, asset) => {
      const purchasePrice = asset.purchase_price ?? 0;
      const currentValue = asset.current_value ?? 0;
      return sum + (currentValue - purchasePrice);
    }, 0);
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

  interface AssetModalProps {
    onClose: () => void;
    onSubmit: (asset: Asset) => void;
    initialData: Asset | null;
  }

  // Asset type fields must be defined before AssetType type
  const assetTypeFields = {
    stock: [
      {
        name: "symbol",
        label: "Stock Symbol",
        type: "text",
        placeholder: "AAPL",
        required: true,
      },
      {
        name: "quantity",
        label: "Number of Shares",
        type: "number",
        step: "0.000001",
        required: true,
      },
      {
        name: "current_value",
        label: "Current Value",
        type: "number",
        step: "0.01",
        required: true,
      },
      {
        name: "purchase_price",
        label: "Purchase Price",
        type: "number",
        step: "0.01",
      },
      { name: "purchase_date", label: "Purchase Date", type: "date" },
    ],
    crypto: [
      {
        name: "symbol",
        label: "Crypto Symbol",
        type: "text",
        placeholder: "BTC",
        required: true,
      },
      {
        name: "quantity",
        label: "Amount",
        type: "number",
        step: "0.00000001",
        required: true,
      },
      {
        name: "current_value",
        label: "Current Value",
        type: "number",
        step: "0.01",
        required: true,
      },
      {
        name: "purchase_price",
        label: "Purchase Price",
        type: "number",
        step: "0.01",
      },
      { name: "purchase_date", label: "Purchase Date", type: "date" },
    ],
    stock_options: [
      {
        name: "symbol",
        label: "Company Stock Symbol",
        type: "text",
        placeholder: "AAPL",
        required: true,
      },
      {
        name: "quantity",
        label: "Number of Options",
        type: "number",
        step: "1",
        required: true,
      },
      {
        name: "current_value",
        label: "Current Value",
        type: "number",
        step: "0.01",
        required: true,
      },
      {
        name: "purchase_price",
        label: "Strike Price",
        type: "number",
        step: "0.01",
        required: true,
      },
      {
        name: "vesting_start_date",
        label: "Vesting Start Date",
        type: "date",
        required: true,
      },
      {
        name: "vesting_end_date",
        label: "Vesting End Date",
        type: "date",
        required: true,
      },
      {
        name: "vesting_schedule",
        label: "Vesting Schedule",
        type: "textarea",
        placeholder: '{"initial": "25", "monthly": "2.083"}',
        required: true,
      },
    ],
    cash: [
      {
        name: "current_value",
        label: "Amount",
        type: "number",
        step: "0.01",
        required: true,
      },
      { name: "notes", label: "Account Details", type: "textarea" },
    ],
    bond: [
      {
        name: "current_value",
        label: "Current Value",
        type: "number",
        step: "0.01",
        required: true,
      },
      {
        name: "purchase_price",
        label: "Purchase Price",
        type: "number",
        step: "0.01",
      },
      { name: "purchase_date", label: "Purchase Date", type: "date" },
    ],
    other: [
      {
        name: "current_value",
        label: "Current Value",
        type: "number",
        step: "0.01",
        required: true,
      },
      {
        name: "purchase_price",
        label: "Purchase Price",
        type: "number",
        step: "0.01",
      },
      { name: "purchase_date", label: "Purchase Date", type: "date" },
    ],
  };

  // Define AssetType as the keys of assetTypeFields
  type AssetType = keyof typeof assetTypeFields;

  type AssetFormData = {
    [key: string]: string | number | { initial?: string; monthly?: string } | null | undefined;
    name: string;
    type: AssetType;
    quantity: string;
    current_value: string;
    purchase_price: string;
    purchase_date: string;
    symbol: string;
    notes: string;
    vesting_schedule: { initial?: string; monthly?: string } | null;
    vesting_start_date: string;
    vesting_end_date: string;
  };

  const AssetModal = ({ onClose, onSubmit, initialData }: AssetModalProps) => {
    const [formData, setFormData] = useState<AssetFormData>(() =>
      initialData
        ? {
            name: initialData.name || "",
            type: (initialData.type as AssetType) || "stock",
            quantity: initialData.quantity?.toString() || "",
            current_value: ((initialData.current_value || 0) / 100).toString(),
            purchase_price: initialData.purchase_price ? (initialData.purchase_price / 100).toString() : "",
            purchase_date: initialData.purchase_date || "",
            symbol: initialData.symbol || "",
            notes: initialData.notes || "",
            vesting_schedule: initialData.vesting_schedule || null,
            vesting_start_date: initialData.vesting_start_date || "",
            vesting_end_date: initialData.vesting_end_date || "",
          }
        : {
            name: "",
            type: "stock",
            quantity: "",
            current_value: "",
            purchase_price: "",
            purchase_date: "",
            symbol: "",
            notes: "",
            vesting_schedule: null,
            vesting_start_date: "",
            vesting_end_date: "",
          }
    );

    const [loading, setLoading] = useState(false);

    useEffect(() => {
      const fetchSymbolData = async () => {
        if (!formData.symbol || !["stock", "crypto"].includes(formData.type))
          return;

        setLoading(true);
        try {
          const response = await fetch(
            `/integrations/product-search/search?q=${encodeURIComponent(
              formData.symbol
            )}`
          );
          const data = await response.json();

          if (data.status === "OK" && data.data.length > 0) {
            const price = parseFloat(
              data.data[0].offer.price.replace(/[^0-9.]/g, "")
            );
            const quantity = parseFloat(formData.quantity);
            const currentValue = !isNaN(quantity) ? price * quantity : price;
            setFormData((prev) => ({
              ...prev,
              current_value: currentValue.toFixed(2),
            }));
          }
        } catch (error) {
          console.error("Error fetching symbol data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchSymbolData();
    }, [formData.symbol, formData.quantity, formData.type]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const assetData: Partial<Asset> = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        current_value: parseFloat(formData.current_value) * 100,
        purchase_price: parseFloat(formData.purchase_price) * 100,
        vesting_schedule: formData.vesting_schedule && 
          typeof formData.vesting_schedule === 'object' &&
          formData.vesting_schedule.initial &&
          formData.vesting_schedule.monthly
          ? {
              initial: formData.vesting_schedule.initial,
              monthly: formData.vesting_schedule.monthly
            }
          : undefined,
      };
      onSubmit(assetData as Asset);
    };

    interface Field {
      name: string;
      label: string;
      type: string;
      placeholder?: string;
      required?: boolean;
      step?: string;
    }

    const renderField = (field: Field) => {
      const commonClasses =
        "w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200";

      const tooltips: Partial<Record<keyof AssetFormData, string>> = {
        current_value:
          "Enter the total current market value in dollars (e.g., 1000 for $1,000.00)",
        purchase_price: "Enter the price you paid per unit in dollars (e.g., 150 for $150.00)",
        quantity:
          "Number of units you own (shares for stocks, coins for crypto)",
        amount: "The total amount of cash in this account",
        symbol:
          "The trading symbol (e.g., AAPL for Apple stock, BTC for Bitcoin)",
        vesting_schedule:
          'JSON format describing vesting terms (e.g., {"initial": "25", "monthly": "2.083"} for 25% initial vest with 2.083% monthly)',
        purchase_date: "The date when the asset was acquired",
        vesting_start_date: "Start date of stock option vesting",
        vesting_end_date: "End date of stock option vesting",
        notes: "Additional notes or comments about the asset",
        name: "Descriptive name for the asset",
        type: "The category of the asset (stock, crypto, property, etc.)"
      };

      return (
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label}
            </label>
            {tooltips[field.name as keyof AssetFormData] && (
              <div className="group relative">
                <i className="fas fa-info-circle text-gray-500 dark:text-gray-400 hover:text-blue-500 cursor-help"></i>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-64 z-10">
                  {tooltips[field.name as keyof AssetFormData]}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                </div>
              </div>
            )}
          </div>
          {field.type === "textarea" ? (
            <textarea
              value={
                field.name === "vesting_schedule"
                  ? formData.vesting_schedule
                    ? JSON.stringify(formData.vesting_schedule)
                    : ""
                  : (formData[field.name] as string) || ""
              }
              onChange={(e) =>
                setFormData({
                  ...formData,
                  [field.name]:
                    field.name === "vesting_schedule"
                      ? e.target.value
                        ? JSON.parse(e.target.value)
                        : null
                      : e.target.value,
                })
              }
              className={commonClasses}
              placeholder={field.placeholder}
              required={field.required}
              rows={3}
            />
          ) : (
            <input
              type={field.type}
              value={(formData[field.name] as string) || ""}
              onChange={(e) =>
                setFormData({ ...formData, [field.name]: e.target.value })
              }
              className={commonClasses}
              placeholder={field.placeholder}
              required={field.required}
              step={field.step}
            />
          )}
        </div>
      );
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 lg:p-8 w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 shadow-2xl">
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {initialData ? "Edit Asset" : "Add New Asset"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-manipulation"
          >
            <i className="fas fa-times text-lg sm:text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Asset Name
                </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                placeholder="e.g., Apple Stock"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Asset Type
                </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as AssetType })
                }
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
              >
                {Object.keys(assetTypeFields).map((type) => (
                  <option key={type} value={type} className="bg-white dark:bg-gray-800">
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            </div>

          <div className="space-y-4 sm:space-y-6">
            {assetTypeFields[formData.type].map((field) => (
              <div key={field.name}>{renderField(field)}</div>
            ))}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400 text-sm">Fetching market data...</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              onClick={onClose}
              variant="ghost"
              className="w-full sm:w-auto px-6 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 touch-manipulation"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium shadow-lg touch-manipulation"
            >
              {initialData ? "Update Asset" : "Add Asset"}
            </Button>
          </div>
        </form>
      </div>
    );
  };

  const AssetCard = ({
    asset,
    onEdit,
    onDelete,
  }: {
    asset: Asset;
    onEdit: (asset: Asset) => void;
    onDelete: (id: string) => void;
  }) => {
    const config = assetTypeConfig[asset.type as keyof typeof assetTypeConfig] || assetTypeConfig.other;
    
    // Use crypto-specific icon if it's a crypto asset
    const iconClass = asset.type === 'crypto' && asset.symbol 
      ? getCryptoIcon(asset.symbol) 
      : config.icon;
    
    const calculateAppreciation = () => {
      if (!asset.purchase_price || !asset.current_value) return null;
      const gain = asset.current_value - asset.purchase_price;
      const percentage = (gain / asset.purchase_price) * 100;
      return { gain, percentage };
    };

    const appreciation = calculateAppreciation();

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ y: -4 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 shadow-lg hover:shadow-xl touch-manipulation"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center flex-1 min-w-0">
            <div className={`p-2 sm:p-3 bg-gradient-to-r ${config.gradient} rounded-lg mr-3 sm:mr-4 shadow-lg flex-shrink-0`}>
              <i className={`fas ${iconClass} text-white text-lg sm:text-xl`}></i>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">{asset.name}</h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                {asset.symbol || asset.type?.charAt(0).toUpperCase() + asset.type?.slice(1)}
            </p>
          </div>
          </div>
          <div className="flex space-x-1 sm:space-x-2 flex-shrink-0 ml-2">
            <button
              onClick={() => onEdit(asset)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-manipulation"
              aria-label="Edit asset"
            >
              <i className="fas fa-edit text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => asset.id && onDelete(asset.id)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-manipulation"
              aria-label="Delete asset"
            >
              <i className="fas fa-trash text-sm sm:text-base"></i>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400 text-sm">Current Value</span>
            <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency((asset.current_value || 0) / 100)}
            </span>
          </div>

          {asset.quantity && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Quantity</span>
              <span className="text-gray-900 dark:text-white text-sm sm:text-base">{asset.quantity}</span>
            </div>
          )}

          {appreciation && (
            <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Gain/Loss</span>
              <div className="text-right">
                <div className={`font-semibold text-sm sm:text-base ${appreciation.gain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {appreciation.gain >= 0 ? '+' : ''}{formatCurrency(appreciation.gain / 100)}
                </div>
                <div className={`text-xs sm:text-sm ${appreciation.gain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {appreciation.gain >= 0 ? '+' : ''}{appreciation.percentage.toFixed(2)}%
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // Table View Component
  const AssetTable = ({
    assets,
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
              {assets.map((asset) => {
                const config = assetTypeConfig[asset.type as keyof typeof assetTypeConfig] || assetTypeConfig.other;
                const iconClass = asset.type === 'crypto' && asset.symbol 
                  ? getCryptoIcon(asset.symbol) 
                  : config.icon;
                
                const appreciation = asset.purchase_price && asset.current_value ? {
                  gain: asset.current_value - asset.purchase_price,
                  percentage: ((asset.current_value - asset.purchase_price) / asset.purchase_price) * 100
                } : null;

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
                      {formatCurrency((asset.current_value || 0) / 100)}
                    </td>
                    <td className="px-4 py-4 text-sm text-right">
                      {appreciation ? (
                        <div>
                          <div className={`font-medium ${appreciation.gain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {appreciation.gain >= 0 ? '+' : ''}{formatCurrency(appreciation.gain / 100)}
                          </div>
                          <div className={`text-xs ${appreciation.gain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {appreciation.gain >= 0 ? '+' : ''}{appreciation.percentage.toFixed(2)}%
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
  };

  // API Configuration Modal
  const ApiConfigModal = ({ onClose }: { onClose: () => void }) => {
    const [apiKeys, setApiKeys] = useState({
      alphaVantage: '',
      coinGecko: '',
      polygon: '',
      trading212: '',
    });
    const [isTestingConnection, setIsTestingConnection] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<Record<string, 'success' | 'error' | null>>({});

    // Check if user is in demo mode
    const isDemoMode = localStorage.getItem('demo-mode') === 'true';

    // Load existing API keys
    useEffect(() => {
      const loadApiKeys = async () => {
        try {
          if (isDemoMode) {
            // For demo mode, load from localStorage
            const demoApiKeys = localStorage.getItem('demo-api-keys');
            if (demoApiKeys) {
              const parsedKeys = JSON.parse(demoApiKeys);
              setApiKeys(prev => ({ ...prev, ...parsedKeys }));
            }
            return;
          }

          // For real users, load from secure server storage
          const token = localStorage.getItem('auth-token') || 'demo-token-secure-123';

          const response = await fetch('/api/user/api-keys', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            setApiKeys(prev => ({ ...prev, ...data.apiKeys }));
          } else {
            console.log('API keys not found, starting with empty keys');
          }
        } catch (error) {
          console.error('Error loading API keys:', error);
        }
      };

      loadApiKeys();
    }, [isDemoMode]);

    const testApiConnection = async (provider: string, apiKey: string) => {
      if (!apiKey.trim()) return;
      
      setIsTestingConnection(provider);
      setConnectionStatus(prev => ({ ...prev, [provider]: null }));

      try {
        let isValid = false;
        const token = localStorage.getItem('auth-token') || 'demo-token-secure-123';
        
        switch (provider) {
          case 'trading212':
            // Test Trading 212 API connection
            const response = await fetch('/api/trading212/test', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({ apiKey }),
            });
            
            if (response.ok) {
              isValid = true;
            } else {
              const errorData = await response.json();
              
              // Handle specific Trading 212 errors
              if (errorData.details?.includes('429') || errorData.details?.includes('Too Many Requests')) {
                alert('⏱️ Trading 212 Rate Limit Exceeded\n\nYou\'ve made too many API requests recently. Please wait a few minutes before testing again.\n\nTip: Trading 212 has strict rate limits to protect their servers.');
                setConnectionStatus(prev => ({ ...prev, [provider]: 'error' }));
                return;
              } else if (errorData.details?.includes('401') || errorData.details?.includes('Unauthorized')) {
                alert('🔑 Invalid Trading 212 API Key\n\nPlease check that:\n• Your API key is correct\n• Your Trading 212 account has API access enabled\n• You\'re using the live Trading 212 API key (not demo/paper trading)');
                setConnectionStatus(prev => ({ ...prev, [provider]: 'error' }));
                return;
              } else if (errorData.details?.includes('403') || errorData.details?.includes('Forbidden')) {
                alert('🚫 Trading 212 API Access Denied\n\nYour API key doesn\'t have the required permissions. Please check your Trading 212 API settings.');
                setConnectionStatus(prev => ({ ...prev, [provider]: 'error' }));
                return;
              } else {
                alert(`❌ Trading 212 Connection Failed\n\n${errorData.details || errorData.error || 'Unknown error'}\n\nPlease try again in a few minutes.`);
                setConnectionStatus(prev => ({ ...prev, [provider]: 'error' }));
                return;
              }
            }
            break;
          
          case 'alphaVantage':
            // Test Alpha Vantage API
            const avResponse = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=${apiKey}`);
            const avData = await avResponse.json();
            isValid = !avData['Error Message'] && !avData['Note'];
            break;
          
          case 'coinGecko':
            // Test CoinGecko API (if they have a test endpoint)
            isValid = true; // CoinGecko often works without API key for basic requests
            break;
          
          case 'polygon':
            // Test Polygon API
            const polygonResponse = await fetch(`https://api.polygon.io/v2/aggs/ticker/AAPL/prev?apikey=${apiKey}`);
            isValid = polygonResponse.ok;
            break;
        }

        setConnectionStatus(prev => ({ ...prev, [provider]: isValid ? 'success' : 'error' }));
      } catch (error) {
        console.error(`Error testing ${provider} API:`, error);
        
        // Handle network errors
        if (error instanceof Error && error.message.includes('fetch')) {
          alert(`🌐 Network Error\n\nCouldn't connect to ${provider} API. Please check your internet connection and try again.`);
        } else {
          alert(`❌ ${provider} Test Failed\n\n${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        setConnectionStatus(prev => ({ ...prev, [provider]: 'error' }));
      } finally {
        setIsTestingConnection(null);
      }
    };

    const syncTrading212Data = async () => {
      if (!apiKeys.trading212.trim()) {
        alert('Please enter your Trading 212 API key first');
        return;
      }

      try {
        setIsTestingConnection('trading212-sync');
        const token = localStorage.getItem('auth-token') || 'demo-token-secure-123';
        
        // Fetch Trading 212 portfolio data
        const response = await fetch('/api/trading212/sync', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ apiKey: apiKeys.trading212 }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          
          // Handle specific Trading 212 errors
          if (errorData.details?.includes('429') || errorData.details?.includes('Too Many Requests')) {
            alert('⏱️ Trading 212 Rate Limit Exceeded\n\nYou\'ve made too many API requests recently. Trading 212 has strict rate limits.\n\nPlease wait 5-10 minutes before trying to sync again.\n\nTip: Once synced successfully, your portfolio data will be cached and you won\'t need to sync frequently.');
            return;
          } else if (errorData.details?.includes('401') || errorData.details?.includes('Unauthorized')) {
            alert('🔑 Invalid Trading 212 API Key\n\nPlease check that:\n• Your API key is correct\n• Your Trading 212 account has API access enabled\n• You\'re using the live Trading 212 API key (not demo/paper trading)\n\nYou can test your API key first using the "Test" button.');
            return;
          } else if (errorData.details?.includes('403') || errorData.details?.includes('Forbidden')) {
            alert('🚫 Trading 212 API Access Denied\n\nYour API key doesn\'t have the required permissions for portfolio access.\n\nPlease check your Trading 212 API settings and ensure you have the necessary permissions.');
            return;
          } else {
            throw new Error(errorData.details || errorData.error || 'Failed to sync Trading 212 data');
          }
        }

        const data = await response.json();
        
        // The sync endpoint will handle updating the assets in the backend
        // Refresh the assets list
        await fetchAssets();
        
        // Show detailed success message
        const message = `✅ Successfully synced ${data.assetsCount} assets from Trading 212!
        
📊 Portfolio Summary:
• Total Value: ${formatCurrency(data.totalValue)}
• Total P&L: ${data.totalPnL >= 0 ? '+' : ''}${formatCurrency(data.totalPnL)} (${data.totalPnLPercentage.toFixed(2)}%)
• Cash Balance: ${formatCurrency(data.cashBalance)}
• Positions: ${data.positionsCount}

🏆 Top Holdings:
${data.topHoldings.slice(0, 3).map((holding: { name: string; value: number; percentage: number }) => 
  `• ${holding.name}: ${formatCurrency(holding.value)} (${holding.percentage.toFixed(1)}%)`
).join('\n')}

🕒 Synced at: ${new Date(data.syncedAt).toLocaleString()}

${isDemoMode ? '\n💡 Demo Mode: Your data is stored locally and will be cleared when you log out.' : ''}`;
        
        alert(message);
        onClose();
      } catch (error) {
        console.error('Error syncing Trading 212 data:', error);
        
        // Handle network errors
        if (error instanceof Error && error.message.includes('fetch')) {
          alert('🌐 Network Error\n\nCouldn\'t connect to Trading 212. Please check your internet connection and try again.');
        } else {
          alert(`❌ Trading 212 Sync Failed\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nIf you\'re seeing rate limit errors, please wait a few minutes before trying again.`);
        }
      } finally {
        setIsTestingConnection(null);
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      try {
        if (isDemoMode) {
          // For demo mode, store in localStorage only
          localStorage.setItem('demo-api-keys', JSON.stringify(apiKeys));
          alert(`Demo Mode: API keys saved locally in your browser session only!\n\nProviders stored: ${Object.keys(apiKeys).filter(key => apiKeys[key as keyof typeof apiKeys].trim()).join(', ')}\n\nNote: These keys are only stored in your browser and will be cleared when you log out.`);
          onClose();
          return;
        }

        // For real users, save to secure server storage
        const token = localStorage.getItem('auth-token') || 'demo-token-secure-123';

        const response = await fetch('/api/user/api-keys', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ apiKeys }),
        });

        if (response.ok) {
          const data = await response.json();
          alert(`API keys saved securely! Providers stored: ${data.providersStored.join(', ')}`);
          onClose();
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save API keys');
        }
      } catch (error) {
        console.error('Error saving API keys:', error);
        alert(`Failed to save API keys: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    const apiProviders = [
      {
        key: 'alphaVantage',
        label: 'Alpha Vantage API Key',
        description: 'For stock market data',
        docsUrl: 'https://www.alphavantage.co/documentation/',
        placeholder: 'Enter your Alpha Vantage API key'
      },
      {
        key: 'coinGecko',
        label: 'CoinGecko API Key',
        description: 'For cryptocurrency data',
        docsUrl: 'https://www.coingecko.com/en/api/documentation',
        placeholder: 'Enter your CoinGecko API key'
      },
      {
        key: 'polygon',
        label: 'Polygon API Key',
        description: 'For real-time market data',
        docsUrl: 'https://polygon.io/docs',
        placeholder: 'Enter your Polygon API key'
      },
      {
        key: 'trading212',
        label: 'Trading 212 API Key',
        description: 'For Trading 212 portfolio sync',
        docsUrl: 'https://t212public-api-docs.redoc.ly/',
        placeholder: 'Enter your Trading 212 API key'
      }
    ];

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">API Configuration</h3>
            {isDemoMode && (
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                <i className="fas fa-info-circle mr-1"></i>
                Demo Mode: Keys stored locally in browser only
              </p>
            )}
              </div>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {apiProviders.map((provider) => (
            <div key={provider.key} className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {provider.label}
                </label>
                <a
                  href={provider.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 text-sm flex items-center gap-1 transition-colors"
                >
                  <i className="fas fa-external-link-alt text-xs"></i>
                  View Docs
                </a>
              </div>
              
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="password"
                    value={apiKeys[provider.key as keyof typeof apiKeys]}
                    onChange={(e) => setApiKeys({ ...apiKeys, [provider.key]: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 pr-10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    placeholder={provider.placeholder}
                  />
                  {connectionStatus[provider.key] && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {connectionStatus[provider.key] === 'success' ? (
                        <i className="fas fa-check-circle text-green-500"></i>
                      ) : (
                        <i className="fas fa-times-circle text-red-500"></i>
                      )}
                    </div>
                  )}
              </div>
                
                <button
                  type="button"
                  onClick={() => testApiConnection(provider.key, apiKeys[provider.key as keyof typeof apiKeys])}
                  disabled={isTestingConnection === provider.key || !apiKeys[provider.key as keyof typeof apiKeys].trim()}
                  className="px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm"
                >
                  {isTestingConnection === provider.key ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    'Test'
                  )}
                </button>
        </div>

              <p className="text-xs text-gray-500">{provider.description}</p>
              
              {provider.key === 'trading212' && apiKeys.trading212 && (
                <button
                  type="button"
                  onClick={syncTrading212Data}
                  disabled={isTestingConnection === 'trading212-sync'}
                  className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                >
                  {isTestingConnection === 'trading212-sync' ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Syncing Portfolio...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sync-alt"></i>
                      Sync Trading 212 Portfolio
                    </>
                  )}
                </button>
              )}
            </div>
          ))}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" onClick={onClose} variant="ghost">
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white">
              {isDemoMode ? 'Save Keys Locally' : 'Save API Keys'}
            </Button>
          </div>
        </form>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
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
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-400 transition-all duration-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Total Asset Value</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-500 mt-1">
                  {formatCurrency(totalValue)}
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

          <div className={`bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 hover:border-${totalGainLoss >= 0 ? 'green' : 'red'}-400 dark:hover:border-${totalGainLoss >= 0 ? 'green' : 'red'}-400 transition-all duration-200 sm:col-span-2 lg:col-span-1`}>
            <div className="flex justify-between items-start">
          <div>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Total Gain/Loss</p>
                <p className={`text-2xl sm:text-3xl font-bold mt-1 ${totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {totalGainLoss >= 0 ? '+' : ''}{formatCurrency(totalGainLoss)}
            </p>
          </div>
              <div className={`p-2 sm:p-3 ${totalGainLoss >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'} rounded-lg`}>
                <i className={`fas fa-chart-line ${totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'} text-lg sm:text-xl`}></i>
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
              />
                ))
              ) : viewMode === "list" ? (
                filteredAssets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
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
      {(showAddModal || editingAsset) && (
        <Modal isOpen={showAddModal || !!editingAsset} onClose={handleCloseModal}>
          <AssetModal
            onClose={handleCloseModal}
            onSubmit={handleSubmit}
            initialData={editingAsset}
          />
        </Modal>
      )}

      {/* API Configuration Modal */}
      {showApiConfig && (
        <Modal isOpen={showApiConfig} onClose={() => setShowApiConfig(false)}>
          <ApiConfigModal onClose={() => setShowApiConfig(false)} />
        </Modal>
      )}
    </div>
  );
}