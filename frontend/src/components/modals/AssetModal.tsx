"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Asset } from "@/types/global";
import { Button } from "@/components/ui/button";
import { EnhancedGlassCard } from "@/components/ui/enhanced-glass/EnhancedGlassCard";
import { FinancialCalculator } from "@/lib/financial";

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
  savings: [
    {
      name: "initialAmount",
      label: "Initial Deposit",
      type: "number",
      step: "0.01",
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
      name: "interestRate",
      label: "Interest Rate (%)",
      type: "number",
      step: "0.01",
      required: true,
    },
    {
      name: "interestType",
      label: "Interest Type",
      type: "select",
      required: true,
      options: [
        { value: "SIMPLE", label: "Simple Interest" },
        { value: "COMPOUND", label: "Compound Interest" },
      ],
    },
    {
      name: "paymentFrequency",
      label: "Payment Frequency",
      type: "select",
      required: true,
      options: [
        { value: "MONTHLY", label: "Monthly" },
        { value: "QUARTERLY", label: "Quarterly" },
        { value: "ANNUALLY", label: "Annually" },
      ],
    },
    {
      name: "termLength",
      label: "Term Length (months)",
      type: "number",
      step: "1",
    },
    {
      name: "maturityDate",
      label: "Maturity Date",
      type: "date",
    },
    { name: "purchase_date", label: "Opening Date", type: "date" },
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
  [key: string]:
    | string
    | number
    | { initial?: string; monthly?: string }
    | null
    | undefined;
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

  // Savings-specific fields
  initialAmount: string;
  interestRate: string;
  interestType: string;
  paymentFrequency: string;
  termLength: string;
  maturityDate: string;
};

interface AssetModalProps {
  asset: Asset | null;
  onSave: (asset: Asset) => void;
  onClose: () => void;
}

