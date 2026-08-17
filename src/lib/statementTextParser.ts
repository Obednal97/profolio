/**
 * Turning the text of a bank statement into transactions.
 *
 * Split out of `pdfParser.ts`, which imports pdf.js at module scope and
 * therefore cannot be loaded outside a browser - `DOMMatrix is not defined`.
 * That made every one of these functions untestable, and the PDF path had
 * never once been run against a real PDF as a result. Nothing here touches
 * pdf.js: it takes the extracted text and returns transactions, so it can be
 * tested with a fixture in milliseconds.
 */

import { classifyTransaction } from "./transactionClassifier";
import {
  normaliseStatementDate,
  parseMoneyToCents,
  sanitiseStatementText,
} from "./statementValues";

// Types for parsed transactions
export interface ParsedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number; // in cents
  type: 'debit' | 'credit';
  category?: string;
  merchant?: string;
  isSubscription?: boolean;
  confidence: number; // 0-1, how confident we are in the parsing
  rawText: string; // original text for manual review
}

export interface ParseResult {
  transactions: ParsedTransaction[];
  bankName?: string;
  accountNumber?: string;
  statementPeriod?: {
    from: string;
    to: string;
  };
  totalTransactions: number;
  errors: string[];
}

// Bank-specific patterns for transaction parsing
export const BANK_PATTERNS = {
  // Chase Bank patterns
  chase: {
    name: 'Chase',
    transactionPattern: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-]?\$?[\d,]+\.?\d{0,2})/gm,
    accountPattern: /Account Number:\s*(\d+)/i,
    periodPattern: /Statement Period:\s*(\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{2}\/\d{2}\/\d{4})/i,
    indicators: ['chase', 'jpmorgan', 'jp morgan'],
  },
  
  // Bank of America patterns
  bofa: {
    name: 'Bank of America',
    transactionPattern: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-]?\$?[\d,]+\.?\d{0,2})/gm,
    accountPattern: /Account Number[:\s]*(\d+)/i,
    periodPattern: /Statement Period[:\s]*(\d{2}\/\d{2}\/\d{4})\s*(?:to|-)?\s*(\d{2}\/\d{2}\/\d{4})/i,
    indicators: ['bank of america', 'bofa', 'bankofamerica'],
  },
  
  // Wells Fargo patterns
  wellsfargo: {
    name: 'Wells Fargo',
    transactionPattern: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-]?\$?[\d,]+\.?\d{0,2})/gm,
    accountPattern: /Account Number[:\s]*(\d+)/i,
    periodPattern: /Statement Period[:\s]*(\d{2}\/\d{2}\/\d{4})\s*(?:to|-)?\s*(\d{2}\/\d{2}\/\d{4})/i,
    indicators: ['wells fargo', 'wellsfargo', 'wf'],
  },
  
  // Citi Bank patterns
  citi: {
    name: 'Citibank',
    transactionPattern: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-]?\$?[\d,]+\.?\d{0,2})/gm,
    accountPattern: /Account Number[:\s]*(\d+)/i,
    periodPattern: /Statement Period[:\s]*(\d{2}\/\d{2}\/\d{4})\s*(?:to|-)?\s*(\d{2}\/\d{2}\/\d{4})/i,
    indicators: ['citibank', 'citi', 'citicorp'],
  },
  
  // Capital One patterns
  capitalone: {
    name: 'Capital One',
    transactionPattern: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-]?\$?[\d,]+\.?\d{0,2})/gm,
    accountPattern: /Account Number[:\s]*(\d+)/i,
    periodPattern: /Statement Period[:\s]*(\d{2}\/\d{2}\/\d{4})\s*(?:to|-)?\s*(\d{2}\/\d{2}\/\d{4})/i,
    indicators: ['capital one', 'capitalone'],
  },
  
  // American Express patterns
  amex: {
    name: 'American Express',
    transactionPattern: /([A-Z][a-z]{2} \d{1,2})\s+([A-Z][a-z]{2} \d{1,2})\s+(.+?)\s+(\d+(?:\.\d{2})?)$/gm,
    accountPattern: /(?:Account|Membership)\s+(?:Number|Ending)[:\s]*(?:\*+)?(\d{4,})/i,
    periodPattern: /(?:Statement\s+)?(?:Period|Closing\s+Date|Date)[:\s]*(\d{1,2}\/\d{1,2}\/\d{2,4})\s*(?:to|-|–)?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})?/i,
    indicators: ['american express', 'amex', 'americanexpress'],
  },
  
  // RBS (Royal Bank of Scotland) patterns - Updated
  rbs: {
    name: 'RBS',
    transactionPattern: /(\d{2}\s+\w{3}\s+\d{2,4})\s+(.+?)\s+([\d,]+\.\d{2})\s*(CR|DR)?/gm,
    accountPattern: /(?:Account|Sort Code)[:\s]*(\d+(?:\s*-\s*\d+)*)/i,
    periodPattern: /(?:Statement\s+)?(?:Period|From)[:\s]*(\d{1,2}\s+\w{3,}\s+\d{2,4})\s*(?:to|-)\s*(\d{1,2}\s+\w{3,}\s+\d{2,4})/i,
    indicators: ['rbs', 'royal bank of scotland', 'royal bank', 'natwest'],
  },
  
  // Starling Bank patterns
  starling: {
    name: 'Starling Bank',
    transactionPattern: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-]?£?[\d,]+\.?\d{0,2})/gm,
    accountPattern: /Account[:\s]*(\d+)/i,
    periodPattern: /Statement\s+(?:from|period)[:\s]*(\d{2}\/\d{2}\/\d{4})\s*(?:to|-)\s*(\d{2}\/\d{2}\/\d{4})/i,
    indicators: ['starling', 'starling bank'],
  },
  
  // Monzo patterns
  monzo: {
    name: 'Monzo',
    transactionPattern: /(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2}:\d{2})?\s*(.+?)\s+([-]?£?[\d,]+\.?\d{0,2})/gm,
    accountPattern: /Account[:\s]*(\d+)/i,
    periodPattern: /(?:Statement\s+)?(?:from|period)[:\s]*(\d{2}\/\d{2}\/\d{4})\s*(?:to|-)\s*(\d{2}\/\d{2}\/\d{4})/i,
    indicators: ['monzo', 'monzo bank'],
  },
  
  // Generic patterns for unknown banks
  generic: {
    name: 'Unknown Bank',
    transactionPattern: /(\d{1,2}[\/\s]\w{3}[\/\s]\d{2,4}|\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+([-]?[£$]?[\d,]+\.?\d{0,2})/gm,
    accountPattern: /(?:Account|Acct)(?:\s+Number)?[:\s]*(\d+)/i,
    periodPattern: /(?:Statement\s+)?Period[:\s]*(\d{1,2}[\/\s]\w{3}[\/\s]\d{2,4}|\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    indicators: [],
  },
};

// Utility functions
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function parseAmount(amountStr: string): number {
  // Remove currency symbols (both $ and £) and convert to number
  const cleanAmount = amountStr.replace(/[£$,\s]/g, '');
  
  // If the amount has no decimal point, treat it as whole pounds/dollars and convert to pence
  if (!cleanAmount.includes('.')) {
    const amount = parseInt(cleanAmount);
    const result = amount * 100;
    return result; // Convert whole pounds to pence (e.g., "5" -> 500 pence)
  }
  
  // If it has decimal points, it's already in pounds/dollars format
  const amount = parseFloat(cleanAmount);
  const result = Math.round(amount * 100);
  return result; // Convert to cents/pence (e.g., "3.00" -> 300 pence)
}

function formatDate(dateStr: string): string {
  // Handle different date formats
  dateStr = dateStr.trim();
  
  // MM/DD/YY format (common in Amex statements)
  if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{2}$/)) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [month, day, year] = parts;
      const fullYear = `20${year}`; // Assume 20xx for 2-digit years
      return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  
  // MM/DD/YYYY or DD/MM/YYYY format
  if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/)) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [first, second, year] = parts;
      const fullYear = year.length === 2 ? `20${year}` : year;
      
      // Assume DD/MM/YYYY for UK banks if day > 12
      if (parseInt(first) > 12) {
        return `${fullYear}-${second.padStart(2, '0')}-${first.padStart(2, '0')}`;
      }
      // Otherwise assume MM/DD/YYYY for US banks
      return `${fullYear}-${first.padStart(2, '0')}-${second.padStart(2, '0')}`;
    }
  }
  
  // DD MMM YYYY format (e.g., "15 May 2025")
  if (dateStr.match(/^\d{1,2}\s+\w{3,}\s+\d{2,4}$/)) {
    const months: Record<string, string> = {
      'jan': '01', 'january': '01',
      'feb': '02', 'february': '02',
      'mar': '03', 'march': '03',
      'apr': '04', 'april': '04',
      'may': '05',
      'jun': '06', 'june': '06',
      'jul': '07', 'july': '07',
      'aug': '08', 'august': '08',
      'sep': '09', 'september': '09',
      'oct': '10', 'october': '10',
      'nov': '11', 'november': '11',
      'dec': '12', 'december': '12'
    };
    
    const parts = dateStr.split(/\s+/);
    if (parts.length === 3) {
      const [day, monthStr, year] = parts;
      const month = months[monthStr.toLowerCase()];
      const fullYear = year.length === 2 ? `20${year}` : year;
      
      if (month) {
        return `${fullYear}-${month}-${day.padStart(2, '0')}`;
      }
    }
  }
  
  // MMM DD format (e.g., "Apr 15") - assume current year
  if (dateStr.match(/^\w{3}\s+\d{1,2}$/)) {
    const months: Record<string, string> = {
      'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
      'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
      'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
    };
    
    const parts = dateStr.split(/\s+/);
    if (parts.length === 2) {
      const [monthStr, day] = parts;
      const month = months[monthStr.toLowerCase()];
      const currentYear = new Date().getFullYear();
      
      if (month) {
        return `${currentYear}-${month}-${day.padStart(2, '0')}`;
      }
    }
  }
  
  return dateStr;
}

