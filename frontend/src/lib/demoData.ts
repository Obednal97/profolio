import type { Asset, Property } from "@/types/global";
import { Expense } from "@/types/global";

// Demo assets data
export const demoAssets: Omit<Asset, "id">[] = [
  {
    name: "Apple Inc.",
    symbol: "AAPL",
    type: "stock",
    quantity: 50,
    current_value: 8750, // $8,750.00 (50 shares * $175)
    purchase_price: 7500, // $7,500.00 (50 shares * $150)
    purchase_date: "2023-01-15",
    notes: "Tech giant with strong fundamentals",
  },
  {
    name: "Bitcoin",
    symbol: "BTC",
    type: "crypto",
    quantity: 0.5,
    current_value: 21500, // $21,500.00 (0.5 BTC * $43,000)
    purchase_price: 15000, // $15,000.00 (0.5 BTC * $30,000)
    purchase_date: "2023-03-10",
    notes: "Digital gold hedge against inflation",
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    type: "crypto",
    quantity: 5,
    current_value: 11250, // $11,250.00 (5 ETH * $2,250)
    purchase_price: 9000, // $9,000.00 (5 ETH * $1,800)
    purchase_date: "2023-02-20",
    notes: "Smart contract platform with DeFi exposure",
  },
  {
    name: "SPDR S&P 500 ETF",
    symbol: "SPY",
    type: "stock",
    quantity: 25,
    current_value: 10875, // $10,875.00 (25 shares * $435)
    purchase_price: 10000, // $10,000.00 (25 shares * $400)
    purchase_date: "2023-01-05",
    notes: "Broad market exposure through S&P 500",
  },
  {
    name: "Tesla Inc.",
    symbol: "TSLA",
    type: "stock",
    quantity: 20,
    current_value: 4200, // $4,200.00 (20 shares * $210)
    purchase_price: 5000, // $5,000.00 (20 shares * $250)
    purchase_date: "2023-04-12",
    notes: "EV leader with autonomous driving potential",
  },
  {
    name: "Microsoft Corporation",
    symbol: "MSFT",
    type: "stock",
    quantity: 15,
    current_value: 5625, // $5,625.00 (15 shares * $375)
    purchase_price: 4500, // $4,500.00 (15 shares * $300)
    purchase_date: "2023-02-28",
    notes: "Cloud computing and AI leader",
  },
  {
    name: "High-Yield Savings",
    type: "cash",
    quantity: 1,
    current_value: 25000, // $25,000.00
    purchase_price: 25000,
    purchase_date: "2023-01-01",
    notes: "Emergency fund earning 4.5% APY",
  },
  {
    name: "Company Stock Options",
    symbol: "COMP",
    type: "stock_options",
    quantity: 1000,
    current_value: 50000, // $50,000.00 (1000 options * $50 current price)
    purchase_price: 25000, // $25,000.00 (1000 options * $25 strike price)
    vesting_start_date: "2023-01-01",
    vesting_end_date: "2027-01-01",
    vesting_schedule: { initial: "25", monthly: "2.083" },
    notes: "4-year vesting with 1-year cliff",
  },
];

// Demo properties data
export const demoProperties: Omit<Property, "id">[] = [
  {
    address: "123 Main Street\nSan Francisco, CA 94102",
    ownershipType: "owned",
    propertyType: "single_family",
    status: "owned",
    currentValue: 1200000, // $1,200,000.00
    purchasePrice: 950000, // $950,000.00
    purchaseDate: "2022-06-15",
    bedrooms: 3,
    bathrooms: 2.5,
    squareFootage: 2200,
    yearBuilt: 2018,
    lotSize: 6534, // 0.15 acres = 6,534 sq ft
    propertyTaxes: 1440, // $1,440.00/month
    insurance: 250, // $250.00/month
    maintenanceCosts: 500, // $500.00/month
    mortgageAmount: 760000, // $760,000.00
    mortgageRate: 6.5,
    mortgageTerm: 30,
    monthlyPayment: 4800, // $4,800.00/month
    mortgageProvider: "Wells Fargo",
    notes: "Beautiful modern home in prime location",
  },
  {
    address: "456 Oak Avenue\nAustin, TX 78701",
    ownershipType: "owned",
    propertyType: "condo",
    status: "rental",
    currentValue: 450000, // $450,000.00
    purchasePrice: 380000, // $380,000.00
    purchaseDate: "2023-03-20",
    bedrooms: 2,
    bathrooms: 2,
    squareFootage: 1100,
    yearBuilt: 2020,
    propertyTaxes: 450, // $450.00/month
    insurance: 150, // $150.00/month
    maintenanceCosts: 200, // $200.00/month
    hoa: 350, // $350.00/month
    mortgageAmount: 342000, // $342,000.00
    mortgageRate: 7.0,
    mortgageTerm: 30,
    monthlyPayment: 2275, // $2,275.00/month
    mortgageProvider: "Chase Bank",
    monthlyRent: 2800, // $2,800.00/month
    notes: "Rental property generating positive cash flow",
  },
  {
    address: "789 Beach Road\nMiami, FL 33139",
    ownershipType: "rented",
    propertyType: "condo",
    status: "rented",
    currentValue: 0, // Not applicable for rented properties
    purchasePrice: 0, // Not applicable for rented properties
    bedrooms: 1,
    bathrooms: 1,
    squareFootage: 800,
    monthlyRent: 3500, // $3,500.00/month
    securityDeposit: 3500, // $3,500.00
    rentalStartDate: "2023-12-01",
    rentalEndDate: "2024-03-31",
    notes: "Short-term rental for winter season",
  },
];

