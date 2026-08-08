import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { propertyTypeConfig, propertyStatusConfig } from '@/lib/constants/propertyTypes';
import type { Property } from '@/types/global';

interface PropertyManagerCardProps {
  property: Property;
  onEdit: (property: Property) => void;
  onDelete: (id: string) => void;
  formatCurrency: (value: number) => string;
}

export function PropertyManagerCard({
  property,
  onEdit,
  onDelete,
  formatCurrency,
}: PropertyManagerCardProps) {
  const typeConfig =
    propertyTypeConfig[
      property.propertyType as keyof typeof propertyTypeConfig
    ] || propertyTypeConfig.residential;
  
  const statusIcon =
    propertyStatusConfig[property.status as keyof typeof propertyStatusConfig] ||
    propertyStatusConfig.owned;

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
        </div>
      )}

      {/* Financial Metrics */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Value
          </span>
          <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
            {formatCurrency(property.currentValue ?? 0)}
          </span>
        </div>

        {property.rentalIncome && property.rentalIncome > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Monthly Rental
            </span>
            <span className="text-sm sm:text-base font-semibold text-green-600">
              {formatCurrency(property.rentalIncome)}
            </span>
          </div>
        )}

        {/* Show appreciation if purchase price exists */}
        {property.purchasePrice && (
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Appreciation
            </span>
            <span
              className={`text-sm sm:text-base font-semibold ${
                appreciation >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {appreciation >= 0 ? "+" : ""}
              {appreciation.toFixed(1)}%
            </span>
          </div>
        )}

        {/* Cash Flow for rental properties */}
        {property.rentalIncome && property.rentalIncome > 0 && (
          <div className="pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Net Cash Flow
              </span>
              <span
                className={`text-sm sm:text-base font-bold ${
                  netCashFlow >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(netCashFlow)}/mo
              </span>
            </div>
            {monthlyROI > 0 && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Annual ROI
                </span>
                <span className="text-sm sm:text-base font-semibold text-purple-600">
                  {monthlyROI.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}