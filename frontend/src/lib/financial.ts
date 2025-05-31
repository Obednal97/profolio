import Decimal from 'decimal.js';

// Configure Decimal.js for financial precision
Decimal.config({
  precision: 20,
  rounding: Decimal.ROUND_HALF_EVEN, // Banker's rounding
  toExpNeg: -18,
  toExpPos: 18,
});

export class FinancialCalculator {
  /**
   * Convert dollars to cents with precision
   */
  static dollarsToCents(dollars: string | number): number {
    try {
      const decimal = new Decimal(dollars);
      return decimal.times(100).round().toNumber();
    } catch (error) {
      console.error('Error converting dollars to cents:', error);
      return 0;
    }
  }

  /**
   * Convert cents to dollars with precision
   */
  static centsToDollars(cents: number): string {
    try {
      const decimal = new Decimal(cents);
      return decimal.dividedBy(100).toFixed(2);
    } catch (error) {
      console.error('Error converting cents to dollars:', error);
      return '0.00';
    }
  }

  /**
   * Calculate percentage change between two values
   */
  static calculatePercentageChange(oldValue: number, newValue: number): number {
    try {
      if (oldValue === 0) return 0;
      
      const oldDecimal = new Decimal(oldValue);
      const newDecimal = new Decimal(newValue);
      const change = newDecimal.minus(oldDecimal);
      const percentage = change.dividedBy(oldDecimal).times(100);
      
      return percentage.toNumber();
    } catch (error) {
      console.error('Error calculating percentage change:', error);
      return 0;
    }
  }

  /**
   * Calculate gain/loss between purchase price and current value
   */
  static calculateGainLoss(purchasePrice: number, currentValue: number): {
    gain: number;
    percentage: number;
  } {
    try {
      const purchase = new Decimal(purchasePrice);
      const current = new Decimal(currentValue);
      const gain = current.minus(purchase);
      
      let percentage = 0;
      if (!purchase.isZero()) {
        percentage = gain.dividedBy(purchase).times(100).toNumber();
      }
      
      return {
        gain: gain.toNumber(),
        percentage: percentage,
      };
    } catch (error) {
      console.error('Error calculating gain/loss:', error);
      return { gain: 0, percentage: 0 };
    }
  }

  /**
   * Calculate total portfolio value from assets
   */
  static calculatePortfolioValue(assets: Array<{ current_value?: number }>): number {
    try {
      let total = new Decimal(0);
      
      for (const asset of assets) {
        if (asset.current_value) {
          total = total.plus(asset.current_value);
        }
      }
      
      return total.toNumber();
    } catch (error) {
      console.error('Error calculating portfolio value:', error);
      return 0;
    }
  }

  /**
   * Calculate compound interest for savings accounts
   */
  static calculateCompoundInterest(
    principal: number,
    rate: number,
    compoundsPerYear: number,
    years: number
  ): number {
    try {
      const p = new Decimal(principal);
      const r = new Decimal(rate).dividedBy(100); // Convert percentage to decimal
      const n = new Decimal(compoundsPerYear);
      const t = new Decimal(years);
      
      // A = P(1 + r/n)^(nt)
      const ratePerCompound = r.dividedBy(n);
      const base = new Decimal(1).plus(ratePerCompound);
      const exponent = n.times(t);
      const amount = p.times(base.pow(exponent));
      
      return amount.toNumber();
    } catch (error) {
      console.error('Error calculating compound interest:', error);
      return principal;
    }
  }

  /**
   * Calculate simple interest for savings accounts
   */
  static calculateSimpleInterest(
    principal: number,
    rate: number,
    years: number
  ): number {
    try {
      const p = new Decimal(principal);
      const r = new Decimal(rate).dividedBy(100); // Convert percentage to decimal
      const t = new Decimal(years);
      
      // A = P(1 + rt)
      const amount = p.times(new Decimal(1).plus(r.times(t)));
      
      return amount.toNumber();
    } catch (error) {
      console.error('Error calculating simple interest:', error);
      return principal;
    }
  }

  /**
   * Calculate payment frequency multiplier
   */
  static getPaymentFrequencyMultiplier(frequency: string): number {
    switch (frequency.toLowerCase()) {
      case 'monthly': return 12;
      case 'quarterly': return 4;
      case 'annually': return 1;
      default: return 1;
    }
  }

  /**
   * Validate monetary input
   */
  static validateMonetaryInput(value: string): {
    isValid: boolean;
    error?: string;
    sanitized?: string;
  } {
    try {
      // Remove any non-numeric characters except decimal point
      const sanitized = value.replace(/[^0-9.-]/g, '');
      
      if (sanitized === '' || sanitized === '.') {
        return { isValid: false, error: 'Please enter a valid amount' };
      }
      
      const decimal = new Decimal(sanitized);
      
      if (decimal.isNaN()) {
        return { isValid: false, error: 'Please enter a valid number' };
      }
      
      if (decimal.isNegative()) {
        return { isValid: false, error: 'Amount cannot be negative' };
      }
      
      if (decimal.greaterThan(1000000000)) {
        return { isValid: false, error: 'Amount too large' };
      }
      
      // Round to 2 decimal places for currency
      const rounded = decimal.toFixed(2);
      
      return { isValid: true, sanitized: rounded };
    } catch {
      return { isValid: false, error: 'Invalid number format' };
    }
  }

