/**
 * Reading the individual values out of a bank statement: money, dates, and the
 * text around them.
 *
 * Shared by the CSV reader and the PDF text reader, which had two separate and
 * differently wrong implementations of all three. The PDF one read `01/07/2026`
 * as 7 January, and treated the trailing digits of `TESCO STORES 3421` as an
 * amount of GBP 3,421.
 */

/** £10m in cents, well past any personal current account line. */
export const MAX_AMOUNT_CENTS = 1_000_000_000;

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

