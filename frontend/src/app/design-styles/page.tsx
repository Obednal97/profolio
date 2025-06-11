"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Settings,
  BarChart3,
  Wallet,
} from "lucide-react";

// Import our liquid glass styles
import "../../styles/liquid-glass.css";

// Import the reusable GlassToggle component
import { GlassToggle } from "../../components/ui/glass-toggle";

export default function DesignStylesPage() {
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark">("light");
  const [performanceValue, setPerformanceValue] = useState(2.4);

  // Apply dark mode to document root
  useEffect(() => {
    if (selectedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Cleanup on unmount
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, [selectedTheme]);

  // Mock portfolio data for demonstrations
  const mockAssets = [
    { symbol: "AAPL", name: "Apple Inc.", value: 12500, performance: 2.4 },
    { symbol: "GOOGL", name: "Alphabet Inc.", value: 8750, performance: -1.2 },
    { symbol: "TSLA", name: "Tesla Inc.", value: 15200, performance: 5.8 },
    { symbol: "MSFT", name: "Microsoft Corp.", value: 9800, performance: -0.5 },
  ];

  const formatCurrency = (amount: number) => `£${amount.toLocaleString()}`;

  return (
    <div className="min-h-screen transition-all duration-500">
      {/* Background with animated gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-pulse" />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="liquid-glass--navigation bg-white/10 dark:bg-black/20 backdrop-blur-xl p-4 m-4 rounded-2xl border border-white/20 dark:border-white/10 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="liquid-glass bg-white/20 dark:bg-black/30 w-12 h-12 rounded-xl flex items-center justify-center border border-white/30 dark:border-white/20">
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  P
                </span>
              </div>
              <div>
                <h1 className="text-xl font-bold glass-typography text-gray-900 dark:text-white">
                  Profolio Design System
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Apple Liquid Glass Components
                </p>
              </div>
            </div>

            {/* Theme Toggle */}
            <div className="flex items-center gap-4">
              <button
                onClick={() =>
                  setSelectedTheme(selectedTheme === "light" ? "dark" : "light")
                }
                className="glass-button bg-white/20 dark:bg-black/30 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30 dark:border-white/20 hover:bg-white/30 dark:hover:bg-black/40 transition-all text-gray-900 dark:text-white"
              >
                {selectedTheme === "light" ? "🌙" : "☀️"}{" "}
                {selectedTheme === "light" ? "Dark" : "Light"}
              </button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 space-y-12">
          {/* Introduction */}
          <section className="glass-card bg-white/15 dark:bg-black/25 backdrop-blur-xl p-8 rounded-2xl border border-white/20 dark:border-white/10 shadow-xl max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold glass-typography--large mb-4 text-gray-900 dark:text-white">
              Apple Liquid Glass Design Language
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Explore our implementation of Apple&apos;s revolutionary Liquid
              Glass design system, featuring translucent materials, dynamic
              tinting, and premium visual effects designed specifically for
              financial applications.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="liquid-glass--subtle bg-white/10 dark:bg-black/20 backdrop-blur-sm p-4 rounded-xl border border-white/20 dark:border-white/10">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                  Translucent Materials
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Glass-like surfaces with real-world physics
                </p>
              </div>
              <div className="liquid-glass--subtle bg-white/10 dark:bg-black/20 backdrop-blur-sm p-4 rounded-xl border border-white/20 dark:border-white/10">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                  Dynamic Tinting
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Performance-based color adaptation
                </p>
              </div>
              <div className="liquid-glass--subtle bg-white/10 dark:bg-black/20 backdrop-blur-sm p-4 rounded-xl border border-white/20 dark:border-white/10">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                  Depth & Hierarchy
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Visual Z-placement without hard borders
                </p>
              </div>
            </div>
          </section>

          {/* Glass Material Variants */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold glass-typography text-gray-900 dark:text-white">
              Glass Material Variants
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="liquid-glass--subtle bg-white/8 dark:bg-black/15 backdrop-blur-sm p-6 rounded-2xl border border-white/20 dark:border-white/10 shadow-lg">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                  Subtle Glass
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Light blur effect for background elements
                </p>
                <code className="text-xs bg-black/10 dark:bg-white/10 px-2 py-1 rounded text-gray-800 dark:text-gray-200">
                  .liquid-glass--subtle
                </code>
              </div>

              <div className="liquid-glass bg-white/12 dark:bg-black/25 backdrop-blur-md p-6 rounded-2xl border border-white/25 dark:border-white/15 shadow-xl">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                  Standard Glass
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Default glass material for most components
                </p>
                <code className="text-xs bg-black/10 dark:bg-white/10 px-2 py-1 rounded text-gray-800 dark:text-gray-200">
                  .liquid-glass
                </code>
              </div>

              <div className="liquid-glass--prominent bg-white/18 dark:bg-black/35 backdrop-blur-xl p-6 rounded-2xl border border-white/30 dark:border-white/20 shadow-2xl">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                  Prominent Glass
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  High-impact glass for modals and CTAs
                </p>
                <code className="text-xs bg-black/10 dark:bg-white/10 px-2 py-1 rounded text-gray-800 dark:text-gray-200">
                  .liquid-glass--prominent
                </code>
              </div>
            </div>
          </section>

          {/* Portfolio Performance Cards */}
          <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold glass-typography text-gray-900 dark:text-white">
                Portfolio Performance Cards
              </h2>
              <div className="liquid-glass--subtle bg-white/10 dark:bg-black/20 backdrop-blur-sm p-3 rounded-xl border border-white/20 dark:border-white/10">
                <label className="text-sm font-medium mr-2 text-gray-900 dark:text-white">
                  Performance:
                </label>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.1"
                  value={performanceValue}
                  onChange={(e) =>
                    setPerformanceValue(parseFloat(e.target.value))
                  }
                  className="w-32 accent-blue-500"
                />
                <span className="ml-2 text-sm font-mono text-gray-900 dark:text-white">
                  {performanceValue.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockAssets.map((asset, index) => (
                <PortfolioGlassCard
                  key={asset.symbol}
                  asset={{
                    ...asset,
                    performance:
                      index === 0 ? performanceValue : asset.performance,
                  }}
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>
          </section>

          {/* Interactive Elements */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold glass-typography text-gray-900 dark:text-white">
              Interactive Elements
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="glass-button--primary bg-gradient-to-r from-blue-600 to-purple-600 text-white backdrop-blur-sm px-6 py-3 rounded-xl border border-white/30 shadow-lg hover:shadow-xl transition-all flex items-center justify-center">
                <Plus className="w-4 h-4 mr-2" />
                Add Asset
              </button>

              <button className="glass-button bg-white/15 dark:bg-black/25 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/25 dark:border-white/15 hover:bg-white/25 dark:hover:bg-black/35 transition-all text-gray-900 dark:text-white flex items-center justify-center">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </button>

              <button className="glass-button bg-white/15 dark:bg-black/25 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/25 dark:border-white/15 hover:bg-white/25 dark:hover:bg-black/35 transition-all text-gray-900 dark:text-white flex items-center justify-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </button>

              <button className="glass-button bg-white/15 dark:bg-black/25 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/25 dark:border-white/15 hover:bg-white/25 dark:hover:bg-black/35 transition-all text-gray-900 dark:text-white flex items-center justify-center">
                <Wallet className="w-4 h-4 mr-2" />
                Portfolio
              </button>
            </div>
          </section>

          {/* Apple Glass Toggle Controls */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold glass-typography text-gray-900 dark:text-white">
              Apple Glass Toggle Controls
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Capsule-style toggles with Apple&apos;s Liquid Glass design,
              featuring status indicators and smooth state transitions.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="liquid-glass bg-white/12 dark:bg-black/25 backdrop-blur-md p-6 rounded-2xl border border-white/25 dark:border-white/15 shadow-xl">
                <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">
                  Auto-sync Data
                </h3>
                <GlassToggle
                  label="Auto-sync"
                  description="Automatically sync portfolio data"
                  defaultChecked={true}
                />
              </div>

              <div className="liquid-glass bg-white/12 dark:bg-black/25 backdrop-blur-md p-6 rounded-2xl border border-white/25 dark:border-white/15 shadow-xl">
                <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">
                  Push Notifications
                </h3>
                <GlassToggle
                  label="Notifications"
                  description="Get alerts for portfolio changes"
                  defaultChecked={false}
                />
              </div>

              <div className="liquid-glass bg-white/12 dark:bg-black/25 backdrop-blur-md p-6 rounded-2xl border border-white/25 dark:border-white/15 shadow-xl">
                <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">
                  Dark Mode
                </h3>
                <GlassToggle
                  label="Dark Mode"
                  description="Enable dark theme"
                  defaultChecked={selectedTheme === "dark"}
                  onChange={(checked) =>
                    setSelectedTheme(checked ? "dark" : "light")
                  }
                />
              </div>
            </div>

            {/* Toggle States Demo */}
            <div className="liquid-glass bg-white/8 dark:bg-black/20 backdrop-blur-sm p-6 rounded-2xl border border-white/20 dark:border-white/10">
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">
                Toggle State Examples
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    Off State
                  </p>
                  <GlassToggle
                    label="Disabled"
                    defaultChecked={false}
                    disabled
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    On State
                  </p>
                  <GlassToggle label="Enabled" defaultChecked={true} disabled />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    Interactive
                  </p>
                  <GlassToggle label="Toggle me" defaultChecked={false} />
                </div>
              </div>
            </div>
          </section>

          {/* Performance Tinting Demo */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold glass-typography text-gray-900 dark:text-white">
              Performance-Based Tinting
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="liquid-glass--performance-positive bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-md p-6 rounded-2xl border border-green-500/30 shadow-xl">
                <TrendingUp className="w-8 h-8 text-green-600 mb-4" />
                <h3 className="font-semibold text-green-600 mb-2">
                  Positive Performance
                </h3>
                <p className="glass-typography--numbers text-2xl font-bold text-green-600">
                  +5.8%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  Green tinting for gains
                </p>
              </div>

              <div className="liquid-glass bg-white/12 dark:bg-black/25 backdrop-blur-md p-6 rounded-2xl border border-white/25 dark:border-white/15 shadow-xl">
                <BarChart3 className="w-8 h-8 text-gray-600 dark:text-gray-400 mb-4" />
                <h3 className="font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Neutral Performance
                </h3>
                <p className="glass-typography--numbers text-2xl font-bold text-gray-600 dark:text-gray-400">
                  0.0%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  No tinting for neutral
                </p>
              </div>

              <div className="liquid-glass--performance-negative bg-gradient-to-br from-red-500/20 to-rose-500/20 backdrop-blur-md p-6 rounded-2xl border border-red-500/30 shadow-xl">
                <TrendingDown className="w-8 h-8 text-red-600 mb-4" />
                <h3 className="font-semibold text-red-600 mb-2">
                  Negative Performance
                </h3>
                <p className="glass-typography--numbers text-2xl font-bold text-red-600">
                  -2.3%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  Red tinting for losses
                </p>
              </div>
            </div>
          </section>

          {/* Modal Example */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold glass-typography text-gray-900 dark:text-white">
              Modal & Dialog Components
            </h2>

            <ModalDemo />
          </section>

          {/* Loading States */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold glass-typography text-gray-900 dark:text-white">
              Loading States
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-skeleton bg-gradient-to-r from-white/10 via-white/20 to-white/10 dark:from-white/5 dark:via-white/10 dark:to-white/5 p-6 rounded-2xl h-32 animate-pulse"></div>
              <div className="glass-skeleton bg-gradient-to-r from-white/10 via-white/20 to-white/10 dark:from-white/5 dark:via-white/10 dark:to-white/5 p-6 rounded-2xl h-32 animate-pulse"></div>
            </div>
          </section>

          {/* Footer */}
          <footer className="liquid-glass--subtle bg-white/10 dark:bg-black/20 backdrop-blur-sm p-6 rounded-2xl text-center border border-white/20 dark:border-white/10">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Profolio Design System • Apple Liquid Glass Implementation •{" "}
              {new Date().getFullYear()}
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

// Portfolio Glass Card Component
function PortfolioGlassCard({
  asset,
  formatCurrency,
}: {
  asset: { symbol: string; name: string; value: number; performance: number };
  formatCurrency: (amount: number) => string;
}) {
  const getPerformanceStyles = () => {
    if (asset.performance > 0) {
      return "bg-gradient-to-br from-green-500/15 to-emerald-500/15 border-green-500/30";
    } else if (asset.performance < 0) {
      return "bg-gradient-to-br from-red-500/15 to-rose-500/15 border-red-500/30";
    }
    return "bg-white/12 dark:bg-black/25 border-white/25 dark:border-white/15";
  };

  return (
    <motion.div
      className={`glass-card backdrop-blur-md p-6 rounded-2xl cursor-pointer shadow-xl border ${getPerformanceStyles()}`}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="liquid-glass--subtle bg-white/20 dark:bg-black/30 w-12 h-12 rounded-full flex items-center justify-center border border-white/30 dark:border-white/20">
            <span className="font-bold text-sm text-gray-900 dark:text-white">
              {asset.symbol.slice(0, 2)}
            </span>
          </div>
          <div>
            <h3 className="font-semibold glass-typography text-gray-900 dark:text-white">
              {asset.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {asset.symbol}
            </p>
          </div>
        </div>

        <div
          className={`liquid-glass bg-white/20 dark:bg-black/30 px-3 py-1 rounded-full text-sm font-medium border border-white/30 dark:border-white/20 ${
            asset.performance > 0
              ? "text-green-600 bg-green-500/20 border-green-500/30"
              : asset.performance < 0
              ? "text-red-600 bg-red-500/20 border-red-500/30"
              : "text-gray-600 dark:text-gray-400"
          }`}
        >
          {asset.performance > 0 ? "+" : ""}
          {asset.performance.toFixed(1)}%
        </div>
      </div>

      <div>
        <span className="text-2xl font-bold glass-typography--numbers text-gray-900 dark:text-white">
          {formatCurrency(asset.value)}
        </span>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Current Value
        </p>
      </div>
    </motion.div>
  );
}

// Modal Demo Component
function ModalDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const [isBlurActive, setIsBlurActive] = useState(false);

  // Handle modal opening with proper blur timing
  const openModal = () => {
    setIsOpen(true);
    // Even longer delay for a more gradual, noticeable fade-in
    setTimeout(() => setIsBlurActive(true), 200);
  };

  // Handle modal closing with proper blur timing
  const closeModal = () => {
    setIsBlurActive(false);
    // Wait for blur to fade out before unmounting modal
    setTimeout(() => setIsOpen(false), 400);
  };

  return (
    <>
      <button
        onClick={openModal}
        className="glass-button--primary bg-gradient-to-r from-blue-600 to-purple-600 text-white backdrop-blur-sm px-6 py-3 rounded-xl border border-white/30 shadow-lg hover:shadow-xl transition-all"
      >
        Open Glass Modal
      </button>

      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            delay: 0.1, // Delay content animation to let blur start first
            duration: 0.4,
          }}
        >
          {/* Enhanced glass backdrop with CSS transition for blur */}
          <div
            className={`absolute inset-0 bg-black/50 transition-all duration-500 ease-out ${
              isBlurActive
                ? "backdrop-blur-xl backdrop-saturate-150"
                : "backdrop-blur-none"
            }`}
            style={{
              transitionProperty: "backdrop-filter, opacity",
              transitionDuration: "400ms",
              transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            onClick={closeModal}
          />

          {/* Modal content with enhanced entrance animation */}
          <motion.div
            className="glass-modal bg-white/20 dark:bg-black/40 backdrop-blur-xl p-8 rounded-3xl max-w-md w-full relative border border-white/30 dark:border-white/20 shadow-2xl"
            initial={{
              scale: 0.8,
              opacity: 0,
              y: 20,
            }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
            }}
            exit={{
              scale: 0.9,
              opacity: 0,
              y: 10,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              delay: 0.1, // Delay content animation to let blur start first
              duration: 0.4,
            }}
          >
            {/* Glass overlay for enhanced depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 rounded-3xl pointer-events-none" />

            {/* Specular highlight on top edge */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-t-3xl" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold glass-typography text-gray-900 dark:text-white">
                  Enhanced Glass Modal
                </h3>
                <motion.button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xl w-8 h-8 rounded-full hover:bg-white/10 dark:hover:bg-black/20 flex items-center justify-center transition-all"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ✕
                </motion.button>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                This modal now features a smooth transitional blur effect that
                gradually fades in the background blur using CSS transitions
                combined with Framer Motion for the perfect Apple-quality
                experience.
              </p>

              <div className="flex gap-3">
                <motion.button
                  className="glass-button--primary bg-gradient-to-r from-blue-600 to-purple-600 text-white backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30 shadow-lg hover:shadow-xl transition-all flex-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Confirm
                </motion.button>
                <motion.button
                  className="glass-button bg-white/15 dark:bg-black/25 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/25 dark:border-white/15 hover:bg-white/25 dark:hover:bg-black/35 transition-all text-gray-900 dark:text-white flex-1"
                  onClick={closeModal}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
