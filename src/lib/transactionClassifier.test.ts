import { describe, expect, it } from "vitest";

import {
  classifyTransaction,
  isIncomeCategory,
  INCOME_CATEGORY_IDS,
} from "@/lib/transactionClassifier";

const spend = (description: string, cents = 1000) =>
  classifyTransaction(description, cents, "debit");
const receive = (description: string, cents = 1000) =>
  classifyTransaction(description, cents, "credit");

describe("direction gating", () => {
  it("never files spending under an income category", () => {
    // The fault that made this worth fixing. 'freelance' listed 'payment' as a
    // keyword and is declared near the top of the category tree, so the
    // first-match scan sent any spending line containing the word to an income
    // category. 'freelance' counts as income on the dashboard, so a rent
    // payment left spending and joined earnings on the way past.
    for (const description of [
      "MONTHLY RENT PAYMENT",
      "CARD PAYMENT TO TESCO",
      "FASTER PAYMENT",
      "PAYMENT RECEIVED",
    ]) {
      expect(isIncomeCategory(spend(description).category)).toBe(false);
    }
  });

  it("always files a credit under an income category", () => {
    for (const description of [
      "ACME LTD SALARY",
      "TESCO REFUND",
      "HMRC TAX REBATE",
      "SOMETHING UNRECOGNISABLE",
    ]) {
      expect(isIncomeCategory(receive(description).category)).toBe(true);
    }
  });

  it("does not turn a supermarket refund into groceries", () => {
    const refund = receive("TESCO STORES 3421");
    expect(refund.category).toBe("income");
    // The merchant is still recognised, it just does not set the category.
    expect(refund.merchant?.name).toBeTruthy();
  });
});

describe("keyword collisions", () => {
  it("reads gas as the household supply, not motor fuel", () => {
    // 'gas' was claimed by both fuel and utilities, and fuel is declared
    // first, so BRITISH GAS ENERGY was filed as petrol.
    expect(spend("BRITISH GAS ENERGY").category).toBe("utilities");
  });

  it("still finds motor fuel by its own words", () => {
    expect(spend("SHELL FILLING STATION").category).toBe("fuel");
    expect(spend("BP PETROL").category).toBe("fuel");
  });

  it("reads a rent payment as rent", () => {
    expect(spend("MONTHLY RENT PAYMENT", 125000).category).toBe("rent_mortgage");
  });

  it("prefers the longer, more specific keyword", () => {
    expect(spend("GAS STATION 42").category).toBe("fuel");
  });
});

describe("word boundaries", () => {
  it("does not match a keyword inside a longer word", () => {
    // Plain includes() matched 'gas' inside 'gasket'.
    expect(spend("GASKET SUPPLIES LTD").category).not.toBe("fuel");
  });

  it("still matches a plural", () => {
    expect(spend("BANK FEES").category).toBe("banking_fees");
  });
});

describe("no invented categories", () => {
  it("does not guess coffee from the amount alone", () => {
    // Anything under ten pounds used to come back as 'coffee_tea' at a stated
    // confidence of 0.6. A 9.45 charge at Boots is not coffee.
    const boots = spend("BOOTS THE CHEMIST 88", 945);
    expect(boots.category).toBe("other");
    expect(boots.confidence).toBeLessThan(0.5);
  });

  it("does not guess rent from the amount alone", () => {
    const big = spend("UNRECOGNISABLE THING", 500000);
    expect(big.category).toBe("other");
  });

  it("still recognises coffee when the description says so", () => {
    expect(spend("COSTA COFFEE LONDON", 399).category).toBe("coffee_tea");
  });

  it("reports low confidence when it does not know", () => {
    expect(spend("XFR 88213 QQ").confidence).toBeLessThanOrEqual(0.3);
  });
});

describe("known merchants", () => {
  it("classifies by merchant with high confidence", () => {
    const netflix = spend("NETFLIX.COM");
    expect(netflix.category).toBe("streaming");
    expect(netflix.confidence).toBeGreaterThan(0.9);
    expect(netflix.isSubscription).toBe(true);
  });

  it("is not sensitive to where an entry sits in the object", () => {
    // Longest match, not first match, so adding an entry cannot silently
    // capture lines that belonged to another one.
    expect(spend("TESCO STORES 3421").category).toBe("groceries");
    expect(spend("SAINSBURYS LOCAL 4412").category).toBe("groceries");
  });
});

describe("INCOME_CATEGORY_IDS", () => {
  it("is derived from the category tree, not written out by hand", () => {
    expect(INCOME_CATEGORY_IDS.has("income")).toBe(true);
    expect(INCOME_CATEGORY_IDS.has("salary")).toBe(true);
    expect(INCOME_CATEGORY_IDS.has("investment_income")).toBe(true);
    expect(INCOME_CATEGORY_IDS.has("freelance")).toBe(true);
    expect(INCOME_CATEGORY_IDS.has("groceries")).toBe(false);
    expect(INCOME_CATEGORY_IDS.has("other")).toBe(false);
  });

  it("ignores case and padding, because stored categories vary", () => {
    expect(isIncomeCategory(" Salary ")).toBe(true);
  });
});
