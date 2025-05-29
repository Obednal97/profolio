// --------------------
// Asset Types
// --------------------
export type Asset = {
  id?: string;
  name: string;
  type: string;
  symbol?: string;
  quantity?: number;
  current_value: number;
  purchase_price?: number;
  purchase_date?: string;
  notes?: string;
  vesting_start_date?: string;
  vesting_end_date?: string;
  vesting_schedule?: {
    initial?: string;
    monthly?: string;
  };
  price_history?: { date: string; value: number }[];
};

// --------------------
// Expense Types
// --------------------
export type Expense = {
  id?: string;
  userId: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  recurrence?: "one-time" | "recurring";
  frequency?: "Daily" | "Weekly" | "Biweekly" | "Monthly" | "Quarterly" | "Yearly";
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
    id?: string;
    address: string;
    purchasePrice: number;
    currentValue: number;
    propertyType: string;
    status: string;
    notes?: string;
    
    // Ownership details
    ownershipType: 'owned' | 'rented' | 'leased';
    
    // Rental-specific fields
    rentalStartDate?: string;
    rentalEndDate?: string;
    monthlyRent?: number;
    securityDeposit?: number;
    
    // Owned property fields
    purchaseDate?: string;
    
    // Mortgage details (for owned properties)
    mortgageAmount?: number;
    mortgageRate?: number;
    mortgageTerm?: number; // in years
    monthlyPayment?: number;
    mortgageStartDate?: string;
    mortgageProvider?: string;
    
    // Property details
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
    yearBuilt?: number;
    lotSize?: number;
    
    // Financial details
    rentalIncome?: number;
    propertyTaxes?: number;
    insurance?: number;
    maintenanceCosts?: number;
    hoa?: number;
  };

export type PropertyFormData = {
    address: string;
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