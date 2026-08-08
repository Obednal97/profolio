"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

/**
 * Apple-inspired Glass Toggle Component with Liquid Glass design
 *
 * Features:
 * - Apple's signature capsule design with glass materials
 * - Status indicator capsules (ON/OFF) with dynamic tinting
 * - Smooth spring animations and specular highlights
 * - Full accessibility support with keyboard navigation
 * - Disabled states and custom onChange handling
 *
 * @example
 * ```tsx
 * <GlassToggle
 *   label="Auto-sync"
 *   description="Automatically sync portfolio data"
 *   defaultChecked={true}
 *   onChange={(checked) => console.log('Toggle:', checked)}
 * />
 * ```
 */

export interface GlassToggleProps {
  /** Unique identifier for the toggle (optional) */
  id?: string;
  /** Label text displayed next to the toggle */
  label: string;
  /** Optional description text below the label */
  description?: string;
  /** Initial checked state */
  defaultChecked?: boolean;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Callback fired when toggle state changes */
  onChange?: (checked: boolean) => void;
  /** Additional CSS classes */
  className?: string;
  /** Show status indicator capsule */
  showStatus?: boolean;
}

export function GlassToggle({
  id,
  label,
  description,
  defaultChecked = false,
  disabled = false,
  onChange,
  className = "",
  showStatus = true,
}: GlassToggleProps) {
  const [isChecked, setIsChecked] = useState(defaultChecked);

  const handleToggle = () => {
    if (disabled) return;
    const newValue = !isChecked;
    setIsChecked(newValue);
    onChange?.(newValue);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {label}
          </span>

          {/* Status indicator capsule */}
          {showStatus && (
            <motion.div
              className={`px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-300 ${
                isChecked
                  ? "liquid-glass--performance-positive bg-green-500/20 text-green-600 border border-green-500/30"
                  : "liquid-glass--subtle bg-gray-500/20 text-gray-600 dark:text-gray-400 border border-gray-500/20"
              }`}
              initial={false}
              animate={{
                scale: isChecked ? 1.05 : 1,
                opacity: isChecked ? 1 : 0.7,
              }}
              transition={{ duration: 0.2 }}
            >
              {isChecked ? "ON" : "OFF"}
            </motion.div>
          )}
        </div>

        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </div>

      {/* Apple-style glass toggle */}
      <motion.button
        id={id}
        role="switch"
        aria-checked={isChecked}
        aria-labelledby={id ? `${id}-label` : undefined}
        aria-describedby={id && description ? `${id}-description` : undefined}
        className={`relative w-14 h-8 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 flex items-center ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
        style={{
          background: isChecked
            ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
            : "rgba(156, 163, 175, 0.3)",
          backdropFilter: "blur(12px)",
          border: `1px solid ${
            isChecked ? "rgba(16, 185, 129, 0.4)" : "rgba(156, 163, 175, 0.3)"
          }`,
          boxShadow: isChecked
            ? "0 4px 20px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
            : "0 4px 12px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
          padding: "3px",
        }}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
      >
        {/* Glass toggle handle */}
        <motion.div
          className="w-6 h-6 bg-white rounded-full shadow-lg relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            boxShadow:
              "0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
          }}
          animate={{
            x: isChecked ? 22 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
        >
          {/* Specular highlight */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-full"
            animate={{
              opacity: isChecked ? 1 : 0.6,
            }}
            transition={{ duration: 0.2 }}
          />

          {/* Secondary highlight for glass effect */}
          <div className="absolute top-0.5 left-0.5 w-2 h-2 bg-white/60 rounded-full blur-sm" />
        </motion.div>

        {/* Background glass overlay */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: isChecked
              ? "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%)"
              : "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)",
          }}
        />
      </motion.button>
    </div>
  );
}

export default GlassToggle;
