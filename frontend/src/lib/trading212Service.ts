// Trading 212 API Service - Enhanced Version
// Based on the official API documentation: https://t212public-api-docs.redoc.ly/

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Trading212ApiError extends Error {
  status?: number;
  endpoint?: string;
  details?: string;
}

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
  blocked: number;
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

export interface Trading212Transaction {
  amount: number;
  dateTime: string;
  reference: string;
  type: 'WITHDRAW' | 'DEPOSIT' | 'DIVIDEND' | 'INTEREST' | 'OTHER';
}

export interface Trading212Exchange {
  id: number;
  name: string;
  workingSchedules: Array<{
    id: number;
    timeEvents: Array<{
      date: string;
      type: 'OPEN' | 'CLOSE';
    }>;
  }>;
}

export interface Trading212Pie {
  id: number;
  cash: number;
  progress: number;
  status: 'AHEAD' | 'BEHIND' | 'ON_TRACK';
  dividendDetails: {
    gained: number;
    inCash: number;
    reinvested: number;
  };
  result: {
    priceAvgInvestedValue: number;
    priceAvgResult: number;
    priceAvgResultCoef: number;
    priceAvgValue: number;
  };
}

export interface Trading212PieDetails {
  instruments: Array<{
    ticker: string;
    currentShare: number;
    expectedShare: number;
    ownedQuantity: number;
    issues: Array<{
      name: string;
      severity: 'IRREVERSIBLE' | 'WARNING' | 'INFO';
    }>;
    result: {
      priceAvgInvestedValue: number;
      priceAvgResult: number;
      priceAvgResultCoef: number;
      priceAvgValue: number;
    };
  }>;
  settings: {
    id: number;
    name: string;
    icon: string;
    goal: number;
    endDate: string;
    creationDate: string;
    dividendCashAction: 'REINVEST' | 'TO_ACCOUNT_CASH';
    initialInvestment: number;
    instrumentShares: Record<string, number>;
    publicUrl: string;
  };
}