// Note: Legacy populateDemoData and hasUserData functions removed
// as they used mockApi but weren't being used anywhere.
// Current demo data uses localStorage-based functions below.

// Calculate demo portfolio summary
export function getDemoPortfolioSummary() {
  const totalValue = demoAssets.reduce((sum, asset) => {
    return sum + (asset.current_value || 0);
  }, 0);

  const totalInvested = demoAssets.reduce((sum, asset) => {
    return sum + (asset.purchase_price || 0);
  }, 0);

  const totalPL = totalValue - totalInvested;
  const percentageChange =
    totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

  // Calculate top holdings
  const holdings = demoAssets
    .map((asset) => ({
      name: asset.name,
      value: asset.current_value || 0,
      percentage:
        totalValue > 0 ? ((asset.current_value || 0) / totalValue) * 100 : 0,
    }))
    .sort((a, b) => (b.value || 0) - (a.value || 0))
    .slice(0, 5);

  return {
    totalValue,
    totalInvested,
    totalPL,
    percentageChange,
    assetCount: demoAssets.length,
    propertyCount: demoProperties.length,
    topHoldings: holdings.map((holding) => ({
      ...holding,
      percentage:
        Math.round(((holding.value || 0) / totalValue) * 100 * 10) / 10,
    })),
  };
}

