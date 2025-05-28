"use client";
import { useEffect } from "react";
import type { PropertyFormData, Property } from "@/types/global";
import React, { useState, useCallback, useMemo } from "react";
import { BaseModal as Modal } from "@/components/modals/modal";
import { useUser } from "@/lib/user";
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
  const { data: user } = useUser();

  const fetchProperties = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "READ", userId: user.id }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch properties");
      }
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setProperties(data.properties || []);
    } catch (err) {
      console.error("Property fetch error:", err);
      setError("Failed to load properties");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user, fetchProperties]);

  const handleSubmit = async (propertyData: Property) => {
    if (!user) return;
    setModalError(null);
    try {
      const method = editingProperty ? "UPDATE" : "CREATE";
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          userId: user.id,
          ...propertyData,
          ...(editingProperty?.id ? { id: editingProperty.id } : {}),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save property");
      }

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
    if (!user) return;
    if (!confirm("Are you sure you want to delete this property?")) return;

    try {
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "DELETE",
          userId: user.id,
          id: propertyId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete property");
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
              mortgageAmount: initialData.mortgageAmount?.toString() ?? "",
              mortgageRate: initialData.mortgageRate?.toString() ?? "",
              monthlyPayment: initialData.monthlyPayment?.toString() ?? "",
              rentalIncome: initialData.rentalIncome?.toString() ?? "",
              propertyType: initialData.propertyType ?? "residential",
              status: initialData.status ?? "owned",
              notes: initialData.notes ?? "",
            }
          : {
              address: "",
              purchasePrice: "",
              currentValue: "",
              mortgageAmount: "",
              mortgageRate: "",
              monthlyPayment: "",
              rentalIncome: "",
              propertyType: "residential",
              status: "owned",
              notes: "",
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
        mortgageAmount: formData.mortgageAmount
          ? Number(formData.mortgageAmount)
          : undefined,
        mortgageRate: formData.mortgageRate
          ? Number(formData.mortgageRate)
          : undefined,
        monthlyPayment: formData.monthlyPayment
          ? Number(formData.monthlyPayment)
          : undefined,
        rentalIncome: formData.rentalIncome
          ? Number(formData.rentalIncome)
          : undefined,
      });
    };

    return (
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            {initialData ? "Edit Property" : "Add New Property"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            aria-label="Close Modal"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="propertyType"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Property Type
              </label>
              <select
                id="propertyType"
                value={formData.propertyType}
                onChange={(e) =>
                  setFormData({ ...formData, propertyType: e.target.value })
                }
                className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 focus:bg-white/10 transition-all duration-200"
              >
                <option value="residential" className="bg-gray-800">Residential</option>
                <option value="commercial" className="bg-gray-800">Commercial</option>
                <option value="industrial" className="bg-gray-800">Industrial</option>
                <option value="land" className="bg-gray-800">Land</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 focus:bg-white/10 transition-all duration-200"
              >
                <option value="owned" className="bg-gray-800">Owned</option>
                <option value="rented" className="bg-gray-800">Rented Out</option>
                <option value="listed" className="bg-gray-800">Listed for Sale</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Address
              </label>
              <textarea
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500/50 focus:bg-white/10 transition-all duration-200"
                rows={2}
                placeholder="123 Main St, City, State ZIP"
                required
              />
            </div>

            <div>
              <label
                htmlFor="purchasePrice"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Purchase Price
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  id="purchasePrice"
                  type="number"
                  min="0"
                  value={formData.purchasePrice}
                  onChange={(e) =>
                    setFormData({ ...formData, purchasePrice: e.target.value })
                  }
                  className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500/50 focus:bg-white/10 transition-all duration-200"
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="currentValue"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Current Value
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  id="currentValue"
                  type="number"
                  min="0"
                  value={formData.currentValue}
                  onChange={(e) =>
                    setFormData({ ...formData, currentValue: e.target.value })
                  }
                  className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500/50 focus:bg-white/10 transition-all duration-200"
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="mortgageAmount"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Mortgage Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  id="mortgageAmount"
                  type="number"
                  min="0"
                  value={formData.mortgageAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, mortgageAmount: e.target.value })
                  }
                  className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500/50 focus:bg-white/10 transition-all duration-200"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="mortgageRate"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Mortgage Rate (%)
              </label>
              <input
                id="mortgageRate"
                type="number"
                step="0.01"
                value={formData.mortgageRate}
                onChange={(e) =>
                  setFormData({ ...formData, mortgageRate: e.target.value })
                }
                className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500/50 focus:bg-white/10 transition-all duration-200"
                placeholder="3.5"
              />
            </div>

            <div>
              <label
                htmlFor="monthlyPayment"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Monthly Payment
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  id="monthlyPayment"
                  type="number"
                  min="0"
                  value={formData.monthlyPayment}
                  onChange={(e) =>
                    setFormData({ ...formData, monthlyPayment: e.target.value })
                  }
                  className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500/50 focus:bg-white/10 transition-all duration-200"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="rentalIncome"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Monthly Rental Income
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  id="rentalIncome"
                  type="number"
                  min="0"
                  value={formData.rentalIncome}
                  onChange={(e) =>
                    setFormData({ ...formData, rentalIncome: e.target.value })
                  }
                  className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500/50 focus:bg-white/10 transition-all duration-200"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500/50 focus:bg-white/10 transition-all duration-200"
                rows={3}
                placeholder="Additional information about the property..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-white/10">
            <Button
              type="button"
              onClick={onClose}
              variant="ghost"
              className="px-6 py-3 hover:bg-white/10"
              aria-label="Cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium shadow-lg"
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

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ y: -4 }}
        className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <div className={`p-3 bg-gradient-to-r ${typeConfig.gradient} rounded-lg mr-4 shadow-lg`}>
              <i className={`fas ${typeConfig.icon} text-white text-xl`}></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white line-clamp-1">{property.address}</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-400 capitalize">{property.propertyType}</span>
                <span className={`text-sm flex items-center ${statusIcon.color === '#3b82f6' ? 'text-blue-400' : statusIcon.color === '#10b981' ? 'text-green-400' : 'text-orange-400'}`}>
                  <i className={`fas ${statusIcon.icon} mr-1`}></i>
                  {property.status}
                </span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(property)}
              className="p-2 text-gray-400 hover:text-blue-400 transition-colors hover:bg-white/10 rounded-lg"
            >
              <i className="fas fa-edit"></i>
            </button>
            <button
              onClick={() => property.id && onDelete(property.id)}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors hover:bg-white/10 rounded-lg"
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-gray-400 text-sm">Current Value</p>
              <p className="text-xl font-bold text-white">
                ${(property.currentValue ?? 0).toLocaleString()}
              </p>
            </div>
            {property.rentalIncome && (
              <div>
                <p className="text-gray-400 text-sm">Monthly Income</p>
                <p className="text-xl font-bold text-green-400">
                  ${property.rentalIncome.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {property.purchasePrice && (
            <div className="pt-3 border-t border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Appreciation</span>
                <span className={`font-semibold ${appreciation >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {appreciation >= 0 ? '+' : ''}{appreciation.toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {monthlyROI > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Annual ROI</span>
              <span className="font-semibold text-blue-400">
                {monthlyROI.toFixed(1)}%
              </span>
            </div>
          )}

          {property.mortgageAmount && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Mortgage</span>
              <span className="text-orange-400">
                ${property.mortgageAmount.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
      </div>

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
                  ${totalValue.toLocaleString()}
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
                  ${totalRentalIncome.toLocaleString()}
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
                  ${totalMortgage.toLocaleString()}
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
                    ${properties.length > 0 ? Math.round(totalValue / properties.length).toLocaleString() : 0}
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">Total Annual Income</p>
                  <p className="text-2xl font-bold text-green-400">
                    ${(totalRentalIncome * 12).toLocaleString()}
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
                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
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
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
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
              className="bg-white/10 text-white rounded-lg px-4 py-2 focus:outline-none focus:bg-white/20 transition-all duration-200"
            >
              <option value="value_desc" className="bg-gray-800">Value: High to Low</option>
              <option value="value_asc" className="bg-gray-800">Value: Low to High</option>
              <option value="rental_desc" className="bg-gray-800">Rental: High to Low</option>
              <option value="rental_asc" className="bg-gray-800">Rental: Low to High</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === "grid"
                    ? 'bg-white/20 text-white'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                }`}
              >
                <i className="fas fa-th"></i>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === "list"
                    ? 'bg-white/20 text-white'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                }`}
              >
                <i className="fas fa-list"></i>
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === "map"
                    ? 'bg-white/20 text-white'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
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

      {/* Modal */}
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
