/**
 * Reading a bank statement PDF.
 *
 * This file is browser-only: pdf.js reaches for DOM globals as it loads. It
 * does the text extraction and nothing else - the parsing lives in
 * `statementTextParser.ts` so that it can be tested without a browser.
 */

import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import {
  BANK_PATTERNS,
  detectBank,
  extractMetadata,
  parseTransactions,
} from './statementTextParser';
import { detectRecurringTransactions } from './transactionClassifier';

export type { ParsedTransaction, ParseResult } from './statementTextParser';
export {
  detectBank,
  parseAmount,
  parseTransactions,
} from './statementTextParser';

import type { ParsedTransaction, ParseResult } from './statementTextParser';

/**
 * Where the worker lives.
 *
 * `.mjs`, because pdfjs-dist 5 ships the worker as an ES module and pdf.js
 * loads it as a module worker. It is copied out of node_modules by
 * scripts/copy-pdf-worker.mjs on install and before every build, so the worker
 * and the library cannot disagree: pdf.js throws `The API version "X" does not
 * match the Worker version "Y"` when they do, and they did - a hand-committed
 * public/pdf.worker.min.js was 5.2.133 against a 5.4.149 library, so every PDF
 * upload failed before it parsed a single line.
 */
const WORKER_SRC = '/pdf.worker.min.mjs';

if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_SRC;
}

// Main parsing function
export async function parseBankStatementPDF(file: File): Promise<ParseResult> {
  // Prevent execution during SSR
  if (typeof window === 'undefined') {
    throw new Error('PDF parsing is only available in browser environment');
  }

  // Ensure PDF.js worker is configured
  if (pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_SRC;
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
    
    // The extracted text and a 500 character sample of it used to be logged
    // here. That is the contents of somebody's bank statement going into the
    // browser console, where an extension or a screen share picks it up, and
    // in an application whose whole premise is keeping financial data private.
    
    // Preprocess text to join amounts that are on separate lines (Amex issue)
    if (text.toLowerCase().includes('american express')) {
      // Join amounts that are on their own line back to the previous line
      text = text.replace(/\n(\d+\.\d{2})/g, ' $1');
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
      // Log some text to help debug
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
