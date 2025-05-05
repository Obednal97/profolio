
// "use client";
import type { PropertyFormData, Property } from "@/types/global";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { BaseModal as Modal } from "@/components/modals/modal";
import { Table } from "@/components/tables/tables";
import { useUser } from "@/lib/user";
import { HeaderLayout } from "@/components/layout/headerLayout";
import { FooterLayout } from "@/components/layout/footerLayout";
import Card from "@/components/cards/cards";
import DropDownButton from "@/components/ui/button/dropDownButton";
import PillSwitchButton from "@/components/ui/button/pillSwitchButton";


function PropertyManager() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const { data: user } = useUser();
  // --- View/sort state ---
  const [viewMode, setViewMode] = useState<"card" | "table" | "map">("card");
  const [sortOrder, setSortOrder] = useState<"value_desc" | "value_asc" | "rental_desc" | "rental_asc">("value_desc");

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

  if (!user) {
    return (
      <HeaderLayout>
        <div className="min-h-screen bg-[#1a1a1a] text-white">
          <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">
                Welcome to Property Management
              </h2>
              <p className="text-white/60 max-w-md mx-auto">
                Track and manage your real estate investments in one place.
              </p>
              <a
                href="/account/signin"
                className="inline-block px-6 py-3 bg-green-500 text-black rounded-xl font-medium hover:bg-green-400 shadow-[0_0_8px_#00ff88] hover:shadow-[0_0_12px_#00ff88] transition-all duration-200"
              >
                <i className="fas fa-sign-in-alt mr-2"></i>
                Sign In to Manage Properties
              </a>
            </div>
          </div>
        </div>
        <FooterLayout />
      </HeaderLayout>
    );
  }

  if (loading) {
    return (
      <HeaderLayout>
        <div className="min-h-screen bg-[#1a1a1a] text-white">
          <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <div className="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full shadow-[0_0_8px_#00ff88]"></div>
          </div>
        </div>
        <FooterLayout />
      </HeaderLayout>
    );
  }

  return (
    <HeaderLayout>
      <div className="min-h-screen bg-[#1a1a1a] text-white">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-semibold bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">
                Property Management
              </h1>
              <p className="text-white/60 mt-2">
                Track and manage your real estate investments
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-green-500 text-black rounded-xl font-medium hover:bg-green-400 shadow-[0_0_8px_#00ff88] hover:shadow-[0_0_12px_#00ff88] transition-all duration-200"
              aria-label="Add Property"
            >
              <i className="fas fa-plus mr-2"></i>
              Add Property
            </button>
          </div>

          <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
          <PillSwitchButton<"card" | "table" | "map">
            options={["card", "table", "map"]}
            value={viewMode}
            onChange={(mode) => setViewMode(mode)}
          />
            <DropDownButton
              label="Sort"
              icon="fa-sort"
              options={[
                { label: "Value: High to Low", value: "value_desc" },
                { label: "Value: Low to High", value: "value_asc" },
                { label: "Rental: High to Low", value: "rental_desc" },
                { label: "Rental: Low to High", value: "rental_asc" },
              ]}
              onSelect={(
                value:
                  | "value_desc"
                  | "value_asc"
                  | "rental_desc"
                  | "rental_asc"
              ) => setSortOrder(value)}
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
              <p className="text-red-400 flex items-center">
                <i className="fas fa-exclamation-circle mr-2"></i>
                {error}
              </p>
            </div>
          )}

          {(() => {
            const sorted = [...properties].sort((a, b) => {
              const compare = (x: number, y: number) => sortOrder.endsWith("asc") ? x - y : y - x;
              if (sortOrder.startsWith("value")) return compare(a.currentValue, b.currentValue);
              if (sortOrder.startsWith("rental")) return compare(a.rentalIncome ?? 0, b.rentalIncome ?? 0);
              return 0;
            });

            if (viewMode === "card") {
              return (
                <section className="grid gap-6" aria-label="Property List">
                  {sorted.map((property) => (
                    <Card key={property.id} className="p-6 border border-white/10 hover:border-green-500/50 transition-all duration-200" aria-label={`Property at ${property.address}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-white/80">{property.address}</h3>
                          <p className="text-white/60">
                            <i className="fas fa-home mr-2"></i>
                            <span className="capitalize">{property.propertyType}</span>
                            {" • "}
                            <span className="capitalize">{property.status}</span>
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingProperty(property);
                              setShowModal(true);
                            }}
                            className="p-2 text-white/60 hover:text-white/80 transition-colors"
                            title="Edit"
                            aria-label="Edit Property"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => property.id && handleDelete(property.id)}
                            className="p-2 text-white/60 hover:text-red-400 transition-colors"
                            title="Delete"
                            aria-label="Delete Property"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-white/60 text-sm">Current Value</p>
                          <p className="text-green-400 font-semibold">
                            ${Number(property.currentValue).toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-white/60 text-sm">Purchase Price</p>
                          <p className="text-white/80 font-semibold">
                            ${Number(property.purchasePrice).toLocaleString()}
                          </p>
                        </div>
                        {property.mortgageAmount && (
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-white/60 text-sm">Mortgage</p>
                            <p className="text-white/80 font-semibold">
                              ${Number(property.mortgageAmount).toLocaleString()}
                              <span className="text-white/60 text-sm ml-1">@ {property.mortgageRate}%</span>
                            </p>
                          </div>
                        )}
                        {property.rentalIncome && (
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-white/60 text-sm">Monthly Rental</p>
                            <p className="text-green-400 font-semibold">
                              ${Number(property.rentalIncome).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>

                      {property.notes && (
                        <p className="mt-4 text-white/60 text-sm">{property.notes}</p>
                      )}
                    </Card>
                  ))}
                  {sorted.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-white/40 text-6xl mb-4">
                        <i className="fas fa-home"></i>
                      </div>
                      <h3 className="text-xl font-medium text-white/80 mb-2">No Properties Yet</h3>
                      <p className="text-white/60">Start building your real estate portfolio by adding your first property.</p>
                    </div>
                  )}
                </section>
              );
            }

            if (viewMode === "table") {
              return (
                <section className="mt-6" aria-label="Property Table">
                  <Table
                    columns={[
                      { header: "Address", accessor: "address" },
                      { header: "Type", accessor: "propertyType" },
                      { header: "Status", accessor: "status" },
                      {
                        header: "Value",
                        accessor: "currentValue",
                        render: (v) => `$${Number(v).toLocaleString()}`
                      },
                      {
                        header: "Rental",
                        accessor: "rentalIncome",
                        render: (v) => v ? `$${Number(v).toLocaleString()}` : "—"
                      },
                      {
                        header: "Actions",
                        accessor: "id",
                        render: (_, row) => (
                          <div className="text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingProperty(row);
                                setShowModal(true);
                              }}
                              className="text-white/60 hover:text-white/80"
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              onClick={() => row.id && handleDelete(row.id)}
                              className="text-white/60 hover:text-red-400"
                              title="Delete"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        )
                      }
                    ]}
                    data={sorted}
                    rowKey={(row) => row.id ?? ""}
                  />
                </section>
              );
            }

            if (viewMode === "map") {
              return (
                <div className="mt-6 text-white/60 text-sm">
                  Map view coming soon...
                </div>
              );
            }

            return null;
          })()}
        </div>

        <Modal
          isOpen={showModal || editingProperty !== null}
          onClose={() => {
            setShowModal(false);
            setEditingProperty(null);
            setModalError(null);
          }}
        >
          <PropertyModal
            onClose={() => {
              setShowModal(false);
              setEditingProperty(null);
              setModalError(null);
            }}
            onSubmit={handleSubmit}
            initialData={editingProperty}
            error={modalError}
          />
        </Modal>
      </div>
      <FooterLayout />
    </HeaderLayout>
  );
}

// Types for PropertyModal props
interface PropertyModalProps {
  onClose: () => void;
  onSubmit: (property: Property) => void;
  initialData: Property | null;
  error: string | null;
}

// Refactored PropertyModal as a separate component
function PropertyModal({ onClose, onSubmit, initialData, error }: PropertyModalProps) {
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
      mortgageAmount: formData.mortgageAmount ? Number(formData.mortgageAmount) : undefined,
      mortgageRate: formData.mortgageRate ? Number(formData.mortgageRate) : undefined,
      monthlyPayment: formData.monthlyPayment ? Number(formData.monthlyPayment) : undefined,
      rentalIncome: formData.rentalIncome ? Number(formData.rentalIncome) : undefined,
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

export default PropertyManager;