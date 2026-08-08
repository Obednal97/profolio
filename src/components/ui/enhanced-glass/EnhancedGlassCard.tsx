"use client";

import React, { useState, ReactNode } from "react";
import { motion } from "framer-motion";

export interface EnhancedGlassCardProps {
  children: ReactNode;
  className?: string;

  // Glass Material Variants
  variant?: "subtle" | "standard" | "prominent" | "clear";

  // Performance-based Tinting
  performance?: number;
  enablePerformanceTinting?: boolean;

  // Layout & Spacing
  padding?: "sm" | "md" | "lg" | "xl";
  borderRadius?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

  // Interaction States
  clickable?: boolean;
  hoverable?: boolean;
  onClick?: () => void;

  // Animation Options
  animate?: boolean;
  animationDelay?: number;
  hoverScale?: number;
  hoverY?: number;

  // Advanced Glass Effects
  enableLensing?: boolean;
  enablePrismaticEdge?: boolean;
  
  // Data attributes for testing
  "data-testid"?: string;
}

// Get glass variant classes with proper dark mode support
const getGlassVariant = (variant: string) => {
  switch (variant) {
    case "subtle":
      return "backdrop-blur-sm bg-white/3 dark:bg-black/10 border border-white/10 dark:border-white/5 shadow-lg";
    case "prominent":
      return "backdrop-blur-3xl bg-white/20 dark:bg-white/10 border border-white/30 dark:border-white/20 shadow-2xl";
    case "clear":
      return "backdrop-blur-sm bg-white/2 dark:bg-black/5 border border-white/5 dark:border-white/3 shadow-lg";
    default: // standard
      return "backdrop-blur-2xl bg-white/5 dark:bg-black/15 border border-white/15 dark:border-white/8 shadow-xl";
  }
};

// Get performance tinting with improved colors
const getPerformanceTinting = (performance: number) => {
  const isPositive = performance > 0;
  const magnitude = Math.abs(performance);
  const intensity = Math.min(magnitude * 2, 20); // Cap at 20% opacity
  
  if (isPositive) {
    return `bg-gradient-to-br from-green-500/${intensity} to-emerald-500/${intensity} border-green-500/30`;
  } else if (performance < 0) {
    return `bg-gradient-to-br from-red-500/${intensity} to-rose-500/${intensity} border-red-500/30`;
  }
  return "";
};

const getPaddingClass = (padding: string) => {
  const paddings = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
    xl: "p-10",
  };
  return paddings[padding as keyof typeof paddings] || paddings.md;
};

const getBorderRadiusClass = (radius: string) => {
  const radii = {
    sm: "rounded-lg",
    md: "rounded-xl",
    lg: "rounded-2xl",
    xl: "rounded-3xl",
    "2xl": "rounded-3xl",
    "3xl": "rounded-3xl",
  };
  return radii[radius as keyof typeof radii] || radii.lg;
};

