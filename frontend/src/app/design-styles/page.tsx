"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

          {/* Enhanced Modal Showcase */}
          <section className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold glass-typography text-gray-900 dark:text-white">
                Glass Modal Showcase
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Experience Apple&apos;s refined modal system with sophisticated
                glass materials, elegant transitions, and multiple interaction
                patterns designed for financial applications.
              </p>
            </div>

            <EnhancedModalShowcase />

            {/* Modal Features Documentation */}
            <div className="liquid-glass bg-white/12 dark:bg-black/25 backdrop-blur-md p-8 rounded-2xl border border-white/25 dark:border-white/15 shadow-xl mt-8">
              <h3 className="text-xl font-semibold glass-typography text-gray-900 dark:text-white mb-6">
                Glass Modal Features
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    ✨ Advanced Effects
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li>• Progressive backdrop blur transitions</li>
                    <li>• Enhanced glass material with subtle depth</li>
                    <li>• Specular light reflections on top edges</li>
                    <li>• Performance-optimized animations</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    🎯 Interaction Design
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li>• Smooth entrance/exit with spring physics</li>
                    <li>• Contextual close button animations</li>
                    <li>• Glass input fields with focus effects</li>
                    <li>• Portfolio-specific performance tinting</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 liquid-glass bg-white/8 dark:bg-black/20 rounded-xl border border-white/20 dark:border-white/10">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>Implementation Note:</strong> These modals use
                  Apple&apos;s signature glass materials with enhanced
                  backdrop-filter effects, creating authentic depth and
                  translucency. The progressive blur system ensures smooth
                  transitions that maintain 60fps performance.
                </p>
              </div>
            </div>
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

