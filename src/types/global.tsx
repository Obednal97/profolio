import type { BasisPoints, Cents } from "@/lib/moneyUnits";

/**
 * MONEY IS `Cents` AND RATES ARE `BasisPoints` IN EVERY ONE OF THESE TYPES.
 *
 * That is the wire format for every resource - the API sends and receives the
 * integers the database holds, and nothing on the server converts a unit. The
 * conversion happens once, in the browser, at the point of display, via
 * `formatCents` in src/lib/moneyUnits.ts.
 *
 * The types are branded so the compiler enforces it. `Cents` is a plain number
 * at runtime, but it cannot be passed where a display value is wanted without
 * saying so, which is the only reason it exists: every money bug this project
 * has had was a unit crossing that looked like ordinary arithmetic.
 */

// --------------------
// Asset Types
// --------------------
export type Asset = {
  id: string;
  userId?: string;
  name: string;
  type: "stock" | "crypto" | "cash" | "stock_options" | "bond" | "other" | "savings";
  symbol?: string;
  quantity: number;
  purchase_price?: Cents;
  current_value?: Cents;
  valueOverride?: Cents;
  purchase_date?: string;
  vesting_start_date?: string;
  vesting_end_date?: string;
  vesting_schedule?: {
    initial: string;
    monthly: string;
  };
  notes?: string;
  price_history?: { date: string; value: Cents }[];
  
  // Savings-specific fields
  initialAmount?: Cents;
  interestRate?: BasisPoints;
  interestType?: "SIMPLE" | "COMPOUND";
  paymentFrequency?: "MONTHLY" | "QUARTERLY" | "ANNUALLY";
  termLength?: number;
  maturityDate?: string;
};

// --------------------
// Expense Types
// --------------------
export type Expense = {
  id: string;
  userId?: string;
  category: string;
  amount: Cents;
  date: string;
  description: string;
  recurrence: "one-time" | "recurring";
  frequency?: "Daily" | "Weekly" | "Biweekly" | "Monthly" | "Quarterly" | "Yearly";
  merchant?: string;
  isSubscription?: boolean;
  notes?: string;
};

export type ExpenseFormData = {
  category: string;
  amount: string;
  date: string;
  description: string;
  recurrence?: "one-time" | "recurring";
  frequency?: "Daily" | "Weekly" | "Biweekly" | "Monthly" | "Quarterly" | "Yearly";
};

// --------------------
// Property Types
// --------------------
export type Property = {
  id: string;
  userId?: string;
  
  // Address components  
  address: string;
  street?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  
  // Property details
  ownershipType?: "owned" | "rented";
  propertyType?: "single_family" | "condo" | "townhouse" | "multi_family" | "commercial" | "land";
  status?: "owned" | "rental" | "rented" | "sold";
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  yearBuilt?: number;
  lotSize?: number;
  
  // Financial values, in integer cents
  currentValue?: Cents;
  purchasePrice?: Cents;
  rentalIncome?: Cents;
  
  // Mortgage details
  mortgageAmount?: Cents;
  mortgageRate?: BasisPoints;
  mortgageTerm?: number;
  monthlyPayment?: Cents;
  mortgageProvider?: string;
  mortgageStartDate?: string;
  
  // Additional costs (monthly)
  propertyTaxes?: Cents;
  insurance?: Cents;
  maintenanceCosts?: Cents;
  hoa?: Cents;
  
  // Rental details
  monthlyRent?: Cents;
  securityDeposit?: Cents;
  rentalStartDate?: string;
  rentalEndDate?: string;
  
  // Dates and metadata
  purchaseDate?: string;
  notes?: string;
};

export type PropertyFormData = {
    address: string;
    street: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
    
    purchasePrice: string;
    currentValue: string;
    propertyType: string;
    status: string;
    notes?: string;
    
    // Ownership details
    ownershipType: 'owned' | 'rented' | 'leased';
    
    // Rental-specific fields
    rentalStartDate?: string;
    rentalEndDate?: string;
    monthlyRent?: string;
    securityDeposit?: string;
    
    // Owned property fields
    purchaseDate?: string;
    
    // Mortgage details (for owned properties)
    mortgageAmount?: string;
    mortgageRate?: string;
    mortgageTerm?: string;
    monthlyPayment?: string;
    mortgageStartDate?: string;
    mortgageProvider?: string;
    
    // Property details
    bedrooms?: string;
    bathrooms?: string;
    squareFootage?: string;
    yearBuilt?: string;
    lotSize?: string;
    
    // Financial details
    rentalIncome?: string;
    propertyTaxes?: string;
    insurance?: string;
    maintenanceCosts?: string;
    hoa?: string;
  };

// --------------------
// Admin Manager Types
// --------------------
export type User = {
  id: string;
  email: string | null;
  name?: string;
  role?: "user" | "admin" | "super_admin";
  token?: string;
  
  // Extended profile fields (from Google auth or manual entry)
  phone?: string;
  location?: string;
  bio?: string;
  photoURL?: string;
  
  // Authentication metadata
  provider?: 'google' | 'email' | 'demo';
  emailVerified?: boolean;
  createdAt?: string;
  lastSignIn?: string;
  lastUpdated?: number;
  
  preferences?: {
    currency?: string;
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
      marketing?: boolean;
    };
  };
};

export type Group = {
  id: string;
  name: string;
  description: string;
};

export type Permission = {
  id: string;
  page: string;
  user: boolean;
  admin: boolean;
  super_admin: boolean;
};

export type Invitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  sent_at: string;
};