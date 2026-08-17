// Advanced transaction classification system with merchant recognition and smart categorization

export interface TransactionCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  gradient: string;
  parent?: string;
  keywords?: string[];
  merchants?: string[];
}

export interface MerchantInfo {
  name: string;
  category: string;
  subcategory?: string;
  isSubscription?: boolean;
  logo?: string;
}

// Comprehensive category hierarchy similar to industry leaders
export const TRANSACTION_CATEGORIES: Record<string, TransactionCategory> = {
  // Income Categories
  'income': {
    id: 'income',
    name: 'Income',
    icon: 'fa-money-bill-wave',
    color: '#10b981',
    gradient: 'from-green-500 to-green-600',
  },
  'salary': {
    id: 'salary',
    name: 'Salary',
    icon: 'fa-briefcase',
    color: '#10b981',
    gradient: 'from-green-500 to-green-600',
    parent: 'income',
    keywords: ['salary', 'payroll', 'wage', 'compensation'],
  },
  'investment_income': {
    id: 'investment_income',
    name: 'Investment Income',
    icon: 'fa-chart-line',
    color: '#10b981',
    gradient: 'from-green-500 to-green-600',
    parent: 'income',
    keywords: ['dividend', 'interest', 'capital gain', 'investment return'],
  },
  'freelance': {
    id: 'freelance',
    name: 'Freelance/Business',
    icon: 'fa-laptop',
    color: '#10b981',
    gradient: 'from-green-500 to-green-600',
    parent: 'income',
    // 'payment' was here, and it is far too broad to mean freelance income:
    // it appears in CARD PAYMENT, MONTHLY RENT PAYMENT and FASTER PAYMENT.
    // Because this category is declared near the top of the object and the
    // keyword scan returned the first hit, any spending line containing the
    // word was classified as freelance income - and 'freelance' counts as
    // income on the dashboard, so a rent payment both vanished from spending
    // and added itself to earnings.
    keywords: ['invoice', 'client', 'project'],
  },
  
  // Food & Dining
  'food_dining': {
    id: 'food_dining',
    name: 'Food & Dining',
    icon: 'fa-utensils',
    color: '#f59e0b',
    gradient: 'from-orange-500 to-orange-600',
  },
  'groceries': {
    id: 'groceries',
    name: 'Groceries',
    icon: 'fa-shopping-basket',
    color: '#f59e0b',
    gradient: 'from-orange-500 to-orange-600',
    parent: 'food_dining',
    keywords: ['grocery', 'supermarket', 'market'],
    merchants: ['tesco', 'sainsbury', 'asda', 'waitrose', 'morrisons', 'aldi', 'lidl', 'walmart', 'kroger', 'whole foods', 'trader joe'],
  },
  'restaurants': {
    id: 'restaurants',
    name: 'Restaurants',
    icon: 'fa-concierge-bell',
    color: '#f59e0b',
    gradient: 'from-orange-500 to-orange-600',
    parent: 'food_dining',
    keywords: ['restaurant', 'dining', 'eat', 'food'],
  },
  'coffee_tea': {
    id: 'coffee_tea',
    name: 'Coffee & Tea',
    icon: 'fa-coffee',
    color: '#f59e0b',
    gradient: 'from-orange-500 to-orange-600',
    parent: 'food_dining',
    keywords: ['coffee', 'cafe', 'tea'],
    merchants: ['starbucks', 'costa', 'pret', 'caffe nero', 'dunkin', 'tim hortons'],
  },
  'takeout_delivery': {
    id: 'takeout_delivery',
    name: 'Takeout & Delivery',
    icon: 'fa-motorcycle',
    color: '#f59e0b',
    gradient: 'from-orange-500 to-orange-600',
    parent: 'food_dining',
    keywords: ['delivery', 'takeout', 'takeaway'],
    merchants: ['uber eats', 'deliveroo', 'just eat', 'doordash', 'grubhub', 'postmates'],
  },
  
  // Transportation
  'transportation': {
    id: 'transportation',
    name: 'Transportation',
    icon: 'fa-car',
    color: '#10b981',
    gradient: 'from-emerald-500 to-emerald-600',
  },
  'fuel': {
    id: 'fuel',
    name: 'Fuel',
    icon: 'fa-gas-pump',
    color: '#10b981',
    gradient: 'from-emerald-500 to-emerald-600',
    parent: 'transportation',
    // 'gas' on its own belongs to utilities in the UK, where it means the
    // supply to a house, not a car. Both categories claimed it and this one
    // is declared first, so BRITISH GAS ENERGY was filed as motor fuel.
    keywords: ['fuel', 'petrol', 'diesel', 'gas station', 'filling station', 'service station'],
    merchants: ['shell', 'bp', 'exxon', 'chevron', 'texaco', 'esso'],
  },
  'public_transport': {
    id: 'public_transport',
    name: 'Public Transport',
    icon: 'fa-train',
    color: '#10b981',
    gradient: 'from-emerald-500 to-emerald-600',
    parent: 'transportation',
    keywords: ['metro', 'subway', 'bus', 'train', 'tube', 'tfl'],
    merchants: ['transport for london', 'mta', 'bart'],
  },
  'rideshare': {
    id: 'rideshare',
    name: 'Rideshare & Taxi',
    icon: 'fa-taxi',
    color: '#10b981',
    gradient: 'from-emerald-500 to-emerald-600',
    parent: 'transportation',
    keywords: ['taxi', 'cab', 'ride'],
    merchants: ['uber', 'lyft', 'bolt', 'ola', 'grab'],
  },
  'parking': {
    id: 'parking',
    name: 'Parking',
    icon: 'fa-parking',
    color: '#10b981',
    gradient: 'from-emerald-500 to-emerald-600',
    parent: 'transportation',
    keywords: ['parking', 'park'],
  },
  
  // Shopping
  'shopping': {
    id: 'shopping',
    name: 'Shopping',
    icon: 'fa-shopping-bag',
    color: '#ec4899',
    gradient: 'from-pink-500 to-pink-600',
  },
  'clothing': {
    id: 'clothing',
    name: 'Clothing & Accessories',
    icon: 'fa-tshirt',
    color: '#ec4899',
    gradient: 'from-pink-500 to-pink-600',
    parent: 'shopping',
    keywords: ['clothes', 'clothing', 'apparel', 'fashion', 'shoes'],
    merchants: ['zara', 'h&m', 'uniqlo', 'gap', 'nike', 'adidas', 'primark'],
  },
  'electronics': {
    id: 'electronics',
    name: 'Electronics',
    icon: 'fa-laptop',
    color: '#ec4899',
    gradient: 'from-pink-500 to-pink-600',
    parent: 'shopping',
    keywords: ['electronics', 'computer', 'phone', 'gadget'],
    merchants: ['apple', 'best buy', 'currys', 'pc world'],
  },
  'home_garden': {
    id: 'home_garden',
    name: 'Home & Garden',
    icon: 'fa-couch',
    color: '#ec4899',
    gradient: 'from-pink-500 to-pink-600',
    parent: 'shopping',
    keywords: ['furniture', 'home', 'garden', 'decor'],
    merchants: ['ikea', 'home depot', 'lowes', 'b&q'],
  },
  
  // Entertainment & Subscriptions
  'entertainment': {
    id: 'entertainment',
    name: 'Entertainment',
    icon: 'fa-film',
    color: '#8b5cf6',
    gradient: 'from-purple-500 to-purple-600',
  },
  'streaming': {
    id: 'streaming',
    name: 'Streaming Services',
    icon: 'fa-tv',
    color: '#8b5cf6',
    gradient: 'from-purple-500 to-purple-600',
    parent: 'entertainment',
    keywords: ['streaming', 'subscription'],
    merchants: ['netflix', 'spotify', 'disney', 'hulu', 'hbo', 'prime video', 'apple tv', 'youtube'],
  },
  'gaming': {
    id: 'gaming',
    name: 'Gaming',
    icon: 'fa-gamepad',
    color: '#8b5cf6',
    gradient: 'from-purple-500 to-purple-600',
    parent: 'entertainment',
    keywords: ['game', 'gaming', 'playstation', 'xbox', 'nintendo'],
    merchants: ['steam', 'epic games', 'playstation', 'xbox', 'nintendo'],
  },
  'events': {
    id: 'events',
    name: 'Events & Activities',
    icon: 'fa-ticket-alt',
    color: '#8b5cf6',
    gradient: 'from-purple-500 to-purple-600',
    parent: 'entertainment',
    keywords: ['ticket', 'concert', 'movie', 'theatre', 'event'],
  },
  
  // Bills & Utilities
  'bills_utilities': {
    id: 'bills_utilities',
    name: 'Bills & Utilities',
    icon: 'fa-file-invoice',
    color: '#eab308',
    gradient: 'from-yellow-500 to-yellow-600',
  },
  'rent_mortgage': {
    id: 'rent_mortgage',
    name: 'Rent/Mortgage',
    icon: 'fa-home',
    color: '#eab308',
    gradient: 'from-yellow-500 to-yellow-600',
    parent: 'bills_utilities',
    keywords: ['rent', 'mortgage', 'housing'],
  },
  'utilities': {
    id: 'utilities',
    name: 'Utilities',
    icon: 'fa-bolt',
    color: '#eab308',
    gradient: 'from-yellow-500 to-yellow-600',
    parent: 'bills_utilities',
    keywords: ['electric', 'gas', 'water', 'utility', 'power'],
  },
  'internet_phone': {
    id: 'internet_phone',
    name: 'Internet & Phone',
    icon: 'fa-wifi',
    color: '#eab308',
    gradient: 'from-yellow-500 to-yellow-600',
    parent: 'bills_utilities',
    keywords: ['internet', 'broadband', 'phone', 'mobile', 'cellular'],
    merchants: ['verizon', 'at&t', 't-mobile', 'ee', 'o2', 'vodafone', 'three'],
  },
  
  // Healthcare
  'healthcare': {
    id: 'healthcare',
    name: 'Healthcare',
    icon: 'fa-heartbeat',
    color: '#ef4444',
    gradient: 'from-red-500 to-red-600',
  },
  'medical': {
    id: 'medical',
    name: 'Medical',
    icon: 'fa-stethoscope',
    color: '#ef4444',
    gradient: 'from-red-500 to-red-600',
    parent: 'healthcare',
    keywords: ['doctor', 'hospital', 'clinic', 'medical'],
  },
  'pharmacy': {
    id: 'pharmacy',
    name: 'Pharmacy',
    icon: 'fa-pills',
    color: '#ef4444',
    gradient: 'from-red-500 to-red-600',
    parent: 'healthcare',
    keywords: ['pharmacy', 'drug', 'medicine', 'prescription'],
    merchants: ['cvs', 'walgreens', 'boots', 'superdrug'],
  },
  
  // Financial
  'financial': {
    id: 'financial',
    name: 'Financial',
    icon: 'fa-university',
    color: '#6366f1',
    gradient: 'from-indigo-500 to-indigo-600',
  },
  'banking_fees': {
    id: 'banking_fees',
    name: 'Banking Fees',
    icon: 'fa-money-check',
    color: '#6366f1',
    gradient: 'from-indigo-500 to-indigo-600',
    parent: 'financial',
    keywords: ['fee', 'charge', 'overdraft', 'atm'],
  },
  'investments': {
    id: 'investments',
    name: 'Investments',
    icon: 'fa-chart-line',
    color: '#6366f1',
    gradient: 'from-indigo-500 to-indigo-600',
    parent: 'financial',
    keywords: ['investment', 'stock', 'trading', 'crypto', 'bitcoin'],
  },
  'savings': {
    id: 'savings',
    name: 'Savings',
    icon: 'fa-piggy-bank',
    color: '#6366f1',
    gradient: 'from-indigo-500 to-indigo-600',
    parent: 'financial',
    keywords: ['savings', 'save', 'deposit'],
  },
  'transfers': {
    id: 'transfers',
    name: 'Transfers',
    icon: 'fa-exchange-alt',
    color: '#6366f1',
    gradient: 'from-indigo-500 to-indigo-600',
    parent: 'financial',
    // 'payment' was here too, and it is not a transfer signal any more than it
    // was a freelance one: MONTHLY RENT PAYMENT is rent.
    keywords: ['transfer', 'send', 'receive'],
  },
  'insurance': {
    id: 'insurance',
    name: 'Insurance',
    icon: 'fa-shield-alt',
    color: '#6366f1',
    gradient: 'from-indigo-500 to-indigo-600',
    parent: 'financial',
    keywords: ['insurance', 'policy', 'premium', 'coverage', 'deductible'],
  },
  
  // Other
  'other': {
    id: 'other',
    name: 'Other',
    icon: 'fa-ellipsis-h',
    color: '#6b7280',
    gradient: 'from-gray-500 to-gray-600',
  },
};

