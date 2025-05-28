"use client";

import React, { useCallback, useMemo, useEffect, useState } from "react";
import { useUser } from "@/lib/user";
import { BaseModal as Modal } from "@/components/modals/modal";
import { Button } from "@/components/ui/button/button";
import type { Asset } from "@/types/global";
import { motion, AnimatePresence } from "framer-motion";
import LineChart from "@/components/charts/line";
import PieChart from "@/components/charts/pie";

// Memoized currency formatter for performance
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const formatCurrency = (cents: number) => {
  return currencyFormatter.format(cents / 100);
};

// Asset type configuration
const assetTypeConfig = {
  stock: { icon: "fa-chart-line", color: "blue", gradient: "from-blue-500 to-blue-600" },
  crypto: { icon: "fa-bitcoin", color: "orange", gradient: "from-orange-500 to-orange-600" },
  property: { icon: "fa-home", color: "green", gradient: "from-green-500 to-green-600" },
  cash: { icon: "fa-dollar-sign", color: "purple", gradient: "from-purple-500 to-purple-600" },
  stock_options: { icon: "fa-certificate", color: "pink", gradient: "from-pink-500 to-pink-600" },
  other: { icon: "fa-box", color: "gray", gradient: "from-gray-500 to-gray-600" },
};

export default function AssetManager() {
  const [error, setError] = useState<string | null>(null);
  const { data: user } = useUser();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [timeframe, setTimeframe] = useState("30");
  const [chartData, setChartData] = useState<{ date: string; total_value: number }[] | null>(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState<string>("all");

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const { apiCall } = await import('@/lib/mockApi');
      
      const response = await apiCall("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "READ", userId: "demo-user-id" }),
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
  }, []);

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
          userId: "demo-user-id",
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
  }, [timeframe]);

  useEffect(() => {
    fetchChartData();
  }, [timeframe, fetchChartData]);

  const handleEdit = useCallback((asset: Asset) => {
    setEditingAsset(asset);
    setShowAddModal(true);
  }, []);

  const handleDelete = useCallback(
    async (assetId: string) => {
      if (!user) return;
      if (!confirm("Are you sure you want to delete this asset?")) return;
      try {
        const { apiCall } = await import('@/lib/mockApi');
        
        const response = await apiCall("/api/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "DELETE",
            userId: user.id,
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
    [user, fetchAssets]
  );

  const handleOpenModal = useCallback(() => {
    setShowAddModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowAddModal(false);
    setEditingAsset(null);
  }, []);

  const handleSubmit = useCallback(
    async (assetData: Asset) => {
      if (!user) return;
      try {
        const { apiCall } = await import('@/lib/mockApi');
        
        const method = editingAsset ? "UPDATE" : "CREATE";
        const response = await apiCall("/api/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method,
            ...(user?.id && { userId: user.id }),
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
    [editingAsset, user, fetchAssets]
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
    property: [
      {
        name: "address",
        label: "Property Address",
        type: "textarea",
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
            current_value: initialData.current_value.toString(),
            purchase_price: initialData.purchase_price?.toString() || "",
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
      onSubmit({
        ...formData,
        quantity: parseFloat(formData.quantity),
        current_value: parseFloat(formData.current_value),
        purchase_price: parseFloat(formData.purchase_price),
        vesting_schedule: formData.vesting_schedule ?? undefined,
      });
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
          "The total current market value of this asset (Price × Quantity for stocks/crypto)",
        purchase_price: "The price you paid per unit when acquiring this asset",
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {initialData ? "Edit Asset" : "Add New Asset"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
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
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
              >
                {Object.keys(assetTypeFields).map((type) => (
                  <option key={type} value={type} className="bg-white dark:bg-gray-800">
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-6">
            {assetTypeFields[formData.type].map((field) => (
              <div key={field.name}>{renderField(field)}</div>
            ))}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Fetching market data...</span>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              onClick={onClose}
              variant="ghost"
              className="px-6 py-3 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium shadow-lg"
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
    
    const calculateAppreciation = () => {
      if (!asset.purchase_price) return null;
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
        className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <div className={`p-3 bg-gradient-to-r ${config.gradient} rounded-lg mr-4 shadow-lg`}>
              <i className={`fas ${config.icon} text-white text-xl`}></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{asset.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {asset.symbol || asset.type?.charAt(0).toUpperCase() + asset.type?.slice(1)}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(asset)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <i className="fas fa-edit"></i>
            </button>
            <button
              onClick={() => asset.id && onDelete(asset.id)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400 text-sm">Current Value</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(asset.current_value)}
            </span>
          </div>

          {asset.quantity && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Quantity</span>
              <span className="text-gray-900 dark:text-white">{asset.quantity}</span>
            </div>
          )}

          {appreciation && (
            <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Gain/Loss</span>
              <div className="text-right">
                <div className={`font-semibold ${appreciation.gain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {appreciation.gain >= 0 ? '+' : ''}{formatCurrency(appreciation.gain)}
                </div>
                <div className={`text-sm ${appreciation.gain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {appreciation.gain >= 0 ? '+' : ''}{appreciation.percentage.toFixed(2)}%
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
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
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Asset Manager
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Track and manage your investment portfolio</p>
            </div>
            <Button
              onClick={handleOpenModal}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium shadow-lg px-6 py-3"
            >
              <i className="fas fa-plus mr-2"></i>
              Add Asset
            </Button>
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
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-400 transition-all duration-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Total Portfolio Value</p>
                <p className="text-3xl font-bold text-green-500 mt-1">
                  {formatCurrency(totalValue)}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <i className="fas fa-wallet text-green-500 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-400 transition-all duration-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Total Assets</p>
                <p className="text-3xl font-bold text-blue-500 mt-1">
                  {assets.length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <i className="fas fa-chart-pie text-blue-500 text-xl"></i>
              </div>
            </div>
          </div>

          <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-${totalGainLoss >= 0 ? 'green' : 'red'}-400 dark:hover:border-${totalGainLoss >= 0 ? 'green' : 'red'}-400 transition-all duration-200`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Total Gain/Loss</p>
                <p className={`text-3xl font-bold mt-1 ${totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {totalGainLoss >= 0 ? '+' : ''}{formatCurrency(totalGainLoss)}
                </p>
              </div>
              <div className={`p-3 ${totalGainLoss >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'} rounded-lg`}>
                <i className={`fas fa-chart-line ${totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'} text-xl`}></i>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Charts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Portfolio Performance</h3>
              <div className="flex gap-2">
                {["7", "30", "90", "365", "max"].map((days) => (
                  <button
                    key={days}
                    onClick={() => setTimeframe(days)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
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
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <LineChart
                data={chartDataFormatted}
                xKey="date"
                lines={[{ dataKey: "value", color: "#3b82f6" }]}
              />
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Asset Distribution</h3>
            <PieChart
              data={Object.entries(assetsByType).map(([type, data]) => ({
                name: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
                value: data.value / 100,
                color: assetTypeConfig[type as keyof typeof assetTypeConfig]?.color || "#gray",
              }))}
            />
          </div>
        </motion.div>

        {/* Filter and View Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4"
        >
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
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
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  filterType === type
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')} ({assetsByType[type].count})
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === "grid"
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <i className="fas fa-th"></i>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === "list"
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <i className="fas fa-list"></i>
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
              className="text-center py-16"
            >
              <div className="text-gray-500 text-6xl mb-4">
                <i className="fas fa-wallet"></i>
              </div>
              <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400 mb-2">
                {filterType === "all" ? "No Assets Yet" : `No ${filterType} assets`}
              </h3>
              <p className="text-gray-500 dark:text-gray-500 mb-6">
                {filterType === "all" 
                  ? "Start building your portfolio by adding your first asset."
                  : "You don't have any assets of this type yet."}
              </p>
              <Button
                onClick={handleOpenModal}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium"
              >
                <i className="fas fa-plus mr-2"></i>
                Add Your First Asset
              </Button>
            </motion.div>
          ) : (
            <motion.div
              layout
              className={viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                : "space-y-4"
              }
            >
              {filteredAssets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal */}
      {(showAddModal || editingAsset) && (
        <Modal isOpen={true} onClose={handleCloseModal}>
          <AssetModal
            onClose={handleCloseModal}
            onSubmit={handleSubmit}
            initialData={editingAsset}
          />
        </Modal>
      )}
    </div>
  );
}