export interface Trading212CurrentOrder {
  id: number;
  creationTime: string;
  filledQuantity: number;
  filledValue: number;
  limitPrice: number;
  quantity: number;
  status: 'LOCAL' | 'SUBMITTED' | 'WORKING' | 'REJECTED' | 'CANCELLED' | 'FILLED';
  stopPrice: number;
  strategy: 'QUANTITY' | 'VALUE';
  ticker: string;
  type: 'LIMIT' | 'MARKET' | 'STOP' | 'STOP_LIMIT';
  value: number;
}

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class Trading212Service {
  private apiKey: string;
  private baseUrl = 'https://live.trading212.com/api/v0';
  private requestQueue: Promise<unknown> = Promise.resolve();
  private requestTimeout = 30000; // 30 seconds timeout for each request

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // ============================================================================
  // CORE API METHODS
  // ============================================================================

  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    // Queue requests to ensure they run in series
    return this.requestQueue = this.requestQueue.then(async () => {
      const url = `${this.baseUrl}${endpoint}`;
      console.log(`🔄 Making request to: ${endpoint}`);
      
      // Enhanced logging for debugging
      const requestHeaders = {
        'Authorization': this.apiKey, // Trading 212 expects just the API key, not "Bearer {key}"
        'Content-Type': 'application/json',
        'User-Agent': 'Profolio/1.0',
        ...options?.headers,
      };
      
      console.log(`📤 Request details:`, {
        url,
        method: options?.method || 'GET',
        headers: {
          ...requestHeaders,
          'Authorization': `${this.apiKey.substring(0, 8)}...` // Mask API key for security
        },
        bodyLength: options?.body ? (options.body as string).length : 0
      });
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, this.requestTimeout);
      
      try {
        const response = await fetch(url, {
          ...options,
          headers: requestHeaders,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `Trading 212 API error: ${response.status} ${response.statusText}`;
          let errorDetails = '';
          
          // Enhanced error logging
          console.error(`❌ API Error on ${endpoint}:`, {
            status: response.status,
            statusText: response.statusText,
            url,
            headers: {
              'content-type': response.headers.get('content-type'),
              'retry-after': response.headers.get('retry-after'),
              'x-ratelimit-reset': response.headers.get('x-ratelimit-reset'),
              'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining')
            },
            body: errorText
          });
          
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.message) {
              errorMessage += ` - ${errorData.message}`;
              errorDetails = errorData.message;
            }
          } catch {
            if (errorText) {
              errorMessage += ` - ${errorText}`;
              errorDetails = errorText;
            }
          }

          // Specific rate limit error handling
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            const rateLimitReset = response.headers.get('X-RateLimit-Reset');
            
            console.error(`🚫 Rate limit exceeded on ${endpoint}:`, {
              retryAfter,
              rateLimitReset
            });
            
            errorMessage = `Rate limit exceeded on ${endpoint}. `;
            if (retryAfter) {
              errorMessage += `Retry after ${retryAfter} seconds. `;
            }
            if (rateLimitReset) {
              errorMessage += `Rate limit resets at ${new Date(parseInt(rateLimitReset) * 1000).toISOString()}. `;
            }
            errorMessage += `Requests are now queued sequentially to prevent further rate limiting.`;
          }

          const error = new Error(errorMessage) as Trading212ApiError;
          error.status = response.status;
          error.endpoint = endpoint;
          error.details = errorDetails;
          throw error;
        }

        console.log(`✅ Success: ${endpoint}`);
        return response.json();
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          const timeoutError = new Error(`Request timeout after ${this.requestTimeout}ms on ${endpoint}`) as Trading212ApiError;
          timeoutError.status = 408;
          timeoutError.endpoint = endpoint;
          timeoutError.details = 'Request timed out';
          console.error(`⏰ Request timeout on ${endpoint}`);
          throw timeoutError;
        }
        
        throw fetchError;
      }
    });
  }

  // ============================================================================
  // ACCOUNT & AUTHENTICATION
  // ============================================================================

  /**
   * Test API connection and get account info
   */
  async testConnection(): Promise<Trading212AccountInfo> {
    return this.makeRequest<Trading212AccountInfo>('/equity/account/info');
  }

  /**
   * Get account cash information
   */
  async getAccountCash(): Promise<Trading212AccountCash> {
    return this.makeRequest<Trading212AccountCash>('/equity/account/cash');
  }

  // ============================================================================
  // PORTFOLIO & POSITIONS
  // ============================================================================

  /**
   * Get all portfolio positions
   */
  async getPortfolio(): Promise<Trading212Position[]> {
    return this.makeRequest<Trading212Position[]>('/equity/portfolio');
  }

  /**
   * Get specific position by ticker
   */
  async getPosition(ticker: string): Promise<Trading212Position> {
    return this.makeRequest<Trading212Position>(`/equity/portfolio/${encodeURIComponent(ticker)}`);
  }

  /**
   * Search for a position by ticker (POST method)
   */
  async searchPosition(ticker: string): Promise<Trading212Position> {
    return this.makeRequest<Trading212Position>('/equity/portfolio/ticker', {
      method: 'POST',
      body: JSON.stringify({ ticker }),
    });
  }

  // ============================================================================
  // INSTRUMENTS & METADATA
  // ============================================================================

  /**
   * Get all available instruments
   */
  async getInstruments(): Promise<Trading212Instrument[]> {
    return this.makeRequest<Trading212Instrument[]>('/equity/metadata/instruments');
  }

  /**
   * Get all exchanges and working schedules
   */
  async getExchanges(): Promise<Trading212Exchange[]> {
    return this.makeRequest<Trading212Exchange[]>('/equity/metadata/exchanges');
  }

  // ============================================================================
  // PIES MANAGEMENT
  // ============================================================================

  /**
   * Get all pies
   */
  async getPies(): Promise<Trading212Pie[]> {
    return this.makeRequest<Trading212Pie[]>('/equity/pies');
  }

  /**
   * Get detailed pie information
   */
  async getPieDetails(pieId: number): Promise<Trading212PieDetails> {
    return this.makeRequest<Trading212PieDetails>(`/equity/pies/${pieId}`);
  }

  /**
   * Create a new pie
   */
  async createPie(pieData: {
    name: string;
    icon: string;
    goal: number;
    endDate: string;
    dividendCashAction: 'REINVEST' | 'TO_ACCOUNT_CASH';
    instrumentShares: Record<string, number>;
  }): Promise<Trading212PieDetails> {
    return this.makeRequest<Trading212PieDetails>('/equity/pies', {
      method: 'POST',
      body: JSON.stringify(pieData),
    });
  }

  /**
   * Update an existing pie
   */
  async updatePie(pieId: number, pieData: {
    name: string;
    icon: string;
    goal: number;
    endDate: string;
    dividendCashAction: 'REINVEST' | 'TO_ACCOUNT_CASH';
    instrumentShares: Record<string, number>;
  }): Promise<Trading212PieDetails> {
    return this.makeRequest<Trading212PieDetails>(`/equity/pies/${pieId}`, {
      method: 'POST',
      body: JSON.stringify(pieData),
    });
  }

  /**
   * Delete a pie
   */
  async deletePie(pieId: number): Promise<void> {
    return this.makeRequest<void>(`/equity/pies/${pieId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Duplicate a pie
   */
  async duplicatePie(pieId: number, name: string, icon: string): Promise<Trading212PieDetails> {
    return this.makeRequest<Trading212PieDetails>(`/equity/pies/${pieId}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ name, icon }),
    });
  }

  // ============================================================================
  // ORDERS MANAGEMENT
  // ============================================================================

  /**
   * Get all current orders
   */
  async getCurrentOrders(): Promise<Trading212CurrentOrder[]> {
    return this.makeRequest<Trading212CurrentOrder[]>('/equity/orders');
  }

  /**
   * Get specific order by ID
   */
  async getOrder(orderId: number): Promise<Trading212CurrentOrder> {
    return this.makeRequest<Trading212CurrentOrder>(`/equity/orders/${orderId}`);
  }

  /**
   * Place a limit order
   */
  async placeLimitOrder(orderData: {
    ticker: string;
    quantity: number;
    limitPrice: number;
    timeValidity: 'DAY' | 'GOOD_TILL_CANCEL';
  }): Promise<Trading212CurrentOrder> {
    return this.makeRequest<Trading212CurrentOrder>('/equity/orders/limit', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  /**
   * Place a market order
   */
  async placeMarketOrder(orderData: {
    ticker: string;
    quantity: number;
  }): Promise<Trading212CurrentOrder> {
    return this.makeRequest<Trading212CurrentOrder>('/equity/orders/market', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  /**
   * Place a stop order
   */
  async placeStopOrder(orderData: {
    ticker: string;
    quantity: number;
    stopPrice: number;
    timeValidity: 'DAY' | 'GOOD_TILL_CANCEL';
  }): Promise<Trading212CurrentOrder> {
    return this.makeRequest<Trading212CurrentOrder>('/equity/orders/stop', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  /**
   * Place a stop-limit order
   */
  async placeStopLimitOrder(orderData: {
    ticker: string;
    quantity: number;
    limitPrice: number;
    stopPrice: number;
    timeValidity: 'DAY' | 'GOOD_TILL_CANCEL';
  }): Promise<Trading212CurrentOrder> {
    return this.makeRequest<Trading212CurrentOrder>('/equity/orders/stop_limit', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: number): Promise<void> {
    return this.makeRequest<void>(`/equity/orders/${orderId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // HISTORICAL DATA
  // ============================================================================

  /**
   * Get historical orders with pagination
   */
  async getHistoricalOrders(options?: {
    limit?: number;
    cursor?: number;
    ticker?: string;
  }): Promise<{
    items: Trading212Order[];
    nextPagePath?: string;
  }> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.cursor) params.append('cursor', options.cursor.toString());
    if (options?.ticker) params.append('ticker', options.ticker);
    
    const queryString = params.toString();
    const endpoint = `/equity/history/orders${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest(endpoint);
  }

  /**
   * Get all historical orders (handles pagination automatically)
   */
  async getAllHistoricalOrders(ticker?: string): Promise<Trading212Order[]> {
    const allOrders: Trading212Order[] = [];
    let cursor: number | undefined;
    
    do {
      const response = await this.getHistoricalOrders({
        limit: 50,
        cursor,
        ticker,
      });
      
      allOrders.push(...response.items);
      
      // Extract cursor from nextPagePath if it exists
      if (response.nextPagePath) {
        const match = response.nextPagePath.match(/cursor=(\d+)/);
        cursor = match ? parseInt(match[1]) : undefined;
      } else {
        cursor = undefined;
      }
    } while (cursor);
    
    return allOrders;
  }

  /**
   * Get dividend history with pagination
   */
  async getDividends(options?: {
    limit?: number;
    cursor?: number;
    ticker?: string;
  }): Promise<{
    items: Trading212Dividend[];
    nextPagePath?: string;
  }> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.cursor) params.append('cursor', options.cursor.toString());
    if (options?.ticker) params.append('ticker', options.ticker);
    
    const queryString = params.toString();
    const endpoint = `/history/dividends${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest(endpoint);
  }

  /**
   * Get transaction history with pagination
   */
  async getTransactions(options?: {
    limit?: number;
    cursor?: string;
    time?: string;
  }): Promise<{
    items: Trading212Transaction[];
    nextPagePath?: string;
  }> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.cursor) params.append('cursor', options.cursor);
    if (options?.time) params.append('time', options.time);
    
    const queryString = params.toString();
    const endpoint = `/history/transactions${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest(endpoint);
  }

  // ============================================================================
  // PROFOLIO INTEGRATION METHODS
  // ============================================================================

  /**
   * Convert Trading 212 data to Profolio assets with enhanced data
   */
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
    pie_info?: {
      pieId: number;
      pieName: string;
      pieShare: number;
    };
  }>> {
    // Make requests sequentially to avoid rate limiting
    console.log('Fetching portfolio positions...');
    const positions = await this.getPortfolio();
    
    console.log('Fetching instruments metadata...');
    const instruments = await this.getInstruments();
    
    console.log('Fetching account cash...');
    const accountCash = await this.getAccountCash().catch(() => ({ 
      free: 0, total: 0, ppl: 0, result: 0, invested: 0, pieCash: 0, blocked: 0 
    }));
    
    console.log('Fetching pies...');
    const pies = await this.getPies().catch(() => []);

    // Get detailed pie information sequentially
    const pieDetails = new Map<number, Trading212PieDetails>();
    for (let i = 0; i < pies.length; i++) {
      const pie = pies[i];
      try {
        const details = await this.getPieDetails(pie.id);
        pieDetails.set(pie.id, details);
        // Requests are now automatically queued sequentially
      } catch (error) {
        console.warn(`Failed to get details for pie ${pie.id}:`, error);
      }
    }

    // Get historical orders with limited pagination to avoid too many requests
    console.log('Fetching recent historical orders...');
    const historicalOrders = await this.getHistoricalOrders({ limit: 50 }).then(response => response.items).catch(() => []);

    // Create instrument lookup map
    const instrumentMap = new Map(
      instruments.map(instrument => [instrument.ticker, instrument])
    );

    // Create historical price data from orders
    const priceHistoryMap = new Map<string, Array<{ date: string; value: number }>>();
    
    historicalOrders.forEach(order => {
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

    // Find pie information for each position
    const findPieInfo = (ticker: string) => {
      for (const [pieId, details] of Array.from(pieDetails.entries())) {
        const instrument = details.instruments.find(inst => inst.ticker === ticker);
        if (instrument) {
          return {
            pieId,
            pieName: details.settings.name,
            pieShare: instrument.expectedShare,
          };
        }
      }
      return undefined;
    };

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

      // Get pie information
      const pieInfo = findPieInfo(position.ticker);

      return {
        id: `t212_${position.ticker}`,
        name: instrument?.name || position.ticker,
        type: assetType,
        symbol: cleanedTicker,
        quantity: position.quantity,
        current_value: Math.round(currentValue),
        purchase_price: Math.round(purchasePrice),
        purchase_date: position.initialFillDate.split('T')[0],
        notes: `Synced from Trading 212 (${instrument?.type || 'STOCK'})${instrument?.isin ? ` - ISIN: ${instrument.isin}` : ''}${pieInfo ? ` - Part of pie: ${pieInfo.pieName} (${pieInfo.pieShare.toFixed(1)}%)` : ''}`,
        price_history: priceHistory,
        pie_info: pieInfo,
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
        notes: `Cash balance from Trading 212. Total: ${accountCash.total}, Invested: ${accountCash.invested}, Pie Cash: ${accountCash.pieCash}`,
        price_history: [{ 
          date: new Date().toISOString().split('T')[0], 
          value: 1.0 // Cash always has value of 1
        }],
        pie_info: undefined, // Cash is not part of any pie
      });
    }

    console.log(`Successfully processed ${assets.length} assets`);
    return assets;
  }

  /**
   * Get comprehensive portfolio summary with pie information
   */
  async getPortfolioSummary(): Promise<{
    totalValue: number;
    totalInvested: number;
    totalPnL: number;
    totalPnLPercentage: number;
    cashBalance: number;
    positionsCount: number;
    piesCount: number;
    topHoldings: Array<{
      name: string;
      symbol: string;
      value: number;
      percentage: number;
      pieInfo?: string;
    }>;
    piesSummary: Array<{
      id: number;
      name: string;
      value: number;
      progress: number;
      status: string;
      instrumentsCount: number;
    }>;
  }> {
    // Make requests sequentially to avoid rate limiting
    const positions = await this.getPortfolio();
    const instruments = await this.getInstruments();
    const accountCash = await this.getAccountCash().catch(() => ({ 
      free: 0, total: 0, ppl: 0, result: 0, invested: 0, pieCash: 0, blocked: 0 
    }));
    const pies = await this.getPies().catch(() => []);

    // Get detailed pie information sequentially
    const pieDetails = new Map<number, Trading212PieDetails>();
    for (let i = 0; i < pies.length; i++) {
      const pie = pies[i];
      try {
        const details = await this.getPieDetails(pie.id);
        pieDetails.set(pie.id, details);
        // Requests are now automatically queued sequentially
      } catch (error) {
        console.warn(`Failed to get details for pie ${pie.id}:`, error);
      }
    }

    const instrumentMap = new Map(
      instruments.map(instrument => [instrument.ticker, instrument])
    );

    const totalValue = positions.reduce((sum, pos) => sum + (pos.quantity * pos.currentPrice), 0) + accountCash.free;
    const totalInvested = accountCash.invested;
    const totalPnL = accountCash.result;
    const totalPnLPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    // Find pie info for each position
    const findPieInfo = (ticker: string) => {
      for (const [, details] of Array.from(pieDetails.entries())) {
        const instrument = details.instruments.find(inst => inst.ticker === ticker);
        if (instrument) {
          return details.settings.name;
        }
      }
      return undefined;
    };

    // Calculate top holdings with pie information
    const holdings = positions
      .map(pos => {
        const instrument = instrumentMap.get(pos.ticker);
        const value = pos.quantity * pos.currentPrice;
        const pieInfo = findPieInfo(pos.ticker);
        
        return {
          name: instrument?.name || pos.ticker,
          symbol: this.cleanTicker(pos.ticker),
          value,
          percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
          pieInfo,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Calculate pies summary - use pie data directly since detailed result is in pie object
    const piesSummary = pies.map(pie => {
      const details = pieDetails.get(pie.id);
      return {
        id: pie.id,
        name: details?.settings.name || `Pie ${pie.id}`,
        value: pie.result.priceAvgValue,
        progress: pie.progress,
        status: pie.status,
        instrumentsCount: details?.instruments.length || 0,
      };
    });

    return {
      totalValue,
      totalInvested,
      totalPnL,
      totalPnLPercentage,
      cashBalance: accountCash.free,
      positionsCount: positions.length,
      piesCount: pies.length,
      topHoldings: holdings,
      piesSummary,
    };
  }

  /**
   * Get enhanced asset data with dividends and pie information
   */
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
    pie_info?: {
      pieId: number;
      pieName: string;
      pieShare: number;
    };
  }>> {
    const [assets, dividends] = await Promise.all([
      this.getProfolioAssets(),
      this.getDividends({ limit: 50 }).catch(() => ({ items: [] }))
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

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Clean up ticker symbols (remove exchange suffixes)
   */
  private cleanTicker(ticker: string): string {
    return ticker
      .replace('_US_EQ', '')
      .replace('_UK_EQ', '')
      .replace('_DE_EQ', '')
      .replace('_FR_EQ', '')
      .replace('_NL_EQ', '')
      .replace('_IT_EQ', '')
      .replace('_ES_EQ', '')
      .replace('_CA_EQ', '')
      .replace('_AU_EQ', '')
      .replace('_JP_EQ', '');
  }

  /**
   * Get comprehensive account overview
   */
  async getAccountOverview(): Promise<{
    accountInfo: Trading212AccountInfo;
    cash: Trading212AccountCash;
    positionsCount: number;
    piesCount: number;
    currentOrdersCount: number;
    totalValue: number;
    totalPnL: number;
  }> {
    // Make requests sequentially to avoid rate limiting
    const accountInfo = await this.testConnection();
    const cash = await this.getAccountCash();
    const positions = await this.getPortfolio();
    const pies = await this.getPies().catch(() => []);
    const currentOrders = await this.getCurrentOrders().catch(() => []);

    const totalValue = positions.reduce((sum, pos) => sum + (pos.quantity * pos.currentPrice), 0) + cash.free;

    return {
      accountInfo,
      cash,
      positionsCount: positions.length,
      piesCount: pies.length,
      currentOrdersCount: currentOrders.length,
      totalValue,
      totalPnL: cash.result,
    };
  }

  /**
   * Simple test method that makes minimal API calls
   */
  async testConnectionSimple(): Promise<{
    accountInfo: Trading212AccountInfo;
    hasPortfolio: boolean;
    hasPies: boolean;
    hasCash: boolean;
  }> {
    // Test basic connection
    const accountInfo = await this.testConnection();
    
    // Test portfolio access with minimal data
    const positions = await this.getPortfolio().catch(() => []);
    
    // Test pies access
    const pies = await this.getPies().catch(() => []);
    
    // Test cash access
    const cash = await this.getAccountCash().catch(() => null);

    return {
      accountInfo,
      hasPortfolio: positions.length >= 0,
      hasPies: pies.length >= 0,
      hasCash: cash !== null,
    };
  }
} 