export function EnhancedGlassCard({
  children,
  className = "",
  variant = "standard",
  performance,
  enablePerformanceTinting = false,
  padding = "md",
  borderRadius = "lg",
  clickable = false,
  hoverable = true,
  onClick,
  animate = true,
  animationDelay = 0,
  hoverScale = 1.02,
  hoverY = -2,
  enableLensing = true,
  enablePrismaticEdge = false,
  "data-testid": dataTestId,
  ...props
}: EnhancedGlassCardProps) {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  // Build the className
  let cardClasses = "relative overflow-hidden transition-all duration-200 ";
  cardClasses += getGlassVariant(variant) + " ";
  
  // Apply performance tinting if enabled
  if (enablePerformanceTinting && typeof performance === "number") {
    cardClasses += getPerformanceTinting(performance) + " ";
  }
  
  cardClasses += getPaddingClass(padding) + " ";
  cardClasses += getBorderRadiusClass(borderRadius) + " ";
  
  if (clickable || onClick) {
    cardClasses += "cursor-pointer ";
  }
  
  cardClasses += className;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableLensing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const CardWrapper = animate ? motion.div : "div";

  const animationProps = animate
    ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: {
          duration: 0.5,
          delay: animationDelay,
          ease: "easeOut",
        },
        ...(hoverable && {
          whileHover: {
            scale: hoverScale,
            y: hoverY,
            transition: { duration: 0.2 },
          },
        }),
        ...(clickable && {
          whileTap: { scale: 0.98 },
        }),
      }
    : {};

  return (
    <CardWrapper
      className={cardClasses}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      data-testid={dataTestId || "enhanced-glass-card"}
      style={{
        background: enableLensing
          ? `
            linear-gradient(
              135deg,
              rgba(255,255,255,0.08) 0%,
              rgba(255,255,255,0.04) 50%,
              rgba(255,255,255,0.01) 100%
            ),
            radial-gradient(
              circle at ${mousePos.x}% ${mousePos.y}%,
              rgba(255,255,255,0.06),
              transparent 40%
            )
          `
          : undefined,
      }}
      {...animationProps}
      {...props}
    >
      {/* Lensing Effect - only if enabled */}
      {enableLensing && (
        <motion.div
          className="absolute inset-0 opacity-20 pointer-events-none"
          animate={{
            opacity: [0.15, 0.2, 0.15],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            background: `
              radial-gradient(
                circle at ${mousePos.x}% ${mousePos.y}%,
                rgba(100,150,255,0.15),
                rgba(150,100,255,0.08) 25%,
                transparent 50%
              )
            `,
            filter: "blur(10px) contrast(1.05)",
            mixBlendMode: "screen",
          }}
        />
      )}
      
      {/* Prismatic Edge Effect - only if enabled */}
      {enablePrismaticEdge && (
        <div
          className={`absolute inset-0 ${getBorderRadiusClass(borderRadius)} pointer-events-none`}
          style={{
            background: `
              conic-gradient(
                from ${mousePos.x * 3.6}deg at ${mousePos.x}% ${mousePos.y}%,
                rgba(255,0,0,0.05),
                rgba(255,128,0,0.05),
                rgba(255,255,0,0.05),
                rgba(0,255,0,0.05),
                rgba(0,255,255,0.05),
                rgba(0,0,255,0.05),
                rgba(255,0,255,0.05),
                rgba(255,0,0,0.05)
              )
            `,
            opacity: 0.3,
            mixBlendMode: "overlay",
          }}
        />
      )}
      
      {/* Top Light Reflection */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </CardWrapper>
  );
}

// Specialized Performance Card using Enhanced Glass
export interface EnhancedPerformanceCardProps extends Omit<EnhancedGlassCardProps, "children"> {
  title: string;
  value: string | number;
  performance: number;
  subtitle?: string;
  icon?: ReactNode;
  showPercentage?: boolean;
}

export function EnhancedPerformanceCard({
  title,
  value,
  performance,
  subtitle,
  icon,
  showPercentage = true,
  ...props
}: EnhancedPerformanceCardProps) {
  const performanceColor =
    performance > 0
      ? "text-green-600 dark:text-green-400"
      : performance < 0
      ? "text-red-600 dark:text-red-400"
      : "text-gray-600 dark:text-gray-400";

  return (
    <EnhancedGlassCard
      enablePerformanceTinting
      performance={performance}
      data-testid="enhanced-performance-card"
      {...props}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {title}
          </span>
          {icon && <div className={performanceColor}>{icon}</div>}
        </div>

        <div>
          <p className={`text-2xl font-bold ${performanceColor}`}>
            {typeof value === "number" ? `£${value.toLocaleString()}` : value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {showPercentage && (
          <div className={`text-sm font-medium ${performanceColor}`}>
            {performance > 0 ? "+" : ""}
            {performance.toFixed(1)}%
          </div>
        )}
      </div>
    </EnhancedGlassCard>
  );
}