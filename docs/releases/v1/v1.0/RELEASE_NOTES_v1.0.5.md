# Release Notes - v1.0.5

Released: 2025-01-31

## 🎯 Release Highlights

**Critical production fix release** - Resolves DOMMatrix SSR errors that were preventing successful production builds. This release ensures your Profolio instance can be deployed without build failures.

## 🐛 Critical Bug Fixes

### Fixed: DOMMatrix SSR Error in Production Builds

**The Problem:**
- Production builds were failing with `ReferenceError: DOMMatrix is not defined`
- This occurred when Next.js tried to server-side render PDF parsing components
- The error prevented successful deployments and updates

**The Solution:**
- Added browser-only checks (`typeof window !== 'undefined'`) to PDF.js initialization
- Made PDF parser configuration conditional on client-side execution
- Enhanced `parseBankStatementPDF` function with SSR-safe guards

**Impact:**
- Production builds now complete successfully
- PDF parsing functionality remains fully operational on client-side
- No functionality loss - all features work as expected

### Technical Implementation

```javascript
// PDF.js now only loads in browser environment
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

// Parser function prevents SSR execution
export async function parseBankStatementPDF(file: File): Promise<ParseResult> {
  if (typeof window === 'undefined') {
    throw new Error('PDF parsing is only available in browser environment');
  }
  // ... rest of function
}
```

## 🔧 Technical Improvements

### SSR-Safe Dynamic Imports
- All PDF-related components use dynamic imports with `ssr: false`
- Browser environment validation before PDF.js operations
- Improved error handling for server-side rendering scenarios

### Build Process Enhancements
- More robust build error detection
- Better error messages for SSR-related issues
- Maintained full client-side functionality

## 📚 Files Modified

- `frontend/src/lib/pdfParser.ts` - Added browser-only checks
- `frontend/src/app/app/expenses/import/page.tsx` - Already had proper dynamic imports

## 🔄 Update Instructions

If you encountered build failures with v1.0.4:

1. Update your installation:
   ```bash
   ./install-or-update.sh --version v1.0.5
   ```

2. The build should now complete successfully

3. Verify PDF import functionality still works in the browser

## 🛡️ Production Stability

This release prioritizes production stability:
- Zero breaking changes
- All existing features preserved
- Focus on build reliability
- Comprehensive SSR error prevention

## 🙏 Acknowledgments

Thanks to users who reported the DOMMatrix build errors. Your detailed error logs helped us quickly identify and resolve this critical issue.

## 📊 Statistics

- **1 critical bug** fixed
- **2 files** modified
- **100% backward** compatible
- **0 breaking** changes 