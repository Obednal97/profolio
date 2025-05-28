// Trading 212 API Service
// Based on the official API documentation: https://t212public-api-docs.redoc.ly/

export interface Trading212Position {
  ticker: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  ppl: number;
  fxPpl: number;
  initialFillDate: string;
  frontend: string;
  maxBuy: number;
  maxSell: number;
  pieQuantity: number;
}

export interface Trading212Instrument {
  ticker: string;
  name: string;
  shortName: string;
  type: 'STOCK' | 'ETF' | 'REIT';
  currencyCode: string;
  isin: string;
  addedOn: string;
  maxOpenQuantity: number;
  minTradeQuantity: number;
  workingScheduleId: number;
}

export interface Trading212AccountInfo {
  currencyCode: string;
  id: number;
}

export interface Trading212AccountCash {
  free: number;
  total: number;
  ppl: number;
  result: number;
  invested: number;
  pieCash: number;
}

export interface Trading212Order {
  id: number;
  dateCreated: string;
  dateExecuted: string;
  dateModified: string;
  executor: string;
  fillCost: number;
  fillId: number;
  fillPrice: number;
  fillResult: number;
  fillType: string;
  filledQuantity: number;
  filledValue: number;
  limitPrice: number;
  orderedQuantity: number;
  orderedValue: number;
  parentOrder: number;
  status: string;
  stopPrice: number;
  ticker: string;
  timeValidity: string;
  type: string;
  taxes: Array<{
    fillId: string;
    name: string;
    quantity: number;
    timeCharged: string;
  }>;
}

export interface Trading212Dividend {
  amount: number;
  amountInEuro: number;
  grossAmountPerShare: number;
  paidOn: string;
  quantity: number;
  reference: string;
  ticker: string;
  type: string;
}

export class Trading212Service {
  private apiKey: string;
  private baseUrl = 'https://live.trading212.com/api/v0';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Trading 212 API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Test API connection
  async testConnection(): Promise<Trading212AccountInfo> {
    return this.makeRequest<Trading212AccountInfo>('/equity/account/info');
  }

  // Get all portfolio positions
  async getPortfolio(): Promise<Trading212Position[]> {
    return this.makeRequest<Trading212Position[]>('/equity/portfolio');
  }

  // Get all available instruments
  async getInstruments(): Promise<Trading212Instrument[]> {
    return this.makeRequest<Trading212Instrument[]>('/equity/metadata/instruments');
  }

  // Get account cash information
  async getAccountCash(): Promise<Trading212AccountCash> {
    return this.makeRequest<Trading212AccountCash>('/equity/account/cash');
  }

  // Get historical orders
  async getHistoricalOrders(limit = 50, cursor?: number): Promise<{
    items: Trading212Order[];
    nextPagePath?: string;
  }> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append('cursor', cursor.toString());
    