// Generate demo assets for showcase
export const generateDemoAssets = (): Asset[] => {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  return [
    {
      id: "demo-asset-1",
      userId: "demo-user-id",
      name: "Apple Inc.",
      type: "stock",
      symbol: "AAPL",
      quantity: 50,
      purchase_price: 145,
      current_value: 9250,
      purchase_date: sixMonthsAgo.toISOString().split("T")[0],
      notes: "Tech portfolio - long term hold",
    },
    {
      id: "demo-asset-2",
      userId: "demo-user-id",
      name: "Microsoft Corporation",
      type: "stock",
      symbol: "MSFT",
      quantity: 30,
      purchase_price: 320,
      current_value: 11700,
      purchase_date: oneYearAgo.toISOString().split("T")[0],
      notes: "Core holding",
    },
    {
      id: "demo-asset-3",
      userId: "demo-user-id",
      name: "Bitcoin",
      type: "crypto",
      symbol: "BTC",
      quantity: 0.5,
      purchase_price: 30000,
      current_value: 21500,
      purchase_date: threeMonthsAgo.toISOString().split("T")[0],
      notes: "Crypto allocation",
    },
    {
      id: "demo-asset-4",
      userId: "demo-user-id",
      name: "Ethereum",
      type: "crypto",
      symbol: "ETH",
      quantity: 5,
      purchase_price: 2000,
      current_value: 11250,
      purchase_date: threeMonthsAgo.toISOString().split("T")[0],
      notes: "DeFi exposure",
    },
    {
      id: "demo-asset-5",
      userId: "demo-user-id",
      name: "Emergency Fund",
      type: "cash",
      quantity: 1,
      current_value: 25000,
      notes: "6 months of expenses in high-yield savings",
    },
    {
      id: "demo-asset-6",
      userId: "demo-user-id",
      name: "Tesla Stock Options",
      type: "stock_options",
      symbol: "TSLA",
      quantity: 100,
      purchase_price: 200,
      current_value: 24000,
      vesting_start_date: oneYearAgo.toISOString().split("T")[0],
      vesting_end_date: new Date(now.getTime() + 2 * 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      vesting_schedule: {
        initial: "25",
        monthly: "2.08",
      },
      notes: "Employee stock options - 4 year vesting",
    },
    {
      id: "demo-asset-7",
      userId: "demo-user-id",
      name: "US Treasury Bonds",
      type: "bond",
      quantity: 10,
      purchase_price: 1000,
      current_value: 9800,
      purchase_date: oneYearAgo.toISOString().split("T")[0],
      notes: "Safe haven allocation",
    },
  ];
};

// Generate demo expenses with realistic patterns
export const generateDemoExpenses = (): Expense[] => {
  const expenses: Expense[] = [];
  const now = new Date();

  // Categories with typical spending patterns using proper category IDs from TRANSACTION_CATEGORIES
  const expensePatterns = [
    // Income items (amounts in cents)
    {
      category: "salary",
      amount: 550000, // $5,500
      frequency: "Monthly",
      isSubscription: false,
      merchant: "TechCorp Inc",
      description: "Monthly salary",
    },
    {
      category: "freelance",
      amount: 120000, // $1,200
      frequency: "Occasional",
      merchant: "Client ABC",
      description: "Freelance project payment",
    },
    // Recurring expenses (amounts in cents)
    {
      category: "rent_mortgage",
      amount: 250000, // $2,500
      frequency: "Monthly",
      isSubscription: false,
      merchant: "Apartment Complex",
      description: "Monthly rent payment",
    },
    {
      category: "utilities",
      amount: 15000, // $150
      frequency: "Monthly",
      isSubscription: false,
      merchant: "City Utilities",
      description: "Electricity & Water",
    },
    {
      category: "internet_phone",
      amount: 8900, // $89
      frequency: "Monthly",
      isSubscription: true,
      merchant: "Verizon",
      description: "Mobile phone plan",
    },
    {
      category: "internet_phone",
      amount: 7500, // $75
      frequency: "Monthly",
      isSubscription: true,
      merchant: "Comcast",
      description: "Internet service",
    },
    {
      category: "healthcare",
      amount: 4500, // $45
      frequency: "Monthly",
      isSubscription: true,
      merchant: "Planet Fitness",
      description: "Gym membership",
    },
    {
      category: "streaming",
      amount: 1099, // $10.99
      frequency: "Monthly",
      isSubscription: true,
      merchant: "Spotify",
      description: "Music streaming",
    },
    {
      category: "streaming",
      amount: 1549, // $15.49
      frequency: "Monthly",
      isSubscription: true,
      merchant: "Netflix",
      description: "Video streaming",
    },
    {
      category: "insurance",
      amount: 12500, // $125
      frequency: "Monthly",
      isSubscription: false,
      merchant: "Geico",
      description: "Auto insurance",
    },
    {
      category: "insurance",
      amount: 18500, // $185
      frequency: "Monthly",
      isSubscription: false,
      merchant: "Blue Cross",
      description: "Health insurance",
    },
    {
      category: "shopping",
      amount: 1299, // $12.99
      frequency: "Monthly",
      isSubscription: true,
      merchant: "Adobe",
      description: "Creative Cloud subscription",
    },

    // Variable expenses (amounts in cents)
    {
      category: "groceries",
      amountRange: [8000, 12000], // $80-$120
      frequency: "Weekly",
      merchant: "Whole Foods",
      description: "Weekly groceries",
    },
    {
      category: "fuel",
      amountRange: [4000, 6000], // $40-$60
      frequency: "Weekly",
      merchant: "Shell",
      description: "Gas for car",
    },
    {
      category: "restaurants",
      amountRange: [2500, 6000], // $25-$60
      frequency: "Multiple",
      merchant: "Various Restaurants",
      description: "Dining out",
    },
    {
      category: "shopping",
      amountRange: [5000, 20000], // $50-$200
      frequency: "Occasional",
      merchant: "Amazon",
      description: "Online shopping",
    },
    {
      category: "entertainment",
      amountRange: [2000, 8000], // $20-$80
      frequency: "Occasional",
      merchant: "AMC Theaters",
      description: "Movies and events",
    },
    {
      category: "pharmacy",
      amountRange: [3000, 8000], // $30-$80
      frequency: "Occasional",
      merchant: "CVS Pharmacy",
      description: "Personal care items",
    },
    {
      category: "other",
      amountRange: [1500, 5000], // $15-$50
      frequency: "Occasional",
      merchant: "Udemy",
      description: "Online courses",
    },
  ];

  // Generate expenses for the last 3 months
  for (let daysAgo = 90; daysAgo >= 0; daysAgo--) {
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Add monthly expenses on the 1st
    if (date.getDate() === 1) {
      expensePatterns
        .filter((p) => p.frequency === "Monthly")
        .forEach((pattern) => {
          expenses.push({
            id: `demo-expense-${expenses.length + 1}`,
            userId: "demo-user-id",
            category: pattern.category,
            amount: pattern.amount || 0,
            date: date.toISOString().split("T")[0],
            description: pattern.description,
            recurrence: "recurring",
            frequency: "Monthly",
            merchant: pattern.merchant,
            isSubscription: pattern.isSubscription,
          });
        });
    }

    // Add weekly expenses on Sundays
    if (date.getDay() === 0) {
      expensePatterns
        .filter((p) => p.frequency === "Weekly")
        .forEach((pattern) => {
          const amount = pattern.amountRange
            ? Math.floor(
                Math.random() *
                  (pattern.amountRange[1] - pattern.amountRange[0]) +
                  pattern.amountRange[0]
              )
            : 0;
          expenses.push({
            id: `demo-expense-${expenses.length + 1}`,
            userId: "demo-user-id",
            category: pattern.category,
            amount,
            date: date.toISOString().split("T")[0],
            description: pattern.description,
            recurrence: "one-time",
            merchant: pattern.merchant,
          });
        });
    }

    // Add random occasional expenses
    if (Math.random() < 0.3) {
      // 30% chance each day
      const occasionalPatterns = expensePatterns.filter(
        (p) => p.frequency === "Occasional" || p.frequency === "Multiple"
      );
      if (occasionalPatterns.length > 0) {
        const pattern =
          occasionalPatterns[
            Math.floor(Math.random() * occasionalPatterns.length)
          ];
        const amount = pattern.amountRange
          ? Math.floor(
              Math.random() *
                (pattern.amountRange[1] - pattern.amountRange[0]) +
                pattern.amountRange[0]
            )
          : 0;
        expenses.push({
          id: `demo-expense-${expenses.length + 1}`,
          userId: "demo-user-id",
          category: pattern.category,
          amount,
          date: date.toISOString().split("T")[0],
          description: pattern.description,
          recurrence: "one-time",
          merchant: pattern.merchant,
        });
      }
    }
    
    // Add some random one-off expenses for more variety
    if (Math.random() < 0.1) {
      // 10% chance for misc expenses
      const miscExpenses = [
        { category: "rideshare", amount: 1500, merchant: "Uber", description: "Ride share" }, // $15
        { category: "coffee_tea", amount: 800, merchant: "Starbucks", description: "Coffee" }, // $8
        { category: "pharmacy", amount: 2500, merchant: "Walgreens", description: "Pharmacy" }, // $25
        { category: "home_garden", amount: 3500, merchant: "Target", description: "Household items" }, // $35
        { category: "other", amount: 5000, merchant: "Various", description: "Miscellaneous expense" }, // $50
        { category: "transportation", amount: 20000, merchant: "Delta Airlines", description: "Flight booking" }, // $200
        { category: "insurance", amount: 9500, merchant: "State Farm", description: "Renters insurance" }, // $95
        { category: "takeout_delivery", amount: 3200, merchant: "DoorDash", description: "Food delivery" }, // $32
        { category: "shopping", amount: 4500, merchant: "PetSmart", description: "Pet supplies" }, // $45
        { category: "clothing", amount: 7500, merchant: "H&M", description: "Clothing" }, // $75
        // Income items (amounts in cents)
        { category: "income", amount: 15000, merchant: "John Smith", description: "Friend repaid loan" }, // $150
        { category: "income", amount: 8900, merchant: "Amazon", description: "Product return refund" }, // $89
        { category: "investment_income", amount: 25000, merchant: "Vanguard", description: "Dividend payment" }, // $250
        { category: "freelance", amount: 80000, merchant: "StartupXYZ", description: "Consulting work" }, // $800
        { category: "income", amount: 50000, merchant: "IRS", description: "Tax refund" }, // $500
        { category: "income", amount: 20000, merchant: "Birthday Gift", description: "Birthday money from parents" }, // $200
      ];
      const misc = miscExpenses[Math.floor(Math.random() * miscExpenses.length)];
      expenses.push({
        id: `demo-expense-${expenses.length + 1}`,
        userId: "demo-user-id",
        category: misc.category,
        amount: misc.amount * (0.8 + Math.random() * 0.4), // Add some variance
        date: date.toISOString().split("T")[0],
        description: misc.description,
        recurrence: "one-time",
        merchant: misc.merchant,
      });
    }
  }

  return expenses;
};

// Generate demo properties
export const generateDemoProperties = (): Property[] => {
  return [
    {
      id: "demo-property-1",
      userId: "demo-user-id",
      address: "123 Main Street, San Francisco, CA 94105",
      ownershipType: "owned",
      propertyType: "condo",
      status: "owned",
      currentValue: 850000,
      purchasePrice: 750000,
      purchaseDate: "2021-06-15",
      bedrooms: 2,
      bathrooms: 2,
      squareFootage: 1200,
      yearBuilt: 2018,
      lotSize: 0,
      propertyTaxes: 708,
      insurance: 125,
      maintenanceCosts: 200,
      hoa: 450,
      mortgageAmount: 600000,
      mortgageRate: 3.25,
      mortgageTerm: 30,
      monthlyPayment: 2610,
      mortgageProvider: "Wells Fargo",
      notes: "Primary residence - great location near downtown",
    },
    {
      id: "demo-property-2",
      userId: "demo-user-id",
      address: "456 Oak Avenue, Austin, TX 78701",
      ownershipType: "owned",
      propertyType: "single_family",
      status: "rental",
      currentValue: 425000,
      purchasePrice: 350000,
      purchaseDate: "2020-03-20",
      bedrooms: 3,
      bathrooms: 2.5,
      squareFootage: 2100,
      yearBuilt: 2015,
      lotSize: 6500,
      rentalIncome: 2800,
      propertyTaxes: 583,
      insurance: 180,
      maintenanceCosts: 150,
      mortgageAmount: 280000,
      mortgageRate: 3.75,
      mortgageTerm: 30,
      monthlyPayment: 1297,
      mortgageProvider: "Chase Bank",
      notes: "Investment property - positive cash flow",
    },
    {
      id: "demo-property-3",
      userId: "demo-user-id",
      address: "789 Beach Road, Miami, FL 33139",
      ownershipType: "owned",
      propertyType: "condo",
      status: "rental",
      currentValue: 325000,
      purchasePrice: 275000,
      purchaseDate: "2022-01-10",
      bedrooms: 1,
      bathrooms: 1,
      squareFootage: 800,
      yearBuilt: 2020,
      lotSize: 0,
      rentalIncome: 2200,
      propertyTaxes: 375,
      insurance: 150,
      maintenanceCosts: 100,
      hoa: 350,
      mortgageAmount: 220000,
      mortgageRate: 4.25,
      mortgageTerm: 30,
      monthlyPayment: 1082,
      mortgageProvider: "Bank of America",
      notes: "Vacation rental - near beach",
    },
  ];
};

// Initialize demo data for a demo user
export const initializeDemoData = () => {
  const demoUserId = "demo-user-id";

  // Always refresh demo data to ensure consistency
  console.log("Initializing demo data...");

  // Generate and save demo data
  localStorage.setItem(
    `user-${demoUserId}-assets`,
    JSON.stringify(generateDemoAssets())
  );
  localStorage.setItem(
    `user-${demoUserId}-expenses`,
    JSON.stringify(generateDemoExpenses())
  );
  localStorage.setItem(
    `user-${demoUserId}-properties`,
    JSON.stringify(generateDemoProperties())
  );

  // Set demo user profile
  const demoProfile = {
    id: demoUserId,
    email: "demo@profolio.com",
    name: "Demo User",
    role: "user" as const,
    provider: "demo" as const,
    createdAt: new Date().toISOString(),
    preferences: {
      currency: "USD",
      theme: "system" as const,
      notifications: {
        email: false,
        push: false,
        marketing: false,
      },
    },
  };
  localStorage.setItem(
    `user-profile-${demoUserId}`,
    JSON.stringify(demoProfile)
  );

  console.log("Demo data initialized successfully");
};
