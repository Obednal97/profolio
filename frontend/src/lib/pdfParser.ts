import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import { classifyTransaction, detectRecurringTransactions } from './transactionClassifier';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

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
const BANK_PATTERNS = {
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
  
  // RBS (Royal Bank of Scotland) patterns
  rbs: {
    name: 'RBS',
    transactionPattern: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-]?£?[\d,]+\.?\d{0,2})/gm,
    accountPattern: /Account[:\s]*(\d+)/i,
    periodPattern: /(?:Statement\s+)?Period[:\s]*(\d{2}\/\d{2}\/\d{4})\s*(?:to|-)\s*(\d{2}\/\d{2}\/\d{4})/i,
    indicators: ['rbs', 'royal bank of scotland', 'natwest'],
  },
  
  // Monzo patterns
  monzo: {
    name: 'Monzo',
    transactionPattern: /(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2}:\d{2})\s+(.+?)\s+([-]?£?[\d,]+\.?\d{0,2})/gm,
    accountPattern: /Account[:\s]*(\d+)/i,
    periodPattern: /(?:Statement\s+)?(?:from|period)[:\s]*(\d{2}\/\d{2}\/\d{4})\s*(?:to|-)\s*(\d{2}\/\d{2}\/\d{4})/i,
    indicators: ['monzo', 'monzo bank'],
  },
  
  // Generic patterns for unknown banks
  generic: {
    name: 'Unknown Bank',
    transactionPattern: /(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+([-]?[£$]?[\d,]+\.?\d{0,2})/gm,
    accountPattern: /(?:Account|Acct)(?:\s+Number)?[:\s]*(\d+)/i,
    periodPattern: /(?:Statement\s+)?Period[:\s]*(\d{1,2}\/\d{1,2}\/\d{2,4})\s*(?:to|-)?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    indicators: [],
  },
};

// Utility functions
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseAmount(amountStr: string): number {
  // Remove currency symbols (both $ and £) and convert to number
  const cleanAmount = amountStr.replace(/[£$,\s]/g, '');
  const amount = parseFloat(cleanAmount);
  return Math.round(amount * 100); // Convert to cents/pence
}

function formatDate(dateStr: string): string {
  // Convert MM/DD/YYYY to YYYY-MM-DD
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [month, day, year] = parts;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateStr;
}

function detectBank(text: string): string {
  const normalizedText = normalizeText(text);
  
  for (const [bankKey, bank] of Object.entries(BANK_PATTERNS)) {
    if (bankKey === 'generic') continue;
    
    for (const indicator of bank.indicators) {
      if (normalizedText.includes(indicator)) {
        return bankKey;
      }
    }
  }
  
  return 'generic';
}

function parseTransactions(text: string, bankKey: string): ParsedTransaction[] {
  const bank = BANK_PATTERNS[bankKey as keyof typeof BANK_PATTERNS];
  const transactions: ParsedTransaction[] = [];
  
  let match;
  while ((match = bank.transactionPattern.exec(text)) !== null) {
    let dateStr, description, amountStr, fullMatch;
    
    if (bankKey === 'monzo') {
      // Monzo format: date, time, description, amount
      [fullMatch, dateStr, , description, amountStr] = match;
    } else {
      // Standard format: date, description, amount
      [fullMatch, dateStr, description, amountStr] = match;
    }
    
    // Skip if this looks like a header or total line
    if (normalizeText(description).includes('total') || 
        normalizeText(description).includes('balance') ||
        normalizeText(description).includes('statement') ||
        normalizeText(description).includes('opening') ||
        normalizeText(description).includes('closing')) {
      continue;
    }
    
    try {
      const amount = parseAmount(amountStr);
      const isDebit = amountStr.includes('-') || amount < 0;
      const type = isDebit ? 'debit' : 'credit';
      
      // Use advanced classification
      const classification = classifyTransaction(description, Math.abs(amount), type);
      
      const transaction: ParsedTransaction = {
        id: `${Date.now()}_${transactions.length}`,
        date: formatDate(dateStr),
        description: description.trim(),
        amount: Math.abs(amount),
        type,
        category: classification.category,
        merchant: classification.merchant?.name,
        isSubscription: classification.isSubscription,
        confidence: classification.confidence,
        rawText: fullMatch.trim(),
      };
      
      transactions.push(transaction);
    } catch (error) {
      console.warn('Failed to parse transaction:', fullMatch, error);
    }
  }
  
  return transactions;
}

function extractMetadata(text: string, bankKey: string): {
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

// Main parsing function
export async function parseBankStatementPDF(file: File): Promise<ParseResult> {
  try {
    // Extract text from PDF
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    
    let text = '';
    
    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => (item as TextItem).str)
        .join(' ');
      text += pageText + '\n';
    }
    
    if (!text || text.length < 100) {
      throw new Error('PDF appears to be empty or contains no readable text');
    }
    
    // Detect bank
    const bankKey = detectBank(text);
    const bankName = BANK_PATTERNS[bankKey as keyof typeof BANK_PATTERNS].name;
    
    // Parse transactions
    const transactions = parseTransactions(text, bankKey);
    
    if (transactions.length === 0) {
      throw new Error('No transactions found in the PDF. Please check the format.');
    }
    
    // Detect recurring transactions
    const recurringPatterns = detectRecurringTransactions(transactions);
    
    // Update transactions with recurring info
    transactions.forEach(transaction => {
      const key = `${transaction.description.toLowerCase().slice(0, 20)}_${Math.round(transaction.amount / 100)}`;
      const recurringInfo = recurringPatterns.get(key);
      if (recurringInfo && recurringInfo.confidence > 0.7) {
        transaction.isSubscription = true;
      }
    });
    
    // Extract metadata
    const metadata = extractMetadata(text, bankKey);
    
    // Sort transactions by date (newest first)
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const result: ParseResult = {
      transactions,
      bankName,
      accountNumber: metadata.accountNumber,
      statementPeriod: metadata.statementPeriod,
      totalTransactions: transactions.length,
      errors: [],
    };
    
    // Add warnings for low confidence transactions
    const lowConfidenceCount = transactions.filter(t => t.confidence < 0.7).length;
    if (lowConfidenceCount > 0) {
      result.errors.push(`${lowConfidenceCount} transactions have low confidence and may need manual review`);
    }
    
    return result;
    
  } catch (error) {
    console.error('PDF parsing error:', error);
    
    return {
      transactions: [],
      totalTransactions: 0,
      errors: [error instanceof Error ? error.message : 'Failed to parse PDF'],
    };
  }
}

// Helper function to validate parsed transactions
export function validateTransactions(transactions: ParsedTransaction[]): {
  valid: ParsedTransaction[];
  invalid: ParsedTransaction[];
} {
  const valid: ParsedTransaction[] = [];
  const invalid: ParsedTransaction[] = [];
  
  for (const transaction of transactions) {
    if (
      transaction.date &&
      transaction.description &&
      transaction.amount > 0 &&
      transaction.confidence > 0.5
    ) {
      valid.push(transaction);
    } else {
      invalid.push(transaction);
    }
  }
  
  return { valid, invalid };
} 