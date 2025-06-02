import React, { useMemo } from 'react';

/**
 * Profolio Logo Component (Font Awesome Version)
 * 
 * A Tailwind CSS-based logo component using Font Awesome's pie chart icon:
 * - Multiple predefined sizes (sm, md, lg, xl)
 * - Purple gradient background matching brand colors
 * - Optional hover animations
 * - Requires Font Awesome CSS to be loaded
 * 
 * @param size - Predefined size variant (default: 'md')
 * @param className - Additional CSS classes to apply
 * @param showHover - Enable hover animations (default: true)
 */

interface ProfolioLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showHover?: boolean;
}

// Centralized size configuration for consistency
const SIZE_CONFIG = {
  sm: {
    container: 'w-8 h-8',
    icon: 'text-sm',
    rounded: 'rounded-lg'
  },
  md: {
    container: 'w-10 h-10',
    icon: 'text-lg',
    rounded: 'rounded-xl'
  },
  lg: {
    container: 'w-12 h-12',
    icon: 'text-xl',
    rounded: 'rounded-xl'
  },
  xl: {
    container: 'w-16 h-16',
    icon: 'text-2xl',
    rounded: 'rounded-2xl'
  }
} as const;

// Base styles that don't change
const BASE_STYLES = 'bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg';
const HOVER_STYLES = 'group-hover:scale-105 group-hover:shadow-blue-500/20 transition-all duration-300';

export const ProfolioLogo: React.FC<ProfolioLogoProps> = ({
  size = 'md',
  className = '',
  showHover = true
}) => {
  // Memoize configuration to prevent recreation on each render
  const config = useMemo(() => SIZE_CONFIG[size], [size]);
  
  // Memoize the complete className string
  const containerClassName = useMemo(() => {
    const classes = [
      config.container,
      config.rounded,
      BASE_STYLES,
      showHover ? HOVER_STYLES : '',
      className
    ].filter(Boolean);
    
    return classes.join(' ');
  }, [config.container, config.rounded, showHover, className]);

  // Memoize icon className
  const iconClassName = useMemo(() => 
    `fas fa-chart-pie text-white ${config.icon}`,
    [config.icon]
  );
  
  return (
    <div className={containerClassName}>
      <i 
        className={iconClassName}
        role="img"
        aria-label="Profolio pie chart logo"
      />
    </div>
  );
};

export default ProfolioLogo; 