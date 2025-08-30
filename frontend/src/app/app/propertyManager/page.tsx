"use client";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import type { Property } from "@/types/global";
import { useAppContext } from "@/components/layout/layoutWrapper";
import { Button, Tabs } from "@/components/ui/button";
import { ViewSwitcher } from "@/components/ui/ViewSwitcher";
import { StatCard } from "@/components/cards/StatCard";
import { motion, AnimatePresence } from "framer-motion";
import PieChart from "@/components/charts/pie";
import { PropertyModal } from "@/components/modals/PropertyModal";
import { useStableUserId, useStableAuthToken } from "@/hooks/useStableUser";
import { PropertyManagerSkeleton } from "@/components/ui/skeleton";
import { EnhancedGlassCard } from "@/components/ui/enhanced-glass/EnhancedGlassCard";

const propertyTypeConfig = {
  residential: {
    icon: "fa-home",
    color: "#3b82f6",
    gradient: "from-blue-500 to-blue-600",
  },
  commercial: {
    icon: "fa-building",
    color: "#10b981",
    gradient: "from-green-500 to-green-600",
  },
  industrial: {
    icon: "fa-industry",
    color: "#f59e0b",
    gradient: "from-orange-500 to-orange-600",
  },
  land: {
    icon: "fa-mountain",
    color: "#8b5cf6",
    gradient: "from-purple-500 to-purple-600",
  },
};

const statusConfig = {
  owned: { icon: "fa-key", color: "#3b82f6" },
  rented: { icon: "fa-handshake", color: "#10b981" },
  listed: { icon: "fa-tag", color: "#f59e0b" },
};