// Known merchant database
export const MERCHANT_DATABASE: Record<string, MerchantInfo> = {
  // Streaming Services (Subscriptions)
  'netflix': { name: 'Netflix', category: 'entertainment', subcategory: 'streaming', isSubscription: true },
  'spotify': { name: 'Spotify', category: 'entertainment', subcategory: 'streaming', isSubscription: true },
  'apple music': { name: 'Apple Music', category: 'entertainment', subcategory: 'streaming', isSubscription: true },
  'disney plus': { name: 'Disney+', category: 'entertainment', subcategory: 'streaming', isSubscription: true },
  'disney+': { name: 'Disney+', category: 'entertainment', subcategory: 'streaming', isSubscription: true },
  'hulu': { name: 'Hulu', category: 'entertainment', subcategory: 'streaming', isSubscription: true },
  'hbo max': { name: 'HBO Max', category: 'entertainment', subcategory: 'streaming', isSubscription: true },
  'prime video': { name: 'Prime Video', category: 'entertainment', subcategory: 'streaming', isSubscription: true },
  'youtube premium': { name: 'YouTube Premium', category: 'entertainment', subcategory: 'streaming', isSubscription: true },
  
  // Food Delivery
  'uber eats': { name: 'Uber Eats', category: 'food_dining', subcategory: 'takeout_delivery' },
  'deliveroo': { name: 'Deliveroo', category: 'food_dining', subcategory: 'takeout_delivery' },
  'just eat': { name: 'Just Eat', category: 'food_dining', subcategory: 'takeout_delivery' },
  'doordash': { name: 'DoorDash', category: 'food_dining', subcategory: 'takeout_delivery' },
  'grubhub': { name: 'Grubhub', category: 'food_dining', subcategory: 'takeout_delivery' },
  
  // Coffee Shops
  'starbucks': { name: 'Starbucks', category: 'food_dining', subcategory: 'coffee_tea' },
  'costa coffee': { name: 'Costa Coffee', category: 'food_dining', subcategory: 'coffee_tea' },
  'pret a manger': { name: 'Pret A Manger', category: 'food_dining', subcategory: 'coffee_tea' },
  'caffe nero': { name: 'Caffè Nero', category: 'food_dining', subcategory: 'coffee_tea' },
  
  // Supermarkets
  'tesco': { name: 'Tesco', category: 'food_dining', subcategory: 'groceries' },
  'sainsburys': { name: 'Sainsbury\'s', category: 'food_dining', subcategory: 'groceries' },
  'sainsbury\'s': { name: 'Sainsbury\'s', category: 'food_dining', subcategory: 'groceries' },
  'asda': { name: 'ASDA', category: 'food_dining', subcategory: 'groceries' },
  'morrisons': { name: 'Morrisons', category: 'food_dining', subcategory: 'groceries' },
  'waitrose': { name: 'Waitrose', category: 'food_dining', subcategory: 'groceries' },
  'aldi': { name: 'Aldi', category: 'food_dining', subcategory: 'groceries' },
  'lidl': { name: 'Lidl', category: 'food_dining', subcategory: 'groceries' },
  'whole foods': { name: 'Whole Foods', category: 'food_dining', subcategory: 'groceries' },
  'walmart': { name: 'Walmart', category: 'food_dining', subcategory: 'groceries' },
  
  // Transportation
  'uber': { name: 'Uber', category: 'transportation', subcategory: 'rideshare' },
  'lyft': { name: 'Lyft', category: 'transportation', subcategory: 'rideshare' },
  'bolt': { name: 'Bolt', category: 'transportation', subcategory: 'rideshare' },
  'transport for london': { name: 'Transport for London', category: 'transportation', subcategory: 'public_transport' },
  'tfl': { name: 'TfL', category: 'transportation', subcategory: 'public_transport' },
  
  // Retail
  'amazon': { name: 'Amazon', category: 'shopping' },
  'apple': { name: 'Apple', category: 'shopping', subcategory: 'electronics' },
  'ikea': { name: 'IKEA', category: 'shopping', subcategory: 'home_garden' },
  'zara': { name: 'Zara', category: 'shopping', subcategory: 'clothing' },
  'h&m': { name: 'H&M', category: 'shopping', subcategory: 'clothing' },
  'uniqlo': { name: 'Uniqlo', category: 'shopping', subcategory: 'clothing' },
  'nike': { name: 'Nike', category: 'shopping', subcategory: 'clothing' },
  'adidas': { name: 'Adidas', category: 'shopping', subcategory: 'clothing' },
  
  // Utilities & Services
  'ee': { name: 'EE', category: 'bills_utilities', subcategory: 'internet_phone', isSubscription: true },
  'o2': { name: 'O2', category: 'bills_utilities', subcategory: 'internet_phone', isSubscription: true },
  'vodafone': { name: 'Vodafone', category: 'bills_utilities', subcategory: 'internet_phone', isSubscription: true },
  'three': { name: 'Three', category: 'bills_utilities', subcategory: 'internet_phone', isSubscription: true },
  'bt': { name: 'BT', category: 'bills_utilities', subcategory: 'internet_phone', isSubscription: true },
  'virgin media': { name: 'Virgin Media', category: 'bills_utilities', subcategory: 'internet_phone', isSubscription: true },
  
  // Gaming
  'steam': { name: 'Steam', category: 'entertainment', subcategory: 'gaming' },
  'playstation': { name: 'PlayStation', category: 'entertainment', subcategory: 'gaming' },
  'xbox': { name: 'Xbox', category: 'entertainment', subcategory: 'gaming' },
  'nintendo': { name: 'Nintendo', category: 'entertainment', subcategory: 'gaming' },
  
  // American Express specific
  'membership fee': { name: 'American Express Fee', category: 'financial', subcategory: 'banking_fees' },
  'annual fee': { name: 'American Express Fee', category: 'financial', subcategory: 'banking_fees' },
  'amex annual': { name: 'American Express Fee', category: 'financial', subcategory: 'banking_fees' },
  'foreign transaction fee': { name: 'Foreign Transaction Fee', category: 'financial', subcategory: 'banking_fees' },
  
  // Insurance companies
  'aviva': { name: 'Aviva', category: 'financial', subcategory: 'insurance' },
  'axa': { name: 'AXA', category: 'financial', subcategory: 'insurance' },
  'admiral': { name: 'Admiral', category: 'financial', subcategory: 'insurance' },
  'direct line': { name: 'Direct Line', category: 'financial', subcategory: 'insurance' },
  'churchill': { name: 'Churchill', category: 'financial', subcategory: 'insurance' },
  'geico': { name: 'GEICO', category: 'financial', subcategory: 'insurance' },
  'state farm': { name: 'State Farm', category: 'financial', subcategory: 'insurance' },
  'allstate': { name: 'Allstate', category: 'financial', subcategory: 'insurance' },
};

