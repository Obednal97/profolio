"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { Property } from "@/types/global";
import { PropertyCard } from "@/components/cards/PropertyCard";
import { useAuth } from "@/lib/unifiedAuth";
import { PropertiesSkeleton } from "@/components/ui/skeleton";
import { EnhancedGlassCard } from "@/components/ui/enhanced-glass/EnhancedGlassCard";
import { Button } from "@/components/ui/button";
import { FullScreenModal } from "@/components/modals/modal";
import { PropertyModal } from "@/components/modals/PropertyModal";


export default function PropertiesPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use ref to track abort controller for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check if user is in demo mode
  const isDemoMode =
    typeof window !== "undefined" &&
    localStorage.getItem("demo-mode") === "true";

  // Use Firebase user data or demo user data - memoized
  const currentUser = useMemo(() => {
    if (user) {
      return {
        id: user.id,
        name:
          user.displayName || user.name || user.email?.split("@")[0] || "User",
        email: user.email || "",
      };
    } else if (isDemoMode) {
      return {
        id: "demo-user-id",
        name: "Demo User",
        email: "demo@profolio.com",
      };
    }
    return null;
  }, [user, isDemoMode]);

  // Cleanup function for abort controller
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const fetchProperties = useCallback(async () => {
    if (!currentUser?.id) return;

    // Cancel any ongoing request
    cleanup();

    // Create new AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      setError(null);

      // Add artificial delay to show skeleton
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Use the proxy endpoint with authentication
      const authToken = (isDemoMode ? "demo-token" : user?.token) || null;

      const response = await fetch("/api/properties", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ method: "READ", userId: currentUser.id }),
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (!controller.signal.aborted) {
        setProperties(data.properties || []);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // Request was aborted, this is expected
        return;
      }
      console.error("Error fetching properties:", err);
      if (!controller.signal.aborted) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch properties"
        );
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [currentUser?.id, cleanup, isDemoMode, user?.token]);

  useEffect(() => {
    if (currentUser?.id) {
      fetchProperties();
    }
  }, [currentUser?.id, fetchProperties]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const handleAddProperty = () => {
    setSelectedProperty(null);
    setShowModal(true);
  };

  const handleEditProperty = (property: Property) => {
    setSelectedProperty(property);
    setShowModal(true);
  };

  const handleSaveProperty = async (propertyData: Property) => {
    try {
      if (isDemoMode) {
        // In demo mode, just update local state
        if (propertyData.id) {
          // Edit existing property
          setProperties((prev) =>
            prev.map((p) => (p.id === propertyData.id ? propertyData : p))
          );
        } else {
          // Add new property
          const newProperty = {
            ...propertyData,
            id: `demo-property-${Date.now()}`,
            userId: "demo-user",
          };
          setProperties((prev) => [...prev, newProperty]);
        }
        setShowModal(false);
        setSelectedProperty(null);
      } else {
        // Real user - save to backend
        const endpoint = propertyData.id
          ? "/api/properties/update"
          : "/api/properties/create";
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...propertyData,
            userId: currentUser?.id || "",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save property");
        }

        const savedProperty = await response.json();

        if (propertyData.id) {
          setProperties((prev) =>
            prev.map((p) => (p.id === propertyData.id ? savedProperty : p))
          );
        } else {
          setProperties((prev) => [...prev, savedProperty]);
        }

        setShowModal(false);
        setSelectedProperty(null);
      }
    } catch (err) {
      console.error("Error saving property:", err);
      setError("Failed to save property");
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return;

    try {
      if (isDemoMode) {
        setProperties((prev) => prev.filter((p) => p.id !== id));
      } else {
        const response = await fetch("/api/properties/delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id, userId: currentUser?.id || "" }),
        });

        if (!response.ok) {
          throw new Error("Failed to delete property");
        }

        setProperties((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error("Error deleting property:", err);
      setError("Failed to delete property");
    }
  };

  // Calculate portfolio stats
  const totalValue = properties.reduce(
    (sum, property) => sum + (property.currentValue || 0),
    0
  );
  const totalCost = properties.reduce(
    (sum, property) => sum + (property.purchasePrice || 0),
    0
  );
  const totalRental = properties.reduce(
    (sum, property) => sum + (property.rentalIncome || 0),
    0
  );
  const totalGain = totalValue - totalCost;

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProperty(null);
  };

  if (loading) {
    return <PropertiesSkeleton />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <i className="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Failed to Load Properties
          </h3>
          <p className="text-red-600 dark:text-red-300">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="danger"
            size="md"
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Property Portfolio
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your real estate investments
          </p>
        </div>
        <Button
          onClick={handleAddProperty}
          variant="gradient"
          size="lg"
          icon="fa-plus"
        >
          Add Property
        </Button>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <EnhancedGlassCard variant="standard" padding="md" animate animationDelay={0.1} enableLensing hoverable>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total Value
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ${totalValue.toLocaleString()}
          </p>
        </EnhancedGlassCard>
        <EnhancedGlassCard variant="standard" padding="md" animate animationDelay={0.2} enableLensing hoverable>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total Gain/Loss
          </p>
          <p
            className={`text-2xl font-bold ${
              totalGain >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            ${Math.abs(totalGain).toLocaleString()}
          </p>
        </EnhancedGlassCard>
        <EnhancedGlassCard variant="standard" padding="md" animate animationDelay={0.3} enableLensing hoverable>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Monthly Rental
          </p>
          <p className="text-2xl font-bold text-purple-600">
            ${totalRental.toLocaleString()}
          </p>
        </EnhancedGlassCard>
        <EnhancedGlassCard variant="standard" padding="md" animate animationDelay={0.4} enableLensing hoverable>
          <p className="text-sm text-gray-600 dark:text-gray-400">Properties</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {properties.length}
          </p>
        </EnhancedGlassCard>
      </div>

      {/* Properties Grid */}
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Your Properties
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            onEdit={handleEditProperty}
            onDelete={handleDeleteProperty}
          />
        ))}
      </div>

      {/* Empty State */}
      {properties.length === 0 && !loading && (
        <div className="text-center py-12">
          <i className="fas fa-home text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No Properties Yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Add your first property to start tracking your real estate portfolio
          </p>
          <Button
            onClick={handleAddProperty}
            variant="gradient"
            size="lg"
            icon="fa-plus"
          >
            Add Your First Property
          </Button>
        </div>
      )}

      {/* Property Modal */}
      <FullScreenModal
        isOpen={showModal || selectedProperty !== null}
        onClose={handleCloseModal}
      >
        <PropertyModal
          initialData={selectedProperty}
          onSubmit={handleSaveProperty}
          onClose={handleCloseModal}
          error={error}
          currentUserId={currentUser?.id}
        />
      </FullScreenModal>
    </div>
  );
}
