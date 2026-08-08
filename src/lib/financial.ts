import Decimal from 'decimal.js';

// Type alias for Decimal instances for better readability
type DecimalValue = InstanceType<typeof Decimal>;

// Configure Decimal.js for financial precision
Decimal.config({
  precision: 20,
  rounding: Decimal.ROUND_HALF_EVEN, // Banker's rounding
  toExpNeg: -18,
  toExpPos: 18,
});

export class FinancialCalculator {
  /**
   * Convert dollars to cents with precision - returns Decimal for chaining
   */
  static dollarsToCentsDecimal(dollars: string | number): DecimalValue {
    try {
      const decimal = new Decimal(dollars);
      return decimal.times(100).round();
    } catch (error) {
      console.error('Error converting dollars to cents:', error);
      return new Decimal(0);
    }
  }

  /**
   * Convert dollars to cents with precision - returns number for database storage
   */
  static dollarsToCents(dollars: string | number): number {
    return this.dollarsToCentsDecimal(dollars).toNumber();
  }

  /**
   * Convert cents to dollars with precision - returns Decimal for chaining
   */
  static centsToDollarsDecimal(cents: number): DecimalValue {
    try {
      return new Decimal(cents).dividedBy(100);
    } catch (error) {
      console.error('Error converting cents to dollars:', error);
      return new Decimal(0);
    }
  }

  /**
   * Convert cents to dollars with precision - returns string for display
   */
  static centsToDollars(cents: number): string {
    return this.centsToDollarsDecimal(cents).toFixed(2);
  }

  /**
   * Calculate percentage change between two values - maintains precision
   */
  static calculatePercentageChangeDecimal(oldValue: number, newValue: number): DecimalValue {
    try {
      if (oldValue === 0) return new Decimal(0);
      
      const oldDecimal = new Decimal(oldValue);
      const newDecimal = new Decimal(newValue);
      const change = newDecimal.minus(oldDecimal);
      const percentage = change.dividedBy(oldDecimal).times(100);
      
      return percentage;
    } catch (error) {
      console.error('Error calculating percentage change:', error);
      return new Decimal(0);
    }
  }

  /**
   * Calculate percentage change between two values
   */
  static calculatePercentageChange(oldValue: number, newValue: number): number {
    return this.calculatePercentageChangeDecimal(oldValue, newValue).toNumber();
  }

  /**
   * Calculate gain/loss between purchase price and current value - maintains precision
   */
  static calculateGainLossDecimal(purchasePrice: number, currentValue: number): {
    gain: DecimalValue;
    percentage: DecimalValue;
  } {
    try {
      const purchase = new Decimal(purchasePrice);
      const current = new Decimal(currentValue);
      const gain = current.minus(purchase);
      
      let percentage = new Decimal(0);
      if (!purchase.isZero()) {
        percentage = gain.dividedBy(purchase).times(100);
      }
      
      return {
        gain: gain,
        percentage: percentage,
      };
    } catch (error) {
      console.error('Error calculating gain/loss:', error);
      return { gain: new Decimal(0), percentage: new Decimal(0) };
    }
  }

  /**
   * Calculate gain/loss between purchase price and current value
   */
  static calculateGainLoss(purchasePrice: number, currentValue: number): {
    gain: number;
    percentage: number;
  } {
    const result = this.calculateGainLossDecimal(purchasePrice, currentValue);
    return {
      gain: result.gain.toNumber(),
      percentage: result.percentage.toNumber(),
    };
  }

  /**
   * Calculate total portfolio value from assets - maintains precision
   */
  static calculatePortfolioValueDecimal(assets: Array<{ current_value?: number }>): DecimalValue {
    try {
      let total = new Decimal(0);
      
      for (const asset of assets) {
        if (asset.current_value) {
          total = total.plus(asset.current_value);
        }
      }
      
      return total;
    } catch (error) {
      console.error('Error calculating portfolio value:', error);
      return new Decimal(0);
    }
  }