/**
 * The categories that mean money arriving.
 *
 * The expense table has no sign column, so the category is the only thing
 * separating income from spending, and this set was written out by hand in
 * three places - the dashboard, the expenses service and here. Derived from
 * the category tree instead, so adding an income category cannot leave two of
 * the three disagreeing.
 */
export const INCOME_CATEGORY_IDS: ReadonlySet<string> = new Set(
  Object.values(TRANSACTION_CATEGORIES)
    .filter((category) => category.id === 'income' || category.parent === 'income')
    .map((category) => category.id),
);

export function isIncomeCategory(categoryId: string): boolean {
  return INCOME_CATEGORY_IDS.has(categoryId.trim().toLowerCase());
}

/**
 * Whether `needle` appears in `haystack` as a whole word.
 *
 * Plain `includes` matched 'gas' inside 'gasket' and 'ent' inside 'rent', and
 * the merchant scan matched short keys inside longer unrelated names.
 */
function containsWord(haystack: string, needle: string): boolean {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // A trailing plural is still the same word: 'fee' has to find FEES, and
  // 'store' has to find STORES.
  return new RegExp(`(^|[^a-z0-9])${escaped}s?([^a-z0-9]|$)`, 'i').test(haystack);
}

/**
 * The longest matching key wins.
 *
 * Both the merchant scan and the keyword scan used to return the first hit in
 * object declaration order, which made classification depend on where someone
 * happened to paste a new entry. Two categories claimed 'gas' and the one
 * declared first took it. Longest match is a real rule: 'british gas' beats
 * 'gas' because it says more.
 */
