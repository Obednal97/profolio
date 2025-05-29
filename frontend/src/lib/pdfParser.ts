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
    periodPattern: /(?:Statement\s+)?Period[:\s]*(\d{1,2}[\/\s]\w{3}[\/\s]\d{2,4}|\d{1,2}\/\d{1,2}\/\d{2,4})\s*(?:to|-)?\s*(\d{1,2}[\/\s]\w{3}[\/\s]\d{2,4}|\d{1,2}\/\d{1,2}\/\d{2,4})/i,
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
  // Handle different date formats
  dateStr = dateStr.trim();
  
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
  
  return dateStr;
}

function detectBank(text: string): string {
  const normalizedText = normalizeText(text);
  
  // Check for bank indicators in the first 500 characters
  const headerText = normalizedText.substring(0, 500);
  
  for (const [bankKey, bank] of Object.entries(BANK_PATTERNS)) {
    if (bankKey === 'generic') continue;
    
    for (const indicator of bank.indicators) {
      if (headerText.includes(indicator) || normalizedText.includes(indicator)) {
        console.log(`Detected bank: ${bank.name} (matched: ${indicator})`);
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