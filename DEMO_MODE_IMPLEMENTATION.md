# Demo Mode Implementation

## Overview
The demo mode has been enhanced to provide realistic sample data for users who want to explore Profolio without creating an account. When users click "Try Demo Mode", they get access to a fully-featured experience with:

- 7 diverse assets (stocks, crypto, cash, bonds, stock options)
- 3 properties (primary residence, rental properties)
- 3 months of realistic expense data with various patterns

## Key Files Modified

### 1. **`frontend/src/lib/demoData.ts`**
- Fixed currency values (were in cents, now in dollars)
- Added `initializeDemoData()` function that creates fresh demo data
- Generates realistic:
  - Assets with proper purchase dates and values
  - Properties with mortgage details and rental income
  - Expenses with recurring subscriptions and variable spending

### 2. **`frontend/src/hooks/useAuth.ts`**
- Updated `signInWithDemo()` to call `initializeDemoData()`
- Ensures demo data is populated when entering demo mode

### 3. **`frontend/src/app/app/client-layout.tsx`**
- Added useEffect to initialize demo data when in demo mode
- Ensures data is available even on page refresh

## Demo Data Details

### Assets
- **Stocks**: Apple, Microsoft, Tesla, S&P 500 ETF
- **Crypto**: Bitcoin, Ethereum
- **Cash**: Emergency fund ($25,000)
- **Stock Options**: Company vesting schedule example
- **Bonds**: US Treasury bonds

### Properties
1. **Primary Residence** (San Francisco)
   - $1.2M value, $760k mortgage
   - Realistic monthly costs
   
2. **Rental Property** (Austin)
   - $450k value, generating $2,800/month
   - Positive cash flow example
   
3. **Beach Condo** (Miami)
   - Vacation rental property
   - $2,200/month income

### Expenses
- **Recurring**: Rent, utilities, subscriptions
- **Variable**: Groceries, dining, shopping
- **Patterns**: Monthly bills on 1st, weekly expenses on Sundays
- **3 months** of historical data

## Testing Demo Mode

1. Visit `/auth/signIn`
2. Click "Try Demo Mode" button
3. You'll be redirected to dashboard with sample data
4. All features work with demo data:
   - View portfolio performance
   - Browse expense insights
   - Manage properties
   - Edit/add/delete items (changes persist in session)

## Technical Notes

- Demo data stored in localStorage with `demo-user-id` prefix
- Data refreshes each time demo mode is activated
- All values are in USD (dollars, not cents)
- Demo mode flag: `localStorage.getItem('demo-mode') === 'true'`

## Future Enhancements

- Add more diverse expense categories
- Include investment account types
- Add historical price data for assets
- Generate PDF statements for demo bank accounts 