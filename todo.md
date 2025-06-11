# Profolio TODO List

## 🔴 **CRITICAL PRIORITY** (Security & Production Blockers)

- [x] ✅ **COMPLETED** - **CRITICAL FIX** - Mock API hardcoded to true, preventing real backend usage even with production env vars (environment-based detection implemented)
- [x] ✅ **COMPLETED** - **CRITICAL FIX** - Multiple hardcoded configurations preventing proper environment-based deployment:
  - BYPASS_AUTH hardcoded to false instead of environment-based (now uses NEXT_PUBLIC_BYPASS_AUTH)
  - API client defaulting to frontend port 3000 instead of backend port 3001 (corrected)
  - Backend CORS origin pointing to backend port 3001 instead of frontend port 3000 (corrected)
- [x] ✅ **COMPLETED** - **CRITICAL FIX** - Missing API proxy routes causing 404 errors after mock API disable:
  - Created `/api/properties/*` proxy routes (create, update, delete)
  - Created `/api/expenses/*` proxy routes
  - Created `/api/assets/summary` and `/api/assets/history` for dashboard
  - Fixed request/response format transformation (mock API → REST API)
  - Fixed authentication token extraction from httpOnly cookies
- [x] ✅ **COMPLETED** - **CRITICAL FIX** - API authentication and format mismatch between frontend and backend:
  - Fixed MarketDataWidget using wrong API format (POST with mock format → GET with REST format)
  - Added defensive error handling for malformed API requests
  - Standardized authentication header passing between proxy routes and backend
- [x] ✅ **COMPLETED** - **CRITICAL FIX** - Backend module registration and dependency injection errors:
  - Fixed PropertiesModule and ExpensesModule missing PrismaService dependencies
  - Fixed MarketDataWidget using mock API format on real proxy routes
  - Added defensive error handling for malformed API requests
  - All endpoints now properly registered and functional
- [x] ✅ **COMPLETED** - **CRITICAL FIX** - Google Places API CORS errors and postcode search limitations:
  - Created server-side proxy routes for Google Places Autocomplete and Details APIs
  - Implemented smart postcode detection with helpful user guidance
  - Added support for UK, US, Canadian, and Australian postcode formats
  - Enhanced UX with contextual tips when users enter postcodes only
  - Maintained fallback to OpenStreetMap for users without Google API keys
- [x] ✅ **COMPLETED** - FIX - Production Firebase Admin SDK verification implementation (`backend/src/app/api/auth/auth.controller.ts`)
- [x] ✅ **COMPLETED** - FIX - Role-based access control for admin endpoints (`backend/src/updates/updates.controller.ts` & `backend/src/app/api/admin/users/users.controller.ts`)
- [x] ✅ **COMPLETED** - FIX - Replace in-memory API key storage with secure database storage (`frontend/src/app/api/user/api-keys/route.ts`)
- [x] ✅ **COMPLETED** - FIX - Mixed Content Security Errors - HTTP resources loaded over HTTPS causing browser blocking
- [x] ✅ **COMPLETED** - FIX - Missing static assets causing 404 errors (`desktop-dashboard.png`, `mobile-dashboard.png`)
- [x] ✅ **COMPLETED** - FIX - Failed notification API calls (`Failed to fetch notifications`, `Failed to refresh unread count`)
- [x] ✅ **COMPLETED** - FIX - Delete account should be disabled in Demo mode, clicking delete account returns a blank white page, can only be solved right now by clearing the cache and refreshing

## 🟡 **HIGH PRIORITY** (User Experience & Features)

