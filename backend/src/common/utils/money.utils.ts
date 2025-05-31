import Decimal from 'decimal.js';

// Configure Decimal.js for financial precision (same as frontend)
Decimal.config({
  precision: 20,
  rounding: Decimal.ROUND_HALF_EVEN, // Banker's rounding
  toExpNeg: -18,
  toExpPos: 18,
});

export class MoneyUtils {
  /**
   * Convert cents/pence to decimal amount with precision
   */
  static fromCents(cents: number): number {
    try {
      const decimal = new Decimal(cents);
      return decimal.dividedBy(100).toNumber();
    } catch (error) {
      console.error('Error converting cents to dollars:', error);
      return 0;
    }
  }

  /**
   * Convert decimal amount to cents/pence with precision
   */
  static toCents(amount: number): number {
    try {
      const decimal = new Decimal(amount);
      return decimal.times(100).round().toNumber();
    } catch (error) {
      console.error('Error converting dollars to cents:', error);
      return 0;
    }
  }

  /**
   * Convert basis points to percentage with precision
   */
  static fromBasisPoints(basisPoints: number): number {
    try {
      const decimal = new Decimal(basisPoints);
      return decimal.dividedBy(10000).toNumber();
    } catch (error) {
      console.error('Error converting basis points to percentage:', error);
      return 0;
    }
  }

  /**
   * Convert percentage to basis points with precision
   */
  static toBasisPoints(percentage: number): number {
    try {
      const decimal = new Decimal(percentage);
      return decimal.times(10000).round().toNumber();
    } catch (error) {
      console.error('Error converting percentage to basis points:', error);
      return 0;
    }
  }

  /**
   * Convert micro-units to decimal with precision
   */
  static fromMicroUnits(microUnits: number): number {
    try {
      const decimal = new Decimal(microUnits);
      return decimal.dividedBy(1000000).toNumber();
    } catch (error) {
      console.error('Error converting micro-units to decimal:', error);
      return 0;
    }
  }

  /**
   * Convert decimal to micro-units with precision
   */
  static toMicroUnits(amount: number): number {
    try {
      const decimal = new Decimal(amount);
      return decimal.times(1000000).round().toNumber();
    } catch (error) {
      console.error('Error converting decimal to micro-units:', error);
      return 0;
    }
  }

  /**
   * Format money for display
   */
  static formatMoney(cents: number, currency: string = 'USD'): string {
    try {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return formatter.format(this.fromCents(cents));
    } catch (error) {
      console.error('Error formatting currency:', error);
      return '$0.00';
    }
  }

  /**
   * Safe decimal arithmetic using decimal.js
   */
  static safeAdd(...values: number[]): number {
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

  static safeSubtract(a: number, b: number): number {
    try {
      const decimalA = new Decimal(a);
      const decimalB = new Decimal(b);
      return decimalA.minus(decimalB).toNumber();
    } catch (error) {
      console.error('Error in subtraction:', error);
      return 0;
    }
  }

  static safeMultiply(a: number, b: number): number {
    try {
      const decimalA = new Decimal(a);
      const decimalB = new Decimal(b);
      return decimalA.times(decimalB).toNumber();
    } catch (error) {
      console.error('Error in multiplication:', error);
      return 0;
    }
  }

  static safeDivide(a: number, b: number): number {
    try {
      if (b === 0) {
        console.warn('Division by zero attempted');
        return 0;
      }
      const decimalA = new Decimal(a);
      const decimalB = new Decimal(b);
      return decimalA.dividedBy(decimalB).toNumber();
    } catch (error) {
      console.error('Error in division:', error);
      return 0;
    }
  }

  /**
   * Calculate gain/loss with precision
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
   * Calculate compound interest with precision
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
   * Calculate simple interest with precision
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
   * Validate monetary input (same as frontend)
   */
  static validateMonetaryInput(value: string | number): {
    isValid: boolean;
    error?: string;
    sanitized?: string;
  } {
    try {
      const stringValue = typeof value === 'number' ? value.toString() : value;
      
      // Remove any non-numeric characters except decimal point
      const sanitized = stringValue.replace(/[^0-9.-]/g, '');
      
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
} 