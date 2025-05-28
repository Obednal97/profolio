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
    mortgageAmount?: number;
    mortgageRate?: number;
    monthlyPayment?: number;
    rentalIncome?: number;
    propertyType: string;
    status: string;
    notes?: string;
  };

export type PropertyFormData = {
    address: string;
    purchasePrice: string;
    currentValue: string;
    mortgageAmount?: string;
    mortgageRate?: string;
    monthlyPayment?: string;
    rentalIncome?: string;
    propertyType: string;
    status: string;
    notes?: string;
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