export function AssetModal({
  asset: initialData,
  onSave,
  onClose,
}: AssetModalProps) {
  // Optimize initial form data creation with useMemo to prevent recreating on every render
  const initialFormData = useMemo(
    () =>
      initialData
        ? {
            name: initialData.name || "",
            type: (initialData.type as AssetType) || "stock",
            quantity: initialData.quantity?.toString() || "",
            current_value: (initialData.current_value || 0).toString(),
            purchase_price: initialData.purchase_price
              ? initialData.purchase_price.toString()
              : "",
            purchase_date: initialData.purchase_date || "",
            symbol: initialData.symbol || "",
            notes: initialData.notes || "",
            vesting_schedule: initialData.vesting_schedule || null,
            vesting_start_date: initialData.vesting_start_date || "",
            vesting_end_date: initialData.vesting_end_date || "",
            initialAmount: initialData.initialAmount
              ? initialData.initialAmount.toString()
              : "",
            interestRate: initialData.interestRate?.toString() || "",
            interestType: initialData.interestType || "",
            paymentFrequency: initialData.paymentFrequency || "",
            termLength: initialData.termLength?.toString() || "",
            maturityDate: initialData.maturityDate || "",
          }
        : {
            name: "",
            type: "stock" as AssetType,
            quantity: "",
            current_value: "",
            purchase_price: "",
            purchase_date: "",
            symbol: "",
            notes: "",
            vesting_schedule: null,
            vesting_start_date: "",
            vesting_end_date: "",
            initialAmount: "",
            interestRate: "",
            interestType: "",
            paymentFrequency: "",
            termLength: "",
            maturityDate: "",
          },
    [initialData]
  );

  const [formData, setFormData] = useState<AssetFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [priceSource, setPriceSource] = useState<"manual" | "live" | "error">(
    "manual"
  );

  // Use ref to track current abort controller and prevent stale closures
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function to cancel ongoing requests
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
  }, []);

  // Optimized symbol data fetch with proper cleanup
  const fetchSymbolData = useCallback(
    async (symbol: string, type: string, quantity: string) => {
      if (!symbol || !["stock", "crypto"].includes(type)) {
        return;
      }

      // Only fetch if this is a new symbol being typed by the user, not form initialization
      if (initialData?.symbol === symbol) {
        return; // Skip search for existing symbols during form load
      }

      // Cancel any ongoing request
      cleanup();

      // Create new AbortController for this request
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setPriceSource("manual");

      try {
        // Check for demo mode
        const isDemoMode =
          typeof window !== "undefined" &&
          localStorage.getItem("demo-mode") === "true";

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        // Add demo mode header if in demo mode
        if (isDemoMode) {
          headers["x-demo-mode"] = "true";
        }

        // First try to get cached price data (no live search)
        const cachedResponse = await fetch(
          `/api/market-data/cached-price/${encodeURIComponent(symbol)}`,
          {
            headers,
            signal: controller.signal,
          }
        );

        if (cachedResponse.ok) {
          const cachedData = await cachedResponse.json();
          if (cachedData.price && !controller.signal.aborted) {
            const qty = parseFloat(quantity) || 1;
            const totalValue = cachedData.price * qty;

            setFormData((prev) => ({
              ...prev,
              current_value: totalValue.toFixed(2),
            }));

            setPriceSource("live");
            setLoading(false);
            return;
          }
        }

        // Only if no cached data AND user is actively searching (not form initialization)
        // trigger a search which will queue the symbol for processing
        const response = await fetch(
          `/api/integrations/product-search/search?q=${encodeURIComponent(
            symbol
          )}`,
          {
            headers,
            signal: controller.signal,
          }
        );

        if (controller.signal.aborted) return;

        const data = await response.json();

        if (data.status === "OK" && data.data.length > 0) {
          const price = parseFloat(
            data.data[0].offer.price.replace(/[^0-9.]/g, "")
          );

          if (price > 0 && !controller.signal.aborted) {
            const qty = parseFloat(quantity) || 1;
            const totalValue = price * qty;

            setFormData((prev) => ({
              ...prev,
              current_value: totalValue.toFixed(2),
            }));

            setPriceSource("live");
          } else {
            setPriceSource("error");
          }
        } else if (data.fallback) {
          // Service is temporarily unavailable, but don't clear existing value
          setPriceSource("error");
        } else {
          setPriceSource("error");
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          // Request was aborted, this is expected
          return;
        }
        console.error("Error fetching symbol data:", error);
        setPriceSource("error");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [initialData?.symbol, cleanup]
  );

  // Effect for symbol data fetching with proper debouncing and cleanup
  useEffect(() => {
    // Cleanup previous timeout and request
    cleanup();

    // Debounce the API call to avoid too many requests
    debounceTimeoutRef.current = setTimeout(() => {
      fetchSymbolData(formData.symbol, formData.type, formData.quantity);
    }, 1000); // 1 second debounce

    return cleanup;
  }, [
    formData.symbol,
    formData.type,
    formData.quantity,
    fetchSymbolData,
    cleanup,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Cancel any ongoing API requests
      cleanup();

      // Validate all monetary inputs
      const currentValueValidation = FinancialCalculator.validateMonetaryInput(
        formData.current_value
      );
      const purchasePriceValidation = FinancialCalculator.validateMonetaryInput(
        formData.purchase_price
      );
      const initialAmountValidation = formData.initialAmount
        ? FinancialCalculator.validateMonetaryInput(formData.initialAmount)
        : { isValid: true };

      if (!currentValueValidation.isValid) {
        alert(`Current Value: ${currentValueValidation.error}`);
        return;
      }

      if (formData.purchase_price && !purchasePriceValidation.isValid) {
        alert(`Purchase Price: ${purchasePriceValidation.error}`);
        return;
      }

      if (formData.initialAmount && !initialAmountValidation.isValid) {
        alert(`Initial Amount: ${initialAmountValidation.error}`);
        return;
      }

      const assetData: Asset = {
        id: initialData?.id || "",
        ...formData,
        quantity: parseFloat(formData.quantity) || 0,
        current_value: parseFloat(currentValueValidation.sanitized || "0"),
        purchase_price: formData.purchase_price
          ? parseFloat(purchasePriceValidation.sanitized || "0")
          : undefined,
        vesting_schedule:
          formData.vesting_schedule &&
          typeof formData.vesting_schedule === "object" &&
          formData.vesting_schedule.initial &&
          formData.vesting_schedule.monthly
            ? {
                initial: formData.vesting_schedule.initial,
                monthly: formData.vesting_schedule.monthly,
              }
            : undefined,
        // Savings fields with proper conversion and validation
        initialAmount: formData.initialAmount
          ? parseFloat(initialAmountValidation.sanitized || "0")
          : undefined,
        interestRate: formData.interestRate
          ? parseFloat(formData.interestRate)
          : undefined,
        interestType: formData.interestType
          ? (formData.interestType as "SIMPLE" | "COMPOUND")
          : undefined,
        paymentFrequency: formData.paymentFrequency
          ? (formData.paymentFrequency as "MONTHLY" | "QUARTERLY" | "ANNUALLY")
          : undefined,
        termLength: formData.termLength
          ? parseInt(formData.termLength)
          : undefined,
        maturityDate: formData.maturityDate || undefined,
      };
      onSave(assetData);
    },
    [formData, initialData?.id, onSave, cleanup]
  );

  interface Field {
    name: string;
    label: string;
    type: string;
    placeholder?: string;
    required?: boolean;
    step?: string;
  }

  // Memoize renderField to prevent recreation on every render
  const renderField = useCallback(
    (field: Field) => {
      const commonClasses =
        "w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200";

      const tooltips: Partial<Record<keyof AssetFormData, string>> = {
        current_value:
          "Total current market value of ALL your shares (e.g., if you own 5 shares at $200 each, enter 1000)",
        purchase_price:
          "Price you paid PER SHARE when you bought it (e.g., 150 for $150 per share)",
        quantity:
          "Number of shares/units you own (e.g., 5 shares of Apple stock)",
        symbol:
          "The trading symbol (e.g., AAPL for Apple stock, BTC for Bitcoin)",
        vesting_schedule:
          'JSON format describing vesting terms (e.g., {"initial": "25", "monthly": "2.083"} for 25% initial vest with 2.083% monthly)',
        purchase_date:
          "The date when you bought this asset (used for calculating annualized returns)",
        vesting_start_date: "Start date of stock option vesting",
        vesting_end_date: "End date of stock option vesting",
        notes: "Additional notes or comments about the asset",
        name: "Descriptive name for this investment (e.g., 'Apple Stock', 'Bitcoin Holdings')",
        type: "The category of the asset (stock, crypto, property, etc.)",
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

            {/* Show price source indicator for current_value field */}
            {field.name === "current_value" &&
              formData.symbol &&
              ["stock", "crypto"].includes(formData.type) && (
                <div className="flex items-center gap-1 text-xs">
                  {loading ? (
                    <span className="flex items-center gap-1 text-blue-500">
                      <i className="fas fa-spinner fa-spin text-xs"></i>
                      Fetching...
                    </span>
                  ) : priceSource === "live" ? (
                    <span className="flex items-center gap-1 text-green-500">
                      <i className="fas fa-check-circle text-xs"></i>
                      Live Price
                    </span>
                  ) : priceSource === "error" ? (
                    <span className="flex items-center gap-1 text-yellow-500">
                      <i className="fas fa-exclamation-triangle text-xs"></i>
                      Manual Entry
                    </span>
                  ) : null}
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
            <div className="relative">
              <input
                type={field.type}
                value={(formData[field.name] as string) || ""}
                onChange={(e) => {
                  setFormData({ ...formData, [field.name]: e.target.value });
                  // Reset price source to manual when user manually edits current_value
                  if (field.name === "current_value") {
                    setPriceSource("manual");
                  }
                }}
                className={`${commonClasses} ${
                  field.name === "current_value" && priceSource === "live"
                    ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-600"
                    : ""
                }`}
                placeholder={
                  field.name === "current_value" &&
                  formData.symbol &&
                  ["stock", "crypto"].includes(formData.type)
                    ? loading
                      ? "Fetching live price..."
                      : priceSource === "live"
                      ? "Auto-updated from live price"
                      : priceSource === "error"
                      ? "Enter current value manually"
                      : field.placeholder
                    : field.placeholder
                }
                required={field.required}
                step={field.step}
              />

              {/* Show loading spinner in the input for current_value */}
              {field.name === "current_value" && loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <i className="fas fa-spinner fa-spin text-blue-500"></i>
                </div>
              )}
            </div>
          )}
        </div>
      );
    },
    [formData, loading, priceSource]
  );

  return (
    <EnhancedGlassCard
      variant="prominent"
      padding="lg"
      hoverable={false}
      enableLensing={false}
      animate={false}
      className="w-full max-w-4xl relative z-50">
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
              className="w-full bg-white/10 dark:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white/20 dark:focus:bg-black/30 transition-all duration-200 touch-manipulation"
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
              className="w-full bg-white/10 dark:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white/20 dark:focus:bg-black/30 transition-all duration-200 touch-manipulation"
            >
              {Object.keys(assetTypeFields).map((type) => (
                <option
                  key={type}
                  value={type}
                  className="bg-white dark:bg-gray-800"
                >
                  {type.charAt(0).toUpperCase() +
                    type.slice(1).replace("_", " ")}
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
            <span className="ml-2 text-gray-600 dark:text-gray-400 text-sm">
              Fetching live price for {formData.symbol?.toUpperCase()}...
            </span>
          </div>
        )}

        {priceSource === "live" && !loading && (
          <div className="flex items-center justify-center py-2">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <i className="fas fa-check-circle text-green-500"></i>
              <span className="text-green-700 dark:text-green-300 text-sm">
                Current value updated with live market price
              </span>
            </div>
          </div>
        )}

        {priceSource === "error" &&
          !loading &&
          formData.symbol &&
          ["stock", "crypto"].includes(formData.type) && (
            <div className="flex items-center justify-center py-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <i className="fas fa-exclamation-triangle text-yellow-500"></i>
                <span className="text-yellow-700 dark:text-yellow-300 text-sm">
                  Live price unavailable for {formData.symbol?.toUpperCase()} -
                  please enter manually
                </span>
              </div>
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
    </EnhancedGlassCard>
  );
}
