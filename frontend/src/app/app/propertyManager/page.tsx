// "use client";
import { useEffect } from "react";
import type { PropertyFormData, Property } from "@/types/global";
import React, { useState, useCallback, useMemo } from "react";
import { BaseModal as Modal } from "@/components/modals/modal";
import { Table } from "@/components/tables/tables";
import { useUser } from "@/lib/user";
import Card from "@/components/cards/cards";
import DropDownButton from "@/components/ui/button/dropDownButton";
import PillSwitchButton from "@/components/ui/button/pillSwitchButton";

export default function PropertyManager() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const { data: user } = useUser();

  const [viewMode, setViewMode] = useState<"card" | "table" | "map">("card");
  const [sortOrder, setSortOrder] = useState<
    "value_desc" | "value_asc" | "rental_desc" | "rental_asc"
  >("value_desc");

  // Optional: abstract API calls to a utility function or custom hook for better separation of concerns
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
    const [formData, setFormData] =
      useState<PropertyFormData>(memoizedInitialData);

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
      <div className="bg-[#2a2a2a] rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white/80">
            {initialData ? "Edit Property" : "Add New Property"}
          </h3>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white/80 transition-colors"
            aria-label="Close Modal"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-red-400 text-sm mb-2">
              <i className="fas fa-exclamation-circle mr-1"></i>
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="propertyType"
                className="block text-sm font-medium text-white/60 mb-1"
              >
                Property Type
              </label>
              <select
                id="propertyType"
                value={formData.propertyType}
                onChange={(e) =>
                  setFormData({ ...formData, propertyType: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-green-500/50"
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="industrial">Industrial</option>
                <option value="land">Land</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-white/60 mb-1"
              >
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-green-500/50"
              >
                <option value="owned">Owned</option>
                <option value="rented">Rented Out</option>
                <option value="listed">Listed for Sale</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="address"
                className="block text-sm font-medium text-white/60 mb-1"
              >
                Address
              </label>
              <textarea
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-green-500/50"
                rows={2}
                required
              />
            </div>

            <div>
              <label
                htmlFor="purchasePrice"
                className="block text-sm font-medium text-white/60 mb-1"
              >
                Purchase Price
              </label>
              <input
                id="purchasePrice"
                type="number"
                min="0"
                value={formData.purchasePrice}
                onChange={(e) =>
                  setFormData({ ...formData, purchasePrice: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-green-500/50"
                required
              />
            </div>

            <div>
              <label
                htmlFor="currentValue"
                className="block text-sm font-medium text-white/60 mb-1"
              >
                Current Value
              </label>
              <input
                id="currentValue"
                type="number"
                min="0"
                value={formData.currentValue}
                onChange={(e) =>
                  setFormData({ ...formData, currentValue: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-green-500/50"
                required
              />
            </div>

            <div>
              <label
                htmlFor="mortgageAmount"
                className="block text-sm font-medium text-white/60 mb-1"
              >
                Mortgage Amount
              </label>
              <input
                id="mortgageAmount"
                type="number"
                min="0"
                value={formData.mortgageAmount}
                onChange={(e) =>
                  setFormData({ ...formData, mortgageAmount: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-green-500/50"
              />
            </div>

            <div>
              <label
                htmlFor="mortgageRate"
                className="block text-sm font-medium text-white/60 mb-1"
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
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-green-500/50"
              />
            </div>

            <div>
              <label
                htmlFor="monthlyPayment"
                className="block text-sm font-medium text-white/60 mb-1"
              >
                Monthly Payment
              </label>
              <input
                id="monthlyPayment"
                type="number"
                min="0"
                value={formData.monthlyPayment}
                onChange={(e) =>
                  setFormData({ ...formData, monthlyPayment: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-green-500/50"
              />
            </div>

            <div>
              <label
                htmlFor="rentalIncome"
                className="block text-sm font-medium text-white/60 mb-1"
              >
                Monthly Rental Income
              </label>
              <input
                id="rentalIncome"
                type="number"
                min="0"
                value={formData.rentalIncome}
                onChange={(e) =>
                  setFormData({ ...formData, rentalIncome: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-green-500/50"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-white/60 mb-1"
              >
                Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-green-500/50"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-white/60 hover:text-white/80 transition-colors"
              aria-label="Cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-black rounded-xl font-medium hover:bg-green-400 shadow-[0_0_8px_#00ff88] hover:shadow-[0_0_12px_#00ff88] transition-all duration-200"
              aria-label={initialData ? "Update Property" : "Add Property"}
            >
              {initialData ? "Update Property" : "Add Property"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Ensure the component still returns JSX and user is only blocked via redirect.
  // Here is a minimal placeholder return, you should replace with your actual UI.
  return (
    <div>
      {/* Your actual property manager UI goes here */}
      {/* For example, you might render a Table, Cards, etc. */}
      Property Manager Page
      {showModal && (
        <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
          <PropertyModal
            onClose={() => setShowModal(false)}
            onSubmit={handleSubmit}
            initialData={editingProperty}
            error={modalError}
          />
        </Modal>
      )}
    </div>
  );
}
