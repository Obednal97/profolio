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
    userId: 'demo-user-id',
    address: '123 Main St, San Francisco, CA',
    propertyType: 'single_family',
    status: 'owned',
    purchasePrice: 80000000, // $800,000 in cents
    currentValue: 95000000, // $950,000 in cents
    purchaseDate: '2020-03-15',
    mortgageAmount: 60000000, // $600,000 in cents
    mortgageRate: 3.25,
    mortgageStartDate: '2020-03-15',
    rentalIncome: 0,
    maintenanceCosts: 250000, // $2,500/month in cents
    notes: 'Beautiful Victorian home in the heart of the city',
  },
  {
    id: '2',
    userId: 'demo-user-id',
    address: '456 Oak Ave, Oakland, CA',
    propertyType: 'single_family',
    status: 'rental',
    purchasePrice: 45000000, // $450,000 in cents
    currentValue: 52000000, // $520,000 in cents
    purchaseDate: '2021-08-20',
    mortgageAmount: 35000000, // $350,000 in cents
    mortgageRate: 3.75,
    mortgageStartDate: '2021-08-20',
    rentalIncome: 280000, // $2,800/month in cents
    maintenanceCosts: 150000, // $1,500/month in cents
    notes: 'Great rental property with reliable tenants',
  },
];

// Generate historical data for charts
export const generateHistoricalData = (days: number, currentAssets: Asset[] = []) => {
  // If no assets, return empty data
  if (!currentAssets || currentAssets.length === 0) {
    return [];
  }

  const data = [];
  const today = new Date();
  
  // Calculate current total value from actual assets
  const currentTotalValue = currentAssets.reduce((sum, asset) => sum + (asset.current_value || 0), 0);
  
  // If current value is 0, return empty data
  if (currentTotalValue === 0) {
    return [];
  }
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Simulate historical values based on current portfolio value
    // Start from a lower value and grow to current value
    const progressRatio = (days - i) / days; // 0 to 1
    const baseValue = currentTotalValue * 0.7; // Start at 70% of current value
    const growth = currentTotalValue * 0.3 * progressRatio; // Grow 30% over time
    const randomFluctuation = (Math.random() - 0.5) * currentTotalValue * 0.05; // +/- 5% random
    
    const historicalValue = Math.max(0, baseValue + growth + randomFluctuation);
    
    data.push({
      date: date.toISOString().split('T')[0],
      total_value: Math.round(historicalValue),
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