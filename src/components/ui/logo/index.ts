/**
 * Profolio Logo Components
 * 
 * Exports both logo component variants:
 * - ProfolioLogo: Font Awesome-based component with Tailwind CSS
 * - ProfolioLogoSVG: Self-contained SVG component for favicon generation
 */

export { ProfolioLogo, default as ProfolioLogoFA } from './ProfolioLogo';
export { ProfolioLogoSVG, default as ProfolioLogoSVGDefault } from './ProfolioLogoSVG';

// Default export is the SVG version (more versatile)
export { default } from './ProfolioLogoSVG'; 