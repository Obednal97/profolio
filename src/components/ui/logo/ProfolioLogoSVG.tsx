import React, { useMemo } from 'react';

/**
 * Profolio Logo SVG Component
 * 
 * A self-contained SVG logo component featuring the Profolio brand:
 * - Purple gradient background with squircle corners
 * - Font Awesome pie chart icon in white
 * - Scalable design that maintains proportions at any size
 * - Drop shadow for premium appearance
 * 
 * @param size - Logo size in pixels (default: 40)
 * @param className - Additional CSS classes to apply
 */

interface ProfolioLogoSVGProps {
  size?: number;
  className?: string;
}

// Design constants - centralized for maintainability
const DESIGN_CONSTANTS = {
  SQUIRCLE_RATIO: 140 / 512, // 27.3% border radius for squircle appearance
  ICON_SCALE: 0.6 / 512, // Scale factor for Font Awesome icon
  ICON_OFFSET_X: 80 / 512, // Horizontal positioning ratio
  ICON_OFFSET_Y: 100 / 512, // Vertical positioning ratio
  GRADIENT_COLORS: {
    START: '#2563eb', // Blue-600
    END: '#9333ea', // Purple-600
  },
  SHADOW: {
    BLUR: '3',
    COLOR: 'rgba(0,0,0,0.15)',
  },
} as const;

// Font Awesome fa-chart-pie path data (unchanged from original)
const PIE_CHART_PATH = 'M304 240l0-223.4c0-9 7-16.6 16-16.6C443.7 0 544 100.3 544 224c0 9-7.6 16-16.6 16L304 240zM32 272C32 150.7 122.1 50.3 239 34.3c9.2-1.3 17 6.1 17 15.4L256 288 412.5 444.5c6.7 6.7 6.2 17.7-1.5 23.1C371.8 495.6 323.8 512 272 512C139.5 512 32 404.6 32 272zm526.4 16c9.3 0 16.6 7.8 15.4 17c-7.7 55.9-34.6 105.6-73.9 142.3c-6 5.6-15.4 5.2-21.2-.7L320 288l238.4 0z' as const;

export const ProfolioLogoSVG: React.FC<ProfolioLogoSVGProps> = ({
  size = 40,
  className = ''
}) => {
  // Memoize expensive calculations to prevent unnecessary re-renders
  const dimensions = useMemo(() => ({
    borderRadius: size * DESIGN_CONSTANTS.SQUIRCLE_RATIO,
    iconScale: DESIGN_CONSTANTS.ICON_SCALE * size,
    offsetX: size * DESIGN_CONSTANTS.ICON_OFFSET_X,
    offsetY: size * DESIGN_CONSTANTS.ICON_OFFSET_Y,
  }), [size]);

  // Memoize unique IDs to prevent conflicts when multiple logos exist
  const ids = useMemo(() => ({
    gradient: `profolio-grad-${size}`,
    shadow: `profolio-shadow-${size}`,
  }), [size]);

  // Memoize transform string for icon positioning
  const iconTransform = useMemo(() => 
    `translate(${dimensions.offsetX}, ${dimensions.offsetY}) scale(${dimensions.iconScale})`,
    [dimensions.offsetX, dimensions.offsetY, dimensions.iconScale]
  );
  
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      className={className}
      role="img"
      aria-label="Profolio Logo"
    >
      <defs>
        <linearGradient id={ids.gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={DESIGN_CONSTANTS.GRADIENT_COLORS.START} />
          <stop offset="100%" stopColor={DESIGN_CONSTANTS.GRADIENT_COLORS.END} />
        </linearGradient>
        <filter id={ids.shadow} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow 
            dx="0" 
            dy="4" 
            stdDeviation={DESIGN_CONSTANTS.SHADOW.BLUR} 
            floodColor={DESIGN_CONSTANTS.SHADOW.COLOR} 
          />
        </filter>
      </defs>
      
      {/* Squircle background with gradient */}
      <rect 
        width={size} 
        height={size} 
        rx={dimensions.borderRadius} 
        fill={`url(#${ids.gradient})`} 
        filter={`url(#${ids.shadow})`}
      />
      
      {/* Font Awesome pie chart icon */}
      <g transform={iconTransform}>
        <path 
          fill="white" 
          d={PIE_CHART_PATH}
        />
      </g>
    </svg>
  );
};

export default ProfolioLogoSVG; 