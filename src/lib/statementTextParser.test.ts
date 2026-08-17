import { describe, expect, it } from "vitest";

import { detectBank, parseTransactions } from "@/lib/statementTextParser";

/**
 * The text pdf.js actually extracts from `e2e/fixtures/monzo-statement.pdf`,
 * pasted verbatim rather than re-derived, so the test does not need pdf.js and
 * still exercises what the parser really receives - collapsed columns,
 * inconsistent gaps between them, and all.
 *
 * The PDF path had never been run against a real PDF before this. Doing so
 * found three faults at once: every row came back as income, merchant branch
 * numbers were read as amounts, and dates were transposed.
 */
const MONZO_PDF_TEXT = [
  "Monzo Bank Limited",
  "Current Account Statement",
  "Account 12345678 Sort code 04-00-04",
  "Statement period 01 July 2026 to 31 July 2026",
  "Date   Description   Money Out   Money In Balance",
  "Opening balance   1,250.00",
  "01/07/2026   COSTA COFFEE LONDON     3.99   1,246.01",
  "02/07/2026   TESCO STORES 3421   42.50   1,203.51",
  "03/07/2026   MONTHLY RENT PAYMENT     1,250.00   -46.49",
  "04/07/2026   ACME LTD SALARY   2,500.00 2,453.51",
  "05/07/2026   NETFLIX.COM   8.99   2,444.52",
  "08/07/2026   SAINSBURYS LOCAL 4412   18.75   2,425.77",
  "09/07/2026   TFL TRAVEL CHARGE   7.60   2,418.17",
  "10/07/2026   THAMES WATER UTILITIES   32.14   2,386.03",
  "11/07/2026   SPOTIFY PREMIUM   11.99   2,374.04",
  "15/07/2026   AMAZON MARKETPLACE UK     56.30   2,317.74",
  "17/07/2026   HMRC TAX REBATE     142.60   2,460.34",
  "18/07/2026   SHELL FILLING STATION   61.02   2,399.32",
  "20/07/2026   BRITISH GAS ENERGY   78.44   2,320.88",
  "21/07/2026   WAITROSE AND PARTNERS 12     63.18   2,257.70",
  "Closing balance   2,257.70",
].join("\n");

describe("a real Monzo PDF", () => {
  const transactions = parseTransactions(MONZO_PDF_TEXT, "monzo");
  const find = (needle: string) =>
    transactions.find((t) => t.description.includes(needle));

  it("finds every transaction and nothing else", () => {
    expect(transactions).toHaveLength(14);
  });

  it("does not import the closing balance as a transaction", () => {
    // It has a figure on it and reads like a row. Importing it would add the
    // whole account value as one expense.
    expect(find("Closing")).toBeUndefined();
    expect(find("Opening")).toBeUndefined();
    expect(transactions.some((t) => t.amount === 225770)).toBe(false);
  });

  it("reads the amount, not the branch number in the merchant name", () => {
    // `TESCO STORES 3421` was read as GBP 3,421.00, because the amount pattern
    // accepted a bare integer and the description match was lazy.
    expect(find("TESCO")?.amount).toBe(4250);
    expect(find("SAINSBURYS")?.amount).toBe(1875);
    expect(find("WAITROSE")?.amount).toBe(6318);
  });

  it("does not mistake the running balance for the amount", () => {
    expect(find("COSTA")?.amount).toBe(399);
    expect(find("NETFLIX")?.amount).toBe(899);
  });

  it("reads dates in one calendar, day first", () => {
    // 01/07/2026 became 7 January while 15/07/2026 stayed 15 July, because 15
    // cannot be a month. One statement, two calendars.
    expect(find("COSTA")?.date).toBe("2026-07-01");
    expect(find("AMAZON")?.date).toBe("2026-07-15");
    expect(find("WAITROSE")?.date).toBe("2026-07-21");
    for (const transaction of transactions) {
      expect(transaction.date.startsWith("2026-07-")).toBe(true);
    }
  });

  it("gets the direction of the money right", () => {
    // Every row used to come back as a credit, so a month of spending was
    // imported as roughly GBP 12,000 of income.
    expect(find("ACME")?.type).toBe("credit");
    expect(find("HMRC")?.type).toBe("credit");
    for (const description of [
      "COSTA",
      "TESCO",
      "RENT",
      "NETFLIX",
      "SAINSBURYS",
      "TFL",
      "THAMES",
      "SPOTIFY",
      "AMAZON",
      "SHELL",
      "BRITISH GAS",
      "WAITROSE",
    ]) {
      expect(find(description)?.type).toBe("debit");
    }
  });

  it("gets the very first row right, using the opening balance", () => {
    // With nothing to compare against, the first row fell back to a guess and
    // a GBP 3.99 coffee came back as income.
    expect(transactions[0].description).toContain("COSTA");
    expect(transactions[0].type).toBe("debit");
  });

  it("adds up to the statement's own closing balance", () => {
    // The strongest check available: if any amount or direction is wrong, the
    // arithmetic stops agreeing with the paper.
    const opening = 125000;
    const closing = transactions.reduce(
      (total, t) => total + (t.type === "debit" ? -t.amount : t.amount),
      opening,
    );
    expect(closing).toBe(225770);
  });

  it("categorises from the description", () => {
    expect(find("TESCO")?.category).toBe("groceries");
    expect(find("RENT")?.category).toBe("rent_mortgage");
    expect(find("BRITISH GAS")?.category).toBe("utilities");
    expect(find("SHELL")?.category).toBe("fuel");
    expect(find("ACME")?.category).toBe("salary");
  });
});

describe("statements without a balance column", () => {
  it("reads a signed amount, negative being money out", () => {
    const text = [
      "01/07/2026 CARD PAYMENT TO TESCO -42.50",
      "02/07/2026 ACME LTD SALARY 2,500.00",
    ].join("\n");
    const transactions = parseTransactions(text, "monzo");
    expect(transactions).toHaveLength(2);
    expect(transactions[0].type).toBe("debit");
    expect(transactions[0].amount).toBe(4250);
    expect(transactions[1].type).toBe("credit");
  });

  it("reads an all-positive column as spending", () => {
    // Nothing in the file says which way the money went, and this is an
    // expense import. The review step is where a reader corrects it.
    const text = [
      "01/07/2026 COSTA COFFEE 3.99",
      "02/07/2026 TESCO STORES 42.50",
    ].join("\n");
    for (const transaction of parseTransactions(text, "monzo")) {
      expect(transaction.type).toBe("debit");
    }
  });
});

describe("US statements", () => {
  it("reads month-first dates for a US bank", () => {
    const text = "07/04/2026 WHOLE FOODS MARKET 52.10";
    const [transaction] = parseTransactions(text, "chase");
    expect(transaction.date).toBe("2026-07-04");
  });

  it("still lets the document overrule the default", () => {
    // A day above twelve can only be a day, whichever bank it is.
    const text = [
      "25/12/2026 TARGET STORE 20.00",
      "07/04/2026 WHOLE FOODS MARKET 52.10",
    ].join("\n");
    const transactions = parseTransactions(text, "chase");
    expect(transactions[0].date).toBe("2026-12-25");
    expect(transactions[1].date).toBe("2026-04-07");
  });
});

describe("detectBank", () => {
  it("recognises the bank from the statement header", () => {
    expect(detectBank(MONZO_PDF_TEXT)).toBe("monzo");
  });
});
