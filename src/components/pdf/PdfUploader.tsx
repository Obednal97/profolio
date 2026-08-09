"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  parseBankStatementPDF,
  ParseResult,
  ParsedTransaction,
} from "@/lib/pdfParser";

interface FileUploaderProps {
  onParsed: (result: ParseResult) => void;
  onError: (error: string) => void;
}

// SECURITY: Enhanced input sanitization
const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== "string") return "";

  // Remove potential XSS vectors and control characters
  return input
    .replace(/[<>'"&]/g, "") // Remove HTML/script injection chars
    .replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/data:/gi, "") // Remove data: protocol
    .trim()
    .slice(0, 500); // Limit length to prevent buffer overflow
};

// SECURITY: Enhanced file validation
const validateFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file existence
  if (!file) {
    return { isValid: false, error: "No file provided" };
  }

  // SECURITY: Check file size limits (min 1KB, max 10MB)
  if (file.size < 1024) {
    return { isValid: false, error: "File too small - minimum 1KB required" };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { isValid: false, error: "File too large - maximum 10MB allowed" };
  }

  // SECURITY: Enhanced file type validation
  const fileName = file.name.toLowerCase();
  const isCSV = file.type === "text/csv" || fileName.endsWith(".csv");
  const isPDF = file.type === "application/pdf" || fileName.endsWith(".pdf");

  if (!isCSV && !isPDF) {
    return {
      isValid: false,
      error: "Invalid file type - only PDF and CSV files are allowed",
    };
  }

  // SECURITY: Check for suspicious file patterns
  const suspiciousPatterns = [
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.scr$/i,
    /\.com$/i,
    /\.pif$/i,
    /\.js$/i,
    /\.vbs$/i,
    /\.jar$/i,
    /\.php$/i,
  ];

  if (suspiciousPatterns.some((pattern) => pattern.test(fileName))) {
    return {
      isValid: false,
      error: "File type not permitted for security reasons",
    };
  }

  // SECURITY: Validate file name length and characters
  if (fileName.length > 255 || !/^[a-zA-Z0-9\.\-_\s]+$/.test(fileName)) {
    return {
      isValid: false,
      error:
        "Invalid file name - only alphanumeric characters, dots, dashes, and spaces allowed",
    };
  }

  return { isValid: true };
};

