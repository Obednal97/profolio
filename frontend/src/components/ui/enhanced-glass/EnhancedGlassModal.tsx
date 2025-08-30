"use client";

import React, { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface EnhancedGlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
  enableProgressiveBlur?: boolean;
  blurIntensity?: number; // Max blur in pixels
  overlayOpacity?: number;
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-7xl",
};

export function EnhancedGlassModal({
  isOpen,
  onClose,
  children,
  size = "md",
  className = "",
  enableProgressiveBlur = true,
  blurIntensity = 40,
  overlayOpacity = 0.3,
}: EnhancedGlassModalProps) {
  const [blurAmount, setBlurAmount] = useState(0);

  useEffect(() => {
    if (isOpen && enableProgressiveBlur) {
      // Progressive blur animation
      const steps = [0, 8, 16, 24, 32, blurIntensity];
      let currentStep = 0;
      const interval = setInterval(() => {
        if (currentStep < steps.length) {
          setBlurAmount(steps[currentStep]);
          currentStep++;
        } else {
          clearInterval(interval);
        }
      }, 50);
      return () => clearInterval(interval);
    } else if (isOpen) {
      setBlurAmount(blurIntensity);
    } else {
      setBlurAmount(0);
    }
  }, [isOpen, enableProgressiveBlur, blurIntensity]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {/* Enhanced Backdrop with Progressive Blur */}
          <motion.div
            className="fixed inset-0"
            style={{
              background: `radial-gradient(circle at center, rgba(0,0,0,${overlayOpacity}) 0%, rgba(0,0,0,${overlayOpacity * 1.5}) 100%)`,
              backdropFilter: `blur(${blurAmount}px) saturate(150%)`,
              WebkitBackdropFilter: `blur(${blurAmount}px) saturate(150%)`,
              transition: "backdrop-filter 100ms ease-out",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            className={`relative ${sizeClasses[size]} w-full ${className}`}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export interface EnhancedGlassModalContentProps {
  children: ReactNode;
  className?: string;
  showShimmer?: boolean;
}

export function EnhancedGlassModalContent({
  children,
  className = "",
  showShimmer = true,
}: EnhancedGlassModalContentProps) {
  return (
    <div className={`relative backdrop-blur-2xl bg-white/25 dark:bg-white/10 p-8 rounded-3xl border border-white/30 dark:border-white/20 shadow-2xl overflow-hidden ${className}`}>
      
      {/* Subtle Shimmer Effect */}
      {showShimmer && (
        <motion.div
          className="absolute inset-0 opacity-10 pointer-events-none"
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 60%)",
              "radial-gradient(circle at 80% 50%, rgba(255,255,255,0.15) 0%, transparent 60%)",
              "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 60%)",
            ],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
      
      {/* Glass Refraction Layer */}
      <div className="absolute inset-0 backdrop-blur-sm bg-gradient-to-br from-white/5 dark:from-black/10 to-transparent rounded-3xl pointer-events-none" />
      
      {/* Top Light Reflection */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 dark:via-white/30 to-transparent"
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      />
      
      {/* Additional Glass Effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/5 dark:to-black/10 pointer-events-none" />
      
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export interface EnhancedGlassModalHeaderProps {
  title: string;
  onClose: () => void;
  className?: string;
  showCloseButton?: boolean;
}

export function EnhancedGlassModalHeader({
  title,
  onClose,
  className = "",
  showCloseButton = true,
}: EnhancedGlassModalHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-6 ${className}`}>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      {showCloseButton && (
        <motion.button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 dark:bg-black/20 backdrop-blur-sm border border-white/20 hover:bg-white/20 dark:hover:bg-black/30 flex items-center justify-center transition-all"
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Close modal"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </motion.button>
      )}
    </div>
  );
}

export interface EnhancedGlassModalBodyProps {
  children: ReactNode;
  className?: string;
}

export function EnhancedGlassModalBody({
  children,
  className = "",
}: EnhancedGlassModalBodyProps) {
  return (
    <div className={`text-gray-600 dark:text-gray-300 leading-relaxed ${className}`}>
      {children}
    </div>
  );
}

export interface EnhancedGlassModalFooterProps {
  children: ReactNode;
  className?: string;
  alignment?: "left" | "center" | "right";
}

export function EnhancedGlassModalFooter({
  children,
  className = "",
  alignment = "right",
}: EnhancedGlassModalFooterProps) {
  const alignmentClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  };

  return (
    <div className={`flex gap-3 mt-6 ${alignmentClasses[alignment]} ${className}`}>
      {children}
    </div>
  );
}

// Enhanced Glass Button for Modals
export interface EnhancedGlassButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "default" | "primary" | "success" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export function EnhancedGlassButton({
  children,
  onClick,
  variant = "default",
  size = "md",
  className = "",
  disabled = false,
  type = "button",
}: EnhancedGlassButtonProps) {
  const variantClasses = {
    default: "bg-white/10 dark:bg-black/20 backdrop-blur-sm border border-white/20 hover:bg-white/20 dark:hover:bg-black/30 text-gray-900 dark:text-white",
    primary: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl",
    success: "bg-gradient-to-r from-green-600 to-emerald-600 text-white backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl",
    danger: "bg-gradient-to-r from-red-600 to-rose-600 text-white backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl",
    ghost: "bg-transparent hover:bg-white/10 dark:hover:bg-black/20 text-gray-900 dark:text-white",
  };

  const sizeClasses = {
    sm: "px-4 py-1.5 text-sm",
    md: "px-6 py-2 text-sm",
    lg: "px-8 py-3",
  };

  return (
    <motion.button
      className={`${sizeClasses[size]} rounded-xl font-medium transition-all ${variantClasses[variant]} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
      onClick={onClick}
      disabled={disabled}
      type={type}
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
    >
      {children}
    </motion.button>
  );
}

// Enhanced Glass Input for Modal Forms
export interface EnhancedGlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  className?: string;
}

export function EnhancedGlassInput({
  label,
  error,
  className = "",
  ...props
}: EnhancedGlassInputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-white/10 dark:bg-black/20 backdrop-blur-sm px-4 py-2.5 rounded-xl border ${
          error
            ? "border-red-500/50 focus:border-red-500"
            : "border-white/20 dark:border-white/10 focus:border-blue-500/50"
        } focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all ${className}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}