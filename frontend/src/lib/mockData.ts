// Mock data for development and testing
import type { Asset, Expense, Property } from '@/types/global';

export const mockAssets: Asset[] = [
  {
    id: '1',
    name: 'Apple Stock',
    type: 'stock',
    symbol: 'AAPL',
    quantity: 50,
    purchase_price: 15000, // $150.00 per share in cents
    current_value: 19000, // $190.00 per share in cents
    purchase_date: '2023-01-15',
    notes: 'Long-term investment',
  },
  {
    id: '2',
    name: 'Bitcoin',
    type: 'crypto',
    symbol: 'BTC',
    quantity: 0.5,
    purchase_price: 2000000, // $20,000 per BTC in cents
    current_value: 3500000, // $35,000 per BTC in cents
    purchase_date: '2022-12-01',
  },
  {
    id: '3',
    name: 'Emergency Fund',
    type: 'cash',
    current_value: 1500000, // $15,000 in cents
    quantity: 1,
    notes: 'High-yield savings account',
  },
  {
    id: '4',
    name: 'Tesla Stock',
    type: 'stock',
    symbol: 'TSLA',
    quantity: 25,
    purchase_price: 20000, // $200.00 per share in cents
    current_value: 24000, // $240.00 per share in cents
    purchase_date: '2023-03-20',
  },
  {
    id: '5',
    name: 'Ethereum',
    type: 'crypto',
    symbol: 'ETH',
    quantity: 5,
    purchase_price: 150000, // $1,500 per ETH in cents
    current_value: 200000, // $2,000 per ETH in cents
    purchase_date: '2023-02-10',
  },
];

export const mockExpenses: Expense[] = [
  {
    id: '1',
    userId: 'demo-user-id',
    category: 'Food',
    amount: 12500, // $125.00 in cents
    date: new Date().toISOString().split('T')[0],
    description: 'Grocery shopping at Whole Foods',
    recurrence: 'one-time',
  },
  {
    id: '2',
    userId: 'demo-user-id',
    category: 'Transportation',
    amount: 5000, // $50.00 in cents
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    description: 'Uber rides',
    recurrence: 'one-time',
  },
  {
    id: '3',
    userId: 'demo-user-id',
    category: 'Housing',
    amount: 150000, // $1,500.00 in cents
    date: new Date().toISOString().split('T')[0],
    description: 'Monthly rent',
    recurrence: 'recurring',
    frequency: 'Monthly',
  },
  {
    id: '4',
    userId: 'demo-user-id',
    category: 'Entertainment',
    amount: 7500, // $75.00 in cents
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
    description: 'Netflix and Spotify subscriptions',
    recurrence: 'recurring',
    frequency: 'Monthly',
  },
  {
    id: '5',
    userId: 'demo-user-id',
    category: 'Shopping',
    amount: 25000, // $250.00 in cents
    date: new Date(Date.now() - 259200000).toISOString().split('T')[0],
    description: 'New running shoes',
    recurrence: 'one-time',
  },
  {
    id: '6',
    userId: 'demo-user-id',
    category: 'Utilities',
    amount: 15000, // $150.00 in cents
    date: new Date(Date.now() - 345600000).toISOString().split('T')[0],
    description: 'Electricity and internet',
    recurrence: 'recurring',
    frequency: 'Monthly',
  },
  {
    id: '7',
    userId: 'demo-user-id',
    category: 'Healthcare',
    amount: 20000, // $200.00 in cents
    date: new Date(Date.now() - 432000000).toISOString().split('T')[0],
    description: 'Doctor visit and prescription',
    recurrence: 'one-time',
  },
];

export const mockProperties: Property[] = [
  {
    id: '1',
    address: '123 Main Street, San Francisco, CA 94105',
    purchasePrice: 75000000, // $750,000 in cents
    currentValue: 85000000, // $850,000 in cents
    mortgageAmount: 60000000, // $600,000 in cents
    mortgageRate: 3.5,
    monthlyPayment: 269000, // $2,690 in cents
    rentalIncome: 350000, // $3,500 in cents
    propertyType: 'residential',
    status: 'rented',
    notes: 'Primary residence, renting out basement unit',
  },
  {
    id: '2',
    address: '456 Oak Avenue, Austin, TX 78701',
    purchasePrice: 45000000, // $450,000 in cents
    currentValue: 52000000, // $520,000 in cents
    mortgageAmount: 36000000, // $360,000 in cents
    mortgageRate: 4.0,
    monthlyPayment: 171000, // $1,710 in cents
    rentalIncome: 250000, // $2,500 in cents
    propertyType: 'residential',
    status: 'rented',
    notes: 'Investment property',
  },
];

// Generate historical data for charts
export const generateHistoricalData = (days: number) => {
  const data = [];
  const today = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Simulate some growth with random fluctuations
    const baseValue = 5000000; // $50,000 in cents
    const growth = (days - i) * 10000; // $100 per day growth
    const randomFluctuation = Math.random() * 100000 - 50000; // +/- $500
    
    data.push({
      date: date.toISOString().split('T')[0],
      total_value: baseValue + growth + randomFluctuation,
    });
  }
  
  return data;
};

// Mock API response wrapper
export const mockApiResponse = <T>(data: T, delay = 500): Promise<{ data: T; error: null }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data, error: null });
    }, delay);
  });
}; 