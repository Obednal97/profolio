"use client";

import React, { ReactNode } from "react";
import { motion } from "framer-motion";

export interface GlassCardProps {
  children: ReactNode;
  className?: string;

  // Glass Material Variants
  variant?: "subtle" | "standard" | "prominent";

  // Performance-based Tinting
  performance?: number; // Percentage change (positive = green, negative = red)
  enablePerformanceTinting?: boolean;

  // Solid Color Options
  solidColor?:
    | "blue"
    | "purple"
    | "green"
    | "orange"
    | "red"
    | "cyan"
    | "pink"
    | "emerald"
    | "rose";
  gradient?:
    | "blue-cyan"
    | "purple-pink"
    | "green-emerald"
    | "orange-red"
    | "blue-purple"
    | "red-rose";

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

  // Responsive Behavior
  responsive?: boolean;
  mobileStack?: boolean;

  // Visual Effects
  showTopHighlight?: boolean;
  showInnerGlow?: boolean;
  shadowIntensity?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
}

// Utility functions for dynamic styling
const getGlassVariant = (variant: string) => {
  switch (variant) {
    case "subtle":
      return "liquid-glass--subtle bg-white/8 dark:bg-black/15 backdrop-blur-sm border border-white/20 dark:border-white/10 shadow-lg";
    case "prominent":
      return "liquid-glass--prominent bg-white/18 dark:bg-black/35 backdrop-blur-xl border border-white/30 dark:border-white/20 shadow-2xl";
    default:
      return "liquid-glass bg-white/12 dark:bg-black/25 backdrop-blur-md border border-white/25 dark:border-white/15 shadow-xl";
  }
};

const getPerformanceTinting = (performance: number) => {
  if (performance > 0) {
    return "bg-gradient-to-br from-green-500/15 to-emerald-500/15 border-green-500/30";
  } else if (performance < 0) {
    return "bg-gradient-to-br from-red-500/15 to-rose-500/15 border-red-500/30";
  }
  return "";
};

const getSolidColorStyles = (color: string) => {
  const colors = {
    blue: "bg-gradient-to-br from-blue-600/80 to-blue-700/80 text-white",
    purple: "bg-gradient-to-br from-purple-600/80 to-purple-700/80 text-white",
    green: "bg-gradient-to-br from-green-600/80 to-green-700/80 text-white",
    orange: "bg-gradient-to-br from-orange-600/80 to-orange-700/80 text-white",
    red: "bg-gradient-to-br from-red-600/80 to-red-700/80 text-white",
    cyan: "bg-gradient-to-br from-cyan-600/80 to-cyan-700/80 text-white",
    pink: "bg-gradient-to-br from-pink-600/80 to-pink-700/80 text-white",
    emerald:
      "bg-gradient-to-br from-emerald-600/80 to-emerald-700/80 text-white",
    rose: "bg-gradient-to-br from-rose-600/80 to-rose-700/80 text-white",
  };
  return colors[color as keyof typeof colors] || colors.blue;
};

const getGradientStyles = (gradient: string) => {
  const gradients = {
    "blue-cyan": "bg-gradient-to-br from-blue-600/80 to-cyan-600/80 text-white",
    "purple-pink":
      "bg-gradient-to-br from-purple-600/80 to-pink-600/80 text-white",
    "green-emerald":
      "bg-gradient-to-br from-green-600/80 to-emerald-600/80 text-white",
    "orange-red":
      "bg-gradient-to-br from-orange-600/80 to-red-600/80 text-white",
    "blue-purple":
      "bg-gradient-to-br from-blue-600/80 to-purple-600/80 text-white",
    "red-rose": "bg-gradient-to-br from-red-600/80 to-rose-600/80 text-white",
  };
  return (
    gradients[gradient as keyof typeof gradients] || gradients["blue-cyan"]
  );
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

const getShadowClass = (intensity: string) => {
  const shadows = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
    "2xl": "shadow-2xl",
  };
  return shadows[intensity as keyof typeof shadows] || shadows.lg;
};

