'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { asCents, toDollars, type Cents } from '@/lib/moneyUnits';

interface NetWorthDisplayProps {
  /**
   * CENTS, like every money value the API returns. This component formatted its
   * props with toLocaleString directly, so it never went through a
   * unit-checked formatter and rendered cents as if they were pounds - a net
   * worth of GBP 1,091,760 appeared as GBP 109,176,000.
   */
  totalAssets: Cents;
  totalLiabilities: Cents;
  showTaxToggle?: boolean;
  loading?: boolean;
}

export default function NetWorthDisplay({
  totalAssets,
  totalLiabilities,
  showTaxToggle = false,
  loading = false,
}: NetWorthDisplayProps) {
  const [showAfterTax, setShowAfterTax] = useState(false);
  const taxRate = 0.25; // Simplified 25% tax rate

  // Subtracted in cents, so the arithmetic is exact; converted once, below.
  const netWorth = asCents(totalAssets - totalLiabilities);
  const afterTaxNetWorth = asCents(Math.round(netWorth * (1 - taxRate)));
  const displayValue = showAfterTax ? afterTaxNetWorth : netWorth;

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-8 text-white">
        <div className="text-center">
          <Skeleton className="h-6 w-32 mx-auto mb-4 bg-white/20" />
          <Skeleton className="h-12 w-48 mx-auto mb-2 bg-white/20" />
          <Skeleton className="h-4 w-40 mx-auto bg-white/20" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-8 text-white shadow-xl"
    >
      <div className="text-center">
        <h2 className="text-lg font-medium mb-2 opacity-90">
          Total Net Worth {showAfterTax && '(After Tax)'}
        </h2>
        <div className="text-4xl md:text-5xl font-bold mb-4">
          ${toDollars(displayValue).toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </div>
        <div className="flex items-center justify-center gap-6 text-sm">
          <div>
            <span className="opacity-75">Assets:</span>{' '}
            <span className="font-semibold">
              ${toDollars(totalAssets).toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
          <div className="w-px h-4 bg-white/30" />
          <div>
            <span className="opacity-75">Liabilities:</span>{' '}
            <span className="font-semibold">
              ${toDollars(totalLiabilities).toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
        </div>
        {showTaxToggle && (
          <button
            onClick={() => setShowAfterTax(!showAfterTax)}
            className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
          >
            {showAfterTax ? 'Show Pre-Tax' : 'Show After Tax'}
          </button>
        )}
      </div>
    </motion.div>
  );
} 