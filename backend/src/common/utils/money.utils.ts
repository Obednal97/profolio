import { Decimal } from '@prisma/client/runtime/library';

export class MoneyUtils {
  /**
   * Convert cents/pence to decimal amount
   */
  static fromCents(cents: number): number {
    return cents / 100;
  }

  /**
   * Convert decimal amount to cents/pence
   */
  static toCents(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Convert basis points to percentage
   */
  static fromBasisPoints(basisPoints: number): number {
    return basisPoints / 10000;
  }

  /**
   * Convert percentage to basis points
   */
  static toBasisPoints(percentage: number): number {
    return Math.round(percentage * 10000);
  }

  /**
   * Convert micro-units to decimal
   */
  static fromMicroUnits(microUnits: number): number {
    return microUnits / 1000000;
  }

  /**
   * Convert decimal to micro-units
   */
  static toMicroUnits(amount: number): number {
    return Math.round(amount * 1000000);
  }

  /**
   * Format money for display
   */
  static formatMoney(cents: number, currency: string = 'USD'): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    });
    return formatter.format(this.fromCents(cents));
  }

  /**
   * Safe decimal arithmetic using Prisma's Decimal type
   */
  static safeAdd(a: number, b: number): number {
    return new Decimal(a).add(new Decimal(b)).toNumber();
  }

  static safeSubtract(a: number, b: number): number {
    return new Decimal(a).sub(new Decimal(b)).toNumber();
  }

  static safeMultiply(a: number, b: number): number {
    return new Decimal(a).mul(new Decimal(b)).toNumber();
  }

  static safeDivide(a: number, b: number): number {
    if (b === 0) throw new Error('Division by zero');
    return new Decimal(a).div(new Decimal(b)).toNumber();
  }
} 