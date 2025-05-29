"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import type { PropertyFormData, Property } from "@/types/global";
import { BaseModal as Modal } from "@/components/modals/modal";
import { useAuth } from '@/lib/auth';
import { useAppContext } from "@/components/layout/layoutWrapper";
import { Button } from "@/components/ui/button/button";
import { motion, AnimatePresence } from "framer-motion";
import PieChart from "@/components/charts/pie";

const propertyTypeConfig = {
  residential: { icon: "fa-home", color: "#3b82f6", gradient: "from-blue-500 to-blue-600" },
  commercial: { icon: "fa-building", color: "#10b981", gradient: "from-green-500 to-green-600" },
  industrial: { icon: "fa-industry", color: "#f59e0b", gradient: "from-orange-500 to-orange-600" },
  land: { icon: "fa-mountain", color: "#8b5cf6", gradient: "from-purple-500 to-purple-600" },
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
  const [sortOrder, setSortOrder] = useState<"value_desc" | "value_asc" | "rental_desc" | "rental_asc">("value_desc");
  const { user } = useAuth();
  const { formatCurrency } = useAppContext();

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

  const fetchProperties = useCallback(async () => {
    if (!currentUser?.id) return;
    
    setLoading(true);
    try {
      const { apiCall } = await import('@/lib/mockApi');
      
      const response = await apiCall("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "READ", userId: currentUser.id }),
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setProperties(data.properties || []);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error("Property fetch error:", err);
      setError("Failed to load properties");
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
      fetchProperties();
  }, [fetchProperties]);

  const handleSubmit = async (propertyData: Property) => {
    if (!currentUser) return;
    
    try {
      const { apiCall } = await import('@/lib/mockApi');
      
      const method = editingProperty ? "UPDATE" : "CREATE";
      const response = await apiCall("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          userId: currentUser.id,
          ...propertyData,
          ...(editingProperty?.id ? { id: editingProperty.id } : {}),
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setShowModal(false);
      setEditingProperty(null);
      fetchProperties();
    } catch (err) {
      console.error("Property save error:", err);
      setModalError("Failed to save property");
    }
  };

  const handleDelete = async (propertyId: string) => {
    if (!currentUser) return;
    if (!confirm("Are you sure you want to delete this property?")) return;

    try {
      const { apiCall } = await import('@/lib/mockApi');
      
      const response = await apiCall("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "DELETE",
          userId: currentUser.id,
          id: propertyId,
        }),
      });

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
    return properties.reduce((sum, property) => sum + (property.currentValue ?? 0), 0);
  }, [properties]);

  const totalRentalIncome = useMemo(() => {
    return properties.reduce((sum, property) => sum + (property.rentalIncome ?? 0), 0);
  }, [properties]);

  const totalMortgage = useMemo(() => {
    return properties.reduce((sum, property) => sum + (property.mortgageAmount ?? 0), 0);
  }, [properties]);

  const propertiesByType = useMemo(() => {
    return properties.reduce((acc, property) => {
      const type = property.propertyType ?? 'residential';
      if (!acc[type]) acc[type] = { count: 0, value: 0 };
      acc[type].count++;
      acc[type].value += property.currentValue ?? 0;
      return acc;
    }, {} as Record<string, { count: number; value: number }>);
  }, [properties]);

  const filteredProperties = useMemo(() => {
    const filtered = filterType === "all" ? properties : properties.filter(p => p.propertyType === filterType);
    
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
  }, [properties, filterType, sortOrder]);

  // Types for PropertyModal props
  interface PropertyModalProps {
    onClose: () => void;
    onSubmit: (property: Property) => void;
    initialData: Property | null;
    error: string | null;
  }

  // Refactored PropertyModal as a separate component
  function PropertyModal({
    onClose,
    onSubmit,
    initialData,
    error,
  }: PropertyModalProps) {
    const memoizedInitialData: PropertyFormData = useMemo(
      () =>
        initialData
          ? {
              address: initialData.address ?? "",
              purchasePrice: initialData.purchasePrice?.toString() ?? "",
              currentValue: initialData.currentValue?.toString() ?? "",
              propertyType: initialData.propertyType ?? "residential",
              status: initialData.status ?? "owned",
              notes: initialData.notes ?? "",
              ownershipType: initialData.ownershipType ?? "owned",
              
              // Rental fields
              rentalStartDate: initialData.rentalStartDate ?? "",
              rentalEndDate: initialData.rentalEndDate ?? "",
              monthlyRent: initialData.monthlyRent?.toString() ?? "",
              securityDeposit: initialData.securityDeposit?.toString() ?? "",
              
              // Owned property fields
              purchaseDate: initialData.purchaseDate ?? "",
              
              // Mortgage fields
              mortgageAmount: initialData.mortgageAmount?.toString() ?? "",
              mortgageRate: initialData.mortgageRate?.toString() ?? "",
              mortgageTerm: initialData.mortgageTerm?.toString() ?? "",
              monthlyPayment: initialData.monthlyPayment?.toString() ?? "",
              mortgageStartDate: initialData.mortgageStartDate ?? "",
              mortgageProvider: initialData.mortgageProvider ?? "",
              
              // Property details
              bedrooms: initialData.bedrooms?.toString() ?? "",
              bathrooms: initialData.bathrooms?.toString() ?? "",
              squareFootage: initialData.squareFootage?.toString() ?? "",
              yearBuilt: initialData.yearBuilt?.toString() ?? "",
              lotSize: initialData.lotSize?.toString() ?? "",
              
              // Financial details
              rentalIncome: initialData.rentalIncome?.toString() ?? "",
              propertyTaxes: initialData.propertyTaxes?.toString() ?? "",
              insurance: initialData.insurance?.toString() ?? "",
              maintenanceCosts: initialData.maintenanceCosts?.toString() ?? "",
              hoa: initialData.hoa?.toString() ?? "",
            }
          : {
              address: "",
              purchasePrice: "",
              currentValue: "",
              propertyType: "residential",
              status: "owned",
              notes: "",
              ownershipType: "owned",
              
              // Rental fields
              rentalStartDate: "",
              rentalEndDate: "",
              monthlyRent: "",
              securityDeposit: "",
              
              // Owned property fields
              purchaseDate: "",
              
              // Mortgage fields
              mortgageAmount: "",
              mortgageRate: "",
              mortgageTerm: "",
              monthlyPayment: "",
              mortgageStartDate: "",
              mortgageProvider: "",
              
              // Property details
              bedrooms: "",
              bathrooms: "",
              squareFootage: "",
              yearBuilt: "",
              lotSize: "",
              
              // Financial details
              rentalIncome: "",
              propertyTaxes: "",
              insurance: "",
              maintenanceCosts: "",
              hoa: "",
            },
      [initialData]
    );
    const [formData, setFormData] = useState<PropertyFormData>(memoizedInitialData);

    useEffect(() => {
      setFormData(memoizedInitialData);
    }, [memoizedInitialData]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit({
        ...formData,
        purchasePrice: Number(formData.purchasePrice),
        currentValue: Number(formData.currentValue),
        monthlyRent: formData.monthlyRent ? Number(formData.monthlyRent) : undefined,
        securityDeposit: formData.securityDeposit ? Number(formData.securityDeposit) : undefined,
        mortgageAmount: formData.mortgageAmount ? Number(formData.mortgageAmount) : undefined,
        mortgageRate: formData.mortgageRate ? Number(formData.mortgageRate) : undefined,
        mortgageTerm: formData.mortgageTerm ? Number(formData.mortgageTerm) : undefined,
        monthlyPayment: formData.monthlyPayment ? Number(formData.monthlyPayment) : undefined,
        bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
        squareFootage: formData.squareFootage ? Number(formData.squareFootage) : undefined,
        yearBuilt: formData.yearBuilt ? Number(formData.yearBuilt) : undefined,
        lotSize: formData.lotSize ? Number(formData.lotSize) : undefined,
        rentalIncome: formData.rentalIncome ? Number(formData.rentalIncome) : undefined,
        propertyTaxes: formData.propertyTaxes ? Number(formData.propertyTaxes) : undefined,
        insurance: formData.insurance ? Number(formData.insurance) : undefined,
        maintenanceCosts: formData.maintenanceCosts ? Number(formData.maintenanceCosts) : undefined,
        hoa: formData.hoa ? Number(formData.hoa) : undefined,
      });
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 lg:p-8 w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 shadow-2xl">
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            {initialData ? "Edit Property" : "Add New Property"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-manipulation"
            aria-label="Close Modal"
          >
            <i className="fas fa-times text-lg sm:text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-900/20 backdrop-blur-sm border border-red-800 rounded-xl p-4"
            >
              <p className="text-red-400 flex items-center">
                <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
              </p>
            </motion.div>
          )}

          {/* Basic Property Information */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 sm:p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <i className="fas fa-home mr-2 text-green-500"></i>
              Property Information
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Property Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                  rows={2}
                  placeholder="123 Main St, City, State ZIP"
                  required
                />
              </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Property Type
              </label>
              <select
                value={formData.propertyType}
                  onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                >
                  <option value="residential" className="bg-white dark:bg-gray-800">Residential</option>
                  <option value="commercial" className="bg-white dark:bg-gray-800">Commercial</option>
                  <option value="industrial" className="bg-white dark:bg-gray-800">Industrial</option>
                  <option value="land" className="bg-white dark:bg-gray-800">Land</option>
              </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ownership Type
                </label>
                <select
                  value={formData.ownershipType}
                  onChange={(e) => setFormData({ ...formData, ownershipType: e.target.value as 'owned' | 'rented' | 'leased' })}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                >
                  <option value="owned" className="bg-white dark:bg-gray-800">Owned</option>
                  <option value="rented" className="bg-white dark:bg-gray-800">Rented</option>
                  <option value="leased" className="bg-white dark:bg-gray-800">Leased</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                >
                  <option value="owned" className="bg-white dark:bg-gray-800">Owned</option>
                  <option value="rented" className="bg-white dark:bg-gray-800">Rented Out</option>
                  <option value="listed" className="bg-white dark:bg-gray-800">Listed for Sale</option>
              </select>
              </div>
            </div>
            </div>

          {/* Property Details */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 sm:p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <i className="fas fa-ruler-combined mr-2 text-blue-500"></i>
              Property Details
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bedrooms
              </label>
                <input
                  type="number"
                  min="0"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                  placeholder="3"
              />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bathrooms
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                  placeholder="2.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Square Footage
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.squareFootage}
                  onChange={(e) => setFormData({ ...formData, squareFootage: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                  placeholder="2000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Year Built
                </label>
                <input
                  type="number"
                  min="1800"
                  max={new Date().getFullYear()}
                  value={formData.yearBuilt}
                  onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                  placeholder="2020"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lot Size (sq ft)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.lotSize}
                  onChange={(e) => setFormData({ ...formData, lotSize: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                  placeholder="8000"
                />
              </div>
            </div>
          </div>

          {/* Financial Information - Conditional based on ownership type */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 sm:p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <i className="fas fa-dollar-sign mr-2 text-green-500"></i>
              Financial Information
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {formData.ownershipType === 'owned' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Purchase Price
              </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                min="0"
                value={formData.purchasePrice}
                        onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                        placeholder="500000"
                required
              />
                    </div>
            </div>

            <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Purchase Date
                    </label>
                    <input
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                    />
                  </div>
                </>
              )}

              {(formData.ownershipType === 'rented' || formData.ownershipType === 'leased') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Monthly Rent
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        min="0"
                        value={formData.monthlyRent}
                        onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                        placeholder="2500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Security Deposit
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        min="0"
                        value={formData.securityDeposit}
                        onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                        placeholder="5000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rental Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.rentalStartDate}
                      onChange={(e) => setFormData({ ...formData, rentalStartDate: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rental End Date
                    </label>
                    <input
                      type="date"
                      value={formData.rentalEndDate}
                      onChange={(e) => setFormData({ ...formData, rentalEndDate: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Value
              </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                min="0"
                value={formData.currentValue}
                    onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                    placeholder="550000"
                required
              />
                </div>
            </div>

              {formData.status === 'rented' && (
            <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Monthly Rental Income
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      min="0"
                      value={formData.rentalIncome}
                      onChange={(e) => setFormData({ ...formData, rentalIncome: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                      placeholder="3000"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mortgage Details - Only for owned properties */}
          {formData.ownershipType === 'owned' && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 sm:p-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <i className="fas fa-university mr-2 text-purple-500"></i>
                Mortgage Details
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mortgage Amount
              </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                min="0"
                value={formData.mortgageAmount}
                      onChange={(e) => setFormData({ ...formData, mortgageAmount: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                      placeholder="400000"
                    />
                  </div>
            </div>

            <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Interest Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                    min="0"
                    max="20"
                value={formData.mortgageRate}
                    onChange={(e) => setFormData({ ...formData, mortgageRate: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                    placeholder="3.5"
              />
            </div>

            <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Term (years)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.mortgageTerm}
                    onChange={(e) => setFormData({ ...formData, mortgageTerm: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                    placeholder="30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Monthly Payment
              </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                min="0"
                value={formData.monthlyPayment}
                      onChange={(e) => setFormData({ ...formData, monthlyPayment: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                      placeholder="2000"
                    />
                  </div>
            </div>

            <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mortgage Start Date
              </label>
              <input
                    type="date"
                    value={formData.mortgageStartDate}
                    onChange={(e) => setFormData({ ...formData, mortgageStartDate: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mortgage Provider
                  </label>
                  <input
                    type="text"
                    value={formData.mortgageProvider}
                    onChange={(e) => setFormData({ ...formData, mortgageProvider: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                    placeholder="Bank of America"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Additional Costs */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 sm:p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <i className="fas fa-receipt mr-2 text-orange-500"></i>
              Additional Costs (Monthly)
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Property Taxes
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                type="number"
                min="0"
                    value={formData.propertyTaxes}
                    onChange={(e) => setFormData({ ...formData, propertyTaxes: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                    placeholder="500"
                  />
                </div>
            </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Insurance
              </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.insurance}
                    onChange={(e) => setFormData({ ...formData, insurance: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                    placeholder="200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maintenance
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.maintenanceCosts}
                    onChange={(e) => setFormData({ ...formData, maintenanceCosts: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                    placeholder="300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  HOA Fees
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.hoa}
                    onChange={(e) => setFormData({ ...formData, hoa: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                    placeholder="150"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 sm:p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <i className="fas fa-sticky-note mr-2 text-yellow-500"></i>
              Notes
            </h4>
            
              <textarea
                value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-green-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                rows={3}
              placeholder="Additional information about the property..."
              />
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              onClick={onClose}
              variant="ghost"
              className="w-full sm:w-auto px-6 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 touch-manipulation"
              aria-label="Cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium shadow-lg touch-manipulation"
              aria-label={initialData ? "Update Property" : "Add Property"}
            >
              {initialData ? "Update Property" : "Add Property"}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  const PropertyCard = ({
    property,
    onEdit,
    onDelete,
  }: {
    property: Property;
    onEdit: (property: Property) => void;
    onDelete: (id: string) => void;
  }) => {
    const typeConfig = propertyTypeConfig[property.propertyType as keyof typeof propertyTypeConfig] || propertyTypeConfig.residential;
    const statusIcon = statusConfig[property.status as keyof typeof statusConfig] || statusConfig.owned;
    
    const appreciation = property.purchasePrice 
      ? ((property.currentValue ?? 0) - property.purchasePrice) / property.purchasePrice * 100
      : 0;
    
    const monthlyROI = property.rentalIncome && property.currentValue
      ? (property.rentalIncome * 12 / property.currentValue * 100)
      : 0;

    const totalMonthlyCosts = (property.monthlyPayment ?? 0) + 
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
            <div className={`p-2 sm:p-3 bg-gradient-to-r ${typeConfig.gradient} rounded-lg mr-3 sm:mr-4 shadow-lg flex-shrink-0`}>
              <i className={`fas ${typeConfig.icon} text-white text-lg sm:text-xl`}></i>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">{property.address}</h3>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <span className="text-gray-600 dark:text-gray-400 capitalize">{property.propertyType}</span>
                <span className={`flex items-center ${statusIcon.color === '#3b82f6' ? 'text-blue-500' : statusIcon.color === '#10b981' ? 'text-green-500' : 'text-orange-500'}`}>
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
            <button
              onClick={() => onEdit(property)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-manipulation"
              aria-label="Edit property"
            >
              <i className="fas fa-edit text-sm sm:text-base"></i>
            </button>
            <button
              onClick={() => property.id && onDelete(property.id)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-manipulation"
              aria-label="Delete property"
            >
              <i className="fas fa-trash text-sm sm:text-base"></i>
            </button>
          </div>
        </div>

        {/* Property Details */}
        {(property.bedrooms || property.bathrooms || property.squareFootage) && (
          <div className="flex flex-wrap gap-3 sm:gap-4 mb-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            {property.bedrooms && (
              <div className="flex items-center">
                <i className="fas fa-bed mr-1"></i>
                <span>{property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}</span>
              </div>
            )}
            {property.bathrooms && (
              <div className="flex items-center">
                <i className="fas fa-bath mr-1"></i>
                <span>{property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}</span>
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
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Current Value</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(property.currentValue ?? 0)}
              </p>
            </div>
            {property.rentalIncome && (
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Monthly Income</p>
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
                <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Appreciation</span>
                <span className={`font-semibold text-sm sm:text-base ${appreciation >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {appreciation >= 0 ? '+' : ''}{appreciation.toFixed(1)}%
                </span>
              </div>
            )}

            {monthlyROI > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Annual ROI</span>
                <span className="font-semibold text-blue-500 text-sm sm:text-base">
                  {monthlyROI.toFixed(1)}%
                </span>
              </div>
            )}

            {property.mortgageAmount && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Mortgage Balance</span>
                <span className="text-orange-500 font-medium text-sm sm:text-base">
                  {formatCurrency(property.mortgageAmount)}
                </span>
              </div>
            )}

            {property.rentalIncome && totalMonthlyCosts > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Net Cash Flow</span>
                <span className={`font-semibold text-sm sm:text-base ${netCashFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}
                </span>
              </div>
            )}
          </div>

          {/* Additional Info */}
          {(property.mortgageProvider || property.mortgageRate) && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              {property.mortgageProvider && (
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Lender</span>
                  <span className="text-gray-900 dark:text-white text-xs font-medium">{property.mortgageProvider}</span>
                </div>
              )}
              {property.mortgageRate && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Rate</span>
                  <span className="text-gray-900 dark:text-white text-xs font-medium">{property.mortgageRate}%</span>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#101828]">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#101828] text-gray-900 dark:text-white">
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
              <p className="text-gray-400 mt-2">Manage your real estate portfolio</p>
            </div>
            <Button
              onClick={handleOpenModal}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium shadow-lg px-6 py-3"
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-xl p-6 border border-green-500/30">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Total Value</p>
                <p className="text-3xl font-bold text-green-400 mt-1">
                  {formatCurrency(totalValue)}
                </p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-lg">
                <i className="fas fa-home text-green-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Properties</p>
                <p className="text-3xl font-bold text-blue-400 mt-1">
                  {properties.length}
                </p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <i className="fas fa-building text-blue-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Monthly Income</p>
                <p className="text-3xl font-bold text-purple-400 mt-1">
                  {formatCurrency(totalRentalIncome)}
                </p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <i className="fas fa-dollar-sign text-purple-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-sm rounded-xl p-6 border border-orange-500/30">
            <div className="flex justify-between items-start">
    <div>
                <p className="text-gray-400 text-sm">Total Mortgage</p>
                <p className="text-3xl font-bold text-orange-400 mt-1">
                  {formatCurrency(totalMortgage)}
                </p>
              </div>
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <i className="fas fa-file-invoice-dollar text-orange-400 text-xl"></i>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Charts Section */}
        {properties.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
          >
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-6">Property Distribution</h3>
              <PieChart
                data={Object.entries(propertiesByType).map(([type, data]) => ({
                  name: type.charAt(0).toUpperCase() + type.slice(1),
                  value: data.value,
                  color: propertyTypeConfig[type as keyof typeof propertyTypeConfig]?.color || "#6b7280",
                }))}
              />
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-6">Portfolio Insights</h3>
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">Average Property Value</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(properties.length > 0 ? totalValue / properties.length : 0)}
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">Total Annual Income</p>
                  <p className="text-2xl font-bold text-green-400">
                    {formatCurrency(totalRentalIncome * 12)}
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">Average ROI</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {totalValue > 0 ? ((totalRentalIncome * 12 / totalValue) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

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
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              All Properties
            </button>
            {Object.keys(propertiesByType).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  filterType === type
                    ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)} ({propertiesByType[type].count})
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
              className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
            >
              <option value="value_desc" className="bg-white dark:bg-gray-800">Value: High to Low</option>
              <option value="value_asc" className="bg-white dark:bg-gray-800">Value: Low to High</option>
              <option value="rental_desc" className="bg-white dark:bg-gray-800">Rental: High to Low</option>
              <option value="rental_asc" className="bg-white dark:bg-gray-800">Rental: Low to High</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === "grid"
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <i className="fas fa-th"></i>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === "list"
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <i className="fas fa-list"></i>
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === "map"
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <i className="fas fa-map"></i>
              </button>
            </div>
          </div>
        </motion.div>

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
                {filterType === "all" ? "No Properties Yet" : `No ${filterType} properties`}
              </h3>
              <p className="text-gray-500 mb-6">
                {filterType === "all" 
                  ? "Start building your real estate portfolio by adding your first property."
                  : "You don't have any properties of this type yet."}
              </p>
              <Button
                onClick={handleOpenModal}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium"
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
              <h3 className="text-xl font-medium text-gray-400 mb-2">Map View Coming Soon</h3>
              <p className="text-gray-500">Interactive map view of your properties will be available in a future update.</p>
            </motion.div>
          ) : (
            <motion.div
              layout
              className={viewMode === "grid" 
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
        <Modal isOpen={showModal} onClose={handleCloseModal}>
          <PropertyModal
            onClose={handleCloseModal}
            onSubmit={handleSubmit}
            initialData={editingProperty}
            error={modalError}
          />
        </Modal>
      )}
    </div>
  );
}