export function detectBank(text: string): string {
  const normalizedText = normalizeText(text);
  
  // Check for bank indicators in the first 500 characters
  const headerText = normalizedText.substring(0, 500);
  
  // Check for American Express first (most specific)
  if (headerText.includes('american express') || normalizedText.includes('american express')) {
    return 'amex';
  }
  
  // Check for exact word matches in header
  for (const [bankKey, bank] of Object.entries(BANK_PATTERNS)) {
    if (bankKey === 'generic') continue;
    
    for (const indicator of bank.indicators) {
      // Use word boundaries for more precise matching
      const wordBoundaryRegex = new RegExp(`\\b${indicator.replace(/\s+/g, '\\s+')}\\b`, 'i');
      if (wordBoundaryRegex.test(headerText)) {
        return bankKey;
      }
    }
  }
  
  // Fallback to substring matching for banks that might not have clear word boundaries
  for (const [bankKey, bank] of Object.entries(BANK_PATTERNS)) {
    if (bankKey === 'generic') continue;
    
    for (const indicator of bank.indicators) {
      if (headerText.includes(indicator)) {
        return bankKey;
      }
    }
  }
  
  // Additional bank detection heuristics
  if (normalizedText.includes('starling bank') || normalizedText.includes('starlingbank')) {
    return 'starling';
  }
  
  if (normalizedText.includes('royal bank of scotland') || normalizedText.includes('rbs')) {
    return 'rbs';
  }
  
  return 'generic';
}

