"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { EnhancedTabs } from "./enhanced-tabs";

export interface ViewSwitcherProps {
  activeView: "grid" | "list" | "table";
  onViewChange: (view: "grid" | "list" | "table") => void;
  variant?: "subtle" | "standard" | "prominent" | "navigation";
  className?: string;
  disabled?: boolean;
  showLabels?: boolean;
}

/**
 * Standardized view switcher component for consistent grid/list/table view toggling
 * Uses the glass design system for visual consistency
 */
export function ViewSwitcher({
  activeView,
  onViewChange,
  variant = "subtle",
  className,
  disabled = false,
  showLabels = false,
}: ViewSwitcherProps) {
  const glassVariants = {
    subtle: "liquid-glass--subtle",
    standard: "liquid-glass",
    prominent: "liquid-glass--prominent",
    navigation: "liquid-glass--navigation",
  };

  const viewOptions = [
    { 
      id: "grid" as const, 
      label: showLabels ? "Grid" : "", 
      icon: "fa-th",
      ariaLabel: "Grid view"
    },
    { 
      id: "list" as const, 
      label: showLabels ? "List" : "", 
      icon: "fa-list",
      ariaLabel: "List view"
    },
    { 
      id: "table" as const, 
      label: showLabels ? "Table" : "", 
      icon: "fa-table",
      ariaLabel: "Table view"
    },
  ];

  return (
    <div 
      className={cn(
        glassVariants[variant],
        "inline-flex rounded-lg p-1",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
      role="group"
      aria-label="View options"
    >
      <EnhancedTabs
        tabs={viewOptions.map(view => ({
          ...view,
          disabled,
        }))}
        activeTab={activeView}
        onTabChange={(view) => onViewChange(view as "grid" | "list" | "table")}
        variant="glass"
        size="md"
        className="bg-transparent p-0 h-10"
      />
    </div>
  );
}

// Export a preset for toolbar usage
export function ToolbarViewSwitcher(props: Omit<ViewSwitcherProps, 'variant'>) {
  return <ViewSwitcher {...props} variant="navigation" />;
}