function longestMatch<T>(
  description: string,
  entries: Array<[string, T]>,
): { key: string; value: T } | null {
  let best: { key: string; value: T } | null = null;
  for (const [key, value] of entries) {
    if (!containsWord(description, key)) continue;
    if (best === null || key.length > best.key.length) best = { key, value };
  }
  return best;
}

const MERCHANT_ENTRIES = Object.entries(MERCHANT_DATABASE);

const KEYWORD_ENTRIES: Array<[string, string]> = Object.values(TRANSACTION_CATEGORIES)
  .flatMap((category) =>
    (category.keywords ?? []).map(
      (keyword) => [keyword, category.id] as [string, string],
    ),
  );

/**
 * Classifies one statement line.
 *
 * `amountInCents` is integer cents, matching every caller and the rest of this
 * module: `detectRecurringTransactions` below divides by 100 to build a
 * whole-pounds grouping key, the PDF parser stores the output of `parseAmount`
 * which multiplies by 100, and the CSV reader does the same. The parameter is
 * named for its unit so a future caller cannot pass pounds without noticing.
 *
 * Direction gates which categories are even considered. A debit can never come
 * back as income and a credit can only be income. Without that gate the
 * keyword scan ran over the whole tree in declaration order, so a spending
 * line was free to land on an income category - and did, constantly, because
 * 'freelance' listed 'payment' as a keyword.
 *
 * There are no amount-only guesses left. Anything under ten pounds used to be
 * returned as 'coffee_tea' with a stated confidence of 0.6, which is a
 * category invented out of nothing: a 9.45 charge at Boots is not coffee.
 * A line the description cannot explain is 'other', and says so with a low
 * confidence rather than a plausible-looking wrong answer.
 */