// Main Glass Card Component
export function GlassCard({
  children,
  className = "",
  variant = "standard",
  performance,
  enablePerformanceTinting = false,
  solidColor,
  gradient,
  padding = "md",
  borderRadius = "lg",
  clickable = false,
  hoverable = true,
  onClick,
  animate = true,
  animationDelay = 0,
  hoverScale = 1.02,
  hoverY = -2,
  responsive = true,
  showTopHighlight = true,
  showInnerGlow = true,
  shadowIntensity = "lg",
  ...props
}: GlassCardProps) {
  // Build the className based on configuration
  let cardClasses = "";

  // Base structure
  cardClasses += "relative overflow-hidden transition-all duration-200 ";

  // Apply solid color or gradient if specified, otherwise use glass variant
  if (solidColor) {
    cardClasses += `${getSolidColorStyles(
      solidColor
    )} backdrop-blur-sm border border-white/30 `;
  } else if (gradient) {
    cardClasses += `${getGradientStyles(
      gradient
    )} backdrop-blur-sm border border-white/30 `;
  } else {
    cardClasses += getGlassVariant(variant) + " ";

    // Apply performance tinting if enabled and performance value provided
    if (enablePerformanceTinting && typeof performance === "number") {
      cardClasses += getPerformanceTinting(performance) + " ";
    }
  }

  // Layout and spacing
  cardClasses += getPaddingClass(padding) + " ";
  cardClasses += getBorderRadiusClass(borderRadius) + " ";
  cardClasses += getShadowClass(shadowIntensity) + " ";

  // Responsive behavior
  if (responsive) {
    cardClasses += "w-full ";
  }

  // Interaction states
  if (clickable || onClick) {
    cardClasses += "cursor-pointer ";
  }

  // Custom className
  cardClasses += className;

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
      data-testid="glass-card"
      {...animationProps}
      {...props}
    >
      {/* Top Light Reflection */}
      {showTopHighlight && (
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      )}

      {/* Subtle Inner Glow */}
      {showInnerGlow && !solidColor && !gradient && (
        <div
          className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none"
          style={{ borderRadius: 'inherit' }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </CardWrapper>
  );
}

// Specialized Card Components
export interface ActionCardProps extends Omit<GlassCardProps, "children"> {
  icon?: ReactNode;
  title: string;
  description?: string;
  onClick: () => void;
}

export function ActionCard({
  icon,
  title,
  description,
  onClick,
  ...props
}: ActionCardProps) {
  return (
    <GlassCard
      clickable
      onClick={onClick}
      animate
      hoverable
      className="group"
      data-testid="action-card"
      {...props}
    >
      <div className="text-center space-y-2">
        {icon && (
          <div className="w-12 h-12 mx-auto bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all">
            {icon}
          </div>
        )}
        <h3 className="font-semibold">{title}</h3>
        {description && <p className="text-sm opacity-90">{description}</p>}
      </div>
    </GlassCard>
  );
}

export interface PerformanceCardProps extends Omit<GlassCardProps, "children"> {
  title: string;
  value: string | number;
  performance: number;
  subtitle?: string;
  icon?: ReactNode;
  showPercentage?: boolean;
}

export function PerformanceCard({
  title,
  value,
  performance,
  subtitle,
  icon,
  showPercentage = true,
  ...props
}: PerformanceCardProps) {
  const performanceColor =
    performance > 0
      ? "text-green-600"
      : performance < 0
      ? "text-red-600"
      : "text-gray-600 dark:text-gray-400";

  return (
    <GlassCard
      enablePerformanceTinting
      performance={performance}
      data-testid="performance-card"
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
          <p
            className={`text-2xl font-bold glass-typography--numbers ${performanceColor}`}
          >
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
    </GlassCard>
  );
}

export interface InfoCardProps extends Omit<GlassCardProps, "children"> {
  title: string;
  content: ReactNode;
  footer?: ReactNode;
}

export function InfoCard({ title, content, footer, ...props }: InfoCardProps) {
  return (
    <GlassCard data-testid="info-card" {...props}>
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        <div className="text-gray-600 dark:text-gray-300">{content}</div>
        {footer && (
          <div className="pt-4 border-t border-white/20 dark:border-white/10">
            {footer}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
