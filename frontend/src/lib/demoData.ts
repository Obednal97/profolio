import type { Asset, Property } from '@/types/global';

// Demo assets data
export const demoAssets: Omit<Asset, 'id'>[] = [
  {
    name: 'Apple Inc.',
    symbol: 'AAPL',
    type: 'stock',
    quantity: 50,
    current_value: 875000, // $8,750.00 (50 shares * $175)
    purchase_price: 750000, // $7,500.00 (50 shares * $150)
    purchase_date: '2023-01-15',
    notes: 'Tech giant with strong fundamentals'
  },
  {
    name: 'Bitcoin',
    symbol: 'BTC',
    type: 'crypto',
    quantity: 0.5,
    current_value: 2150000, // $21,500.00 (0.5 BTC * $43,000)
    purchase_price: 1500000, // $15,000.00 (0.5 BTC * $30,000)
    purchase_date: '2023-03-10',
    notes: 'Digital gold hedge against inflation'
  },
  {
    name: 'Ethereum',
    symbol: 'ETH',
    type: 'crypto',
    quantity: 5,
    current_value: 1125000, // $11,250.00 (5 ETH * $2,250)
    purchase_price: 900000, // $9,000.00 (5 ETH * $1,800)
    purchase_date: '2023-02-20',
    notes: 'Smart contract platform with DeFi exposure'
  },
  {
    name: 'SPDR S&P 500 ETF',
    symbol: 'SPY',
    type: 'stock',
    quantity: 25,
    current_value: 1087500, // $10,875.00 (25 shares * $435)
    purchase_price: 1000000, // $10,000.00 (25 shares * $400)
    purchase_date: '2023-01-05',
    notes: 'Broad market exposure through S&P 500'
  },
  {
    name: 'Tesla Inc.',
    symbol: 'TSLA',
    type: 'stock',
    quantity: 20,
    current_value: 420000, // $4,200.00 (20 shares * $210)
    purchase_price: 500000, // $5,000.00 (20 shares * $250)
    purchase_date: '2023-04-12',
    notes: 'EV leader with autonomous driving potential'
  },
  {
    name: 'Microsoft Corporation',
    symbol: 'MSFT',
    type: 'stock',
    quantity: 15,
    current_value: 562500, // $5,625.00 (15 shares * $375)
    purchase_price: 450000, // $4,500.00 (15 shares * $300)
    purchase_date: '2023-02-28',
    notes: 'Cloud computing and AI leader'
  },
  {
    name: 'High-Yield Savings',
    type: 'cash',
    quantity: 1,
    current_value: 2500000, // $25,000.00
    purchase_price: 2500000,
    purchase_date: '2023-01-01',
    notes: 'Emergency fund earning 4.5% APY'
  },
  {
    name: 'Company Stock Options',
    symbol: 'COMP',
    type: 'stock_options',
    quantity: 1000,
    current_value: 5000000, // $50,000.00 (1000 options * $50 current price)
    purchase_price: 2500000, // $25,000.00 (1000 options * $25 strike price)
    vesting_start_date: '2023-01-01',
    vesting_end_date: '2027-01-01',
    vesting_schedule: { initial: '25', monthly: '2.083' },
    notes: '4-year vesting with 1-year cliff'
  }
];

// Demo properties data
export const demoProperties: Omit<Property, 'id'>[] = [
  {
    address: '123 Main Street\nSan Francisco, CA 94102',
    ownershipType: 'owned',
    propertyType: 'single_family',
    status: 'owned',
    currentValue: 120000000, // $1,200,000.00
    purchasePrice: 95000000, // $950,000.00
    purchaseDate: '2022-06-15',
    bedrooms: 3,
    bathrooms: 2.5,
    squareFootage: 2200,
    yearBuilt: 2018,
    lotSize: 0.15,
    propertyTaxes: 144000, // $1,440.00/month
    insurance: 25000, // $250.00/month
    maintenanceCosts: 50000, // $500.00/month
    mortgageAmount: 76000000, // $760,000.00
    mortgageRate: 6.5,
    mortgageTerm: 30,
    monthlyPayment: 480000, // $4,800.00/month
    mortgageProvider: 'Wells Fargo',
    notes: 'Beautiful modern home in prime location'
  },
  {
    address: '456 Oak Avenue\nAustin, TX 78701',
    ownershipType: 'owned',
    propertyType: 'condo',
    status: 'rental',
    currentValue: 45000000, // $450,000.00
    purchasePrice: 38000000, // $380,000.00
    purchaseDate: '2023-03-20',
    bedrooms: 2,
    bathrooms: 2,
    squareFootage: 1100,
    yearBuilt: 2020,
    propertyTaxes: 45000, // $450.00/month
    insurance: 15000, // $150.00/month
    maintenanceCosts: 20000, // $200.00/month
    hoa: 35000, // $350.00/month
    mortgageAmount: 34200000, // $342,000.00
    mortgageRate: 7.0,
    mortgageTerm: 30,
    monthlyPayment: 227500, // $2,275.00/month
    mortgageProvider: 'Chase Bank',
    monthlyRent: 280000, // $2,800.00/month
    notes: 'Rental property generating positive cash flow'
  },
  {
    address: '789 Beach Road\nMiami, FL 33139',
    ownershipType: 'rented',
    propertyType: 'condo',
    status: 'rented',
    currentValue: 0, // Not applicable for rented properties
    purchasePrice: 0, // Not applicable for rented properties
    bedrooms: 1,
    bathrooms: 1,
    squareFootage: 800,
    monthlyRent: 350000, // $3,500.00/month
    securityDeposit: 350000, // $3,500.00
    rentalStartDate: '2023-12-01',
    rentalEndDate: '2024-03-31',
    notes: 'Short-term rental for winter season'
  }
];

// Function to populate demo data for a user
export async function populateDemoData(userId: string) {
  try {
    const { apiCall } = await import('@/lib/mockApi');
    
    // Add demo assets
    for (const asset of demoAssets) {
      try {
        await apiCall('/api/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: 'CREATE',
            userId,
            ...asset,
          }),
        });
      } catch (error) {
        console.error('Failed to create demo asset:', asset.name, error);
      }
    }

    // Add demo properties
    for (const property of demoProperties) {
      try {
        await apiCall('/api/properties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: 'CREATE',
            userId,
            ...property,
          }),
        });
      } catch (error) {
        console.error('Failed to create demo property:', property.address, error);
      }
    }

    console.log('Demo data populated successfully');
    return { success: true, assetsCount: demoAssets.length, propertiesCount: demoProperties.length };
  } catch (error) {
    console.error('Failed to populate demo data:', error);
    throw error;
  }
}

// Calculate demo portfolio summary
export function getDemoPortfolioSummary() {
  const totalValue = demoAssets.reduce((sum, asset) => sum + asset.current_value, 0);
  const totalInvested = demoAssets.reduce((sum, asset) => sum + (asset.purchase_price || 0), 0);
  const totalPnL = totalValue - totalInvested;
  const totalPnLPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  const topHoldings = demoAssets
    .map(asset => ({
      name: asset.name,
      value: asset.current_value,
      percentage: (asset.current_value / totalValue) * 100
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return {
    totalValue: totalValue / 100, // Convert to dollars
    totalInvested: totalInvested / 100,
    totalPnL: totalPnL / 100,
    totalPnLPercentage,
    assetsCount: demoAssets.length,
    topHoldings: topHoldings.map(holding => ({
      ...holding,
      value: holding.value / 100
    }))
  };
} 