- [x] ✅ **COMPLETED** - FIX - Development-only logs showing in production (preloading, cache skip, PWA, auth state), use logger.ts
- [x] ✅ **COMPLETED** - FIX - Excessive console logging impacting performance and exposing debug info, use logger.ts
- [x] ✅ **COMPLETED** - FIX - Authentication state logging exposing sensitive information in console, use logger.ts
- [x] ✅ **COMPLETED** - FIX - Updates page doesn't have the latest release selected by default (dependency cycle fixed)
- [x] ✅ **COMPLETED** - FIX - Saving theme preference in settings doesn't have any affect (setTheme integration fixed)
- [x] ✅ **COMPLETED** - FIX - Updates page version detection incorrect - showing wrong current version (mock data version fixed to use package.json version)
- [x] ✅ **COMPLETED** - FIX - Preloading conditions not met after authentication (improved detection logic for post-auth state)
- [x] ✅ **COMPLETED** - FIX - Updates API 404 errors due to double /api/api/ in URLs (fixed all endpoint paths)
- [x] ✅ **COMPLETED** - FIX - Network requests taking multiple seconds due to API delays and dynamic imports (reduced API delay to 50ms, moved imports to top level)
- [x] ✅ **COMPLETED** - FIX - Excessive User Menu console logging causing performance impact (optimized to only log on data changes)
- [x] ✅ **COMPLETED** - FIX - API config modal should be height limited to below the header and above the footer on web or mobile nav bar on mobile. Like the add an asset modal (proper height calc implemented)
- [x] ✅ **COMPLETED** - UPDATE - Mobile login and signup buttons to be same size as logo and square (h-11 w-11 consistency)
- [x] ✅ **COMPLETED** - UPDATE - When on mobile, enable the theme toggle in header before signup & signin buttons (already enabled)
- [x] ✅ **COMPLETED** - **FIX** - Loading page background should use site-wide animated color background (Impact Score: 8)
  - Updated AuthLoadingState component to use consistent animated gradient background
  - Now matches site-wide pattern with proper blob animations (animate-blob vs animate-pulse)
  - Consistent visual experience during auth transitions and page loading
- [ ] **NEW** - Google auth users should be able to set password for email auth (Impact Score: 8)
  - Currently asks for current password but none exists for Google auth users
  - Allow setting initial password for account security
- [ ] **NEW** - Add 2FA properly using otplib (Impact Score: 8)
  - Implement TOTP-based two-factor authentication
  - QR code generation for authenticator apps
  - Backup codes for account recovery
- [ ] **UPDATE** - Implement failed password rate limiting (Impact Score: 8)
  - Enhance existing rate limiting for password attempts
  - Progressive lockout duration (15min → 1hr → 24hr)
  - Account security monitoring and alerts
- [ ] **UPDATE** - Utilise bcrypt for password hashing and secure storage (Impact Score: 7)
  - Verify bcrypt salt rounds (currently 12, industry standard)
  - Audit password storage security practices
  - Ensure proper password validation flows
- [ ] **UPDATE** - NextAuth migration (Impact Score: 7)
  - Migrate from Firebase + custom backend auth to NextAuth.js
  - Unified provider management (Google + credentials)
  - Improved session handling and security features
- [ ] **FIX** - Animation stutter on mobile and PWA (Impact Score: 6)
  - Optimize animations for mobile performance
  - Reduce frame drops and improve smoothness
- [ ] **UPDATE** - Complete ApiKeysService integration in setup service (Impact Score: 6)
  - Finish backend integration for API key management
  - Enable proper setup flow for external services

## 🟢 **MEDIUM PRIORITY** (Features & Improvements)

- [ ] **NEW** - Separate app performance from user actions (Impact Score: 9)
  - Prevent one user from taking down the app for all users
  - Implement proper isolation and resource management
- [ ] **NEW** - User management (Impact Score: 8)
  - Admin interface for managing users
  - User roles and permissions system
- [ ] **NEW** - Stripe integration (Impact Score: 8)
  - Payment processing for premium features
  - Subscription management
- [ ] **UPDATE** - Complete market data type migration (Impact Score: 7)
  - Finish backend market data service migration (`backend/src/app/api/market-data/market-data.service.ts`)
- [ ] **NEW** - Reports page (Impact Score: 7)
  - Generate and export portfolio reports
  - PDF/CSV export functionality
- [ ] **NEW** - Email notifications setup (Impact Score: 7)
  - Configure email service for notifications
  - User preferences for email alerts
- [ ] **NEW** - Guides documentation page (Impact Score: 6)
  - User guides and tutorials
  - Help documentation
- [ ] **NEW** - Captcha integration (Impact Score: 6)
  - Add captcha to signup/login forms
  - Prevent automated abuse
- [ ] **NEW** - Billing menu in settings (Impact Score: 6)
  - Subscription management interface
  - Payment history and invoices
- [ ] **UPDATE** - Improved settings page (Impact Score: 6)
  - Enhanced UI/UX for settings
  - Better organization of options
- [ ] **UPDATE** - Make account deletion more challenging (Impact Score: 6)
  - Add confirmation steps
  - Require password verification