    return this.makeRequest(`/equity/history/orders?${params}`);
  }

  // Get dividend history
  async getDividends(limit = 50, cursor?: number): Promise<{
    items: Trading212Dividend[];
    nextPagePath?: string;
  }> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append('cursor', cursor.toString());
    
    return this.makeRequest(`/history/dividends?${params}`);
  }

  // Convert Trading 212 data to Profolio assets with historical data
  async getProfolioAssets(): Promise<Array<{
    id: string;
    name: string;
    type: string;
    symbol: string;
    quantity: number;
    current_value: number;
    purchase_price: number;
    purchase_date: string;
    notes: string;
    price_history: Array<{ date: string; value: number }>;
  }>> {
    const [positions, instruments, accountCash, historicalOrders] = await Promise.all([
      this.getPortfolio(),
      this.getInstruments(),
      this.getAccountCash().catch(() => ({ free: 0, total: 0, ppl: 0, result: 0, invested: 0, pieCash: 0 })),
      this.getHistoricalOrders(200).catch(() => ({ items: [] })) // Get more historical data
    ]);

    // Create instrument lookup map
    const instrumentMap = new Map(
      instruments.map(instrument => [instrument.ticker, instrument])
    );

    // Create historical price data from orders
    const priceHistoryMap = new Map<string, Array<{ date: string; value: number }>>();
    
    // Process historical orders to build price history
    historicalOrders.items.forEach(order => {
      if (order.status === 'FILLED' && order.fillPrice > 0) {
        const ticker = this.cleanTicker(order.ticker);
        if (!priceHistoryMap.has(ticker)) {
          priceHistoryMap.set(ticker, []);
        }
        
        priceHistoryMap.get(ticker)!.push({
          date: order.dateExecuted.split('T')[0],
          value: order.fillPrice
        });
      }
    });

    // Sort and deduplicate price history
    priceHistoryMap.forEach((history, ticker) => {
      const sortedHistory = history
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .filter((item, index, arr) => 
          index === 0 || item.date !== arr[index - 1].date
        );
      priceHistoryMap.set(ticker, sortedHistory);
    });

    // Convert positions to assets
    const assets = positions.map(position => {
      const instrument = instrumentMap.get(position.ticker);
      const currentValue = position.quantity * position.currentPrice * 100; // Convert to cents
      const purchasePrice = position.quantity * position.averagePrice * 100; // Convert to cents
      const cleanedTicker = this.cleanTicker(position.ticker);

      // Determine asset type based on instrument type
      let assetType = 'stock';
      if (instrument?.type === 'ETF') assetType = 'stock'; // ETFs are treated as stocks in Profolio
      if (instrument?.type === 'REIT') assetType = 'property'; // REITs could be property-related

      // Get price history for this asset
      const priceHistory = priceHistoryMap.get(cleanedTicker) || [];
      
      // Add current price as latest data point if not already present
      const today = new Date().toISOString().split('T')[0];
      const hasToday = priceHistory.some(p => p.date === today);
      if (!hasToday) {
        priceHistory.push({
          date: today,
          value: position.currentPrice
        });
      }

      return {
        id: `t212_${position.ticker}`,
        name: instrument?.name || position.ticker,
        type: assetType,
        symbol: cleanedTicker,
        quantity: position.quantity,
        current_value: Math.round(currentValue),
        purchase_price: Math.round(purchasePrice),
        purchase_date: position.initialFillDate.split('T')[0],
        notes: `Synced from Trading 212 (${instrument?.type || 'STOCK'})${instrument?.isin ? ` - ISIN: ${instrument.isin}` : ''}`,
        price_history: priceHistory,
      };
    });

    // Add cash as an asset if there's any free cash
    if (accountCash.free > 0) {
      assets.push({
        id: 't212_cash',
        name: 'Trading 212 Cash',
        type: 'cash',
        symbol: 'CASH',
        quantity: 1,
        current_value: Math.round(accountCash.free * 100),
        purchase_price: Math.round(accountCash.free * 100),
        purchase_date: new Date().toISOString().split('T')[0],
        notes: `Cash balance from Trading 212. Total: ${accountCash.total}, Invested: ${accountCash.invested}`,
        price_history: [{ 
          date: new Date().toISOString().split('T')[0], 
          value: 1.0 // Cash always has value of 1
        }],
      });
    }

    return assets;
  }

  // Get portfolio summary statistics
  async getPortfolioSummary(): Promise<{
    totalValue: number;
    totalInvested: number;
    totalPnL: number;
    totalPnLPercentage: number;
    cashBalance: number;
    positionsCount: number;
    topHoldings: Array<{
      name: string;
      symbol: string;
      value: number;
      percentage: number;
    }>;
  }> {
    const [positions, instruments, accountCash] = await Promise.all([
      this.getPortfolio(),
      this.getInstruments(),
      this.getAccountCash().catch(() => ({ free: 0, total: 0, ppl: 0, result: 0, invested: 0, pieCash: 0 }))
    ]);

    const instrumentMap = new Map(
      instruments.map(instrument => [instrument.ticker, instrument])
    );

    const totalValue = positions.reduce((sum, pos) => sum + (pos.quantity * pos.currentPrice), 0) + accountCash.free;
    const totalInvested = accountCash.invested;
    const totalPnL = accountCash.result;
    const totalPnLPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    // Calculate top holdings
    const holdings = positions
      .map(pos => {
        const instrument = instrumentMap.get(pos.ticker);
        const value = pos.quantity * pos.currentPrice;
        return {
          name: instrument?.name || pos.ticker,
          symbol: this.cleanTicker(pos.ticker),
          value,
          percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      totalValue,
      totalInvested,
      totalPnL,
      totalPnLPercentage,
      cashBalance: accountCash.free,
      positionsCount: positions.length,
      topHoldings: holdings,
    };
  }

  // Clean up ticker symbols (remove exchange suffixes)
  private cleanTicker(ticker: string): string {
    return ticker
      .replace('_US_EQ', '')
      .replace('_UK_EQ', '')
      .replace('_DE_EQ', '')
      .replace('_FR_EQ', '')
      .replace('_NL_EQ', '')
      .replace('_IT_EQ', '')
      .replace('_ES_EQ', '');
  }

  // Get enhanced asset data with dividends
  async getEnhancedAssets(): Promise<Array<{
    id: string;
    name: string;
    type: string;
    symbol: string;
    quantity: number;
    current_value: number;
    purchase_price: number;
    purchase_date: string;
    notes: string;
    price_history: Array<{ date: string; value: number }>;
    dividends?: Array<{
      amount: number;
      date: string;
      grossAmountPerShare: number;
    }>;
  }>> {
    const [assets, dividends] = await Promise.all([
      this.getProfolioAssets(),
      this.getDividends(100).catch(() => ({ items: [] }))
    ]);

    // Group dividends by ticker
    const dividendMap = new Map<string, Trading212Dividend[]>();
    dividends.items.forEach(dividend => {
      const ticker = this.cleanTicker(dividend.ticker);
      if (!dividendMap.has(ticker)) {
        dividendMap.set(ticker, []);
      }
      dividendMap.get(ticker)!.push(dividend);
    });

    // Enhance assets with dividend information
    return assets.map(asset => {
      const assetDividends = dividendMap.get(asset.symbol) || [];
      
      return {
        ...asset,
        dividends: assetDividends.map(div => ({
          amount: div.amount,
          date: div.paidOn.split('T')[0],
          grossAmountPerShare: div.grossAmountPerShare,
        })),
      };
    });
  }
} 