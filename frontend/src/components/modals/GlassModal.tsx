"use client";

import React, { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Import the liquid glass styles
import "../../styles/liquid-glass.css";

export interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export interface GlassModalContentProps {
  children: ReactNode;
  className?: string;
}

export interface GlassModalHeaderProps {
  title: string;
  onClose: () => void;
  className?: string;
}

export interface GlassModalBodyProps {
  children: ReactNode;
  className?: string;
}

export interface GlassModalFooterProps {
  children: ReactNode;
  className?: string;
}

// Size configurations
const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

// Main Glass Modal Component
export function GlassModal({
  isOpen,
  onClose,
  children,
  size = "md",
  className = "",
}: GlassModalProps) {
  const [isBlurActive, setIsBlurActive] = useState(false);

  // Handle modal opening - activate blur after a tiny delay
  useEffect(() => {
    if (isOpen) {
      // Small delay to let DOM update, then activate blur transition
      const timer = setTimeout(() => setIsBlurActive(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsBlurActive(false);
    }
  }, [isOpen]);

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
          {/* Enhanced Backdrop */}
          <motion.div
            className="fixed inset-0"
            style={{
              background: `radial-gradient(circle at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.4) 100%)`,
              backdropFilter: isBlurActive
                ? "blur(32px) saturate(150%)"
                : "blur(0px) saturate(100%)",
              transition: "backdrop-filter 400ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
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

// Glass Modal Content Container
export function GlassModalContent({
  children,
  className = "",
}: GlassModalContentProps) {
  return (
    <div
      className={`liquid-glass--prominent bg-white/25 dark:bg-black/40 backdrop-blur-2xl p-8 rounded-3xl border border-white/30 dark:border-white/20 shadow-2xl relative overflow-hidden ${className}`}
    >
      {/* Top Light Reflection */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

      {/* Subtle Inner Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 rounded-3xl pointer-events-none" />

      <div className="relative z-10">{children}</div>
    </div>
  );
}

// Glass Modal Header
export function GlassModalHeader({
  title,
  onClose,
  className = "",
}: GlassModalHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-6 ${className}`}>
      <h3 className="text-xl font-semibold glass-typography text-gray-900 dark:text-white">
        {title}
      </h3>
      <motion.button
        onClick={onClose}
        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 w-8 h-8 rounded-full hover:bg-white/10 dark:hover:bg-black/20 flex items-center justify-center transition-all"
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
      >
        ✕
      </motion.button>
    </div>
  );
}

// Glass Modal Body
export function GlassModalBody({
  children,
  className = "",
}: GlassModalBodyProps) {
  return (
    <div
      className={`text-gray-600 dark:text-gray-300 leading-relaxed ${className}`}
    >
      {children}
    </div>
  );
}

// Glass Modal Footer
export function GlassModalFooter({
  children,
  className = "",
}: GlassModalFooterProps) {
  return <div className={`flex gap-3 mt-6 ${className}`}>{children}</div>;
}

// Glass Button Components for Modals
export interface GlassButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "default" | "primary" | "success" | "danger";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export function GlassButton({
  children,
  onClick,
  variant = "default",
  className = "",
  ...props
}: GlassButtonProps) {
  const variantClasses = {
    default:
      "glass-button bg-white/15 dark:bg-black/25 backdrop-blur-sm border border-white/25 dark:border-white/15 hover:bg-white/25 dark:hover:bg-black/35 text-gray-900 dark:text-white",
    primary:
      "glass-button--primary bg-gradient-to-r from-blue-600 to-purple-600 text-white backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl",
    success:
      "glass-button--primary bg-gradient-to-r from-green-600 to-emerald-600 text-white backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl",
    danger:
      "glass-button--primary bg-gradient-to-r from-red-600 to-rose-600 text-white backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl",
  };

  return (
    <motion.button
      className={`px-6 py-3 rounded-xl font-medium transition-all flex-1 ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

// Glass Input Component for Forms
export interface GlassInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  className?: string;
}

export function GlassInput({
  label,
  type = "text",
  placeholder,
  className = "",
  ...props
}: GlassInputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        className={`w-full liquid-glass bg-white/20 dark:bg-black/30 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/30 dark:border-white/20 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all ${className}`}
        {...props}
      />
    </div>
  );
}
