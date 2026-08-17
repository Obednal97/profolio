/**
 * Reading a bank statement CSV.
 *
 * This was previously a `useCallback` inside `PdfUploader`, which made it
 * impossible to test and hid several faults that only show up on a real export
 * rather than a hand-written fixture. It is a plain function now, and the
 * pieces it is built from are exported so they can be tested on their own.
 *
 * Amounts come out as integer CENTS, matching `ParsedTransaction.amount` and
 * the expenses wire format. There is exactly one multiplication by 100, here.
 */

import { classifyTransaction } from "@/lib/transactionClassifier";
import type { ParsedTransaction, ParseResult } from "@/lib/pdfParser";

/** A statement no larger than this, to bound the work a dropped file can cause. */
const MAX_ROWS = 10_000;
const MAX_TEXT_LENGTH = 50 * 1024 * 1024;
/** £10m in cents, well past any personal current account line. */
const MAX_AMOUNT_CENTS = 1_000_000_000;

/**
 * Statement text is rendered by React, which escapes it, and the server
 * revalidates every field on arrival, so this does not try to be an HTML
 * sanitiser. It used to strip `&`, `'` and `"` as "XSS vectors" and that was
 * pure data loss: `M&S BANK` became `MS BANK` and `SAINSBURY'S` became
 * `SAINSBURYS`, which also broke the merchant lookup in the classifier. What
 * is left removes control characters, which have no business in a description
 * and can corrupt a terminal or a log line, and caps the length.
 */
export function sanitiseStatementText(input: string): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/[\x00-\x1F\x7F]/g, " ")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

/**
 * Splits CSV text into rows of fields, per RFC 4180.
 *
 * The previous implementation was `line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)`
 * over `text.split("\n")`, which had three separate faults, each of which
 * silently corrupted a real export:
 *
 *  - `[^,]+` cannot match an empty field, so every blank cell was dropped from
 *    the row and every column after it shifted left by one. A Monzo export has
 *    a blank `Money In` on every line of spending, so the amount was read out
 *    of whatever column happened to land in that slot.
 *  - splitting on `\n` leaves a trailing `\r` on the last field of every line
 *    in a CRLF file, which is what banks actually export, so the last column
 *    never parsed as a number.
 *  - a quoted field containing a newline, which is common in payment
 *    references, was torn into two broken rows.
 */
export function splitCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let rowHasContent = false;

  const endField = (): void => {
    row.push(field);
    if (field.trim() !== "") rowHasContent = true;
    field = "";
  };

  const endRow = (): void => {
    endField();
    // A trailing newline, or a run of blank lines, is not a row.
    if (rowHasContent) rows.push(row);
    row = [];
    rowHasContent = false;
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        // A doubled quote inside a quoted field is one literal quote.
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"' && field.trim() === "") {
      // Only opens a quoted field at the start of one, so a stray quote in the
      // middle of an unquoted value stays literal instead of swallowing the
      // rest of the file.
      field = "";
      inQuotes = true;
    } else if (char === ",") {
      endField();
    } else if (char === "\n") {
      endRow();
    } else if (char === "\r") {
      // Consumed here so CRLF does not leave \r on the preceding field.
      if (text[i + 1] === "\n") i++;
      endRow();
    } else {
      field += char;
    }
  }

  if (field !== "" || row.length > 0) endRow();

  return rows;
}

/**
 * Reads a money cell into cents.
 *
 * Returns null rather than 0 for anything unreadable, so a blank cell and a
 * genuine zero stay distinguishable to the caller.
 *
 * Handles the shapes that turn up in real exports: a currency symbol, thousands
 * separators, a leading or trailing minus, accounting parentheses, and the
 * `CR`/`DR` suffix some banks use instead of a sign.
 */
export function parseMoneyToCents(raw: string | undefined): number | null {
  if (raw == null) return null;

  let text = raw.trim();
  if (text === "") return null;

  let negative = false;

  if (/^\(.*\)$/.test(text)) {
    negative = true;
    text = text.slice(1, -1);
  }

  const suffix = text.match(/\b(CR|DR)\s*$/i);
  if (suffix) {
    if (suffix[1].toUpperCase() === "CR") negative = false;
    text = text.slice(0, suffix.index).trim();
  }

  if (text.endsWith("-")) {
    negative = true;
    text = text.slice(0, -1).trim();
  }

  // Everything that is not a digit, a decimal point or a sign: currency
  // symbols, thousands separators, stray spaces from a fixed-width export.
  text = text.replace(/[^\d.\-+]/g, "");

  if (text.startsWith("-")) {
    negative = true;
    text = text.slice(1);
  } else if (text.startsWith("+")) {
    text = text.slice(1);
  }

  if (text === "" || !/^\d*\.?\d*$/.test(text) || !/\d/.test(text)) return null;

  const value = Number.parseFloat(text);
  if (!Number.isFinite(value)) return null;

  // `parseFloat("3.99") * 100` is 398.99999999999994. Rounding is not a
  // nicety: the amount column is an integer and the server rejects the rest.
  const cents = Math.round(value * 100);
  const capped = Math.min(cents, MAX_AMOUNT_CENTS);

  return negative ? -capped : capped;
}