  /**
   * Format currency for display
   */
  static formatCurrency(
    amount: number | string,
    options: {
      currency?: string;
      locale?: string;
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
    } = {}
  ): string {
    try {
      const {
        currency = 'USD',
        locale = 'en-US',
        minimumFractionDigits = 2,
        maximumFractionDigits = 2,
      } = options;
      
      const decimal = new Decimal(amount);
      const number = decimal.toNumber();
      
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(number);
    } catch (error) {
      console.error('Error formatting currency:', error);
      return '$0.00';
    }
  }

  /**
   * Format percentage for display
   */
  static formatPercentage(value: number, decimals: number = 2, includeSign: boolean = false): string {
    try {
      const decimal = new Decimal(value);
      const sign = includeSign && value > 0 ? '+' : '';
      const formatted = decimal.toFixed(decimals);
      return `${sign}${formatted}%`;
    } catch (error) {
      console.error('Error formatting percentage:', error);
      return '0.00%';
    }
  }

  /**
   * Safe addition for financial values
   */
  static add(...values: number[]): number {
    try {
      let result = new Decimal(0);
      for (const value of values) {
        result = result.plus(value);
      }
      return result.toNumber();
    } catch (error) {
      console.error('Error in addition:', error);
      return 0;
    }
  }

  /**
   * Safe subtraction for financial values
   */
  static subtract(a: number, b: number): number {
    try {
      const decimalA = new Decimal(a);
      const decimalB = new Decimal(b);
      return decimalA.minus(decimalB).toNumber();
    } catch (error) {
      console.error('Error in subtraction:', error);
      return 0;
    }
  }

  /**
   * Safe multiplication for financial values
   */
  static multiply(a: number, b: number): number {
    try {
      const decimalA = new Decimal(a);
      const decimalB = new Decimal(b);
      return decimalA.times(decimalB).toNumber();
    } catch (error) {
      console.error('Error in multiplication:', error);
      return 0;
    }
  }

  /**
   * Safe division for financial values
   */
  static divide(a: number, b: number): number {
    try {
      if (b === 0) return 0;
      const decimalA = new Decimal(a);
      const decimalB = new Decimal(b);
      return decimalA.dividedBy(decimalB).toNumber();
    } catch (error) {
      console.error('Error in division:', error);
      return 0;
    }
  }

  /**
   * Calculate proper gain/loss for an asset
   */
  static calculateAssetGainLoss(currentValue: number, purchasePricePerUnit: number, quantity: number): {
    totalInvestment: number;
    currentValue: number;
    gain: number;
    gainPercent: number;
  } {
    const totalInvestment = purchasePricePerUnit * quantity;
    const gain = currentValue - totalInvestment;
    const gainPercent = totalInvestment > 0 ? (gain / totalInvestment) * 100 : 0;

    return {
      totalInvestment,
      currentValue,
      gain,
      gainPercent
    };
  }

  /**
   * Calculate annualized return (APY) based on purchase date
   */
  static calculateAPY(currentValue: number, purchasePricePerUnit: number, quantity: number, purchaseDate: string): number {
    if (!purchaseDate || !purchasePricePerUnit || !quantity || !currentValue) return 0;

    const totalInvestment = purchasePricePerUnit * quantity;
    const gain = currentValue - totalInvestment;
    const gainPercent = gain / totalInvestment;

    // Calculate time period in years
    const purchaseDateObj = new Date(purchaseDate);
    const currentDate = new Date();
    const timeDiffMs = currentDate.getTime() - purchaseDateObj.getTime();
    const timeDiffYears = timeDiffMs / (1000 * 60 * 60 * 24 * 365.25);

    // Avoid division by zero or negative time
    if (timeDiffYears <= 0) return 0;

    // APY formula: (1 + total_return)^(1/years) - 1
    const apy = Math.pow(1 + gainPercent, 1 / timeDiffYears) - 1;
    
    return apy * 100; // Convert to percentage
  }

  /**
   * Calculate time period since purchase in human readable format
   */
  static getTimeSincePurchase(purchaseDate: string): string {
    if (!purchaseDate) return 'Unknown';

    const purchaseDateObj = new Date(purchaseDate);
    const currentDate = new Date();
    const timeDiffMs = currentDate.getTime() - purchaseDateObj.getTime();
    
    const days = Math.floor(timeDiffMs / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30.44); // Average days per month
    const years = Math.floor(days / 365.25);

    if (years > 0) {
      const remainingMonths = Math.floor((days % 365.25) / 30.44);
      return years === 1 ? 
        `1 year${remainingMonths > 0 ? `, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}` : ''}` :
        `${years} years${remainingMonths > 0 ? `, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}` : ''}`;
    } else if (months > 0) {
      return months === 1 ? '1 month' : `${months} months`;
    } else if (days > 0) {
      return days === 1 ? '1 day' : `${days} days`;
    } else {
      return 'Today';
    }
  }

  /**
   * Format APY with context
   */
  static formatAPY(apy: number): string {
    if (Math.abs(apy) < 0.01) return '0.00% APY';
    const sign = apy > 0 ? '+' : '';
    return `${sign}${apy.toFixed(2)}% APY`;
  }
} 