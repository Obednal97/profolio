/**
 * Units of money, as types.
 *
 * Every money bug this project has had was a unit bug, not an arithmetic bug.
 * A unit price written into a column holding a position total. A dollar figure
 * from a market feed passed through `fromCents` and divided by 100. A
 * `formatCurrency` that guessed cents from dollars by looking at the magnitude,
 * so a balance crossed a threshold and moved the decimal point. None of them
 * were caught by a test or a review, because to the compiler they were all
 * `number`.
 *
 * A branded type makes the unit part of the type. `Cents` and `Dollars` are
 * both numbers at runtime - there is no wrapper object and no cost - but they
 * are not interchangeable to the compiler, so passing one where the other is
 * expected fails the build instead of shipping.
 *
 * This module is deliberately not `server-only`: the conversion has to be
 * expressible on both sides, because the wire format differs per resource and
 * the boundary is exactly where the mistakes happen. decimal.js is already a
 * client dependency through `src/lib/financial.ts`, so using it here adds
 * nothing to the bundle, and it keeps these conversions bit for bit identical
 * to the MoneyUtils ones they stand in for. Branding was meant to be a
 * compile-time change; it should not quietly alter a stored figure.
 */

import Decimal from "decimal.js";

declare const centsBrand: unique symbol;
declare const dollarsBrand: unique symbol;
declare const basisPointsBrand: unique symbol;
declare const percentBrand: unique symbol;
declare const fractionBrand: unique symbol;

/** An integer number of cents. How money is stored, everywhere. */
export type Cents = number & { readonly [centsBrand]: true };

/** A decimal amount of currency. How money is displayed, and how the assets and properties APIs speak. */
export type Dollars = number & { readonly [dollarsBrand]: true };

/** An integer number of basis points. How rates are stored. */
export type BasisPoints = number & { readonly [basisPointsBrand]: true };

/** An annual percentage, so 4.25 means 4.25%. */
export type Percent = number & { readonly [percentBrand]: true };

/**
 * The same rate as a fraction, so 0.0425 means 4.25%.
 *
 * A separate type from `Percent` because the two differ by a factor of 100 and
 * the codebase already has one place where they were confused:
 * `MoneyUtils.toBasisPoints` scales by 10000, which is the fraction to basis
 * points conversion, but its parameter is named `percentage`. Liabilities
 * divides by 100 first and is correct; assets does not, and stores rates a
 * hundred times too large.
 */
export type Fraction = number & { readonly [fractionBrand]: true };

/**
 * Asserts that a plain number is already in cents.
 *
 * Use at a boundary the compiler cannot see through - a database row, a
 * validated request body - and nowhere else. Inside the application the unit
 * should be carried by the type rather than reasserted.
 */
export function asCents(value: number): Cents {
  return value as Cents;
}

/** Asserts that a plain number is already in dollars. See `asCents`. */
export function asDollars(value: number): Dollars {
  return value as Dollars;
}

/** Asserts that a plain number is already in basis points. See `asCents`. */
export function asBasisPoints(value: number): BasisPoints {
  return value as BasisPoints;
}

/** Asserts that a plain number is already an annual percentage. See `asCents`. */
export function asPercent(value: number): Percent {
  return value as Percent;
}

/** Asserts that a plain number is already a fraction. See `asCents`. */
export function asFraction(value: number): Fraction {
  return value as Fraction;
}

/**
 * 4.25% -> 0.0425, and back.
 *
 * Decimal rather than a plain divide or multiply. `0.059 * 100` in binary
 * floating point is 5.8999999999999995, and that is what the assets API
 * returned for a 5.9% rate until this used Decimal.
 */
export function percentToFraction(rate: Percent): Fraction {
  return new Decimal(rate).dividedBy(100).toNumber() as Fraction;
}

/** 0.0425 -> 4.25%. See `percentToFraction`. */
export function fractionToPercent(rate: Fraction): Percent {
  return new Decimal(rate).times(100).toNumber() as Percent;
}

/**
 * Rounds, because the column is an integer and `19.99 * 100` is
 * 1998.9999999999998 in binary floating point.
 */
export function toCents(amount: Dollars): Cents {
  return new Decimal(amount).times(100).round().toNumber() as Cents;
}

export function toDollars(amount: Cents): Dollars {
  return new Decimal(amount).dividedBy(100).toNumber() as Dollars;
}

/** Basis points are hundredths of a percent, so 4.25% is 425. */
export function toBasisPoints(rate: Percent): BasisPoints {
  return new Decimal(rate).times(100).round().toNumber() as BasisPoints;
}

export function toPercent(rate: BasisPoints): Percent {
  return new Decimal(rate).dividedBy(100).toNumber() as Percent;
}

/** Adds amounts that are already in the same unit. */
export function sumCents(values: readonly Cents[]): Cents {
  return values.reduce<number>((total, value) => total + value, 0) as Cents;
}

/**
 * A quantity times a unit price, in cents.
 *
 * Named for the mistake it exists to prevent: `current_value` on an asset is
 * the total value of a position, and multiplying it by the quantity a second
 * time double-counts. Price sync writes the output of this, once.
 */
export function positionValue(quantity: number, unitPrice: Dollars): Cents {
  return new Decimal(quantity)
    .times(unitPrice)
    .times(100)
    .round()
    .toNumber() as Cents;
}

/** Formats an amount held in cents. Takes cents so the call site cannot pass the wrong unit. */
export function formatCents(
  amount: Cents,
  currency = "USD",
  locale = "en-GB",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toDollars(amount));
}
