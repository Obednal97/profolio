import { describe, expect, it } from "vitest";

import {
  asBasisPoints,
  asCents,
  asDollars,
  asPercent,
  asFraction,
  formatCents,
  fractionToPercent,
  percentToFraction,
  positionValue,
  sumCents,
  toBasisPoints,
  toCents,
  toDollars,
  toPercent,
} from "@/lib/moneyUnits";

describe("toCents", () => {
  it("rounds rather than trusting binary floating point", () => {
    // 19.99 * 100 is 1998.9999999999998 and the column is an integer.
    expect(toCents(asDollars(19.99))).toBe(1999);
    expect(toCents(asDollars(3.99))).toBe(399);
    expect(toCents(asDollars(9.45))).toBe(945);
  });

  it("round trips", () => {
    for (const amount of [0, 0.01, 1, 3.99, 1250, 999999.99]) {
      expect(toDollars(toCents(asDollars(amount)))).toBeCloseTo(amount, 10);
    }
  });

  it("keeps a genuine zero", () => {
    expect(toCents(asDollars(0))).toBe(0);
    expect(toDollars(asCents(0))).toBe(0);
  });
});

describe("rate units", () => {
  it("treats a percent and a fraction as a hundred apart", () => {
    expect(percentToFraction(asPercent(4.25))).toBeCloseTo(0.0425, 10);
    expect(fractionToPercent(asFraction(0.0425))).toBeCloseTo(4.25, 10);
  });

  it("holds a percent in basis points", () => {
    expect(toBasisPoints(asPercent(4.25))).toBe(425);
    expect(toPercent(asBasisPoints(425))).toBeCloseTo(4.25, 10);
  });

  it("rounds to the nearest basis point", () => {
    expect(toBasisPoints(asPercent(4.257))).toBe(426);
  });
});

describe("positionValue", () => {
  it("is a quantity times a unit price, converted once", () => {
    // current_value holds the TOTAL position. Multiplying by quantity a second
    // time downstream double-counts, which the dashboard used to do.
    expect(positionValue(50, asDollars(313.33))).toBe(1566650);
  });

  it("does not accumulate float error over awkward prices", () => {
    expect(positionValue(3, asDollars(19.99))).toBe(5997);
    expect(Number.isInteger(positionValue(7, asDollars(0.07)))).toBe(true);
  });

  it("handles a fractional quantity", () => {
    expect(positionValue(0.5, asDollars(100))).toBe(5000);
  });
});

describe("sumCents", () => {
  it("adds without leaving a fraction of a cent", () => {
    const values = [399, 4250, 125000].map(asCents);
    expect(sumCents(values)).toBe(129649);
    expect(Number.isInteger(sumCents(values))).toBe(true);
  });

  it("is zero for nothing", () => {
    expect(sumCents([])).toBe(0);
  });
});

describe("formatCents", () => {
  it("formats an amount held in cents", () => {
    expect(formatCents(asCents(129649), "GBP")).toBe("£1,296.49");
  });

  it("does not guess the unit from the magnitude", () => {
    // The bug this replaces: formatCurrency divided by 100 when the value
    // happened to exceed 1000, so the same figure rendered differently either
    // side of the threshold.
    expect(formatCents(asCents(99900), "GBP")).toBe("£999.00");
    expect(formatCents(asCents(100100), "GBP")).toBe("£1,001.00");
  });
});
