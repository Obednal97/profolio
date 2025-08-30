# Release Notes - v1.14.0

**Released**: 30th August 2025  
**Type**: Minor Release  
**Compatibility**: Fully backward compatible

---

## 🎯 **Release Highlights**

- **Fixed Demo Mode**: Resolved critical issue where demo data wasn't displaying in Asset, Property, and Expense managers
- **Income Tracking**: Added comprehensive income tracking with salary, freelance, and transfer entries
- **Advanced Sorting**: Implemented 8-way sorting system for better data organization
- **Visual Clarity**: Income now displays in green, expenses in red for instant recognition

## ✨ **New Features**

### Demo Mode Enhancements
- **Server-Side Generation**: Demo data now generates correctly on API routes (fixed localStorage access issue)
- **Realistic Data**: Added 50+ realistic transactions with proper merchants and descriptions
- **Income Entries**: New income categories including salary, freelance, refunds, and transfers

### Expense Manager Improvements
- **8-Way Sorting**: Sort by date (asc/desc), amount (asc/desc), name (asc/desc), category (asc/desc)
- **Visual Distinction**: Income shows as green/positive, expenses as red/negative
- **Category Variety**: Proper categorization with rent_mortgage, groceries, utilities, etc.

## 🐛 **Critical Bug Fixes**

### Demo Data Display Issue
- **Problem**: Demo data stored in localStorage but not displaying in UI
- **Root Cause**: API routes run server-side where localStorage doesn't exist
- **Solution**: Modified API routes to use generateDemoAssets/Expenses/Properties directly

### Category Mapping Fix
- **Problem**: All expenses showing as "Other" category
- **Root Cause**: Used capitalized names instead of lowercase category IDs
- **Solution**: Updated to use proper IDs: rent_mortgage, groceries, utilities, etc.

### Amount Sorting Bug
- **Problem**: Amount sorting not working correctly
- **Root Cause**: Amounts not stored in cents format
- **Solution**: Multiplied all amounts by 100 for proper cent-based calculations

## 🎨 **UI/UX Improvements**

- **Income Display**: Fixed ExpenseTableRow and ExpenseCard components to show income as positive
- **Color Coding**: Consistent green for income, red for expenses across all views
- **Sorting Indicators**: Clear visual feedback for active sort order
- **Card Layout**: Improved ExpenseManagerCard with better visual hierarchy

## 🔧 **Technical Improvements**

- **API Routes**: Enhanced /api/expenses, /api/assets, /api/properties for demo mode
- **Data Generation**: Improved generateDemoExpenses() with realistic patterns
- **Type Safety**: Added proper TypeScript types for sorting options
- **Component Architecture**: New ExpenseManagerCard component for better reusability

## 🛡️ **Security & Compatibility**

- **Auth Safety**: Demo mode properly isolated from authenticated user data
- **Cookie Detection**: Reliable demo mode detection via auth tokens
- **Backward Compatible**: All changes maintain compatibility with existing data

## 📚 **Documentation**

- **Code Comments**: Added clarifying comments for demo mode logic
- **Category Mapping**: Documented valid category IDs in transactionClassifier
- **Sorting Logic**: Clear documentation of signed value sorting approach

## 🚀 **Performance**

- **Optimized Sorting**: Efficient useMemo implementation for filtered and sorted data
- **Reduced Re-renders**: Proper dependency arrays in React hooks
- **Bundle Size**: No significant increase despite new features

## 📦 **Installation & Updates**

Update your Profolio installation to v1.14.0:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh)"
```

Self-hosted installations will detect and install this version automatically.

## 📊 **Release Statistics**

- **Commits**: 5 commits addressing demo mode and sorting
- **Files Changed**: 8 core components and API routes
- **Lines Added**: ~500 (including demo data enhancements)
- **Lines Removed**: ~200 (removing redundant code)
- **Test Coverage**: All demo mode scenarios validated

---

**Note**: This version includes automatic PWA cache invalidation. Users will receive fresh updates without manual cache clearing.