"use client";

import React, { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  count?: number;
}

export interface EnhancedTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  variant?: "glass" | "solid";
  size?: "sm" | "md" | "lg";
}

export function EnhancedTabs({ 
  tabs, 
  activeTab, 
  onTabChange, 
  className,
  variant = "glass",
  size = "md"
}: EnhancedTabsProps) {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Update indicator position when activeTab changes
  useEffect(() => {
    if (!tabsRef.current) return;

    const updateIndicatorPosition = () => {
      const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
      if (activeIndex !== -1 && tabRefs.current[activeIndex]) {
        const activeTabElement = tabRefs.current[activeIndex];
        if (activeTabElement && tabsRef.current) {
          const containerRect = tabsRef.current.getBoundingClientRect();
          const tabRect = activeTabElement.getBoundingClientRect();

          setIndicatorStyle({
            left: tabRect.left - containerRect.left,
            width: tabRect.width,
          });
        }
      }
    };

    // Small delay to ensure DOM has settled
    const timer = setTimeout(updateIndicatorPosition, 50);

    // Add resize listener
    window.addEventListener("resize", updateIndicatorPosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateIndicatorPosition);
    };
  }, [activeTab, tabs]);

  const containerClasses = {
    glass: "bg-white/30 dark:bg-gray-800/30 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-sm",
    solid: "bg-gray-100 dark:bg-gray-800"
  };

  const sizeClasses = {
    sm: "p-0.5",
    md: "p-1",
    lg: "p-1.5"
  };

  const tabSizeClasses = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2"
  };

  return (
    <div
      ref={tabsRef}
      className={cn(
        "relative flex gap-1 rounded-full",
        containerClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {/* Sliding background indicator */}
      <div
        className="absolute bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg pointer-events-none"
        style={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
          height: `calc(100% - ${size === 'sm' ? '4px' : size === 'md' ? '8px' : '12px'})`,
          top: size === 'sm' ? '2px' : size === 'md' ? '4px' : '6px',
          zIndex: 0,
          transition: "all 0.45s cubic-bezier(0.4, 0.0, 0.2, 1)",
        }}
      />

      {/* Tab buttons */}
      {tabs.map((tab, index) => (
        <motion.button
          key={tab.id}
          ref={el => { tabRefs.current[index] = el; }}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "relative z-10 flex items-center justify-center font-medium rounded-full transition-all duration-300",
            tabSizeClasses[size],
            activeTab === tab.id
              ? "text-white"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          )}
          whileHover={activeTab !== tab.id ? { scale: 1.05 } : undefined}
          whileTap={{ scale: 0.98 }}
        >
          <span className="flex items-center justify-center gap-2">
            {tab.icon && <i className={`fas ${tab.icon}`} aria-hidden="true" />}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={cn(
                  "ml-1 px-1.5 py-0.5 text-xs rounded-full font-semibold",
                  activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                )}
              >
                {tab.count > 99 ? "99+" : tab.count}
              </span>
            )}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

// Legacy Tabs component for backward compatibility
export interface TabProps {
  tabs: Array<{
    id: string;
    label: string;
    icon?: string;
    count?: number;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, className }: TabProps) {
  return (
    <EnhancedTabs 
      tabs={tabs} 
      activeTab={activeTab} 
      onTabChange={onTabChange} 
      className={className}
      variant="solid"
    />
  );
}