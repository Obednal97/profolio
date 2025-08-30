"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/enhanced-button";
import { ViewSwitcher } from "@/components/ui/ViewSwitcher";
import { cn } from "@/lib/utils";

export interface FilterCategory {
  id: string;
  name: string;
  icon: string;
  count?: number;
  subcategories?: FilterCategory[];
}

export interface FilterBarProps {
  // Category Filter
  categories?: FilterCategory[];
  selectedCategory?: string;
  selectedSubcategory?: string;
  onCategoryChange?: (categoryId: string, subcategoryId?: string) => void;
  
  // Search
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  
  // Advanced Filters
  showAdvancedFilters?: boolean;
  advancedFiltersContent?: React.ReactNode;
  
  // Sort
  sortOptions?: Array<{ value: string; label: string; icon?: string }>;
  selectedSort?: string;
  onSortChange?: (value: string) => void;
  
  // View Switcher
  viewMode?: "grid" | "list" | "table";
  onViewChange?: (view: "grid" | "list" | "table") => void;
  availableViews?: Array<"grid" | "list" | "table">;
  
  // General
  className?: string;
}

export function FilterBar({
  categories,
  selectedCategory = "all",
  selectedSubcategory,
  onCategoryChange,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showAdvancedFilters = false,
  advancedFiltersContent,
  sortOptions,
  selectedSort,
  onSortChange,
  viewMode = "grid",
  onViewChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  availableViews = ["grid", "list", "table"],
  className,
}: FilterBarProps) {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [openCategoryDropdown, setOpenCategoryDropdown] = useState(false);
  const [openSortDropdown, setOpenSortDropdown] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchExpanded && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isSearchExpanded]);

  const handleSearchBlur = () => {
    if (!searchValue) {
      setIsSearchExpanded(false);
    }
  };

  const getCategoryDisplay = () => {
    if (selectedCategory === "all") return "All Categories";
    const category = categories?.find(c => c.id === selectedCategory);
    if (selectedSubcategory) {
      const subcategory = category?.subcategories?.find(s => s.id === selectedSubcategory);
      return subcategory?.name || category?.name || "Category";
    }
    return category?.name || "Category";
  };

  const getSortDisplay = () => {
    const option = sortOptions?.find(o => o.value === selectedSort);
    return option?.label || "Sort";
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          {/* Category Dropdown */}
          {categories && onCategoryChange && (
            <div className="relative">
              <Button
                onClick={() => setOpenCategoryDropdown(!openCategoryDropdown)}
                variant="glass"
                size="md"
                animate
                className="min-w-[180px]"
              >
                <i className="fas fa-filter"></i>
                <span>{getCategoryDisplay()}</span>
                <i className="fas fa-chevron-down text-xs ml-auto"></i>
              </Button>
              
              {openCategoryDropdown && (
                <div className="absolute top-full left-0 mt-2 w-64 liquid-glass rounded-lg shadow-xl z-20 max-h-80 overflow-y-auto">
                  <Button
                    onClick={() => {
                      onCategoryChange("all");
                      setOpenCategoryDropdown(false);
                    }}
                    variant="dropdown-item"
                    className="border-b-0"
                  >
                    <i className="fas fa-globe mr-2"></i>
                    All Categories
                  </Button>
                  
                  {categories.map((category) => (
                    <div key={category.id}>
                      <Button
                        onClick={() => {
                          onCategoryChange(category.id);
                          setOpenCategoryDropdown(false);
                        }}
                        variant="dropdown-item"
                        className="flex items-center justify-between border-b-0"
                      >
                        <span className="flex items-center">
                          <i className={`fas ${category.icon} mr-2`}></i>
                          {category.name}
                        </span>
                        {category.count !== undefined && (
                          <span className="text-sm text-gray-500">({category.count})</span>
                        )}
                      </Button>
                      
                      {category.subcategories?.map((sub) => (
                        <Button
                          key={sub.id}
                          onClick={() => {
                            onCategoryChange(category.id, sub.id);
                            setOpenCategoryDropdown(false);
                          }}
                          variant="dropdown-item"
                          className="pl-10 flex items-center justify-between border-b-0"
                        >
                          <span className="flex items-center">
                            <i className={`fas ${sub.icon} mr-2 text-sm`}></i>
                            {sub.name}
                          </span>
                          {sub.count !== undefined && (
                            <span className="text-sm text-gray-500">({sub.count})</span>
                          )}
                        </Button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Search Field */}
          {onSearchChange && (
            <div className="relative flex-1 max-w-md">
              <AnimatePresence mode="wait">
                {isSearchExpanded ? (
                  <motion.div
                    key="expanded"
                    initial={{ width: 40, opacity: 0 }}
                    animate={{ width: "100%", opacity: 1 }}
                    exit={{ width: 40, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative"
                  >
                    <input
                      ref={searchRef}
                      type="text"
                      value={searchValue}
                      onChange={(e) => onSearchChange(e.target.value)}
                      onBlur={handleSearchBlur}
                      placeholder={searchPlaceholder}
                      className="w-full liquid-glass--subtle rounded-lg pl-10 pr-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
                  </motion.div>
                ) : (
                  <motion.div key="collapsed">
                    <Button
                      onClick={() => setIsSearchExpanded(true)}
                      variant="glass"
                      size="md"
                      iconOnly
                      icon="fa-search"
                      animate
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Advanced Filters Toggle */}
          {advancedFiltersContent && (
            <Button
              onClick={() => setShowAdvanced(!showAdvanced)}
              variant="glass"
              size="md"
              animate
            >
              <i className="fas fa-sliders-h"></i>
              <span>Advanced</span>
              <i className={`fas fa-chevron-${showAdvanced ? "up" : "down"} text-xs`}></i>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Sort Dropdown */}
          {sortOptions && onSortChange && (
            <div className="relative">
              <Button
                onClick={() => setOpenSortDropdown(!openSortDropdown)}
                variant="glass"
                size="md"
                animate
                className="min-w-[150px]"
              >
                <i className="fas fa-sort"></i>
                <span>{getSortDisplay()}</span>
                <i className="fas fa-chevron-down text-xs ml-auto"></i>
              </Button>
              
              {openSortDropdown && (
                <div className="absolute top-full right-0 mt-2 w-48 liquid-glass rounded-lg shadow-xl z-20">
                  {sortOptions.map((option) => (
                    <Button
                      key={option.value}
                      onClick={() => {
                        onSortChange(option.value);
                        setOpenSortDropdown(false);
                      }}
                      variant="dropdown-item"
                      className="border-b-0"
                    >
                      {option.icon && <i className={`fas ${option.icon} mr-2`}></i>}
                      {option.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* View Switcher */}
          {onViewChange && (
            <ViewSwitcher
              activeView={viewMode}
              onViewChange={onViewChange}
              variant="subtle"
            />
          )}
        </div>
      </div>

      {/* Advanced Filters Content */}
      {showAdvanced && advancedFiltersContent && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="liquid-glass--subtle rounded-lg p-6"
        >
          {advancedFiltersContent}
        </motion.div>
      )}
    </div>
  );
}

// Export preset configurations for common use cases
export function AssetFilterBar(props: Omit<FilterBarProps, 'searchPlaceholder'>) {
  return <FilterBar {...props} searchPlaceholder="Search assets..." />;
}

export function ExpenseFilterBar(props: Omit<FilterBarProps, 'searchPlaceholder'>) {
  return <FilterBar {...props} searchPlaceholder="Search expenses..." />;
}

export function PropertyFilterBar(props: Omit<FilterBarProps, 'searchPlaceholder'>) {
  return <FilterBar {...props} searchPlaceholder="Search properties..." />;
}