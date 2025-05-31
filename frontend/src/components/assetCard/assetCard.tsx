'use client';

import React from 'react';
import { Asset } from '@/types/global';
import { motion } from 'framer-motion';
import { FinancialCalculator } from '@/lib/financial';

// Asset type configuration
const assetTypeConfig = {
  stock: { icon: "fa-chart-line", color: "blue", gradient: "from-blue-500 to-blue-600" },
  crypto: { icon: "fa-bitcoin", color: "orange", gradient: "from-orange-500 to-orange-600" },
  property: { icon: "fa-home", color: "green", gradient: "from-green-500 to-green-600" },
  cash: { icon: "fa-dollar-sign", color: "purple", gradient: "from-purple-500 to-purple-600" },
  savings: { icon: "fa-piggy-bank", color: "emerald", gradient: "from-emerald-500 to-emerald-600" },
  stock_options: { icon: "fa-certificate", color: "pink", gradient: "from-pink-500 to-pink-600" },
  bond: { icon: "fa-chart-area", color: "indigo", gradient: "from-indigo-500 to-indigo-600" },
  other: { icon: "fa-box", color: "gray", gradient: "from-gray-500 to-gray-600" },
};

// Crypto-specific icons
const getCryptoIcon = (symbol: string) => {
  const symbolUpper = symbol?.toUpperCase();
  switch (symbolUpper) {
    case 'BTC':
    case 'BITCOIN':
      return 'fa-bitcoin';
    case 'ETH':
    case 'ETHEREUM':
      return 'fa-ethereum';
    default:
      return 'fa-coins'; // Generic crypto icon for other cryptocurrencies
  }
};

interface AssetCardProps {
  asset: Asset;
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => void;
}

const AssetCard = ({ asset, onEdit, onDelete }: AssetCardProps) => {
  const config = assetTypeConfig[asset.type as keyof typeof assetTypeConfig] || assetTypeConfig.other;
  
  // Use crypto-specific icon if it's a crypto asset
  const iconClass = asset.type === 'crypto' && asset.symbol 
    ? getCryptoIcon(asset.symbol) 
    : config.icon;
  
  const calculateAppreciation = () => {
    if (!asset.purchase_price || !asset.current_value || !asset.quantity) return null;
    
    // Check if current_value is already in dollars or cents
    // If it's a large number (>1000), it's likely in cents
    // If it's a small number (<1000), it's likely already in dollars
    const currentValueDollars = asset.current_value > 1000 
      ? parseFloat(FinancialCalculator.centsToDollars(asset.current_value))
      : asset.current_value;
    
    const purchasePriceDollars = asset.purchase_price; // Already in dollars
    
    // Use the new proper calculation method
    const calculation = FinancialCalculator.calculateAssetGainLoss(
      currentValueDollars, 
      purchasePriceDollars, 
      asset.quantity
    );
    
    // Calculate APY if purchase date is available
    const apy = asset.purchase_date ? 
      FinancialCalculator.calculateAPY(
        currentValueDollars,
        purchasePriceDollars,
        asset.quantity,
        asset.purchase_date
      ) : 0;
    
    // Get time period
    const timePeriod = asset.purchase_date ? 
      FinancialCalculator.getTimeSincePurchase(asset.purchase_date) : '';
    
    return {
      totalInvestment: calculation.totalInvestment,
      gain: calculation.gain,
      gainPercent: calculation.gainPercent,
      apy,
      timePeriod
    };
  };

  const appreciation = calculateAppreciation();

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
        <div className="flex items-center flex-1 min-w-0">
          <div className={`p-2 sm:p-3 bg-gradient-to-r ${config.gradient} rounded-lg mr-3 sm:mr-4 shadow-lg flex-shrink-0`}>
            <i className={`fas ${iconClass} text-white text-lg sm:text-xl`}></i>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">{asset.name}</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
              {asset.symbol || asset.type?.charAt(0).toUpperCase() + asset.type?.slice(1)}
            </p>
          </div>
        </div>
        <div className="flex space-x-1 sm:space-x-2 flex-shrink-0 ml-2">
          <button
            onClick={() => onEdit(asset)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-manipulation"
            aria-label="Edit asset"
          >
            <i className="fas fa-edit text-sm sm:text-base"></i>
          </button>
          <button
            onClick={() => asset.id && onDelete(asset.id)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-manipulation"
            aria-label="Delete asset"
          >
            <i className="fas fa-trash text-sm sm:text-base"></i>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400 text-sm">Current Value</span>
          <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            {FinancialCalculator.formatCurrency(
              asset.current_value && asset.current_value > 1000 
                ? parseFloat(FinancialCalculator.centsToDollars(asset.current_value))
                : asset.current_value || 0
            )}
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
                {appreciation.gain >= 0 ? '+' : ''}
                {FinancialCalculator.formatCurrency(appreciation.gain)}
              </div>
              <div className={`text-xs sm:text-sm ${appreciation.gain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {FinancialCalculator.formatPercentage(appreciation.gainPercent)}
              </div>
            </div>
          </div>
        )}

        {appreciation && appreciation.apy !== 0 && asset.purchase_date && (
          <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400 text-sm">APY</span>
            <div className="text-right">
              <div className={`font-semibold text-sm sm:text-base ${appreciation.apy >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {FinancialCalculator.formatAPY(appreciation.apy)}
              </div>
            </div>
          </div>
        )}

        {appreciation && asset.purchase_date && (
          <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400 text-sm">Held For</span>
            <div className="text-right">
              <div className="font-semibold text-sm sm:text-base text-blue-500">
                {appreciation.timePeriod || 'N/A'}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AssetCard; 