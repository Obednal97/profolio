import React from 'react';
import { motion } from 'framer-motion';
import type { Asset } from '@/types/global';
import { FinancialCalculator } from '@/lib/financial';
import { Button } from '@/components/ui/button';
import { EnhancedGlassCard } from '@/components/ui/enhanced-glass/EnhancedGlassCard';

interface AssetCardProps {
  asset: Asset;
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => void;
  config: {
    icon: string;
    gradient: string;
  };
  getCryptoIcon?: (symbol: string) => string;
}

export function AssetCard({ asset, onEdit, onDelete, config, getCryptoIcon }: AssetCardProps) {
  // Use crypto-specific icon if it's a crypto asset
  const iconClass = asset.type === 'crypto' && asset.symbol && getCryptoIcon 
    ? getCryptoIcon(asset.symbol) 
    : `fas ${config.icon}`;
  
  const calculateAppreciation = () => {
    if (!asset.purchase_price || !asset.current_value || !asset.quantity) return null;
    
    // Check if current_value is already in dollars or cents
    const currentValueDollars = asset.current_value > 1000
      ? parseFloat(FinancialCalculator.centsToDollars(asset.current_value))
      : asset.current_value;
    const purchasePriceDollars = asset.purchase_price; // Already in dollars
    
    return FinancialCalculator.calculateAssetGainLoss(
      currentValueDollars,
      purchasePriceDollars,
      asset.quantity
    );
  };

  const appreciation = calculateAppreciation();

  return (
    <EnhancedGlassCard
      variant="standard"
      padding="md"
      enableLensing
      hoverable
      animate
      className="touch-manipulation"
      enablePerformanceTinting={!!appreciation}
      performance={appreciation?.percentageChange || 0}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center flex-1 min-w-0">
          <div className={`p-2 sm:p-3 bg-gradient-to-r ${config.gradient} rounded-lg mr-3 sm:mr-4 shadow-lg flex-shrink-0`}>
            <i className={`${iconClass} text-white text-lg sm:text-xl`}></i>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">{asset.name}</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
              {asset.symbol || asset.type?.charAt(0).toUpperCase() + asset.type?.slice(1)}
            </p>
          </div>
        </div>
        <div className="flex space-x-1 sm:space-x-2 flex-shrink-0 ml-2">
          <Button
            onClick={() => onEdit(asset)}
            variant="ghost"
            size="sm"
            icon="fa-edit"
            className="text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
            aria-label="Edit asset"
          />
          <Button
            onClick={() => asset.id && onDelete(asset.id)}
            variant="ghost"
            size="sm"
            icon="fa-trash"
            className="text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
            aria-label="Delete asset"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400 text-sm">Current Value</span>
          <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            {FinancialCalculator.formatCurrency(asset.current_value || 0)}
          </span>
        </div>

        {asset.quantity && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400 text-sm">Quantity</span>
            <span className="text-gray-900 dark:text-white text-sm sm:text-base">{asset.quantity}</span>
          </div>
        )}

        {appreciation && (
          <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400 text-sm">Gain/Loss</span>
            <div className="text-right">
              <div className={`font-semibold text-sm sm:text-base ${appreciation.gain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {appreciation.gain >= 0 ? '+' : ''}{FinancialCalculator.formatCurrency(appreciation.gain)}
              </div>
              <div className={`text-xs sm:text-sm ${appreciation.gain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {FinancialCalculator.formatPercentage(appreciation.gainPercent, 2, true)}
              </div>
            </div>
          </div>
        )}
      </div>
    </EnhancedGlassCard>
  );
} 