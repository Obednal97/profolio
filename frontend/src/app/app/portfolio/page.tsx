'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Asset } from '@/types/global';
import AssetCard from '@/components/assetCard/assetCard';
import AssetModal from '@/components/assetModal/assetModal';
import { Tile } from '@/components/ui/tile/tile';
import { useAuth } from '@/lib/auth';
import {
  SkeletonCard,
  SkeletonChart,
  Skeleton,
  SkeletonStat,
  SkeletonButton
} from '@/components/ui/skeleton';

// Skeleton component for portfolio page
function PortfolioSkeleton() {
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

      {/* Portfolio overview skeleton */}
      <div className="mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <SkeletonChart height="h-64" />
        </div>
      </div>

      {/* Assets grid skeleton */}
      <div className="mb-4 flex justify-between items-center">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-lg" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <SkeletonCard key={i} className="h-48" />
        ))}
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'value' | 'change' | 'name'>('value');

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

  const fetchAssets = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Add artificial delay to show skeleton
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const { apiCall } = await import('@/lib/mockApi');
      const response = await apiCall('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'READ', userId: currentUser.id }),
      });
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setAssets(data.assets || []);
    } catch (err) {
      console.error('Error fetching assets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser?.id) {
      fetchAssets();
    }
  }, [currentUser?.id, fetchAssets]);

  const handleSaveAsset = async (asset: Asset) => {
    if (!currentUser?.id) return;
    
    try {
      const { apiCall } = await import('@/lib/mockApi');
      const method = asset.id ? 'UPDATE' : 'CREATE';
      const response = await apiCall('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method,
          userId: currentUser.id,
          data: asset,
        }),
      });
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setShowModal(false);
      setSelectedAsset(null);
      fetchAssets();
    } catch (err) {
      console.error('Error saving asset:', err);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!currentUser?.id) return;
    
    try {
      const { apiCall } = await import('@/lib/mockApi');
      const response = await apiCall('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'DELETE',
          userId: currentUser.id,
          id: assetId,
        }),
      });
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      fetchAssets();
    } catch (err) {
      console.error('Error deleting asset:', err);
    }
  };

  // Filter and sort assets
  const filteredAndSortedAssets = assets
    .filter(asset => filter === 'all' || asset.type === filter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'value':
          return (b.current_value || 0) - (a.current_value || 0);
        case 'change':
          const aChange = ((a.current_value || 0) - (a.purchase_price || 0)) / (a.purchase_price || 1);
          const bChange = ((b.current_value || 0) - (b.purchase_price || 0)) / (b.purchase_price || 1);
          return bChange - aChange;
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        default:
          return 0;
      }
    });

  // Calculate portfolio stats
  const totalValue = assets.reduce((sum, asset) => sum + (asset.current_value || 0), 0);
  const totalCost = assets.reduce((sum, asset) => sum + (asset.purchase_price || 0), 0);
  const totalGain = totalValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  if (loading) {
    return <PortfolioSkeleton />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <i className="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Failed to Load Portfolio
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
            Portfolio
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track and manage your investment portfolio
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedAsset(null);
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <i className="fas fa-plus"></i>
          Add Asset
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
          <p className="text-sm text-gray-600 dark:text-gray-400">Return</p>
          <p className={`text-2xl font-bold ${totalGainPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalGainPercent.toFixed(2)}%
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">Assets</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {assets.length}
          </p>
        </div>
      </div>

      {/* Asset Allocation Chart Placeholder */}
      <div className="mb-8">
        <Tile>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Asset Allocation
          </h2>
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <i className="fas fa-chart-pie text-6xl opacity-20"></i>
          </div>
        </Tile>
      </div>

      {/* Filters and Sort */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Your Assets
        </h2>
        <div className="flex flex-wrap gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Types</option>
            <option value="stock">Stocks</option>
            <option value="crypto">Crypto</option>
            <option value="cash">Cash</option>
            <option value="stock_options">Options</option>
            <option value="bond">Bonds</option>
            <option value="other">Other</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'value' | 'change' | 'name')}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="value">Sort by Value</option>
            <option value="change">Sort by Change</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </div>

      {/* Assets Grid */}
      {filteredAndSortedAssets.length === 0 ? (
        <div className="text-center py-12">
          <i className="fas fa-inbox text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
            {filter === 'all' ? 'No assets found' : `No ${filter} assets found`}
          </p>
          <button
            onClick={() => {
              setSelectedAsset(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Your First Asset
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onEdit={() => {
                setSelectedAsset(asset);
                setShowModal(true);
              }}
              onDelete={() => handleDeleteAsset(asset.id!)}
            />
          ))}
        </div>
      )}

      {/* Asset Modal */}
      {showModal && (
        <AssetModal
          asset={selectedAsset}
          onSave={handleSaveAsset}
          onClose={() => {
            setShowModal(false);
            setSelectedAsset(null);
          }}
        />
      )}
    </div>
  );
} 