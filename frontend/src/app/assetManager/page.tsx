"use client";

import React, { useCallback, useMemo, useEffect, useState } from "react";
import { useUser } from "@/lib/user";
import { HeaderLayout } from "@/components/layout/headerLayout";
import { FooterLayout } from "@/components/layout/footerLayout";
import { BaseModal as Modal } from "@/components/modals/modal";
import { Button } from "@/components/ui/button/button";
import type { Asset } from "@/types/global";

// Memoized currency formatter for performance
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const formatCurrency = (cents: number) => {
  return currencyFormatter.format(cents / 100);
};

function AssetManager() {
  const [error, setError] = useState<string | null>(null);
  const { data: user } = useUser();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [timeframe, setTimeframe] = useState("30");
  const [chartData, setChartData] = useState<{ date: string; total_value: number }[] | null>(null);
  const [chartLoading, setChartLoading] = useState(true);

  const fetchAssets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "READ", userId: user.id }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch assets");
      }
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setAssets(data.assets || []);
    } catch (err) {
      console.error("Asset fetch error:", err);
      setError("Failed to load assets");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchAssets();
    }
  }, [user, fetchAssets]);

  const fetchChartData = useCallback(async () => {
    if (!user) return;
    setChartLoading(true);
    try {
      const response = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "GET_HISTORY",
          userId: user.id,
          days: timeframe === "max" ? null : parseInt(timeframe),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch asset history");
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setChartData(data.history || []);
    } catch (err) {
      console.error("Chart data fetch error:", err);
      setError("Failed to load chart data");
    } finally {
      setChartLoading(false);
    }
  }, [user, timeframe]);

  useEffect(() => {
    if (user) {
      fetchChartData();
    }
  }, [user, timeframe, fetchChartData]);

  const handleEdit = useCallback(
    (asset: Asset) => {
      setEditingAsset(asset);
      setShowAddModal(true);
    },
    []
  );

  const handleDelete = useCallback(
    async (assetId: string) => {
      if (!user) return;
      if (!confirm("Are you sure you want to delete this asset?")) return;
      try {
        const response = await fetch("/api/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "DELETE",
            userId: user.id,
            id: assetId,
          }),
        });
        if (!response.ok) {
          throw new Error("Failed to delete asset");
        }
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
        const method = editingAsset ? "UPDATE" : "CREATE";
        const response = await fetch("/api/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method,
            ...(user?.id && { userId: user.id }),
            ...assetData,
            id: editingAsset?.id,
          }),
        });
        if (!response.ok) {
          throw new Error("Failed to save asset");
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
    [editingAsset, user, fetchAssets]
  );

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

    interface SymbolData {
      offer: { price: string };
      typical_price_range?: [string, string];
    }
    const [symbolData, setSymbolData] = useState<SymbolData | null>(null);
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
            setSymbolData(data.data[0]);
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
        "w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-green-500/50";

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
          <div className="flex items-center gap-2 mb-1">
            <label className="block text-sm font-medium text-gray-500 dark:text-white/60">
              {field.label}
            </label>
            {tooltips[field.name] && (
              <div className="group relative">
                <i className="fas fa-info-circle text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/60 cursor-help"></i>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 dark:bg-white/10 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 backdrop-blur-xl z-50">
                  {tooltips[field.name]}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-white/10"></div>
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
              onChange={(e) => {
                let value = e.target.value;
                if (field.name === "vesting_schedule") {
                  try {
                    value = JSON.parse(value);
                  } catch (error) {
                    console.error("Error parsing vesting_schedule JSON:", error);
                  }
                }
                setFormData({ ...formData, [field.name]: value });
              }}
              placeholder={field.placeholder}
              className={commonClasses}
              rows={3}
              required={field.required}
            />
          ) : (
            <input
              type={field.type}
              value={
                formData[field.name] !== null &&
                (typeof formData[field.name] === "string" || typeof formData[field.name] === "number")
                  ? (formData[field.name] as string | number)
                  : ""
              }
              onChange={(e) => {
                let value = e.target.value;
                if (field.name === "symbol") {
                  value = value.toUpperCase();
                }
                setFormData({ ...formData, [field.name]: value });
              }}
              step={field.step}
              placeholder={field.placeholder}
              className={commonClasses}
              required={field.required}
            />
          )}
          {(field.name === "current_value" || field.name === "symbol") &&
            loading && (
              <div className="absolute right-3 top-2">
                <div className="animate-spin h-6 w-6 border-2 border-green-500 border-t-transparent rounded-full"></div>
              </div>
            )}
        </div>
      );
    };

    return (
      <div className="bg-[#2a2a2a] rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white/80">
            {initialData ? "Edit Asset" : "Add New Asset"}
          </h3>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white/80 transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-1">
                <label className="block text-sm font-medium text-gray-500 dark:text-white/60">
                  Asset Name
                </label>
                <div className="group relative">
                  <i className="fas fa-info-circle text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/60 cursor-help"></i>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 dark:bg-white/10 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 backdrop-blur-xl z-50">
                    A descriptive name for your asset (e.g., &quot;Apple Stock&quot;, &quot;Bitcoin Investment&quot;, &quot;Rental Property&quot;)
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-white/10"></div>
                  </div>
                </div>
              </div>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-green-500/50"
                required
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-1">
                <label className="block text-sm font-medium text-gray-500 dark:text-white/60">
                  Type
                </label>
                <div className="group relative">
                  <i className="fas fa-info-circle text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/60 cursor-help"></i>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 dark:bg-white/10 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 backdrop-blur-xl z-50">
                    Select the type of asset you&apos;re adding. Different types
                    have different required information.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-white/10"></div>
                  </div>
                </div>
              </div>
              <select
                value={formData.type}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    type: e.target.value as AssetType,
                    symbol: "",
                    quantity: "",
                    vesting_schedule: null,
                    vesting_start_date: "",
                    vesting_end_date: "",
                  });
                  setSymbolData(null);
                }}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-green-500/50"
              >
                <option value="stock">Stock</option>
                <option value="crypto">Cryptocurrency</option>
                <option value="stock_options">Stock Options</option>
                <option value="property">Property</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
            </div>

            {assetTypeFields[formData.type].map((field) => (
              <div
                key={field.name}
                className={
                  field.name === "address" ||
                  field.name === "vesting_schedule"
                    ? "md:col-span-2"
                    : ""
                }
              >
                <label className="block text-sm font-medium text-gray-500 dark:text-white/60 mb-1">
                  {field.label}
                </label>
                <div className="relative">
                  {renderField(field)}
                  {(field.name === "current_value" ||
                    field.name === "symbol") &&
                    loading && (
                      <div className="absolute right-3 top-2">
                        <div className="animate-spin h-6 w-6 border-2 border-green-500 border-t-transparent rounded-full"></div>
                      </div>
                    )}
                </div>
              </div>
            ))}

            {formData.type !== "cash" && (
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-1">
                  <label className="block text-sm font-medium text-gray-500 dark:text-white/60">
                    Notes
                  </label>
                  <div className="group relative">
                    <i className="fas fa-info-circle text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/60 cursor-help"></i>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 dark:bg-white/10 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 backdrop-blur-xl z-50">
                      Additional information or comments about this asset
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-white/10"></div>
                    </div>
                  </div>
                </div>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-green-500/50"
                  rows={3}
                />
              </div>
            )}
          </div>

          {symbolData && ["stock", "crypto"].includes(formData.type) && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <h4 className="text-sm font-medium text-green-400 mb-2">
                Live Market Data
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-white/60">
                    Current Price
                  </p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {symbolData.offer.price}
                  </p>
                </div>
                {symbolData.typical_price_range && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-white/60">
                      Price Range
                    </p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {symbolData.typical_price_range[0]} -{" "}
                      {symbolData.typical_price_range[1]}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-white/60 hover:text-white/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-black rounded-xl font-medium hover:bg-green-400 shadow-[0_0_8px_#00ff88] hover:shadow-[0_0_12px_#00ff88] transition-all duration-200"
            >
              {initialData ? "Update Asset" : "Add Asset"}
            </button>
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
    const calculateAppreciation = () => {
      if (!asset.purchase_price || !asset.current_value) return null;
      const diff = asset.current_value - asset.purchase_price;
      const percentage = (diff / asset.purchase_price) * 100;
      return {
        value: diff,
        percentage: percentage.toFixed(2),
      };
    };

    const appreciation = calculateAppreciation();

    return (
      <div className="bg-[#2a2a2a] rounded-xl p-6 border border-white/10 hover:border-green-500/50 transition-all duration-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-white/80">
              {asset.name}
            </h3>
            <p className="text-white/60">
              <i
                className={`fas ${
                  asset.type === "stock"
                    ? "fa-chart-line"
                    : asset.type === "crypto"
                    ? "fa-coins"
                    : asset.type === "stock_options"
                    ? "fa-certificate"
                    : asset.type === "property"
                    ? "fa-home"
                    : asset.type === "cash"
                    ? "fa-dollar-sign"
                    : "fa-cube"
                } mr-2`}
              ></i>
              <span className="capitalize">{asset.type.replace("_", " ")}</span>
              {asset.symbol && ` • ${asset.symbol}`}
              {asset.quantity && ` • ${asset.quantity} units`}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(asset)}
              className="p-2 text-white/60 hover:text-white/80 transition-colors"
              title="Edit"
            >
              <i className="fas fa-edit"></i>
            </button>
            <button
              onClick={() => asset.id && onDelete(asset.id)}
              className="p-2 text-white/60 hover:text-red-400 transition-colors"
              title="Delete"
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-white/60 text-sm">Current Value</p>
            <p className="text-green-400 font-semibold">
              {formatCurrency(asset.current_value)}
            </p>
          </div>

          {asset.purchase_price && (
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-white/60 text-sm">Purchase Price</p>
              <p className="text-white/80 font-semibold">
                {formatCurrency(asset.purchase_price)}
              </p>
            </div>
          )}

          {appreciation && (
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-white/60 text-sm">Appreciation</p>
              <p
                className={`font-semibold ${
                  appreciation.value >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {formatCurrency(appreciation.value)}
                <span className="text-sm ml-1">
                  ({appreciation.percentage}%)
                </span>
              </p>
            </div>
          )}

          {asset.purchase_date && (
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-white/60 text-sm">Purchase Date</p>
              <p className="text-white/80 font-semibold">
                {new Date(asset.purchase_date).toLocaleDateString()}
              </p>
            </div>
          )}

          {asset.type === "stock_options" && (
            <>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-white/60 text-sm">Vesting Period</p>
                <p className="text-white/80 font-semibold">
                  {asset.vesting_start_date
                    ? new Date(asset.vesting_start_date).toLocaleDateString()
                    : ""}
                  {" - "}
                  {asset.vesting_end_date
                    ? new Date(asset.vesting_end_date).toLocaleDateString()
                    : ""}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-white/60 text-sm">Vesting Schedule</p>
                <p className="text-white/80 font-semibold">
                  {asset.vesting_schedule && (
                    <>
                      Initial: {asset.vesting_schedule.initial}%
                      {asset.vesting_schedule.monthly && (
                        <>
                          , Monthly: {asset.vesting_schedule.monthly}%
                        </>
                      )}
                    </>
                  )}
                </p>
              </div>
            </>
          )}
        </div>

        {asset.notes && (
          <p className="mt-4 text-white/60 text-sm">{asset.notes}</p>
        )}

        {asset.price_history && asset.price_history.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-sm font-medium text-white/60 mb-2">
              Price History
            </p>
            <div className="h-24 w-full"></div>
          </div>
        )}
      </div>
    );
  };

  const AssetSummaryChart = () => {
    const chartCurrencyFormatter = useMemo(
      () =>
        new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }),
      []
    );

    if (!chartData || chartData.length === 0) return null;

    const data = chartData.map((point) => ({
      date: new Date(point.date),
      value: point.total_value / 100,
    }));

    const minValue = Math.min(...data.map((d) => d.value));
    const maxValue = Math.max(...data.map((d) => d.value));
    // const valueRange = maxValue - minValue;
    // const padding = valueRange * 0.1;

    const chartHeight = 300;
    const chartWidth = 100;

    const points = data
      .map((point, i) => {
        const x = (i / (data.length - 1)) * chartWidth;
        const y =
          ((maxValue - point.value) / (maxValue - minValue)) * chartHeight;
        return `${x},${y}`;
      })
      .join(" ");

    const fillPoints = `0,${chartHeight} ${points} ${chartWidth},${chartHeight}`;

    return (
      <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-gray-200 dark:border-white/10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white/80">
              Net Asset Value
            </h2>
            <p className="text-3xl font-bold text-green-400">
              {chartCurrencyFormatter.format(data[data.length - 1].value)}
            </p>
          </div>
          <div className="flex gap-2">
            {["7", "30", "365", "max"].map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                  timeframe === period
                    ? "bg-green-500 text-black shadow-[0_0_8px_#00ff88]"
                    : "text-gray-500 dark:text-white/60 hover:text-gray-700 dark:hover:text-white/80"
                }`}
              >
                {period === "max" ? "Max" : `${period}D`}
              </button>
            ))}
          </div>
        </div>

        {chartLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="relative h-[300px] w-full">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full"
            >
              <defs>
                <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="rgb(34,197,94)"
                    stopOpacity="0.2"
                  />
                  <stop
                    offset="100%"
                    stopColor="rgb(34,197,94)"
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>

              <path
                d={`M ${fillPoints}`}
                fill="url(#gradient)"
                className="transition-all duration-300"
              />

              <polyline
                points={points}
                fill="none"
                stroke="rgb(34,197,94)"
                strokeWidth="0.5"
                className="transition-all duration-300"
              />
            </svg>

            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 dark:text-white/60 mt-2">
              <span>{data[0].date.toLocaleDateString()}</span>
              <span>{data[data.length - 1].date.toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!user) {
    return (
      <HeaderLayout>
        <FooterLayout>
          <div className="min-h-screen bg-[#1a1a1a] text-white">
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">
                  Welcome to Asset Management
                </h2>
                <p className="text-white/60 max-w-md mx-auto">
                  Track and manage your investments in one place.
                </p>
                <a
                  href="/account/signin"
                  className="inline-block px-6 py-3 bg-green-500 text-black rounded-xl font-medium hover:bg-green-400 shadow-[0_0_8px_#00ff88] hover:shadow-[0_0_12px_#00ff88] transition-all duration-200"
                >
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  Sign In to Manage Assets
                </a>
              </div>
            </div>
          </div>
        </FooterLayout>
      </HeaderLayout>
    );
  }

  if (loading) {
    return (
      <HeaderLayout>
        <FooterLayout>
          <div className="min-h-screen bg-[#1a1a1a] text-white">
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
              <div className="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full shadow-[0_0_8px_#00ff88]"></div>
            </div>
          </div>
        </FooterLayout>
      </HeaderLayout>
    );
  }

  return (
    <HeaderLayout>
      <FooterLayout>
        <div className="min-h-screen bg-[#1a1a1a] text-white">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-semibold bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">
                  Asset Management
                </h1>
                <p className="text-white/60 mt-2">
                  Track and manage your investments
                </p>
              </div>
              <Button onClick={handleOpenModal} icon="fa-plus" variant="default">
                Add Asset
              </Button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                <p className="text-red-400 flex items-center">
                  <i className="fas fa-exclamation-circle mr-2"></i>
                  {error}
                </p>
              </div>
            )}

            <AssetSummaryChart />

            <div className="grid gap-6">
              {assets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}

              {assets.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-white/40 text-6xl mb-4">
                    <i className="fas fa-coins"></i>
                  </div>
                  <h3 className="text-xl font-medium text-white/80 mb-2">
                    No Assets Yet
                  </h3>
                  <p className="text-white/60">
                    Start building your portfolio by adding your first asset.
                  </p>
                </div>
              )}
            </div>
          </div>

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
      </FooterLayout>
    </HeaderLayout>
  );
}

export default AssetManager;