/**
 * Any run of digits that is unambiguously money: it has exactly two decimal
 * places.
 *
 * The old per-bank patterns ended in `[\d,]+\.?\d{0,2}`, where the decimal part
 * is optional, so a bare integer matched. Combined with a lazy `(.+?)` for the
 * description, the regex stopped at the first number-shaped token on the line
 * and called it the amount. On a real statement that is the branch number in
 * the merchant name: `TESCO STORES 3421` was read as a GBP 3,421.00 payment,
 * and `WAITROSE AND PARTNERS 12` as GBP 12.00. Requiring the decimals is what
 * separates an amount from a store number.
 */
const MONEY_TOKEN = /-?[£$€]?\s?-?\d[\d,]*\.\d{2}-?(?:\s?(?:CR|DR))?/gi;

/** A leading date in any of the shapes a statement uses. */
const LEADING_DATE =
  /^\s*(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}|\d{4}-\d{2}-\d{2}|\d{1,2}\s+[A-Za-z]{3,9}(?:\s+\d{4})?|[A-Za-z]{3,9}\s+\d{1,2})\b/;

/**
 * Lines that carry a date and an amount but are not transactions.
 *
 * A closing balance line looks exactly like a transaction to a regex, and
 * importing one adds a duplicate of the account's whole value as a single
 * expense.
 */