// Enhanced Modal Showcase Component
function EnhancedModalShowcase() {
  const [currentModal, setCurrentModal] = useState<string | null>(null);
  const [isBlurActive, setIsBlurActive] = useState(false);

  // Handle modal opening - activate blur after a tiny delay
  const openModal = (modalType: string) => {
    setCurrentModal(modalType);
    // Small delay to let DOM update, then activate blur transition
    setTimeout(() => setIsBlurActive(true), 50);
  };

  // Handle modal closing - deactivate blur immediately
  const closeModal = () => {
    setIsBlurActive(false);
    setCurrentModal(null);
  };

  return (
    <>
      {/* Modal Trigger Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.button
          onClick={() => openModal("basic")}
          className="glass-button bg-gradient-to-br from-blue-600/80 to-cyan-600/80 text-white backdrop-blur-sm p-6 rounded-2xl border border-white/30 shadow-lg hover:shadow-xl transition-all group"
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="font-semibold">Basic Modal</h3>
            <p className="text-sm opacity-90">Simple confirmation dialog</p>
          </div>
        </motion.button>

        <motion.button
          onClick={() => openModal("form")}
          className="glass-button bg-gradient-to-br from-purple-600/80 to-pink-600/80 text-white backdrop-blur-sm p-6 rounded-2xl border border-white/30 shadow-lg hover:shadow-xl transition-all group"
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all">
              <span className="text-2xl">📝</span>
            </div>
            <h3 className="font-semibold">Form Modal</h3>
            <p className="text-sm opacity-90">Add asset form example</p>
          </div>
        </motion.button>

        <motion.button
          onClick={() => openModal("portfolio")}
          className="glass-button bg-gradient-to-br from-green-600/80 to-emerald-600/80 text-white backdrop-blur-sm p-6 rounded-2xl border border-white/30 shadow-lg hover:shadow-xl transition-all group"
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="font-semibold">Portfolio Modal</h3>
            <p className="text-sm opacity-90">Asset details with charts</p>
          </div>
        </motion.button>

        <motion.button
          onClick={() => openModal("settings")}
          className="glass-button bg-gradient-to-br from-orange-600/80 to-red-600/80 text-white backdrop-blur-sm p-6 rounded-2xl border border-white/30 shadow-lg hover:shadow-xl transition-all group"
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all">
              <span className="text-2xl">⚙️</span>
            </div>
            <h3 className="font-semibold">Settings Modal</h3>
            <p className="text-sm opacity-90">Complex preferences UI</p>
          </div>
        </motion.button>
      </div>

      {/* Modal Implementations */}
      <AnimatePresence mode="wait">
        {currentModal && (
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
                transition:
                  "backdrop-filter 400ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={closeModal}
            />

            {/* Modal Content Based on Type */}
            {currentModal === "basic" && <BasicModal onClose={closeModal} />}
            {currentModal === "form" && <FormModal onClose={closeModal} />}
            {currentModal === "portfolio" && (
              <PortfolioModal onClose={closeModal} />
            )}
            {currentModal === "settings" && (
              <SettingsModal onClose={closeModal} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Basic Modal Component
function BasicModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="relative max-w-md w-full"
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.95, opacity: 0, y: 10 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Glass Container */}
      <div className="liquid-glass--prominent bg-white/25 dark:bg-black/40 backdrop-blur-2xl p-8 rounded-3xl border border-white/30 dark:border-white/20 shadow-2xl relative overflow-hidden">
        {/* Top Light Reflection */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

        {/* Subtle Inner Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 rounded-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold glass-typography text-gray-900 dark:text-white">
              Confirm Action
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

          <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            This is a beautifully crafted glass modal with enhanced blur
            effects, subtle animations, and Apple&apos;s signature attention to
            detail.
          </p>

          <div className="flex gap-3">
            <motion.button
              className="glass-button--primary bg-gradient-to-r from-blue-600 to-purple-600 text-white backdrop-blur-sm px-6 py-3 rounded-xl border border-white/30 shadow-lg hover:shadow-xl transition-all flex-1"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Confirm
            </motion.button>
            <motion.button
              className="glass-button bg-white/15 dark:bg-black/25 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/25 dark:border-white/15 hover:bg-white/25 dark:hover:bg-black/35 transition-all text-gray-900 dark:text-white flex-1"
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Form Modal Component
function FormModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="relative max-w-lg w-full"
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.95, opacity: 0, y: 10 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="liquid-glass--prominent bg-white/25 dark:bg-black/40 backdrop-blur-2xl p-8 rounded-3xl border border-white/30 dark:border-white/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 rounded-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold glass-typography text-gray-900 dark:text-white">
              Add New Asset
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

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Asset Symbol
              </label>
              <input
                type="text"
                placeholder="AAPL"
                className="w-full liquid-glass bg-white/20 dark:bg-black/30 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/30 dark:border-white/20 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantity
              </label>
              <input
                type="number"
                placeholder="100"
                className="w-full liquid-glass bg-white/20 dark:bg-black/30 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/30 dark:border-white/20 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Purchase Price
              </label>
              <input
                type="number"
                placeholder="150.00"
                step="0.01"
                className="w-full liquid-glass bg-white/20 dark:bg-black/30 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/30 dark:border-white/20 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <motion.button
              className="glass-button--primary bg-gradient-to-r from-green-600 to-emerald-600 text-white backdrop-blur-sm px-6 py-3 rounded-xl border border-white/30 shadow-lg hover:shadow-xl transition-all flex-1"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Add Asset
            </motion.button>
            <motion.button
              className="glass-button bg-white/15 dark:bg-black/25 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/25 dark:border-white/15 hover:bg-white/25 dark:hover:bg-black/35 transition-all text-gray-900 dark:text-white flex-1"
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Portfolio Modal Component
function PortfolioModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="relative max-w-2xl w-full max-h-[90vh]"
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.95, opacity: 0, y: 10 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="liquid-glass--prominent bg-white/25 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 rounded-3xl pointer-events-none" />

        <div className="relative z-10 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold glass-typography text-gray-900 dark:text-white">
              Apple Inc. (AAPL)
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="liquid-glass bg-gradient-to-br from-green-500/15 to-emerald-500/15 border-green-500/30 backdrop-blur-md p-6 rounded-2xl border shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Current Value
                </span>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold glass-typography--numbers text-green-600">
                £12,500
              </p>
              <p className="text-sm text-green-600">+£2,500 (+25.0%)</p>
            </div>

            <div className="liquid-glass bg-white/12 dark:bg-black/25 backdrop-blur-md p-6 rounded-2xl border border-white/25 dark:border-white/15 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Shares Owned
                </span>
                <Wallet className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <p className="text-2xl font-bold glass-typography--numbers text-gray-900 dark:text-white">
                100
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                @ £125.00 each
              </p>
            </div>
          </div>

          <div className="liquid-glass bg-white/12 dark:bg-black/25 backdrop-blur-md p-6 rounded-2xl border border-white/25 dark:border-white/15 shadow-xl mb-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              Performance Chart
            </h4>
            <div className="h-32 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center">
              <span className="text-gray-600 dark:text-gray-400">
                📈 Chart Visualization
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <motion.button
              className="glass-button bg-gradient-to-r from-blue-600 to-purple-600 text-white backdrop-blur-sm px-6 py-3 rounded-xl border border-white/30 shadow-lg hover:shadow-xl transition-all flex-1"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Buy More
            </motion.button>
            <motion.button
              className="glass-button bg-gradient-to-r from-red-600 to-rose-600 text-white backdrop-blur-sm px-6 py-3 rounded-xl border border-white/30 shadow-lg hover:shadow-xl transition-all flex-1"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Sell
            </motion.button>
            <motion.button
              className="glass-button bg-white/15 dark:bg-black/25 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/25 dark:border-white/15 hover:bg-white/25 dark:hover:bg-black/35 transition-all text-gray-900 dark:text-white"
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Close
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Settings Modal Component
function SettingsModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="relative max-w-xl w-full max-h-[90vh]"
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.95, opacity: 0, y: 10 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="liquid-glass--prominent bg-white/25 dark:bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-white/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 rounded-3xl pointer-events-none" />

        <div className="relative z-10 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold glass-typography text-gray-900 dark:text-white">
              Preferences
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

          <div className="space-y-6 mb-6">
            <div className="liquid-glass bg-white/12 dark:bg-black/25 backdrop-blur-md p-4 rounded-xl border border-white/25 dark:border-white/15">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Push Notifications
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Get alerts for portfolio changes
                  </p>
                </div>
                <GlassToggle label="" defaultChecked={true} />
              </div>
            </div>

            <div className="liquid-glass bg-white/12 dark:bg-black/25 backdrop-blur-md p-4 rounded-xl border border-white/25 dark:border-white/15">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Auto-sync Data
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Automatically update portfolio data
                  </p>
                </div>
                <GlassToggle label="" defaultChecked={false} />
              </div>
            </div>

            <div className="liquid-glass bg-white/12 dark:bg-black/25 backdrop-blur-md p-4 rounded-xl border border-white/25 dark:border-white/15">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Market Hours Only
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Only show data during market hours
                  </p>
                </div>
                <GlassToggle label="" defaultChecked={true} />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <motion.button
              className="glass-button--primary bg-gradient-to-r from-blue-600 to-purple-600 text-white backdrop-blur-sm px-6 py-3 rounded-xl border border-white/30 shadow-lg hover:shadow-xl transition-all flex-1"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Save Changes
            </motion.button>
            <motion.button
              className="glass-button bg-white/15 dark:bg-black/25 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/25 dark:border-white/15 hover:bg-white/25 dark:hover:bg-black/35 transition-all text-gray-900 dark:text-white flex-1"
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