const FileUploader: React.FC<FileUploaderProps> = ({ onParsed, onError }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const formatDateFromCSV = useCallback((dateStr: string): string => {
    // SECURITY: Sanitize date input
    const sanitizedDate = sanitizeInput(dateStr);

    // Handle American Express format: "Apr 15" (month abbreviation + day)
    if (sanitizedDate.match(/^\w{3}\s+\d{1,2}$/)) {
      const [monthStr, day] = sanitizedDate.split(/\s+/);
      const currentYear = new Date().getFullYear();

      const months: Record<string, string> = {
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

      const month = months[monthStr.toLowerCase()];
      if (month) {
        return `${currentYear}-${month}-${day.padStart(2, "0")}`;
      }
    }

    // Handle DD/MM/YYYY format (UK)
    if (sanitizedDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [day, month, year] = sanitizedDate.split("/");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    // Handle ISO format YYYY-MM-DD
    if (sanitizedDate.match(/^\d{4}-\d{2}-\d{2}/)) {
      return sanitizedDate.split("T")[0]; // Remove time if present
    }

    return sanitizedDate;
  }, []);

  const parseCSV = useCallback(
    async (file: File): Promise<ParseResult> => {
      try {
        const text = await file.text();

        // SECURITY: Validate file content size after reading
        if (text.length > 50 * 1024 * 1024) {
          // 50MB text limit
          throw new Error("File content too large to process safely");
        }

        const lines = text.split("\n").filter((line) => line.trim());

        if (lines.length < 2) {
          throw new Error("CSV file appears to be empty or invalid");
        }

        // SECURITY: Limit number of lines to prevent DoS
        if (lines.length > 50000) {
          throw new Error("CSV file too large - maximum 50,000 lines allowed");
        }

        // SECURITY: Sanitize headers
        const headers = lines[0]
          .split(",")
          .map((h) => sanitizeInput(h).toLowerCase().replace(/"/g, ""));
        const transactions: ParsedTransaction[] = [];

        console.log("CSV headers validated:", headers.length);

        // Map headers to indices (handle different CSV formats)
        const dateIndex = headers.findIndex(
          (h) =>
            h.includes("date") ||
            h.includes("time") ||
            h.includes("transaction date")
        );
        const typeIndex = headers.findIndex(
          (h) => h.includes("type") || h.includes("transaction type")
        );
        const nameIndex = headers.findIndex(
          (h) =>
            h.includes("name") ||
            h.includes("description") ||
            h.includes("merchant")
        );
        const moneyOutIndex = headers.findIndex(
          (h) =>
            h.includes("money out") ||
            h.includes("debit") ||
            h.includes("amount out")
        );
        const moneyInIndex = headers.findIndex(
          (h) =>
            h.includes("money in") ||
            h.includes("credit") ||
            h.includes("amount in")
        );
        const amountIndex = headers.findIndex(
          (h) =>
            (h.includes("amount") && !h.includes("out") && !h.includes("in")) ||
            h.includes("amount (£)")
        );

        for (let i = 1; i < lines.length && i < 10000; i++) {
          // SECURITY: Limit processing to 10,000 transactions
          // Handle CSV with potential quoted values
          const values = lines[i].match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];

          // SECURITY: Sanitize all CSV values
          const cleanValues = values.map((v) =>
            sanitizeInput(v.replace(/^"|"$/g, ""))
          );

          if (cleanValues.length < headers.length - 1) continue; // Skip incomplete rows

          try {
            const dateStr = cleanValues[dateIndex] || "";
            const type = cleanValues[typeIndex] || "";
            const name = cleanValues[nameIndex] || "";

            // SECURITY: Validate numeric inputs
            let transactionAmount = 0;
            let isDebit = true;

            if (moneyOutIndex >= 0 && moneyInIndex >= 0) {
              // Separate debit/credit columns (Monzo style)
              const moneyOutStr = cleanValues[moneyOutIndex] || "0";
              const moneyInStr = cleanValues[moneyInIndex] || "0";

              // SECURITY: Safe number parsing with validation
              const moneyOut = isNaN(parseFloat(moneyOutStr))
                ? 0
                : Math.abs(parseFloat(moneyOutStr));
              const moneyIn = isNaN(parseFloat(moneyInStr))
                ? 0
                : Math.abs(parseFloat(moneyInStr));

              if (moneyOut > 0) {
                transactionAmount = Math.min(moneyOut * 100, 1000000000); // Cap at £10M
                isDebit = true;
              } else if (moneyIn > 0) {
                transactionAmount = Math.min(moneyIn * 100, 1000000000); // Cap at £10M
                isDebit = false;
              }
            } else if (amountIndex >= 0) {
              // Single amount column
              const amountStr = cleanValues[amountIndex] || "0";
              const amount = isNaN(parseFloat(amountStr))
                ? 0
                : parseFloat(amountStr);
              transactionAmount = Math.min(Math.abs(amount) * 100, 1000000000); // Cap at £10M

              isDebit = amount < 0 ? false : true;

              // Check if it's a credit based on description
              const lowerName = name.toLowerCase();
              if (
                lowerName.includes("payment") ||
                lowerName.includes("credit") ||
                lowerName.includes("refund")
              ) {
                isDebit = false;
              }
            }

            // Skip pot transfers and other non-spending transactions
            const lowerType = type.toLowerCase();
            if (
              lowerType.includes("pot transfer") ||
              lowerType.includes("active card check") ||
              transactionAmount === 0
            ) {
              continue;
            }

            if (name && transactionAmount > 0) {
              // Use the classifier for better categorization
              const { classifyTransaction } = await import(
                "@/lib/transactionClassifier"
              );
              const classification = classifyTransaction(
                name,
                transactionAmount,
                isDebit ? "debit" : "credit"
              );

              const transaction: ParsedTransaction = {
                id: `csv_${Date.now()}_${i}`,
                date: formatDateFromCSV(dateStr),
                description: sanitizeInput(name), // SECURITY: Sanitize description
                amount: transactionAmount,
                type: isDebit ? "debit" : "credit",
                category: classification.category,
                merchant: classification.merchant?.name,
                isSubscription: classification.isSubscription,
                confidence: 0.9,
                rawText: sanitizeInput(lines[i].substring(0, 1000)), // SECURITY: Sanitize and limit raw text
              };

              transactions.push(transaction);
            }
          } catch {
            // SECURITY: Safe error logging without exposing sensitive data
            console.warn("Failed to parse CSV line at index:", i);
            continue; // Continue processing other lines
          }
        }

        console.log(`Parsed ${transactions.length} transactions from CSV`);

        return {
          transactions,
          bankName: "CSV Import",
          totalTransactions: transactions.length,
          errors:
            transactions.length === 0
              ? ["No valid transactions found in CSV"]
              : [],
        };
      } catch {
        // SECURITY: Safe error handling without information disclosure
        throw new Error(
          "Failed to process CSV file - please check file format and try again"
        );
      }
    },
    [formatDateFromCSV]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];

      if (!file) return;

      // SECURITY: Enhanced file validation
      const validation = validateFile(file);
      if (!validation.isValid) {
        onError(validation.error || "Invalid file");
        return;
      }

      setUploading(true);
      setUploadProgress(0);

      try {
        // SECURITY: Add timeout for file processing
        const processingTimeout = setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
          onError("File processing timeout - please try a smaller file");
        }, 30000); // 30 second timeout

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        // Parse the file based on type
        let result: ParseResult;

        const fileName = file.name.toLowerCase();
        if (fileName.endsWith(".csv")) {
          result = await parseCSV(file);
        } else {
          result = await parseBankStatementPDF(file);
        }

        clearTimeout(processingTimeout);
        clearInterval(progressInterval);
        setUploadProgress(100);

        // Delay to show completion
        setTimeout(() => {
          if (result.errors.length > 0 && result.transactions.length === 0) {
            // SECURITY: Generic error message to prevent information disclosure
            onError(
              "Unable to process file - please check the file format and try again"
            );
          } else {
            onParsed(result);
          }
          setUploading(false);
          setUploadProgress(0);
        }, 500);
      } catch {
        setUploading(false);
        setUploadProgress(0);
        // SECURITY: Generic error message to prevent information disclosure
        onError(
          "Failed to process file - please check the file format and try again"
        );
      }
    },
    [onParsed, onError, parseCSV]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "application/pdf": [".pdf"],
        "text/csv": [".csv"],
      },
      multiple: false,
      disabled: uploading,
      maxSize: 10 * 1024 * 1024, // SECURITY: Enforce 10MB limit
    });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${
            isDragActive
              ? "border-blue-400 bg-blue-50 dark:bg-blue-500/10"
              : isDragReject
              ? "border-red-400 bg-red-50 dark:bg-red-500/10"
              : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
          }
          ${uploading ? "pointer-events-none opacity-75" : ""}
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
                      <p>
                        • PDF: Chase, Bank of America, Wells Fargo, Citi,
                        Capital One, American Express, RBS, Monzo
                      </p>
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
