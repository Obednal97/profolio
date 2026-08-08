/**
 * Mock release data for development and demo purposes
 * Separated from main code for better organization and maintainability
 */

export interface MockRelease {
  version: string;
  name: string;
  body: string;
  publishedAt: string;
  downloadUrl: string;
  isLatest: boolean;
}

export const mockReleases: MockRelease[] = [
  {
    version: '1.7.1',
    name: 'Profolio v1.7.1 - Enhanced UI & Mobile Optimisations',
    body: `## 🚀 New Features
- Mobile navigation bar for seamless app navigation
- Enhanced authentication flow with Google OAuth priority
- Responsive pricing page with feature comparison tables
- FAQ sections with smooth animations
- Demo mode consistency across all pages

## ✨ Improvements  
- Mobile-first responsive design across all pages
- Optimised spacing and typography for mobile devices
- Enhanced glass effects and visual polish
- Improved footer layout and mobile navigation spacing
- Better text wrapping and markdown support in release notes

## 🐛 Bug Fixes
- Fixed footer overlap issues on mobile devices
- Resolved authentication page layout inconsistencies
- Fixed apostrophe rendering in UI text
- Corrected pricing card height alignment
- Fixed release sorting and filtering issues`,
    publishedAt: '2025-01-06T14:00:00Z',
    downloadUrl: 'https://github.com/Obednal97/profolio/releases/tag/v1.7.1',
    isLatest: true
  },
  {
    version: '1.7.0',
    name: 'Profolio v1.7.0 - Major UI Overhaul',
    body: `## 🚀 New Features
- Complete UI redesign with enhanced visual hierarchy
- Advanced pricing tiers with detailed feature comparison
- Enhanced update management with cloud/self-hosted detection
- Improved release notes with markdown formatting support
- Better mobile experience across all pages

## ✨ Improvements
- Modernised colour scheme and typography
- Enhanced glassmorphism effects throughout the app
- Better responsive breakpoints for mobile devices
- Improved accessibility with focus management
- Optimised performance with better code splitting

## 🐛 Bug Fixes
- Fixed update page layout and navigation issues
- Resolved release sorting and version detection
- Fixed mobile viewport and scrolling issues
- Corrected authentication state management`,
    publishedAt: '2025-01-05T16:30:00Z',
    downloadUrl: 'https://github.com/Obednal97/profolio/releases/tag/v1.7.0',
    isLatest: false
  },
  {
    version: '1.6.0',
    name: 'Profolio v1.6.0 - Enhanced Analytics & Notifications',
    body: `## 🚀 New Features
- Real-time notification system with badge indicators
- Advanced portfolio performance analytics
- Enhanced asset allocation visualisations
- Automated rebalancing recommendations
- Multi-currency support improvements

## ✨ Improvements
- Faster data synchronisation with improved caching
- Enhanced error handling and user feedback
- Better mobile responsiveness across all components
- Optimised database queries for better performance
- Improved security with enhanced authentication

## 🐛 Bug Fixes
- Fixed notification delivery reliability issues
- Resolved portfolio calculation edge cases
- Fixed timezone handling in transaction records
- Corrected asset import validation logic`,
    publishedAt: '2025-01-03T12:00:00Z',
    downloadUrl: 'https://github.com/Obednal97/profolio/releases/tag/v1.6.0',
    isLatest: false
  },
  {
    version: '1.5.0',
    name: 'Profolio v1.5.0 - API Enhancements & Performance',
    body: `## 🚀 New Features
- Enhanced API key management with multiple providers
- Improved market data synchronisation
- Advanced portfolio history tracking
- Enhanced security with rate limiting
- Better error recovery mechanisms

## ✨ Improvements
- Significant performance improvements for large portfolios
- Enhanced logging and monitoring capabilities
- Better handling of API rate limits
- Improved data validation and sanitisation
- Enhanced user experience with loading states

## 🐛 Bug Fixes
- Fixed API synchronisation timeout issues
- Resolved memory leaks in data fetching
- Fixed chart rendering performance issues
- Corrected currency conversion accuracy`,
    publishedAt: '2025-01-01T10:00:00Z',
    downloadUrl: 'https://github.com/Obednal97/profolio/releases/tag/v1.5.0',
    isLatest: false
  },
  {
    version: '1.4.0',
    name: 'Profolio v1.4.0 - Enhanced Analytics',
    body: `## 🚀 New Features
- Advanced portfolio analytics dashboard
- Real-time market alerts and notifications
- Enhanced asset allocation visualization
- Automated rebalancing suggestions
- Multi-timeframe performance analysis

## ✨ Improvements  
- Faster portfolio synchronization
- Enhanced security measures
- Better error handling and user feedback
- Improved mobile responsiveness
- Optimized database performance

## 🐛 Bug Fixes
- Fixed portfolio calculation edge cases
- Resolved timezone issues in transactions
- Fixed notification delivery reliability
- Corrected asset import validation
- Fixed responsive layout on tablets`,
    publishedAt: '2024-12-20T16:00:00Z',
    downloadUrl: 'https://github.com/Obednal97/profolio/releases/tag/v1.4.0',
    isLatest: false
  },
  {
    version: '1.3.0',
    name: 'Profolio v1.3.0 - Enhanced Notification System & Critical Fixes',
    body: `## 🚀 New Features
- Notification badges on user menu for instant visibility
- Demo mode banner with clear signup call-to-action  
- Smart auto-updates toggle for self-hosted deployments
- Enhanced notification system with real-time updates
- Cross-deployment compatibility improvements

## 🐛 Critical Bug Fixes
- Fixed Next.js 15+ dynamic route parameter issues
- Unified Yahoo Finance rate limiting for better reliability
- Resolved updates page layout and viewport issues
- Fixed notification badge positioning and display

## ✨ Improvements
- Simplified notifications UI with streamlined interface
- Better rate limiting synchronization across services
- Enhanced demo session management
- Improved documentation organization`,
    publishedAt: '2024-12-02T10:00:00Z',
    downloadUrl: 'https://github.com/Obednal97/profolio/releases/tag/v1.3.0',
    isLatest: false
  },
  {
    version: '1.2.3',
    name: 'Profolio v1.2.3 - MDX Components and Development Fixes',
    body: `## 🐛 Bug Fixes
- Fixed MDX Components TypeScript configuration
- Resolved development server compatibility issues
- Fixed component type definitions
- Corrected build process for documentation

## ✨ Improvements
- Enhanced development experience
- Better error messages for failed operations
- Improved logging for debugging
- Enhanced performance monitoring`,
    publishedAt: '2025-01-02T14:30:00Z',
    downloadUrl: 'https://github.com/Obednal97/profolio/releases/tag/v1.2.3',
    isLatest: false
  },
  {
    version: '1.2.1',
    name: 'Profolio v1.2.1 - Proxmox LXC Support',
    body: `## 🚀 New Features
- Full Proxmox LXC container support
- Environment preservation system
- Enhanced demo mode functionality
- Unified authentication improvements

## 🐛 Bug Fixes
- Fixed container deployment issues
- Resolved authentication edge cases
- Fixed environment variable handling
- Corrected service startup sequences

## ✨ Improvements
- Better container resource management
- Enhanced logging for troubleshooting
- Improved installation reliability`,
    publishedAt: '2024-12-15T16:00:00Z',
    downloadUrl: 'https://github.com/Obednal97/profolio/releases/tag/v1.2.1',
    isLatest: false
  },
  {
    version: '1.2.0',
    name: 'Profolio v1.2.0 - Authentication & Deployment Enhancements',
    body: `## 🚀 New Features
- Unified authentication system (local + Firebase)
- Self-hosted and cloud deployment modes
- Enhanced demo mode with session management
- Advanced installer with rollback protection

## ✨ Improvements
- Better error handling for API failures
- Enhanced logging for troubleshooting
- Improved data validation
- Optimized performance for large portfolios`,
    publishedAt: '2024-12-01T10:00:00Z',
    downloadUrl: 'https://github.com/Obednal97/profolio/releases/tag/v1.2.0',
    isLatest: false
  },
  {
    version: '1.1.0',
    name: 'Profolio v1.1.0 - Foundation Release',
    body: `## 🚀 New Features
- Complete portfolio management system
- Real-time market data integration
- Asset tracking and performance analysis
- Secure authentication system
- Responsive web interface

## ✨ Improvements
- Enhanced portfolio dashboard performance
- Improved API key management interface
- Better error messages for failed syncs
- Faster asset price updates
- Optimized database queries

## 🐛 Bug Fixes
- Fixed asset sync timeout issues
- Resolved chart rendering across browsers
- Fixed settings page validation
- Corrected currency conversion accuracy`,
    publishedAt: '2024-11-15T12:00:00Z',
    downloadUrl: 'https://github.com/Obednal97/profolio/releases/tag/v1.1.0',
    isLatest: false
  }
]; 