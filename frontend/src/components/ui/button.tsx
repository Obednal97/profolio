// Button component exports
// - Button (default): EnhancedButton with glass design for app pages
// - RadixButton: For public pages that need asChild prop for Link components

// Export EnhancedButton as the default Button (for app pages with glass design)
export { EnhancedButton as Button } from "./enhanced-button";

// Export Radix button for public pages that need asChild prop
export { Button as RadixButton, buttonVariants } from "./button/button";

// Legacy Tab component - use EnhancedTabs for new implementations
export { type TabProps, Tabs } from "./enhanced-tabs";