"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { EnhancedGlassCard } from "@/components/ui/enhanced-glass/EnhancedGlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface FilterOption {
  id: string;
  label: string;
  icon?: string;
}

export interface FilterConfig {
  categories?: FilterOption[];
  sortOptions?: FilterOption[];
  searchable?: boolean;
  customFilters?: React.ReactNode;
}

export interface FilterPanelProps {
  config: FilterConfig;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  sortBy?: string;
  onSortChange?: (sort: string) => void;
  className?: string;
  onReset?: () => void;
  showAdvanced?: boolean;
  onAdvancedToggle?: () => void;
}

export function FilterPanel({
  config,
  searchQuery = "",
  onSearchChange,
  selectedCategory = "all",
  onCategoryChange,
  sortBy = "date",
  onSortChange,
  className,
  onReset,
  showAdvanced = false,
  onAdvancedToggle,
}: FilterPanelProps) {
  const [searchExpanded, setSearchExpanded] = useState(false);

  return (
    <EnhancedGlassCard
      variant="subtle"
      padding="md"
      hoverable={false}
      enableLensing={false}
      className={cn("mb-6", className)}
    >
      <div className="flex flex-col gap-4">
        {/* Search Bar */}
        {config.searchable && (
          <div className="relative">
            <div
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 dark:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-white/10 transition-all duration-300",
                searchExpanded && "ring-2 ring-blue-500/30"
              )}
            >
              <i className="fas fa-search text-gray-400"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                onFocus={() => setSearchExpanded(true)}
                onBlur={() => setSearchExpanded(false)}
                placeholder="Search..."
                className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange?.("")}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main Filters Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          {config.categories && (
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => onCategoryChange?.(e.target.value)}
                className="appearance-none bg-white/10 dark:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl px-4 py-2 pr-10 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white/20 dark:focus:bg-black/30 transition-all duration-200"
              >
                <option value="all">All Categories</option>
                {config.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
            </div>
          )}

          {/* Sort Options */}
          {config.sortOptions && (
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => onSortChange?.(e.target.value)}
                className="appearance-none bg-white/10 dark:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl px-4 py-2 pr-10 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white/20 dark:focus:bg-black/30 transition-all duration-200"
              >
                {config.sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <i className="fas fa-sort absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
            </div>
          )}

          {/* Advanced Filters Toggle */}
          {onAdvancedToggle && (
            <Button
              onClick={onAdvancedToggle}
              variant="glass"
              size="sm"
              className="ml-auto"
            >
              <i className={cn("fas fa-sliders-h mr-2", showAdvanced && "text-blue-500")}></i>
              {showAdvanced ? "Hide" : "Show"} Filters
            </Button>
          )}

          {/* Reset Button */}
          {onReset && (
            <Button
              onClick={onReset}
              variant="glass-ghost"
              size="sm"
            >
              <i className="fas fa-undo mr-2"></i>
              Reset
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showAdvanced && config.customFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-white/10 dark:border-white/5">
                {config.customFilters}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </EnhancedGlassCard>
  );
}