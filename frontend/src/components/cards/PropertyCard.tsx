'use client';

import React from 'react';
import { Property } from '@/types/global';
import { motion } from 'framer-motion';

interface PropertyCardProps {
  property: Property;
  onEdit: (property: Property) => void;
  onDelete: (id: string) => void;
}

const propertyTypeConfig = {
  single_family: { icon: "fa-home", color: "#3b82f6", gradient: "from-blue-500 to-blue-600" },
  condo: { icon: "fa-building", color: "#10b981", gradient: "from-green-500 to-green-600" },
  townhouse: { icon: "fa-city", color: "#8b5cf6", gradient: "from-purple-500 to-purple-600" },
  multi_family: { icon: "fa-building", color: "#f59e0b", gradient: "from-orange-500 to-orange-600" },
  commercial: { icon: "fa-store", color: "#ec4899", gradient: "from-pink-500 to-pink-600" },
  land: { icon: "fa-mountain", color: "#6366f1", gradient: "from-indigo-500 to-indigo-600" },
};

const statusConfig = {
  owned: { icon: "fa-key", color: "text-blue-500" },
  rental: { icon: "fa-handshake", color: "text-green-500" },
  rented: { icon: "fa-user", color: "text-purple-500" },
  sold: { icon: "fa-tag", color: "text-gray-500" },
};

export function PropertyCard({ property, onEdit, onDelete }: PropertyCardProps) {
  const typeConfig = propertyTypeConfig[property.propertyType as keyof typeof propertyTypeConfig] || propertyTypeConfig.single_family;
  const statusInfo = statusConfig[property.status as keyof typeof statusConfig] || statusConfig.owned;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateROI = () => {
    if (!property.purchasePrice || !property.rentalIncome) return null;
    const annualIncome = property.rentalIncome * 12;
    const roi = (annualIncome / property.purchasePrice) * 100;
    return roi.toFixed(1);
  };

  const calculateAppreciation = () => {
    if (!property.purchasePrice || !property.currentValue) return null;
    const appreciation = ((property.currentValue - property.purchasePrice) / property.purchasePrice) * 100;
    return appreciation.toFixed(1);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 shadow-lg hover:shadow-xl"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start flex-1 min-w-0">
          <div className={`p-3 bg-gradient-to-r ${typeConfig.gradient} rounded-lg mr-4 shadow-lg flex-shrink-0`}>
            <i className={`fas ${typeConfig.icon} text-white text-xl`}></i>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
              {property.address}
            </h3>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-600 dark:text-gray-400 capitalize">
                {property.propertyType?.replace('_', ' ')}
              </span>
              <span className={`flex items-center ${statusInfo.color}`}>
                <i className={`fas ${statusInfo.icon} mr-1`}></i>
                {property.status}
              </span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2 flex-shrink-0 ml-2">
          <button
            onClick={() => onEdit(property)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            aria-label="Edit property"
          >
            <i className="fas fa-edit"></i>
          </button>
          <button
            onClick={() => property.id && onDelete(property.id)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            aria-label="Delete property"
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>

      {/* Property Details */}
      {(property.bedrooms || property.bathrooms || property.squareFootage || property.yearBuilt) && (
        <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
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
            <p className="text-gray-600 dark:text-gray-400 text-sm">Current Value</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(property.currentValue || 0)}
            </p>
          </div>
          {property.rentalIncome && (
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Monthly Income</p>
              <p className="text-xl font-bold text-green-500">
                {formatCurrency(property.rentalIncome)}
              </p>
            </div>
          )}
        </div>

        {/* Financial Metrics */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
          {calculateAppreciation() && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Appreciation</span>
              <span className={`font-semibold ${parseFloat(calculateAppreciation()!) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {parseFloat(calculateAppreciation()!) >= 0 ? '+' : ''}{calculateAppreciation()}%
              </span>
            </div>
          )}

          {calculateROI() && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Annual ROI</span>
              <span className="font-semibold text-blue-500">
                {calculateROI()}%
              </span>
            </div>
          )}

          {property.mortgageAmount && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400 text-sm">Mortgage Balance</span>
              <span className="text-orange-500 font-medium">
                {formatCurrency(property.mortgageAmount)}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
} 