export default function PropertyManager() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<
    "value_desc" | "value_asc" | "rental_desc" | "rental_asc"
  >("value_desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [openCategoryDropdown, setOpenCategoryDropdown] = useState<string | null>(null);
  const { formatCurrency } = useAppContext();

  // 🚀 PERFORMANCE: Use stable user hooks to prevent unnecessary re-renders
  const userId = useStableUserId();
  const authToken = useStableAuthToken();

  // Use ref to track abort controller for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup function for abort controller
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const fetchProperties = useCallback(async () => {
    if (!userId) return;

    // Cancel any ongoing request
    cleanup();

    // Create new AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    try {
      // 🚀 FIX: Convert from legacy POST+method format to proper REST API calls
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Add authentication header
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch("/api/properties", {
        method: "GET", // ✅ Changed from POST to GET
        headers,
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      if (!controller.signal.aborted) {
        setProperties(data.properties || []);
        setError(null); // Clear any previous errors
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // Request was aborted, this is expected
        return;
      }
      console.error("Property fetch error:", err);
      if (!controller.signal.aborted) {
        setError("Failed to load properties");
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [userId, cleanup, authToken]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Handle closing dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openCategoryDropdown && event.target instanceof Element) {
        const closestDropdown = event.target.closest("[data-dropdown]");
        if (!closestDropdown) {
          setOpenCategoryDropdown(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openCategoryDropdown]);

  const handleSubmit = async (propertyData: Property) => {
    if (!userId) return;

    try {
      // 🚀 FIX: Convert to proper REST API calls
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Add authentication header
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      if (editingProperty) {
        // UPDATE: Use PATCH with ID in URL
        const response = await fetch(`/api/properties/${editingProperty.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(propertyData),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.error) throw new Error(data.error);
      } else {
        // CREATE: Use POST without method parameter
        const response = await fetch("/api/properties", {
          method: "POST",
          headers,
          body: JSON.stringify(propertyData),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.error) throw new Error(data.error);
      }

      setShowModal(false);
      setEditingProperty(null);
      fetchProperties();
    } catch (err) {
      console.error("Property save error:", err);
      setModalError("Failed to save property");
    }
  };

  const handleDelete = async (propertyId: string) => {
    if (!userId) return;
    if (!confirm("Are you sure you want to delete this property?")) return;

    try {
      // 🚀 FIX: Convert to proper REST API calls
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Add authentication header
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      // DELETE: Use DELETE with ID in URL
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      fetchProperties();
    } catch (err) {
      console.error("Property deletion error:", err);
      setError("Failed to delete property");
    }
  };

  const handleEdit = useCallback((property: Property) => {
    setEditingProperty(property);
    setShowModal(true);
  }, []);

  const handleOpenModal = useCallback(() => {
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingProperty(null);
    setModalError(null);
  }, []);

  // Calculate metrics
  const totalValue = useMemo(() => {
    return properties.reduce(
      (sum, property) => sum + (property.currentValue ?? 0),
      0
    );
  }, [properties]);

  const totalRentalIncome = useMemo(() => {
    return properties.reduce(
      (sum, property) => sum + (property.rentalIncome ?? 0),
      0
    );
  }, [properties]);

  const totalMortgage = useMemo(() => {
    return properties.reduce(
      (sum, property) => sum + (property.mortgageAmount ?? 0),
      0
    );
  }, [properties]);

  const propertiesByType = useMemo(() => {
    return properties.reduce((acc, property) => {
      const type = property.propertyType ?? "residential";
      if (!acc[type]) acc[type] = { count: 0, value: 0 };
      acc[type].count++;
      acc[type].value += property.currentValue ?? 0;
      return acc;
    }, {} as Record<string, { count: number; value: number }>);
  }, [properties]);

  const filteredProperties = useMemo(() => {
    let filtered = [...properties];
    
    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((p) => p.propertyType === filterType);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((property) => 
        property.name.toLowerCase().includes(query) ||
        property.address?.toLowerCase().includes(query) ||
        property.propertyType?.toLowerCase().includes(query) ||
        property.city?.toLowerCase().includes(query)
      );
    }

    // Sort properties
    return filtered.sort((a, b) => {
      switch (sortOrder) {
        case "value_desc":
          return (b.currentValue ?? 0) - (a.currentValue ?? 0);
        case "value_asc":
          return (a.currentValue ?? 0) - (b.currentValue ?? 0);
        case "rental_desc":
          return (b.rentalIncome ?? 0) - (a.rentalIncome ?? 0);
        case "rental_asc":
          return (a.rentalIncome ?? 0) - (b.rentalIncome ?? 0);
        default:
          return 0;
      }
    });
  }, [properties, filterType, sortOrder, searchQuery]);

  const PropertyCard = ({
    property,
    onEdit,
    onDelete,
  }: {
    property: Property;
    onEdit: (property: Property) => void;
    onDelete: (id: string) => void;
  }) => {
    const typeConfig =
      propertyTypeConfig[
        property.propertyType as keyof typeof propertyTypeConfig
      ] || propertyTypeConfig.residential;
    const statusIcon =
      statusConfig[property.status as keyof typeof statusConfig] ||
      statusConfig.owned;

    const appreciation = property.purchasePrice
      ? (((property.currentValue ?? 0) - property.purchasePrice) /
          property.purchasePrice) *
        100
      : 0;

    const monthlyROI =
      property.rentalIncome && property.currentValue
        ? ((property.rentalIncome * 12) / property.currentValue) * 100
        : 0;

    const totalMonthlyCosts =
      (property.monthlyPayment ?? 0) +
      (property.propertyTaxes ?? 0) +
      (property.insurance ?? 0) +
      (property.maintenanceCosts ?? 0) +
      (property.hoa ?? 0);

    const netCashFlow = (property.rentalIncome ?? 0) - totalMonthlyCosts;

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
          <div className="flex items-start flex-1 min-w-0">
            <div
              className={`p-2 sm:p-3 bg-gradient-to-r ${typeConfig.gradient} rounded-lg mr-3 sm:mr-4 shadow-lg flex-shrink-0`}
            >
              <i
                className={`fas ${typeConfig.icon} text-white text-lg sm:text-xl`}
              ></i>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
                {property.address}
              </h3>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <span className="text-gray-600 dark:text-gray-400 capitalize">
                  {property.propertyType}
                </span>
                <span
                  className={`flex items-center ${
                    statusIcon.color === "#3b82f6"
                      ? "text-blue-500"
                      : statusIcon.color === "#10b981"
                      ? "text-green-500"
                      : "text-orange-500"
                  }`}
                >
                  <i className={`fas ${statusIcon.icon} mr-1`}></i>
                  {property.status}
                </span>
                {property.ownershipType && (
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-700 dark:text-gray-300 capitalize">
                    {property.ownershipType}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex space-x-1 sm:space-x-2 flex-shrink-0 ml-2">
            <Button
              onClick={() => onEdit(property)}
              variant="ghost"
              size="sm"
              icon="fa-edit"
              className="text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
              aria-label="Edit property"
            />
            <Button
              onClick={() => property.id && onDelete(property.id)}
              variant="ghost"
              size="sm"
              icon="fa-trash"
              className="text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
              aria-label="Delete property"
            />
          </div>
        </div>

        {/* Property Details */}
        {(property.bedrooms ||
          property.bathrooms ||
          property.squareFootage) && (
          <div className="flex flex-wrap gap-3 sm:gap-4 mb-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            {property.bedrooms && (
              <div className="flex items-center">
                <i className="fas fa-bed mr-1"></i>
                <span>
                  {property.bedrooms} bed{property.bedrooms !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            {property.bathrooms && (
              <div className="flex items-center">
                <i className="fas fa-bath mr-1"></i>
                <span>
                  {property.bathrooms} bath{property.bathrooms !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            {property.squareFootage && (
              <div className="flex items-center">
                <i className="fas fa-ruler-combined mr-1"></i>
                <span>{property.squareFootage.toLocaleString()} sq ft</span>
              </div>
            )}
            {property.yearBuilt && (
              <div className="flex items-center">
                <i className="fas fa-calendar mr-1"></i>
                <span>Built {property.yearBuilt}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                Current Value
              </p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(property.currentValue ?? 0)}
              </p>
            </div>
            {property.rentalIncome && (
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                  Monthly Income
                </p>
                <p className="text-lg sm:text-xl font-bold text-green-500">
                  {formatCurrency(property.rentalIncome)}
                </p>
              </div>
            )}
          </div>

          {/* Financial Metrics */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
            {property.purchasePrice && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                  Appreciation
                </span>
                <span
                  className={`font-semibold text-sm sm:text-base ${
                    appreciation >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {appreciation >= 0 ? "+" : ""}
                  {appreciation.toFixed(1)}%
                </span>
              </div>
            )}

            {monthlyROI > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                  Annual ROI
                </span>
                <span className="font-semibold text-blue-500 text-sm sm:text-base">
                  {monthlyROI.toFixed(1)}%
                </span>
              </div>
            )}

            {property.mortgageAmount && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                  Mortgage Balance
                </span>
                <span className="text-orange-500 font-medium text-sm sm:text-base">
                  {formatCurrency(property.mortgageAmount)}
                </span>
              </div>
            )}

            {property.rentalIncome && totalMonthlyCosts > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                  Net Cash Flow
                </span>
                <span
                  className={`font-semibold text-sm sm:text-base ${
                    netCashFlow >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {netCashFlow >= 0 ? "+" : ""}
                  {formatCurrency(netCashFlow)}
                </span>
              </div>
            )}
          </div>

          {/* Additional Info */}
          {(property.mortgageProvider || property.mortgageRate) && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              {property.mortgageProvider && (
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                    Lender
                  </span>
                  <span className="text-gray-900 dark:text-white text-xs font-medium">
                    {property.mortgageProvider}
                  </span>
                </div>
              )}
              {property.mortgageRate && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                    Rate
                  </span>
                  <span className="text-gray-900 dark:text-white text-xs font-medium">
                    {property.mortgageRate}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return <PropertyManagerSkeleton />;
  }

  return (
    <div className="min-h-screen text-gray-900 dark:text-white">
      <div className="relative z-10 p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                Property Manager
              </h1>
              <p className="text-gray-400 mt-2">
                Manage your real estate portfolio
              </p>
            </div>
            <Button
              onClick={handleOpenModal}
              variant="glass-primary"
              animate
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium shadow-lg border-white/20"
            >
              <i className="fas fa-plus mr-2"></i>
              Add Property
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Value"
            value={formatCurrency(totalValue)}
            icon="fa-home"
            colorScheme="green"
          />
          
          <StatCard
            title="Properties"
            value={properties.length}
            icon="fa-building"
            colorScheme="blue"
          />
          
          <StatCard
            title="Monthly Income"
            value={formatCurrency(totalRentalIncome)}
            icon="fa-dollar-sign"
            colorScheme="purple"
          />
          
          <StatCard
            title="Total Mortgage"
            value={formatCurrency(totalMortgage)}
            icon="fa-file-invoice-dollar"
            colorScheme="orange"
          />
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3 flex-1">
            {/* Category Dropdown */}
            <div className="relative">
              <Button
                onClick={() => setOpenCategoryDropdown(openCategoryDropdown ? null : "main")}
                variant="glass"
                size="md"
                animate
                className="min-w-[180px] justify-between"
              >
                <span className="flex items-center gap-2">
                  <i className={`fas ${filterType === "all" ? "fa-layer-group" : propertyTypeConfig[filterType as keyof typeof propertyTypeConfig]?.icon || "fa-home"} text-sm`}></i>
                  {filterType === "all" ? "All Properties" : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </span>
                <i className="fas fa-chevron-down text-xs"></i>
              </Button>
              
              {openCategoryDropdown && (
                <div className="absolute top-full left-0 mt-2 w-64 liquid-glass rounded-lg shadow-xl z-20 max-h-80 overflow-y-auto" data-dropdown>
                  <button
                    onClick={() => {
                      setFilterType("all");
                      setOpenCategoryDropdown(null);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-white/10 dark:hover:bg-black/10 text-gray-900 dark:text-white border-b border-white/10 dark:border-black/10"
                  >
                    <i className="fas fa-layer-group mr-2"></i>
                    All Properties
                  </button>
                  {Object.entries(propertyTypeConfig).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setFilterType(key);
                        setOpenCategoryDropdown(null);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-white/10 dark:hover:bg-black/10 text-gray-900 dark:text-white flex items-center"
                    >
                      <i className={`fas ${config.icon} mr-2`}></i>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </button>
                  ))}
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
                      placeholder="Search properties..."
                      className="w-full pl-10 pr-4 py-1.5 bg-white/10 dark:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-white/40 dark:focus:border-white/30"
                    />
                    <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"></i>
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

          {/* Sort Dropdown and View Switcher */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
                className="bg-white/10 dark:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-lg px-3 py-1.5 text-gray-900 dark:text-white focus:outline-none focus:border-white/40 dark:focus:border-white/30 text-sm"
              >
                <option value="value_desc">Value: High to Low</option>
                <option value="value_asc">Value: Low to High</option>
                <option value="rental_desc">Rental: High to Low</option>
                <option value="rental_asc">Rental: Low to High</option>
              </select>
            </div>
            <Tabs
              tabs={[
                { id: "grid", label: "", icon: "fa-th" },
                { id: "list", label: "", icon: "fa-list" },
                { id: "map", label: "", icon: "fa-map" },
              ]}
              activeTab={viewMode}
              onTabChange={(mode) => setViewMode(mode as "grid" | "list" | "map")}
              variant="glass"
              size="sm"
            />
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 liquid-glass rounded-xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  className="w-full bg-white/10 dark:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-lg px-3 py-1.5 text-gray-900 dark:text-white focus:outline-none focus:border-white/40 dark:focus:border-white/30"
                >
                  <option value="">All Status</option>
                  <option value="owned">Owned</option>
                  <option value="rented">Rented</option>
                  <option value="listed">Listed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min Value
                </label>
                <input
                  type="number"
                  placeholder="Min value"
                  className="w-full bg-white/10 dark:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-lg px-3 py-1.5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-white/40 dark:focus:border-white/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Value
                </label>
                <input
                  type="number"
                  placeholder="Max value"
                  className="w-full bg-white/10 dark:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-lg px-3 py-1.5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-white/40 dark:focus:border-white/30"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Charts Section */}
        {properties.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
          >
            <EnhancedGlassCard enableLensing hoverable
              variant="prominent"
              padding="lg"
              animate
              animationDelay={0.2}
            >
              <h3 className="text-xl font-semibold text-white mb-6">
                Property Distribution
              </h3>
              <PieChart
                data={Object.entries(propertiesByType).map(([type, data]) => ({
                  name: type.charAt(0).toUpperCase() + type.slice(1),
                  value: data.value,
                  color:
                    propertyTypeConfig[type as keyof typeof propertyTypeConfig]
                      ?.color || "#6b7280",
                }))}
              />
            </EnhancedGlassCard>

            <EnhancedGlassCard enableLensing hoverable
              variant="prominent"
              padding="lg"
              animate
              animationDelay={0.25}
            >
              <h3 className="text-xl font-semibold text-white mb-6">
                Portfolio Insights
              </h3>
              <div className="space-y-4">
                <EnhancedGlassCard enableLensing hoverable
                  variant="subtle"
                  padding="md"
                  borderRadius="lg"
                  animate={false}
                >
                  <p className="text-gray-400 text-sm mb-1">
                    Average Property Value
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(
                      properties.length > 0 ? totalValue / properties.length : 0
                    )}
                  </p>
                </EnhancedGlassCard>
                <EnhancedGlassCard enableLensing hoverable
                  variant="subtle"
                  padding="md"
                  borderRadius="lg"
                  animate={false}
                >
                  <p className="text-gray-400 text-sm mb-1">
                    Total Annual Income
                  </p>
                  <p className="text-2xl font-bold text-green-400">
                    {formatCurrency(totalRentalIncome * 12)}
                  </p>
                </EnhancedGlassCard>
                <EnhancedGlassCard enableLensing hoverable
                  variant="subtle"
                  padding="md"
                  borderRadius="lg"
                  animate={false}
                >
                  <p className="text-gray-400 text-sm mb-1">Average ROI</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {totalValue > 0
                      ? (((totalRentalIncome * 12) / totalValue) * 100).toFixed(
                          1
                        )
                      : 0}
                    %
                  </p>
                </EnhancedGlassCard>
              </div>
            </EnhancedGlassCard>
          </motion.div>
        )}


        {/* Properties Grid/List/Map */}
        <AnimatePresence mode="wait">
          {filteredProperties.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <div className="text-gray-500 text-6xl mb-4">
                <i className="fas fa-home"></i>
              </div>
              <h3 className="text-xl font-medium text-gray-400 mb-2">
                {filterType === "all"
                  ? "No Properties Yet"
                  : `No ${filterType} properties`}
              </h3>
              <p className="text-gray-500 mb-6">
                {filterType === "all"
                  ? "Start building your real estate portfolio by adding your first property."
                  : "You don't have any properties of this type yet."}
              </p>
              <Button
                onClick={handleOpenModal}
                variant="glass-primary"
                animate
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium border-white/20"
              >
                <i className="fas fa-plus mr-2"></i>
                Add Your First Property
              </Button>
            </motion.div>
          ) : viewMode === "map" ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 text-center"
            >
              <i className="fas fa-map-marked-alt text-6xl text-gray-500 mb-4"></i>
              <h3 className="text-xl font-medium text-gray-400 mb-2">
                Map View Coming Soon
              </h3>
              <p className="text-gray-500">
                Interactive map view of your properties will be available in a
                future update.
              </p>
            </motion.div>
          ) : (
            <motion.div
              layout
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {filteredProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal - Moved outside the relative z-10 container */}
      {showModal && (
        <PropertyModal
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          initialData={editingProperty}
          error={modalError}
          currentUserId={userId || undefined}
        />
      )}
    </div>
  );
}
