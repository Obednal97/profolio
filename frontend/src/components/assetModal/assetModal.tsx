'use client';

import React, { useState, useEffect } from 'react';
import { Asset } from '@/types/global';
import { Button } from '@/components/ui/button/button';

// Asset type fields configuration
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

interface AssetModalProps {
  asset: Asset | null;
  onSave: (asset: Asset) => void;
  onClose: () => void;
}

const AssetModal = ({ asset: initialData, onSave, onClose }: AssetModalProps) => {
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
    const assetData: Asset = {
      id: initialData?.id || '',
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
    onSave(assetData);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
    </div>
  );
};

export default AssetModal; 