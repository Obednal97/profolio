"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

export interface LiquidGlassCardProps {
  children: React.ReactNode;
  className?: string;
  performance?: number; // Portfolio performance for dynamic tinting
  variant?: "default" | "prominent" | "subtle";
  interactive?: boolean;
}

export function LiquidGlassCard({
  children,
  className = "",
  performance = 0,
  variant = "default",
  interactive = true,
}: LiquidGlassCardProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Dynamic color based on performance
  const getPerformanceColor = () => {
    if (performance > 0) {
      return {
        hue: 120, // Green
        saturation: Math.min(Math.abs(performance) * 2 + 60, 90),
        lightness: 50,
      };
    } else if (performance < 0) {
      return {
        hue: 0, // Red
        saturation: Math.min(Math.abs(performance) * 2 + 60, 90),
        lightness: 50,
      };
    }
    return { hue: 220, saturation: 70, lightness: 50 }; // Default blue
  };

  const performanceColor = getPerformanceColor();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "prominent":
        return "backdrop-blur-[32px] bg-white/20 dark:bg-black/40";
      case "subtle":
        return "backdrop-blur-[12px] bg-white/8 dark:bg-black/20";
      default:
        return "backdrop-blur-[24px] bg-white/12 dark:bg-black/30";
    }
  };

  return (
    <motion.div
      className={`
        liquid-glass-card relative overflow-hidden rounded-2xl
        ${getVariantStyles()}
        border border-white/20 dark:border-white/10
        shadow-lg shadow-black/5 dark:shadow-black/20
        ${interactive ? "cursor-pointer" : ""}
        ${className}
      `}
      style={
        {
          // Dynamic CSS variables for performance-based tinting
          "--performance-hue": performanceColor.hue,
          "--performance-saturation": `${performanceColor.saturation}%`,
          "--performance-lightness": `${performanceColor.lightness}%`,
          "--mouse-x": `${mousePosition.x}%`,
          "--mouse-y": `${mousePosition.y}%`,
        } as React.CSSProperties
      }
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={
        interactive
          ? {
              y: -4,
              scale: 1.02,
              transition: { type: "spring", stiffness: 300, damping: 30 },
            }
          : undefined
      }
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Glass background with performance tinting */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), 
            hsl(var(--performance-hue) var(--performance-saturation) var(--performance-lightness)) 0%, 
            transparent 70%)`,
        }}
      />

      {/* Specular highlight layer */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background: `radial-gradient(circle at var(--mouse-x) var(--mouse-y), 
            rgba(255, 255, 255, 0.3) 0%, 
            rgba(255, 255, 255, 0.1) 30%, 
            transparent 70%)`,
        }}
      />

      {/* Top edge highlight */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      {/* Glass reflection gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

// Example usage component for portfolio cards
interface PortfolioGlassCardProps {
  asset: {
    symbol: string;
    name: string;
    value: number;
    performance: number;
  };
  formatCurrency: (amount: number) => string;
}

export function PortfolioGlassCard({
  asset,
  formatCurrency,
}: PortfolioGlassCardProps) {
  return (
    <LiquidGlassCard performance={asset.performance} className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Asset icon with glass effect */}
          <div className="w-12 h-12 rounded-full backdrop-blur-sm bg-white/20 dark:bg-black/30 border border-white/30 dark:border-white/20 flex items-center justify-center">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {asset.symbol.slice(0, 2)}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {asset.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {asset.symbol}
            </p>
          </div>
        </div>

        {/* Performance indicator */}
        <div
          className={`
          px-3 py-1 rounded-full backdrop-blur-sm border
          ${
            asset.performance > 0
              ? "bg-green-500/20 border-green-500/30 text-green-600 dark:text-green-400"
              : "bg-red-500/20 border-red-500/30 text-red-600 dark:text-red-400"
          }
        `}
        >
          <span className="text-sm font-medium">
            {asset.performance > 0 ? "+" : ""}
            {asset.performance.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Value display with glass typography */}
      <div className="space-y-1">
        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
          {formatCurrency(asset.value)}
        </span>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Current Value
        </p>
      </div>
    </LiquidGlassCard>
  );
}
