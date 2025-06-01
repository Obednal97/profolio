'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Property } from '@/types/global';
import { PropertyCard } from '@/components/cards/PropertyCard';
import { useAuth } from '@/lib/unifiedAuth';
import {
  SkeletonCard,
  Skeleton,
  SkeletonStat,
  SkeletonButton
} from '@/components/ui/skeleton';
import { FullScreenModal } from '@/components/modals/modal';
import { PropertyModal } from '@/components/modals/PropertyModal';

// Skeleton component for properties page
function PropertiesSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      {/* Header skeleton */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <SkeletonButton size="lg" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <SkeletonStat key={i} />
        ))}
      </div>

      {/* Properties grid skeleton */}
      <div className="mb-4">
        <Skeleton className="h-8 w-40 mb-4" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <SkeletonCard key={i} className="h-64" />
        ))}
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is in demo mode
  const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('demo-mode') === 'true';
  
  // Use Firebase user data or demo user data
  const currentUser = user ? {
    id: user.id,
    name: user.displayName || user.name || user.email?.split('@')[0] || 'User',
    email: user.email || ''
  } : (isDemoMode ? {
    id: 'demo-user-id',
    name: 'Demo User',
    email: 'demo@profolio.com'
  } : null);

  const fetchProperties = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Add artificial delay to show skeleton
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const { apiCall } = await import('@/lib/mockApi');
      const response = await apiCall('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'READ', userId: currentUser.id }),
      });
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setProperties(data.properties || []);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch properties');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser?.id) {
      fetchProperties();
    }
  }, [currentUser?.id, fetchProperties]);

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
          setProperties(prev => prev.map(p => p.id === propertyData.id ? propertyData : p));
        } else {
          // Add new property
          const newProperty = {
            ...propertyData,
            id: `demo-property-${Date.now()}`,
            userId: 'demo-user'
          };
          setProperties(prev => [...prev, newProperty]);
        }
        setShowModal(false);
        setSelectedProperty(null);
      } else {
        // Real user - save to backend
        const endpoint = propertyData.id ? '/api/properties/update' : '/api/properties/create';
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...propertyData,
            userId: currentUser?.id || ''
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save property');
        }

        const savedProperty = await response.json();
        
        if (propertyData.id) {
          setProperties(prev => prev.map(p => p.id === propertyData.id ? savedProperty : p));
        } else {
          setProperties(prev => [...prev, savedProperty]);
        }
        
        setShowModal(false);
        setSelectedProperty(null);
      }
    } catch (err) {
      console.error('Error saving property:', err);
      setError('Failed to save property');
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      if (isDemoMode) {
        setProperties(prev => prev.filter(p => p.id !== id));
      } else {
        const response = await fetch('/api/properties/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id, userId: currentUser?.id || '' }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete property');
        }

        setProperties(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error('Error deleting property:', err);
      setError('Failed to delete property');
    }
  };

  // Calculate portfolio stats
  const totalValue = properties.reduce((sum, property) => sum + (property.currentValue || 0), 0);
  const totalCost = properties.reduce((sum, property) => sum + (property.purchasePrice || 0), 0);
  const totalRental = properties.reduce((sum, property) => sum + (property.rentalIncome || 0), 0);
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
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
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
        <button
          onClick={handleAddProperty}
          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-2 px-6 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl flex items-center gap-2"
        >
          <i className="fas fa-plus"></i>
          Add Property
        </button>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ${totalValue.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Gain/Loss</p>
          <p className={`text-2xl font-bold ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${Math.abs(totalGain).toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Rental</p>
          <p className="text-2xl font-bold text-purple-600">
            ${totalRental.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Properties</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {properties.length}
          </p>
        </div>
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
          <button
            onClick={handleAddProperty}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
          >
            <i className="fas fa-plus mr-2"></i>
            Add Your First Property
          </button>
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