/** Matches a header by whole word, so "Amount (Pending)" is not read as an "in" column. */
function hasWord(header: string, word: string): boolean {
  return new RegExp(`(^|[^a-z])${word}([^a-z]|$)`, "i").test(header);
}

interface ColumnMap {
  date: number;
  type: number;
  description: number;
  moneyOut: number;
  moneyIn: number;
  amount: number;
}

/**
 * Works out which column is which.
 *
 * The old version tested `h.includes("in")` to rule a header out of being the
 * single amount column, which also ruled out `Amount (Pending)` and
 * `Amount in GBP`, because "pending" and "in GBP" both contain the letters.
 * Whole-word matching fixes that.
 */
export function mapColumns(headers: string[]): ColumnMap {
  const find = (
    predicate: (header: string, index: number) => boolean,
  ): number => headers.findIndex(predicate);

  const moneyOut = find(
    (h) =>
      h.includes("money out") ||
      h.includes("amount out") ||
      h.includes("paid out") ||
      h.includes("withdrawal") ||
      hasWord(h, "debit"),
  );
  const moneyIn = find(
    (h) =>
      h.includes("money in") ||
      h.includes("amount in") ||
      h.includes("paid in") ||
      h.includes("deposit") ||
      hasWord(h, "credit"),
  );

  return {
    date: find((h) => hasWord(h, "date") || hasWord(h, "time")),
    type: find((h) => hasWord(h, "type")),
    description: find(
      (h) =>
        hasWord(h, "name") ||
        h.includes("description") ||
        h.includes("merchant") ||
        h.includes("reference") ||
        h.includes("details") ||
        h.includes("payee"),
    ),
    moneyOut,
    moneyIn,
    // Only a single amount column if it is not one of the pair above.
    amount: find(
      (h, index) =>
        index !== moneyOut && index !== moneyIn && hasWord(h, "amount"),
    ),
  };
}

const MONTHS: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

/**
 * Whether `DD/MM` or `MM/DD` is in play, decided across the whole file.
 *
 * A single row cannot tell you: `05/07/2026` is valid either way. A statement
 * usually can, because sooner or later a day exceeds 12. UK order is the
 * default when the file never says, matching the rest of the application.
 */
export function detectDayFirst(dateCells: string[]): boolean {
  for (const cell of dateCells) {
    const match = cell.trim().match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.]\d{2,4}$/);
    if (!match) continue;
    const first = Number(match[1]);
    const second = Number(match[2]);
    if (first > 12 && second <= 12) return true;
    if (second > 12 && first <= 12) return false;
  }
  return true;
}

/**
 * Normalises a statement date to `YYYY-MM-DD`.
 *
 * Returns null when it cannot read the value. The old version returned the
 * original string in that case, which meant an unreadable cell travelled all
 * the way to the API and failed validation for the whole batch, so one odd row
 * lost the entire statement.
 */
export function normaliseStatementDate(
  raw: string,
  options: { dayFirst?: boolean; referenceYear?: number } = {},
): string | null {
  const { dayFirst = true, referenceYear = new Date().getUTCFullYear() } =
    options;
  const text = raw.trim();
  if (text === "") return null;

  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  // "Apr 15" and "15 Apr", the American Express and some statement-PDF shapes.
  const monthDay = text.match(/^([A-Za-z]{3})[a-z]*\s+(\d{1,2})$/);
  if (monthDay) {
    const month = MONTHS[monthDay[1].toLowerCase()];
    if (month) {
      return `${referenceYear}-${month}-${monthDay[2].padStart(2, "0")}`;
    }
  }
  const dayMonth = text.match(/^(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s*(\d{4})?$/);
  if (dayMonth) {
    const month = MONTHS[dayMonth[2].toLowerCase()];
    if (month) {
      const year = dayMonth[3] ?? String(referenceYear);
      return `${year}-${month}-${dayMonth[1].padStart(2, "0")}`;
    }
  }

  // Numeric, either order. Accepts single digits: `1/7/2026` used to fall
  // through unrecognised because the pattern demanded zero padding.
  const numeric = text.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2}|\d{4})$/);
  if (numeric) {
    const first = Number(numeric[1]);
    const second = Number(numeric[2]);
    let day = dayFirst ? first : second;
    let month = dayFirst ? second : first;

    // One row can still contradict the file-wide guess. Trust the row.
    if (month > 12 && day <= 12) [day, month] = [month, day];
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    const yearPart = numeric[3];
    const year =
      yearPart.length === 4 ? Number(yearPart) : 2000 + Number(yearPart);

    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return null;
}

