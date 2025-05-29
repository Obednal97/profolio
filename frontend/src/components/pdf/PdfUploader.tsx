'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { parseBankStatementPDF, ParseResult, ParsedTransaction } from '@/lib/pdfParser';

interface FileUploaderProps {
  onParsed: (result: ParseResult) => void;
  onError: (error: string) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onParsed, onError }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const parseCSV = async (file: File): Promise<ParseResult> => {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('CSV file appears to be empty or invalid');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const transactions: ParsedTransaction[] = [];
    
    console.log('CSV headers:', headers);
    
    // Map headers to indices (handle different CSV formats)
    const dateIndex = headers.findIndex(h => h.includes('date') || h.includes('time'));
    const typeIndex = headers.findIndex(h => h.includes('type') || h.includes('transaction type'));
    const nameIndex = headers.findIndex(h => h.includes('name') || h.includes('description') || h.includes('merchant'));
    const moneyOutIndex = headers.findIndex(h => h.includes('money out') || h.includes('debit') || h.includes('amount out'));
    const moneyInIndex = headers.findIndex(h => h.includes('money in') || h.includes('credit') || h.includes('amount in'));
    const amountIndex = headers.findIndex(h => h.includes('amount') && !h.includes('out') && !h.includes('in'));

    console.log('Column indices:', { dateIndex, nameIndex, moneyOutIndex, moneyInIndex, amountIndex });

    for (let i = 1; i < lines.length; i++) {
      // Handle CSV with potential quoted values
      const values = lines[i].match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
      const cleanValues = values.map(v => v.trim().replace(/^"|"$/g, ''));
      
      if (cleanValues.length < headers.length - 1) continue; // Skip incomplete rows

      try {
        const dateStr = cleanValues[dateIndex] || '';
        const type = cleanValues[typeIndex] || '';
        const name = cleanValues[nameIndex] || '';
        
        // Determine amount and type
        let transactionAmount = 0;
        let isDebit = true;
        
        if (moneyOutIndex >= 0 && moneyInIndex >= 0) {
          // Separate debit/credit columns (Monzo style)
          const moneyOut = parseFloat(cleanValues[moneyOutIndex] || '0');
          const moneyIn = parseFloat(cleanValues[moneyInIndex] || '0');
          
          if (moneyOut > 0) {
            transactionAmount = moneyOut * 100;
            isDebit = true;
          } else if (moneyIn > 0) {
            transactionAmount = moneyIn * 100;
            isDebit = false;
          }
        } else if (amountIndex >= 0) {
          // Single amount column (positive/negative)
          const amount = parseFloat(cleanValues[amountIndex] || '0');
          transactionAmount = Math.abs(amount) * 100;
          isDebit = amount < 0;
        }

        // Skip pot transfers and other non-spending transactions
        if (type.toLowerCase().includes('pot transfer') || 
            type.toLowerCase().includes('active card check') ||
            transactionAmount === 0) {
          continue;
        }

        if (name) {
          // Use the classifier for better categorization
          const { classifyTransaction } = await import('@/lib/transactionClassifier');
          const classification = classifyTransaction(name, transactionAmount, isDebit ? 'debit' : 'credit');
          
          const transaction: ParsedTransaction = {
            id: `csv_${Date.now()}_${i}`,
            date: formatDateFromCSV(dateStr),
            description: name,
            amount: transactionAmount,
            type: isDebit ? 'debit' : 'credit',
            category: classification.category,
            merchant: classification.merchant?.name,
            isSubscription: classification.isSubscription,
            confidence: 0.9, // High confidence for CSV data
            rawText: lines[i],
          };
          
          transactions.push(transaction);
        }
      } catch (error) {
        console.warn('Failed to parse CSV line:', lines[i], error);
      }
    }

    console.log(`Parsed ${transactions.length} transactions from CSV`);

    return {
      transactions,
      bankName: 'CSV Import',
      totalTransactions: transactions.length,
      errors: transactions.length === 0 ? ['No valid transactions found in CSV'] : [],
    };
  };

  const formatDateFromCSV = (dateStr: string): string => {
    // Handle DD/MM/YYYY format (UK)
    if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Handle ISO format YYYY-MM-DD
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
      return dateStr.split('T')[0]; // Remove time if present
    }
    
    return dateStr;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    
    if (!file) return;

    // Validate file type
    const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');
    const isPDF = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    
    if (!isCSV && !isPDF) {
      onError('Please upload a PDF or CSV file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      onError('File must be smaller than 10MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Parse the file based on type
      let result: ParseResult;
      
      if (isCSV) {
        result = await parseCSV(file);
      } else {
        result = await parseBankStatementPDF(file);
      }
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Delay to show completion
      setTimeout(() => {
        if (result.errors.length > 0 && result.transactions.length === 0) {
          onError(result.errors[0]);
        } else {
          onParsed(result);
        }
        setUploading(false);
        setUploadProgress(0);
      }, 500);

    } catch (error) {
      setUploading(false);
      setUploadProgress(0);
      onError(error instanceof Error ? error.message : 'Failed to parse file');
    }
  }, [onParsed, onError]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv']
    },
    multiple: false,
    disabled: uploading,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-500/10' 
            : isDragReject
            ? 'border-red-400 bg-red-50 dark:bg-red-500/10'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${uploading ? 'pointer-events-none opacity-75' : ''}
        `}
      >
        <motion.div
          whileHover={{ scale: uploading ? 1 : 1.02 }}
          whileTap={{ scale: uploading ? 1 : 0.98 }}
        >
          <input {...getInputProps()} />
          
          <AnimatePresence mode="wait">
            {uploading ? (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="w-16 h-16 mx-auto mb-4">
                  <div className="relative w-full h-full">
                    <svg
                      className="w-full h-full animate-spin text-blue-500"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <i className="fas fa-file text-gray-500 text-lg"></i>
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Processing File...
                  </p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                      className="bg-blue-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {uploadProgress}% complete
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="w-16 h-16 mx-auto mb-4">
                  <i className="fas fa-cloud-upload-alt text-4xl text-gray-400"></i>
                </div>
                
                {isDragActive ? (
                  <div>
                    <p className="text-lg font-medium text-blue-600 dark:text-blue-400 mb-2">
                      Drop your file here
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      We&apos;ll automatically extract transactions
                    </p>
                  </div>
                ) : isDragReject ? (
                  <div>
                    <p className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
                      Invalid file type
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Please upload a PDF or CSV file
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Upload Bank Statement
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Drag and drop your file here, or click to browse
                    </p>
                    
                    <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                      <p>• PDF: Chase, Bank of America, Wells Fargo, Citi, Capital One, American Express, RBS, Monzo</p>
                      <p>• CSV: Monzo export format</p>
                      <p>• Maximum file size: 10MB</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default FileUploader; 