const SUMMARY_LINE =
  /\b(opening|closing|start(ing)?|end(ing)?|brought forward|carried forward|total|subtotal|balance b\/?f|statement period|available balance|overdraft limit)\b/i;

/** Statement lines that are movements but not spending. */
const NON_SPENDING =
  /\b(pot transfer|active card check|declined|reversal pending)\b/i;

interface MoneyToken {
  cents: number;
  index: number;
  length: number;
}

function findMoneyTokens(line: string): MoneyToken[] {
  const tokens: MoneyToken[] = [];
  MONEY_TOKEN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = MONEY_TOKEN.exec(line)) !== null) {
    const cents = parseMoneyToCents(match[0]);
    if (cents === null) continue;
    tokens.push({ cents, index: match.index, length: match[0].length });
  }
  return tokens;
}

/**
 * Turns the text of a statement into transactions.
 *
 * Rewritten because the per-bank regexes did not work. Run against a real
 * Monzo PDF, the old implementation got every one of the following wrong:
 *
 *   - direction: all fourteen rows came back as `credit`, so a month of
 *     spending was imported as GBP 12,000 of income. Nothing in the old code
 *     ever decided debit versus credit for a PDF at all.
 *   - amounts: `TESCO STORES 3421` was read as GBP 3,421.00, because the
 *     amount pattern accepted a bare integer and the description match was
 *     lazy.
 *   - dates: `01/07/2026` became 7 January, since the day and month were
 *     assumed to be in US order, while `15/07/2026` on the next line stayed
 *     15 July because 15 cannot be a month. One statement, two calendars.
 *
 * What it does instead is read the line the way a person does. Money tokens
 * are the runs with two decimal places. A statement with a running balance
 * column says which way the money went - the balance falls on spending and
 * rises on income - and that is used in preference to anything else, because
 * it is arithmetic rather than a guess about wording. Where there is no
 * balance column, the sign is used; where there is neither, the row is
 * treated as spending, which is what an expense import is for, and the review
 * step is there for the reader to correct it.
 */
