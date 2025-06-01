import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import { classifyTransaction, detectRecurringTransactions } from './transactionClassifier';

// Configure PDF.js worker only in browser environment
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

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

function parseAmount(amountStr: string): number {
  // Remove currency symbols (both $ and £) and convert to number
  const cleanAmount = amountStr.replace(/[£$,\s]/g, '');
  
  // If the amount has no decimal point, treat it as whole pounds/dollars and convert to pence
  if (!cleanAmount.includes('.')) {
    const amount = parseInt(cleanAmount);
    const result = amount * 100;
    console.log(`Parsing integer amount: "${amountStr}" -> "${cleanAmount}" -> ${amount} -> ${result} pence`);
    return result; // Convert whole pounds to pence (e.g., "5" -> 500 pence)
  }
  
  // If it has decimal points, it's already in pounds/dollars format
  const amount = parseFloat(cleanAmount);
  const result = Math.round(amount * 100);
  console.log(`Parsing decimal amount: "${amountStr}" -> "${cleanAmount}" -> ${amount} -> ${result} pence`);
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

function detectBank(text: string): string {
  const normalizedText = normalizeText(text);
  
  // Check for bank indicators in the first 500 characters
  const headerText = normalizedText.substring(0, 500);
  
  // Check for American Express first (most specific)
  if (headerText.includes('american express') || normalizedText.includes('american express')) {
    console.log('Detected bank: American Express (header match)');
    return 'amex';
  }
  
  // Check for exact word matches in header
  for (const [bankKey, bank] of Object.entries(BANK_PATTERNS)) {
    if (bankKey === 'generic') continue;
    
    for (const indicator of bank.indicators) {
      // Use word boundaries for more precise matching
      const wordBoundaryRegex = new RegExp(`\\b${indicator.replace(/\s+/g, '\\s+')}\\b`, 'i');
      if (wordBoundaryRegex.test(headerText)) {
        console.log(`Detected bank: ${bank.name} (word boundary match: ${indicator})`);
        return bankKey;
      }
    }
  }
  
  // Fallback to substring matching for banks that might not have clear word boundaries
  for (const [bankKey, bank] of Object.entries(BANK_PATTERNS)) {
    if (bankKey === 'generic') continue;
    
    for (const indicator of bank.indicators) {
      if (headerText.includes(indicator)) {
        console.log(`Detected bank: ${bank.name} (substring match: ${indicator})`);
        return bankKey;
      }
    }
  }
  
  // Additional bank detection heuristics
  if (normalizedText.includes('starling bank') || normalizedText.includes('starlingbank')) {
    console.log('Detected bank: Starling (heuristic)');
    return 'starling';
  }
  
  if (normalizedText.includes('royal bank of scotland') || normalizedText.includes('rbs')) {
    console.log('Detected bank: RBS (heuristic)');
    return 'rbs';
  }
  
  console.log('Could not detect bank, using generic patterns');
  return 'generic';
}

function parseTransactions(text: string, bankKey: string): ParsedTransaction[] {
  const bank = BANK_PATTERNS[bankKey as keyof typeof BANK_PATTERNS];
  const transactions: ParsedTransaction[] = [];
  
  console.log(`Parsing transactions for ${bankKey} bank with pattern:`, bank.transactionPattern);
  
  // For RBS, try multiple patterns
  if (bankKey === 'rbs') {
    // Pattern 1: Standard RBS format with CR/DR
    const pattern1 = /(\d{2}\s+\w{3}\s+\d{2,4})\s+(.+?)\s+([\d,]+\.\d{2})\s*(CR|DR)?/gm;
    // Pattern 2: More flexible for descriptions with multiple spaces
    const pattern2 = /(\d{2}\s+\w{3})\s+(.+?)\s{2,}([\d,]+\.\d{2})/gm;
    // Pattern 3: Even more flexible
    const pattern3 = /(\d{2}\s+\w{3})\s+(\S.+?)\s+([\d,]+\.\d{2})(?:\s+(CR|DR))?/gm;
    
    const patterns = [pattern1, pattern2, pattern3];
    
    for (const pattern of patterns) {
      console.log('Trying RBS pattern...');
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const [fullMatch, dateStr, description, amountStr, crdrIndicator] = match;
        
        // Skip headers and totals
        if (description.match(/balance|total|statement|opening|closing|forward/i)) {
          continue;
        }
        
        try {
          const amount = parseAmount(amountStr);
          if (amount === 0 || isNaN(amount)) continue;
          
          const isDebit = crdrIndicator ? crdrIndicator === 'DR' : !description.includes('CREDIT');
          const type = isDebit ? 'debit' : 'credit';
          
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
          
          // Check for duplicates
          const isDuplicate = transactions.some(t => 
            t.date === transaction.date && 
            t.amount === transaction.amount && 
            t.description.substring(0, 20) === transaction.description.substring(0, 20)
          );
          
          if (!isDuplicate) {
            transactions.push(transaction);
          }
        } catch (error) {
          console.warn('Failed to parse RBS transaction:', error);
        }
      }
    }
    
    console.log(`Found ${transactions.length} RBS transactions`);
    return transactions;
  }
  
  // For Starling, try specific patterns
  if (bankKey === 'starling') {
    // Pattern 1: DD/MM/YYYY Description Amount
    const pattern1 = /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-]?£?[\d,]+\.\d{2})/gm;
    // Pattern 2: More flexible
    const pattern2 = /(\d{2}\/\d{2}\/\d{4})\s+(\S.+?)\s+([-]?[\d,]+\.\d{2})/gm;
    
    const patterns = [pattern1, pattern2];
    
    for (const pattern of patterns) {
      console.log('Trying Starling pattern...');
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const [fullMatch, dateStr, description, amountStr] = match;
        
        // Skip headers and totals
        if (description.match(/balance|total|statement|opening|closing/i)) {
          continue;
        }
        
        try {
          const amount = parseAmount(amountStr);
          if (amount === 0 || isNaN(amount)) continue;
          
          const isDebit = amountStr.includes('-') || !description.includes('CREDIT');
          const type = isDebit ? 'debit' : 'credit';
          
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
          
          // Check for duplicates
          const isDuplicate = transactions.some(t => 
            t.date === transaction.date && 
            t.amount === transaction.amount && 
            t.description.substring(0, 20) === transaction.description.substring(0, 20)
          );
          
          if (!isDuplicate) {
            transactions.push(transaction);
          }
        } catch (error) {
          console.warn('Failed to parse Starling transaction:', error);
        }
      }
    }
    
    console.log(`Found ${transactions.length} Starling transactions`);
    return transactions;
  }
  
  // For American Express, try specific patterns
  if (bankKey === 'amex') {
    console.log('Parsing American Express statement...');
    
    // More flexible patterns based on actual PDF text extraction
    const patterns = [
      // Pattern 1: Corrected Amex format with both dates (handles both decimal and integer amounts)
      /([A-Z][a-z]{2} \d{1,2})\s+([A-Z][a-z]{2} \d{1,2})\s+(.+?)\s+(\d+(?:\.\d{2})?)$/gm,
      
      // Pattern 2: Single date format (fallback)
      /([A-Z][a-z]{2} \d{1,2})\s+(.+?)\s+(\d+(?:\.\d{2})?)$/gm,
      
      // Pattern 3: Very flexible - any amount of whitespace
      /([A-Z][a-z]{2} \d{1,2})\s+([A-Z][a-z]{2} \d{1,2})\s+(.+?)\s+(\d+(?:\.\d{2})?)\s*$/gm,
    ];
    
    for (const [patternIndex, pattern] of patterns.entries()) {
      console.log(`Trying Amex pattern ${patternIndex + 1}...`);
      
      let match;
      let patternMatches = 0;
      
      while ((match = pattern.exec(text)) !== null) {
        patternMatches++;
        
        let transactionDate, description, amountStr;
        
        if (match.length === 5) {
          // Full format with both dates
          [, transactionDate, , description, amountStr] = match;
        } else if (match.length === 4) {
          // Simplified format with single date
          [, transactionDate, description, amountStr] = match;
        } else if (match.length === 3) {
          // Very simple format: description and amount only
          [, description, amountStr] = match;
          transactionDate = 'Apr 15'; // Default date for now
        } else {
          continue;
        }
        
        const fullMatch = match[0];
        console.log(`Pattern ${patternIndex + 1} matched:`, fullMatch);
        
        // Clean up description by removing extra whitespace and URLs
        let cleanDescription = description.trim().replace(/\s+/g, ' ');
        
        // Remove common URL patterns and location suffixes from description
        cleanDescription = cleanDescription.replace(/\s+[A-Z]+\.[A-Z]+\.[A-Z]+\/.*$/, '').trim();
        cleanDescription = cleanDescription.replace(/\s+WWW\..*$/, '').trim();
        cleanDescription = cleanDescription.replace(/\s+[A-Z]+\s*$/, '').trim(); // Remove trailing location codes
        
        // Skip if description is too short or looks like a header
        if (cleanDescription.length < 3) {
          console.log('Skipping short description:', cleanDescription);
          continue;
        }
        
        // Skip headers and summary lines (more comprehensive)
        if (cleanDescription.match(/balance|total|payment|thank you|previous balance|new balance|minimum|credit limit|available credit|finance charge|membership|annual fee|summary|statement|page|prepared for|account|closing date|direct debit|cardholder|section|continued|transaction date|process date|transaction details|foreign spend|amount|new spend|total new spend/i)) {
          console.log('Skipping header/summary line:', cleanDescription);
          continue;
        }
        
        try {
          const amount = parseAmount(amountStr);
          if (amount === 0 || isNaN(amount)) {
            console.log('Skipping zero/invalid amount:', amountStr);
            continue;
          }
          
          // For Amex, most transactions are debits (purchases)
          // Credits are usually payments, refunds, or credits
          const isCredit = cleanDescription.toUpperCase().includes('PAYMENT') || 
                          cleanDescription.toUpperCase().includes('CREDIT') || 
                          cleanDescription.toUpperCase().includes('REFUND') ||
                          cleanDescription.toUpperCase().includes('CASHBACK') ||
                          cleanDescription.toUpperCase().includes('THANK YOU') ||
                          fullMatch.includes('CR');
          const type = isCredit ? 'credit' : 'debit';
          
          const classification = classifyTransaction(cleanDescription, Math.abs(amount), type);
          
          const transaction: ParsedTransaction = {
            id: `${Date.now()}_${transactions.length}`,
            date: formatDate(transactionDate), // Use transaction date
            description: cleanDescription,
            amount: Math.abs(amount),
            type,
            category: classification.category,
            merchant: classification.merchant?.name,
            isSubscription: classification.isSubscription,
            confidence: classification.confidence * (patternIndex === 0 ? 1.0 : 0.9 - (patternIndex * 0.1)), // Lower confidence for fallback patterns
            rawText: fullMatch.trim(),
          };
          
          // Check for duplicates
          const isDuplicate = transactions.some(t => 
            t.date === transaction.date && 
            t.amount === transaction.amount && 
            t.description.substring(0, 15) === transaction.description.substring(0, 15)
          );
          
          if (!isDuplicate) {
            transactions.push(transaction);
            console.log('Added Amex transaction:', transaction);
          } else {
            console.log('Skipping duplicate transaction');
          }
        } catch (error) {
          console.warn('Failed to parse Amex transaction:', error);
        }
      }
      
      console.log(`Pattern ${patternIndex + 1} found ${patternMatches} matches`);
      
      // If we found transactions with this pattern, we can stop trying others
      if (transactions.length > 0) {
        console.log(`Successfully parsed ${transactions.length} transactions with pattern ${patternIndex + 1}`);
        break;
      }
      
    }
    
    console.log(`Total Amex transactions found: ${transactions.length}`);
    
    return transactions;
  }
  
  // Original parsing logic for other banks
  let match;
  let matchCount = 0;
  while ((match = bank.transactionPattern.exec(text)) !== null) {
    matchCount++;
    let dateStr, description, amountStr, fullMatch;
    
    if (bankKey === 'monzo') {
      // Monzo format: date, optional time, description, amount
      const [full, date, , desc, amount] = match;
      fullMatch = full;
      dateStr = date;
      description = desc;
      amountStr = amount;
    } else {
      // Standard format: date, description, amount
      [fullMatch, dateStr, description, amountStr] = match;
    }
    
    // Skip if this looks like a header or total line
    const skipKeywords = ['total', 'balance', 'statement', 'opening', 'closing', 'brought forward', 'carried forward'];
    if (skipKeywords.some(keyword => normalizeText(description).includes(keyword))) {
      continue;
    }
    
    try {
      const amount = parseAmount(amountStr);
      
      // Determine debit/credit
      const isDebit = amountStr.includes('-');
      
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
  
  console.log(`Regex matched ${matchCount} times, parsed ${transactions.length} transactions`);
  
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
  // Prevent execution during SSR
  if (typeof window === 'undefined') {
    throw new Error('PDF parsing is only available in browser environment');
  }

  // Ensure PDF.js worker is configured
  if (pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  }

  try {
    // Extract text from PDF
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    
    let text = '';
    
    // Extract text from all pages with better formatting
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Group text items by Y position to preserve line structure
      const textByLine = new Map<number, Array<{str: string, x: number}>>();
      
      textContent.items.forEach((item) => {
        const textItem = item as TextItem;
        // Round Y position to group items on the same line
        const y = Math.round(textItem.transform[5]);
        const x = textItem.transform[4];
        
        if (!textByLine.has(y)) {
          textByLine.set(y, []);
        }
        textByLine.get(y)!.push({ str: textItem.str, x });
      });
      
      // Sort lines by Y position (top to bottom)
      const sortedLines = Array.from(textByLine.entries())
        .sort((a, b) => b[0] - a[0]); // PDF Y coordinates are bottom-up
      
      // Reconstruct text preserving line structure
      for (const [, items] of sortedLines) {
        // Sort items by X position (left to right)
        items.sort((a, b) => a.x - b.x);
        
        // Join items with appropriate spacing
        let lineText = '';
        let lastX = 0;
        items.forEach(item => {
          // Add space if there's a gap between items
          if (lastX > 0 && item.x - lastX > 10) {
            lineText += '  '; // Add extra space for column separation
          }
          lineText += item.str;
          lastX = item.x + item.str.length * 5; // Approximate width
        });
        
        text += lineText + '\n';
      }
      
      text += '\n--- PAGE BREAK ---\n';
    }
    
    console.log('Extracted text preview (first 1000 chars):', text.substring(0, 1000));
    console.log('Total text length:', text.length);
    
    // Preprocess text to join amounts that are on separate lines (Amex issue)
    if (text.toLowerCase().includes('american express')) {
      console.log('Preprocessing Amex text to join split amounts...');
      // Join amounts that are on their own line back to the previous line
      text = text.replace(/\n(\d+\.\d{2})/g, ' $1');
      console.log('Text after preprocessing length:', text.length);
    }
    
    if (!text || text.length < 100) {
      throw new Error('PDF appears to be empty or contains no readable text');
    }
    
    // Detect bank
    const bankKey = detectBank(text);
    const bankName = BANK_PATTERNS[bankKey as keyof typeof BANK_PATTERNS].name;
    
    console.log('Detected bank:', bankName);
    
    // Parse transactions
    const transactions = parseTransactions(text, bankKey);
    
    console.log('Found transactions:', transactions.length);
    
    if (transactions.length === 0) {
      // Log some text to help debug
      console.log('No transactions found. Text sample:', text.substring(0, 500));
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