  /**
   * Calculate total portfolio value from assets
   */
  static calculatePortfolioValue(assets: Array<{ current_value?: number }>): number {
    return this.calculatePortfolioValueDecimal(assets).toNumber();
  }

  /**
   * Calculate compound interest for savings accounts - maintains precision
   */
  static calculateCompoundInterestDecimal(
    principal: number,
    rate: number,
    compoundsPerYear: number,
    years: number
  ): DecimalValue {
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
      
      return amount;
    } catch (error) {
      console.error('Error calculating compound interest:', error);
      return new Decimal(principal);
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
    return this.calculateCompoundInterestDecimal(principal, rate, compoundsPerYear, years).toNumber();
  }

  /**
   * Calculate simple interest for savings accounts - maintains precision
   */
  static calculateSimpleInterestDecimal(
    principal: number,
    rate: number,
    years: number
  ): DecimalValue {
    try {
      const p = new Decimal(principal);
      const r = new Decimal(rate).dividedBy(100); // Convert percentage to decimal
      const t = new Decimal(years);
      
      // A = P(1 + rt)
      const amount = p.times(new Decimal(1).plus(r.times(t)));
      
      return amount;
    } catch (error) {
      console.error('Error calculating simple interest:', error);
      return new Decimal(principal);
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
    return this.calculateSimpleInterestDecimal(principal, rate, years).toNumber();
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
   * Validate monetary input with overflow protection
   */
  static validateMonetaryInput(value: string): {
    isValid: boolean;
    error?: string;
    sanitized?: string;
    decimal?: DecimalValue;
  } {
    try {
      // Remove any non-numeric characters except decimal point and negative sign
      const sanitized = value.replace(/[^0-9.-]/g, '');
      
      if (sanitized === '' || sanitized === '.' || sanitized === '-') {
        return { isValid: false, error: 'Please enter a valid amount' };
      }
      
      const decimal = new Decimal(sanitized);
      
      if (decimal.isNaN()) {
        return { isValid: false, error: 'Please enter a valid number' };
      }
      
      if (decimal.isNegative()) {
        return { isValid: false, error: 'Amount cannot be negative' };
      }
      
      // Check for overflow - set a reasonable maximum
      const maxValue = new Decimal('999999999999.99'); // ~1 trillion
      if (decimal.greaterThan(maxValue)) {
        return { isValid: false, error: 'Amount too large (maximum: $999,999,999,999.99)' };
      }
      
      // Check for too many decimal places
      if (decimal.decimalPlaces() > 2) {
        // Round to 2 decimal places for currency
        const rounded = decimal.toDecimalPlaces(2);
        return { 
          isValid: true, 
          sanitized: rounded.toFixed(2),
          decimal: rounded
        };
      }
      
      return { 
        isValid: true, 
        sanitized: decimal.toFixed(2),
        decimal: decimal
      };
    } catch {
      return { isValid: false, error: 'Invalid number format' };
    }
  }

  /**
   * Format currency for display with proper precision
   */
  static formatCurrency(
    amount: number | string | DecimalValue,
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
      
      // Convert to Decimal first to maintain precision
      const decimal = amount instanceof Decimal ? amount : new Decimal(amount);
      const number = decimal.toNumber();
      
      // Check for overflow in Intl.NumberFormat
      if (Math.abs(number) > Number.MAX_SAFE_INTEGER) {
        // For very large numbers, format manually
        return `${currency === 'USD' ? '$' : ''}${decimal.toFixed(maximumFractionDigits)}`;
      }
      
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
   * Format percentage for display with precision
   */
  static formatPercentage(value: number | DecimalValue, decimals: number = 2, includeSign: boolean = false): string {
    try {
      const decimal = value instanceof Decimal ? value : new Decimal(value);
      const sign = includeSign && decimal.greaterThan(0) ? '+' : '';
      const formatted = decimal.toFixed(decimals);
      return `${sign}${formatted}%`;
    } catch (error) {
      console.error('Error formatting percentage:', error);
      return '0.00%';
    }
  }

  /**
   * Safe addition for financial values - maintains precision
   */
  static addDecimal(...values: (number | DecimalValue)[]): DecimalValue {
    try {
      let result = new Decimal(0);
      for (const value of values) {
        const decimal = value instanceof Decimal ? value : new Decimal(value);
        result = result.plus(decimal);
      }
      return result;
    } catch (error) {
      console.error('Error in addition:', error);
      return new Decimal(0);
    }
  }

  /**
   * Safe addition for financial values
   */
  static add(...values: number[]): number {
    return this.addDecimal(...values).toNumber();
  }

  /**
   * Safe subtraction for financial values - maintains precision
   */
  static subtractDecimal(a: number | DecimalValue, b: number | DecimalValue): DecimalValue {
    try {
      const decimalA = a instanceof Decimal ? a : new Decimal(a);
      const decimalB = b instanceof Decimal ? b : new Decimal(b);
      return decimalA.minus(decimalB);
    } catch (error) {
      console.error('Error in subtraction:', error);
      return new Decimal(0);
    }
  }

  /**
   * Safe subtraction for financial values
   */
  static subtract(a: number, b: number): number {
    return this.subtractDecimal(a, b).toNumber();
  }

  /**
   * Safe multiplication for financial values - maintains precision
   */
  static multiplyDecimal(a: number | DecimalValue, b: number | DecimalValue): DecimalValue {
    try {
      const decimalA = a instanceof Decimal ? a : new Decimal(a);
      const decimalB = b instanceof Decimal ? b : new Decimal(b);
      return decimalA.times(decimalB);
    } catch (error) {
      console.error('Error in multiplication:', error);
      return new Decimal(0);
    }
  }

  /**
   * Safe multiplication for financial values
   */
  static multiply(a: number, b: number): number {
    return this.multiplyDecimal(a, b).toNumber();
  }

  /**
   * Safe division for financial values - maintains precision
   */
  static divideDecimal(a: number | DecimalValue, b: number | DecimalValue): DecimalValue {
    try {
      const decimalA = a instanceof Decimal ? a : new Decimal(a);
      const decimalB = b instanceof Decimal ? b : new Decimal(b);
      if (decimalB.isZero()) return new Decimal(0);
      return decimalA.dividedBy(decimalB);
    } catch (error) {
      console.error('Error in division:', error);
      return new Decimal(0);
    }
  }

  /**
   * Safe division for financial values
   */
  static divide(a: number, b: number): number {
    return this.divideDecimal(a, b).toNumber();
  }

  /**
   * Calculate proper gain/loss for an asset with maintained precision
   */
  static calculateAssetGainLossDecimal(currentValue: number | DecimalValue, purchasePricePerUnit: number | DecimalValue, quantity: number | DecimalValue): {
    totalInvestment: DecimalValue;
    currentValue: DecimalValue;
    gain: DecimalValue;
    gainPercent: DecimalValue;
  } {
    try {
      const currentVal = currentValue instanceof Decimal ? currentValue : new Decimal(currentValue);
      const purchasePrice = purchasePricePerUnit instanceof Decimal ? purchasePricePerUnit : new Decimal(purchasePricePerUnit);
      const qty = quantity instanceof Decimal ? quantity : new Decimal(quantity);
      
      const totalInvestment = purchasePrice.times(qty);
      const gain = currentVal.minus(totalInvestment);
      const gainPercent = totalInvestment.greaterThan(0) ? 
        gain.dividedBy(totalInvestment).times(100) : 
        new Decimal(0);

      return {
        totalInvestment,
        currentValue: currentVal,
        gain,
        gainPercent
      };
    } catch (error) {
      console.error('Error calculating asset gain/loss:', error);
      return {
        totalInvestment: new Decimal(0),
        currentValue: new Decimal(0),
        gain: new Decimal(0),
        gainPercent: new Decimal(0)
      };
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
    const result = this.calculateAssetGainLossDecimal(currentValue, purchasePricePerUnit, quantity);
    return {
      totalInvestment: result.totalInvestment.toNumber(),
      currentValue: result.currentValue.toNumber(),
      gain: result.gain.toNumber(),
      gainPercent: result.gainPercent.toNumber()
    };
  }

  /**
   * Calculate annualized return (APY) based on purchase date with precision
   */
  static calculateAPYDecimal(currentValue: number | DecimalValue, purchasePricePerUnit: number | DecimalValue, quantity: number | DecimalValue, purchaseDate: string): DecimalValue {
    try {
      if (!purchaseDate || !purchasePricePerUnit || !quantity || !currentValue) return new Decimal(0);

      const currentVal = currentValue instanceof Decimal ? currentValue : new Decimal(currentValue);
      const purchasePrice = purchasePricePerUnit instanceof Decimal ? purchasePricePerUnit : new Decimal(purchasePricePerUnit);
      const qty = quantity instanceof Decimal ? quantity : new Decimal(quantity);

      const totalInvestment = purchasePrice.times(qty);
      if (totalInvestment.isZero()) return new Decimal(0);

      const gain = currentVal.minus(totalInvestment);
      const gainPercent = gain.dividedBy(totalInvestment);

      // Calculate time period in years
      const purchaseDateObj = new Date(purchaseDate);
      const currentDate = new Date();
      const timeDiffMs = currentDate.getTime() - purchaseDateObj.getTime();
      const timeDiffYears = new Decimal(timeDiffMs).dividedBy(1000 * 60 * 60 * 24 * 365.25);

      // Avoid division by zero or negative time
      if (timeDiffYears.lessThanOrEqualTo(0)) return new Decimal(0);

      // APY formula: (1 + total_return)^(1/years) - 1
      const base = new Decimal(1).plus(gainPercent);
      const exponent = new Decimal(1).dividedBy(timeDiffYears);
      const apy = base.pow(exponent).minus(1);
      
      return apy.times(100); // Convert to percentage
    } catch (error) {
      console.error('Error calculating APY:', error);
      return new Decimal(0);
    }
  }

  /**
   * Calculate annualized return (APY) based on purchase date
   */
  static calculateAPY(currentValue: number, purchasePricePerUnit: number, quantity: number, purchaseDate: string): number {
    return this.calculateAPYDecimal(currentValue, purchasePricePerUnit, quantity, purchaseDate).toNumber();
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
   * Format APY with context and precision
   */
  static formatAPY(apy: number | DecimalValue): string {
    try {
      const apyDecimal = apy instanceof Decimal ? apy : new Decimal(apy);
      if (apyDecimal.abs().lessThan(0.01)) return '0.00% APY';
      const sign = apyDecimal.greaterThan(0) ? '+' : '';
      return `${sign}${apyDecimal.toFixed(2)}% APY`;
    } catch (error) {
      console.error('Error formatting APY:', error);
      return '0.00% APY';
    }
  }

  /**
   * Round to nearest cent with proper banker's rounding
   */
  static roundToCents(value: number | DecimalValue): DecimalValue {
    try {
      const decimal = value instanceof Decimal ? value : new Decimal(value);
      return decimal.toDecimalPlaces(2);
    } catch (error) {
      console.error('Error rounding to cents:', error);
      return new Decimal(0);
    }
  }

  /**
   * Check if two financial values are equal within tolerance
   */
  static isEqual(a: number | DecimalValue, b: number | DecimalValue, tolerance: number = 0.001): boolean {
    try {
      const decimalA = a instanceof Decimal ? a : new Decimal(a);
      const decimalB = b instanceof Decimal ? b : new Decimal(b);
      const diff = decimalA.minus(decimalB).abs();
      return diff.lessThanOrEqualTo(tolerance);
    } catch (error) {
      console.error('Error comparing financial values:', error);
      return false;
    }
  }
} 