export function parseTransactions(
  text: string,
  bankKey: string,
): ParsedTransaction[] {
  const lines = text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  // Day-first or month-first, decided once for the whole document rather than
  // per line, so a statement cannot come out on two different calendars.
  const dateCandidates: string[] = [];
  for (const line of lines) {
    const match = LEADING_DATE.exec(line);
    if (match) dateCandidates.push(match[1]);
  }
  // A US bank is month-first even when its own dates are ambiguous.
  const americanBank = ["chase", "bofa", "wellsfargo", "citi", "capitalone"].includes(
    bankKey,
  );
  const dayFirst = americanBank
    ? detectDayFirstOrDefault(dateCandidates, false)
    : detectDayFirstOrDefault(dateCandidates, true);

  // Whether this statement writes negatives at all, which decides how to read
  // a lone unsigned figure further down.
  const signedDocument = lines.some((line) =>
    findMoneyTokens(line).some((token) => token.cents < 0),
  );

  const transactions: ParsedTransaction[] = [];

  // Seeded from an opening balance where the statement states one, so the very
  // first transaction has something to compare against. Without it the first
  // row has no previous balance and has to fall back to a guess - which is how
  // a GBP 3.99 coffee came back as income on the real Monzo PDF.
  let previousBalance: number | null = openingBalance(lines);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const dateMatch = LEADING_DATE.exec(line);
    if (!dateMatch) continue;
    if (SUMMARY_LINE.test(line)) {
      // Still worth reading the balance off, so the next real row can be
      // compared against it.
      const summaryTokens = findMoneyTokens(line);
      if (summaryTokens.length > 0) {
        previousBalance = summaryTokens[summaryTokens.length - 1].cents;
      }
      continue;
    }

    const tokens = findMoneyTokens(line);
    if (tokens.length === 0) continue;

    const date = normaliseStatementDate(dateMatch[1], { dayFirst });
    if (!date) continue;

    const description = sanitiseStatementText(
      line.slice(dateMatch[0].length, tokens[0].index),
    );
    if (!description || description.length < 2) continue;
    if (NON_SPENDING.test(line)) continue;

    let amountCents: number;
    let isDebit: boolean;

    if (tokens.length >= 2) {
      // Last token is the running balance, the one before it the movement.
      const balance = tokens[tokens.length - 1].cents;
      const movement = tokens[tokens.length - 2].cents;
      amountCents = Math.abs(movement);

      if (previousBalance !== null && balance !== previousBalance) {
        isDebit = balance < previousBalance;
      } else {
        // No opening balance to compare the first row against. Use the sign if
        // the statement writes signs, otherwise read it as spending, which is
        // what an expense import is for.
        isDebit = signedDocument ? movement < 0 : true;
      }
      previousBalance = balance;
    } else {
      // One figure and no balance column. If the document uses signs at all
      // then the sign means something and negative is money out; if it never
      // does, the figure says nothing about direction and spending is the safe
      // reading for an expense import, with the review step to correct it.
      amountCents = Math.abs(tokens[0].cents);
      isDebit = signedDocument ? tokens[0].cents < 0 : true;
    }

    if (amountCents === 0) continue;

    const classification = classifyTransaction(
      description,
      amountCents,
      isDebit ? "debit" : "credit",
    );

    transactions.push({
      id: `pdf-${i + 1}`,
      date,
      description,
      amount: amountCents,
      type: isDebit ? "debit" : "credit",
      category: classification.category,
      merchant: classification.merchant?.name,
      isSubscription: classification.isSubscription,
      confidence: classification.confidence,
      rawText: sanitiseStatementText(line),
    });
  }

  return transactions;
}

/**
 * The opening balance, if the statement states one.
 *
 * Matched on its own rather than through the transaction path because the line
 * usually carries no date, so nothing else would pick it up.
 */
function openingBalance(lines: string[]): number | null {
  for (const line of lines) {
    if (!/\b(opening balance|balance brought forward|balance b\/?f|previous balance|start(ing)? balance)\b/i.test(line)) {
      continue;
    }
    const tokens = findMoneyTokens(line);
    if (tokens.length > 0) return tokens[tokens.length - 1].cents;
  }
  return null;
}

/** `detectDayFirst`, but with the fallback the caller chooses. */
function detectDayFirstOrDefault(
  dateCells: string[],
  fallback: boolean,
): boolean {
  for (const cell of dateCells) {
    const match = cell.trim().match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.]\d{2,4}$/);
    if (!match) continue;
    const first = Number(match[1]);
    const second = Number(match[2]);
    if (first > 12 && second <= 12) return true;
    if (second > 12 && first <= 12) return false;
  }
  return fallback;
}

export function extractMetadata(text: string, bankKey: string): {
  accountNumber?: string;
  statementPeriod?: {
    from: string;
    to: string;
  };
} {
  const bank = BANK_PATTERNS[bankKey as keyof typeof BANK_PATTERNS];
  const metadata: {
    accountNumber?: string;
    statementPeriod?: {
      from: string;
      to: string;
    };
  } = {};
  
  // Extract account number
  const accountMatch = text.match(bank.accountPattern);
  if (accountMatch) {
    metadata.accountNumber = accountMatch[1];
  }
  
  // Extract statement period
  const periodMatch = text.match(bank.periodPattern);
  if (periodMatch) {
    metadata.statementPeriod = {
      from: formatDate(periodMatch[1]),
      to: formatDate(periodMatch[2]),
    };
  }
  
  return metadata;
}