/** Statement lines that are not spending and should never reach the ledger. */
function isNonSpendingRow(type: string, description: string): boolean {
  const haystack = `${type} ${description}`.toLowerCase();
  return (
    haystack.includes("pot transfer") ||
    haystack.includes("active card check") ||
    haystack.includes("declined")
  );
}

export interface ParseCsvOptions {
  /** Pinned by the tests; defaults to the current year. */
  referenceYear?: number;
}

/**
 * Parses a bank statement CSV into reviewable transactions.
 *
 * Direction is taken from the numbers, never from the words. A separate
 * out/in column pair is authoritative. A single signed amount column is read
 * with the convention every UK bank and every OFX feed uses: negative is money
 * leaving the account. The previous code had this backwards, and then made it
 * worse by forcing any description containing "payment" to be a credit, so
 * `CARD PAYMENT TO TESCO` was filed as income. In an app that reads income off
 * the category, that inverted the entire statement.
 *
 * An all-positive single column carries no direction at all, so those rows are
 * treated as spending, which is what an expense import is for, and the review
 * step exists for the reader to correct anything the file could not say.
 */
export function parseStatementCsv(
  text: string,
  options: ParseCsvOptions = {},
): ParseResult {
  const errors: string[] = [];

  if (text.length > MAX_TEXT_LENGTH) {
    return {
      transactions: [],
      bankName: "CSV Import",
      totalTransactions: 0,
      errors: ["File content too large to process safely"],
    };
  }

  const rows = splitCsvRows(text);
  if (rows.length < 2) {
    return {
      transactions: [],
      bankName: "CSV Import",
      totalTransactions: 0,
      errors: ["CSV file appears to be empty or has no transaction rows"],
    };
  }

  const headers = rows[0].map((header) =>
    header.replace(/"/g, "").trim().toLowerCase(),
  );
  const columns = mapColumns(headers);

  if (columns.date < 0) {
    return {
      transactions: [],
      bankName: "CSV Import",
      totalTransactions: 0,
      errors: ["Could not find a date column in this CSV"],
    };
  }
  if (columns.moneyOut < 0 && columns.moneyIn < 0 && columns.amount < 0) {
    return {
      transactions: [],
      bankName: "CSV Import",
      totalTransactions: 0,
      errors: ["Could not find an amount column in this CSV"],
    };
  }

  const body = rows.slice(1, MAX_ROWS + 1);
  if (rows.length - 1 > MAX_ROWS) {
    errors.push(
      `Only the first ${MAX_ROWS.toLocaleString()} rows were read from this file`,
    );
  }

  const dayFirst = detectDayFirst(
    body.map((row) => row[columns.date] ?? "").filter(Boolean),
  );

  const transactions: ParsedTransaction[] = [];
  let unreadableDates = 0;

  for (let i = 0; i < body.length; i++) {
    const row = body[i];
    const cell = (index: number): string =>
      index >= 0 ? sanitiseStatementText(row[index] ?? "") : "";

    const description = cell(columns.description);
    const type = cell(columns.type);

    let cents = 0;
    let isDebit = true;

    if (columns.moneyOut >= 0 || columns.moneyIn >= 0) {
      const out = parseMoneyToCents(cell(columns.moneyOut));
      const incoming = parseMoneyToCents(cell(columns.moneyIn));

      if (out !== null && out !== 0) {
        cents = Math.abs(out);
        isDebit = true;
      } else if (incoming !== null && incoming !== 0) {
        cents = Math.abs(incoming);
        isDebit = false;
      }
    }

    if (cents === 0 && columns.amount >= 0) {
      const signed = parseMoneyToCents(cell(columns.amount));
      if (signed !== null && signed !== 0) {
        cents = Math.abs(signed);
        isDebit = signed < 0;
      }
    }

    if (cents === 0) continue;
    if (!description) continue;
    if (isNonSpendingRow(type, description)) continue;

    const date = normaliseStatementDate(cell(columns.date), {
      dayFirst,
      referenceYear: options.referenceYear,
    });
    if (!date) {
      unreadableDates++;
      continue;
    }

    const classification = classifyTransaction(
      description,
      cents,
      isDebit ? "debit" : "credit",
    );

    transactions.push({
      // Deterministic, and unique within one parse, which is all a React key
      // and the review table need. `Date.now()` made the output untestable.
      id: `csv-${i + 1}`,
      date,
      description,
      amount: cents,
      type: isDebit ? "debit" : "credit",
      category: classification.category,
      merchant: classification.merchant?.name,
      isSubscription: classification.isSubscription,
      confidence: classification.confidence,
      rawText: sanitiseStatementText(row.join(",")),
    });
  }

  if (unreadableDates > 0) {
    errors.push(
      `${unreadableDates} ${unreadableDates === 1 ? "row was" : "rows were"} skipped because the date could not be read`,
    );
  }
  if (transactions.length === 0) {
    errors.push("No valid transactions found in CSV");
  }

  return {
    transactions,
    bankName: "CSV Import",
    totalTransactions: transactions.length,
    errors,
  };
}