export function classifyTransaction(description: string, amountInCents: number, type: 'debit' | 'credit'): {
  category: string;
  subcategory?: string;
  confidence: number;
  isSubscription: boolean;
  merchant?: MerchantInfo;
} {
  const normalizedDesc = description.toLowerCase().trim();
  const wantIncome = type === 'credit';

  // A known merchant is the strongest signal, but only when it agrees with the
  // direction of the money. A refund from Tesco is not groceries.
  const merchantMatch = longestMatch(normalizedDesc, MERCHANT_ENTRIES);
  if (merchantMatch) {
    const merchant = merchantMatch.value;
    const category = merchant.subcategory || merchant.category;
    if (isIncomeCategory(category) === wantIncome) {
      return {
        category,
        subcategory: merchant.subcategory,
        confidence: 0.95,
        isSubscription: merchant.isSubscription || false,
        merchant,
      };
    }
    // Recognised, but pointing the wrong way. Keep the merchant for display and
    // fall through to decide the category on the direction of the money.
    if (wantIncome) {
      return {
        category: 'income',
        confidence: 0.7,
        isSubscription: false,
        merchant,
      };
    }
  }

  const keywordMatch = longestMatch(
    normalizedDesc,
    KEYWORD_ENTRIES.filter(([, categoryId]) => isIncomeCategory(categoryId) === wantIncome),
  );
  if (keywordMatch) {
    const category = TRANSACTION_CATEGORIES[keywordMatch.value];
    return {
      category: keywordMatch.value,
      subcategory: category?.parent,
      confidence: 0.8,
      isSubscription: false,
      merchant: merchantMatch?.value,
    };
  }

  if (wantIncome) {
    return {
      category: 'income',
      confidence: 0.7,
      isSubscription: false,
      merchant: merchantMatch?.value,
    };
  }

  // Says nothing about the category, only that this looks like a standing
  // charge, so it stays 'other' and is flagged for the recurring view.
  const subscriptionPatterns = [
    /monthly subscription/i,
    /annual subscription/i,
    /recurring payment/i,
    /membership/i,
    /subscription/i,
  ];
  if (subscriptionPatterns.some((pattern) => pattern.test(normalizedDesc))) {
    return {
      category: 'other',
      confidence: 0.5,
      isSubscription: true,
      merchant: merchantMatch?.value,
    };
  }

  return {
    category: 'other',
    confidence: 0.3,
    isSubscription: false,
    merchant: merchantMatch?.value,
  };
}

