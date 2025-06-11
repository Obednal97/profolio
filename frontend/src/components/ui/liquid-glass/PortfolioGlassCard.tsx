"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

interface Asset {
  symbol: string;
  name: string;
  value: number;
  performance: number;
}

interface PortfolioGlassCardProps {
  asset: Asset;
  formatCurrency?: (amount: number) => string;
  className?: string;
}

/**
 * Portfolio Card Component using Apple's Liquid Glass Design Language
 *
 * Features:
 * - Dynamic performance-based tinting (green for gains, red for losses)
 * - Liquid glass material with backdrop blur effects
 * - Smooth hover animations and micro-interactions
 * - Adaptive styling for light/dark mode
 * - Accessibility support with reduced motion preferences
 */
export function PortfolioGlassCard({
  asset,
  formatCurrency = (amount) => `£${amount.toLocaleString()}`,
  className = "",
}: PortfolioGlassCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Determine glass variant based on performance
  const performanceVariant =
    asset.performance > 0
      ? "liquid-glass--performance-positive"
      : asset.performance < 0
      ? "liquid-glass--performance-negative"
      : "";

  return (
    <motion.div
      className={`
        glass-card ${performanceVariant} cursor-pointer select-none
        ${className}
      `}
      style={
        {
          "--portfolio-performance": asset.performance,
        } as React.CSSProperties
      }
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{
        y: -6,
        scale: 1.02,
        transition: { type: "spring", stiffness: 400, damping: 25 },
      }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Header with asset info and performance indicator */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Asset Icon with glass effect */}
          <div className="liquid-glass--subtle w-14 h-14 rounded-full flex items-center justify-center border border-white/20">
            <span className="text-lg font-bold glass-typography text-gray-900 dark:text-white">
              {asset.symbol.slice(0, 2).toUpperCase()}
            </span>
          </div>

          {/* Asset Details */}
          <div>
            <h3 className="text-lg font-semibold glass-typography text-gray-900 dark:text-white">
              {asset.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 glass-typography">
              {asset.symbol.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Performance Badge */}
        <motion.div
          className={`
            liquid-glass px-4 py-2 rounded-full border
            ${
              asset.performance > 0
                ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
                : asset.performance < 0
                ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                : "bg-gray-500/10 border-gray-500/20 text-gray-600 dark:text-gray-400"
            }
          `}
          animate={{
            scale: isHovered ? 1.05 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          <span className="text-sm font-medium glass-typography--numbers">
            {asset.performance > 0 ? "+" : ""}
            {asset.performance.toFixed(2)}%
          </span>
        </motion.div>
      </div>

      {/* Asset Value */}
      <div className="space-y-2">
        <motion.span
          className="text-3xl font-bold glass-typography--numbers block bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300"
          animate={{
            scale: isHovered ? 1.02 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          {formatCurrency(asset.value)}
        </motion.span>

        <p className="text-sm text-gray-500 dark:text-gray-400 glass-typography">
          Current Portfolio Value
        </p>
      </div>

      {/* Performance Chart Preview (placeholder) */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 glass-typography">
          <span>24h Performance</span>
          <motion.span
            className={`font-medium ${
              asset.performance > 0
                ? "text-green-600 dark:text-green-400"
                : asset.performance < 0
                ? "text-red-600 dark:text-red-400"
                : "text-gray-600 dark:text-gray-400"
            }`}
            animate={{
              opacity: isHovered ? 1 : 0.8,
            }}
          >
            {asset.performance > 0 ? "↗" : asset.performance < 0 ? "↘" : "→"}
            {Math.abs(asset.performance).toFixed(2)}%
          </motion.span>
        </div>

        {/* Mini performance bar */}
        <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              asset.performance > 0
                ? "bg-green-500"
                : asset.performance < 0
                ? "bg-red-500"
                : "bg-gray-500"
            }`}
            initial={{ width: "0%" }}
            animate={{
              width: `${Math.min(Math.abs(asset.performance) * 10, 100)}%`,
            }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// Example usage component
export function PortfolioGlassGrid() {
  const sampleAssets: Asset[] = [
    { symbol: "AAPL", name: "Apple Inc.", value: 12500, performance: 2.4 },
    { symbol: "GOOGL", name: "Alphabet Inc.", value: 8750, performance: -1.2 },
    { symbol: "TSLA", name: "Tesla Inc.", value: 15200, performance: 5.8 },
    { symbol: "MSFT", name: "Microsoft Corp.", value: 9800, performance: 1.1 },
  ];

  return (
    <div className="space-y-8">
      {/* Header with Glass Effect */}
      <div className="liquid-glass--navigation p-6 rounded-2xl">
        <h2 className="text-2xl font-bold glass-typography text-gray-900 dark:text-white">
          Portfolio Assets
        </h2>
        <p className="text-gray-600 dark:text-gray-300 glass-typography mt-2">
          Your investment portfolio with Apple's Liquid Glass design language
        </p>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {sampleAssets.map((asset, index) => (
          <PortfolioGlassCard
            key={asset.symbol}
            asset={asset}
            className="hover:shadow-2xl hover:shadow-black/10"
          />
        ))}
      </div>

      {/* Action Button with Glass Effect */}
      <div className="flex justify-center">
        <motion.button
          className="glass-button--primary"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Add New Asset
        </motion.button>
      </div>
    </div>
  );
}
