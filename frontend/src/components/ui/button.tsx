// Export the enhanced button as the default Button
// The old button implementation is preserved below as LegacyButton if needed

import React from "react";
import { cn } from "@/lib/utils";

export interface LegacyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "gradient" | "outline";
  size?: "sm" | "md" | "lg";
  icon?: string; // FontAwesome icon class
  iconOnly?: boolean; // For icon-only buttons
  loading?: boolean;
  fullWidth?: boolean;
}

const LegacyButton = React.forwardRef<HTMLButtonElement, LegacyButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      icon,
      iconOnly = false,
      loading = false,
      disabled = false,
      fullWidth = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold transition-all duration-200 rounded-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700",
      secondary:
        "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700",
      danger:
        "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700",
      ghost:
        "bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 shadow-none hover:shadow-none",
      gradient:
        "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white",
      outline:
        "bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600",
    };

    const sizes = {
      sm: iconOnly ? "p-1.5 text-sm" : "px-3 py-1.5 text-sm gap-1.5",
      md: iconOnly ? "px-3 py-2 text-base" : "px-4 py-2 text-base gap-2",
      lg: iconOnly ? "p-3 text-lg" : "px-6 py-3 text-lg gap-2",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <i className="fas fa-spinner fa-spin" aria-hidden="true" />
        ) : icon ? (
          <i className={`fas ${icon}`} aria-hidden="true" />
        ) : null}
        {children}
      </button>
    );
  }
);

LegacyButton.displayName = "LegacyButton";

// Export EnhancedButton as the default Button
export { EnhancedButton as Button } from "./enhanced-button";
export { LegacyButton };

// Legacy Tab component - use EnhancedTabs for new implementations
export { type TabProps, Tabs } from "./enhanced-tabs";