/**
 * Groups repeated statement lines and guesses how often they recur. Amounts are
 * integer cents here as well, which is why the grouping key below divides by
 * 100 before rounding: it deliberately treats amounts within the same pound as
 * the same subscription.
 */
export function detectRecurringTransactions(transactions: Array<{
  description: string;
  amount: number;
  date: string;
}>): Map<string, { frequency: string; confidence: number }> {
  const recurringMap = new Map<string, { frequency: string; confidence: number }>();
  
  // Group transactions by similar description and amount
  const groups = new Map<string, Array<{ date: string; amount: number }>>();
  
  for (const transaction of transactions) {
    // Create a key based on normalized description and rounded amount
    const key = `${transaction.description.toLowerCase().slice(0, 20)}_${Math.round(transaction.amount / 100)}`;
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push({ date: transaction.date, amount: transaction.amount });
  }
  
  // Analyze each group for recurring patterns
  for (const [key, group] of groups.entries()) {
    if (group.length >= 2) {
      // Sort by date
      group.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Calculate intervals between transactions
      const intervals: number[] = [];
      for (let i = 1; i < group.length; i++) {
        const days = Math.round(
          (new Date(group[i].date).getTime() - new Date(group[i - 1].date).getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        intervals.push(days);
      }
      
      // Determine frequency based on average interval
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      
      let frequency = 'irregular';
      let confidence = 0.5;
      
      if (avgInterval >= 365 - 15 && avgInterval <= 365 + 15) {
        frequency = 'yearly';
        confidence = 0.9;
      } else if (avgInterval >= 90 - 7 && avgInterval <= 90 + 7) {
        frequency = 'quarterly';
        confidence = 0.85;
      } else if (avgInterval >= 30 - 3 && avgInterval <= 30 + 3) {
        frequency = 'monthly';
        confidence = 0.9;
      } else if (avgInterval >= 14 - 2 && avgInterval <= 14 + 2) {
        frequency = 'biweekly';
        confidence = 0.85;
      } else if (avgInterval >= 7 - 1 && avgInterval <= 7 + 1) {
        frequency = 'weekly';
        confidence = 0.85;
      }
      
      if (frequency !== 'irregular') {
        recurringMap.set(key, { frequency, confidence });
      }
    }
  }
  
  return recurringMap;
}

// Get category display info
export function getCategoryInfo(categoryId: string): TransactionCategory {
  return TRANSACTION_CATEGORIES[categoryId] || TRANSACTION_CATEGORIES.other;
}

// Get all categories for display
export function getAllCategories(): TransactionCategory[] {
  return Object.values(TRANSACTION_CATEGORIES).filter(cat => !cat.parent);
}

// Get subcategories for a parent category
export function getSubcategories(parentId: string): TransactionCategory[] {
  return Object.values(TRANSACTION_CATEGORIES).filter(cat => cat.parent === parentId);
} 