- [ ] **NEW** - Welcome notification 60s after signup (Impact Score: 5)
  - Automated welcome message for new users
  - Onboarding flow improvement
- [ ] **NEW** - Set PWA status bar to CSS blur effect (Impact Score: 5)
  - PWA status bar styling (`frontend/src/app/globals.css`)
- [ ] **NEW** - Modals should have glass effect with blur (Impact Score: 5)
  - Enhanced visual design for modals
  - Glassmorphism UI effects
- [ ] **UPDATE** - Improved forgot password page (Impact Score: 5)
  - Better UX for password recovery
  - Clear instructions and feedback
- [ ] **UPDATE** - Improved policy hub (Impact Score: 4)
  - Enhanced privacy policy and terms pages
  - Better formatting and navigation

## 🔵 **LOW PRIORITY** (Polish & Nice-to-Have)

- [ ] **UPDATE** - Enhanced dashboard performance optimizations (Impact Score: 5)
  - Further optimize dashboard loading (`frontend/src/app/app/dashboard/page.tsx`)
- [ ] **UPDATE** - API security & validation improvements (Impact Score: 6)
  - Enhanced input validation and security (`frontend/src/app/api/market-data/portfolio-history/[userId]/route.ts`)
- [ ] **UPDATE** - PWA management enhancements (Impact Score: 4)
  - Improve PWA features (`frontend/src/components/PWAManager.tsx`)
- [ ] **NEW** - Get feedback (Impact Score: 4)
  - User feedback collection system
  - Feature request management
- [ ] **UPDATE** - Put screenshots in GitHub readme.md (Impact Score: 3)
  - Add visual documentation to repository
- [ ] **UPDATE** - Adjust padding on public pages (Impact Score: 3)
  - Fine-tune spacing on landing pages
- [ ] **UPDATE** - Add back scroll snap to section on public pages (Impact Score: 3)
  - Smooth scrolling between sections
- [ ] **UPDATE** - Remove links in footer (Impact Score: 2)
  - Clean up footer navigation

## 🧹 **TECHNICAL DEBT** (Development Cleanup)

- [x] ✅ **COMPLETED** - **UPDATE** - Phase out mock API usage where appropriate (Impact Score: 4)
  - ✅ Replaced direct mock API imports with unified API service in Asset Manager
  - ✅ Replaced direct mock API imports with proper API proxy in Expense Manager
  - ✅ Replaced direct mock API imports with proper API proxy in Portfolio page
  - ✅ Properties page and Expenses import page already modernized
  - ✅ LayoutWrapper modernized (using localStorage fallbacks for user preferences)
  - ✅ PropertyManager completely modernized (3 mockApi calls replaced with proper API proxy)
  - ✅ **RESULT**: Zero mockApi imports remaining in codebase - complete elimination achieved
- [x] ✅ **COMPLETED** - **UPDATE** - Replace placeholder implementations with real ones (Impact Score: 4)
  - ✅ Replaced console.log statements with proper logger usage in API services
  - ✅ Modernized API call patterns across all major components
  - ✅ All critical components now use proper authentication and error handling
- [x] ✅ **COMPLETED** - **UPDATE** - Remove development artifacts and improve maintainability (Impact Score: 4)
  - ✅ Cleaned up console.log statements in key API files and components
  - ✅ Modernized API patterns across AssetManager, ExpenseManager, Portfolio, Properties, LayoutWrapper, PropertyManager
  - ✅ All components now follow consistent authentication and API proxy patterns
  - ✅ Enhanced error handling and request cancellation across all components
- [x] ✅ **COMPLETED** - **UPDATE** - Clean up temporary market data generation (Impact Score: 3)
  - ✅ Assessed market data generators - confirmed they serve legitimate demo mode purpose
  - ✅ Streamlined mock data generation logic
  - ✅ Maintained necessary functionality for development and demo environments

## 📝 Notes

- **Major Issues Resolved**: All critical authentication, API connectivity, 404 routing, and backend module registration issues have been fixed
- **System Status**: Ready for production testing - all endpoints now functional with proper error handling
- **Recent Completions**: Fixed Properties/Expenses 404s, Assets API format mismatch, backend dependency injection, and Google Places API CORS issues
- **Next Steps**: Focus on enhancement features and testing coverage
- **Total API Routes Created**: 17 proxy routes covering all frontend→backend communication
