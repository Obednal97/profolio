import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface EnhancedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 
    | "primary" 
    | "secondary" 
    | "danger" 
    | "ghost" 
    | "gradient"
    | "outline"
    | "glass"
    | "glass-primary"
    | "glass-danger"
    | "glass-ghost"
    | "dropdown-item"
    | "bulk-action"
    | "link";
  size?: "sm" | "md" | "lg";
  icon?: string; // FontAwesome icon class
  iconOnly?: boolean; // For icon-only buttons
  loading?: boolean;
  fullWidth?: boolean;
  animate?: boolean;
  as?: "button" | "a"; // Allow rendering as anchor
  href?: string; // For link variant
}

const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  (
    {
      className,
      variant = "glass-primary",
      size = "md",
      icon,
      iconOnly = false,
      loading = false,
      disabled = false,
      fullWidth = false,
      animate = true,
      as = "button",
      href,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold transition-all duration-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden";

    const variants = {
      // Original variants
      primary:
        "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 shadow-lg hover:shadow-xl",
      secondary:
        "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-md hover:shadow-lg",
      danger:
        "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 shadow-lg hover:shadow-xl",
      ghost:
        "bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
      gradient:
        "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl",
      outline:
        "bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 shadow-sm hover:shadow-md",
      
      // Glass variants
      glass:
        "backdrop-blur-xl bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10 text-gray-900 dark:text-white hover:bg-white/20 dark:hover:bg-black/30 shadow-lg hover:shadow-xl",
      "glass-primary":
        "backdrop-blur-xl bg-gradient-to-r from-blue-600/80 to-indigo-600/80 text-white border border-white/20 hover:from-blue-600 hover:to-indigo-600 shadow-lg hover:shadow-xl",
      "glass-danger":
        "backdrop-blur-xl bg-gradient-to-r from-red-600/80 to-rose-600/80 text-white border border-white/20 hover:from-red-600 hover:to-rose-600 shadow-lg hover:shadow-xl",
      "glass-ghost":
        "backdrop-blur-sm bg-white/5 dark:bg-black/10 text-gray-900 dark:text-white hover:bg-white/10 dark:hover:bg-black/20",
      
      // Special purpose variants
      "dropdown-item":
        "w-full text-left px-4 py-2 hover:bg-white/10 dark:hover:bg-black/10 text-gray-900 dark:text-white border-b border-white/10 dark:border-black/10 last:border-b-0 rounded-none justify-start",
      "bulk-action":
        "bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm rounded-lg transition-colors",
      link:
        "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl inline-flex items-center justify-center",
    };

    const sizes = {
      sm: iconOnly ? "px-1.5 py-1 text-sm" : "px-3 py-1 text-sm gap-1.5",
      md: iconOnly ? "px-2 py-1.5 text-base" : "px-4 py-1.5 text-base gap-2",
      lg: iconOnly ? "px-2.5 py-2 text-lg" : "px-5 py-2 text-lg gap-2",
    };

    const Component = as === "a" ? "a" : "button";
    const ButtonElement = animate && as !== "a" ? motion[Component] : Component;
    const animationProps = animate ? {
      whileHover: !disabled ? { scale: 1.02 } : undefined,
      whileTap: !disabled ? { scale: 0.98 } : undefined,
      transition: { duration: 0.15, ease: "easeInOut" }
    } : {};

    return (
      <ButtonElement
        ref={as === "button" ? ref : undefined}
        disabled={as === "button" ? (disabled || loading) : undefined}
        href={as === "a" ? href : undefined}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        {...(as === "button" ? animationProps : {})}
        {...props}
      >
        {/* Glass shimmer effect for glass variants */}
        {variant.startsWith("glass") && (
          <div 
            className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)",
              animation: "shimmer 2s infinite"
            }}
          />
        )}
        
        {/* Button content */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {loading ? (
            <i className="fas fa-spinner fa-spin" aria-hidden="true" />
          ) : icon ? (
            <i className={`fas ${icon}`} aria-hidden="true" />
          ) : null}
          {children}
        </span>
      </ButtonElement>
    );
  }
);

EnhancedButton.displayName = "EnhancedButton";

export { EnhancedButton };

// Export as default and as Button for easier migration
export default EnhancedButton;
export { EnhancedButton as Button };