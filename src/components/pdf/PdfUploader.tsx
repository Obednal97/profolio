"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { parseBankStatementPDF, ParseResult } from "@/lib/pdfParser";
import { parseStatementCsv } from "@/lib/csvStatementParser";

interface FileUploaderProps {
  onParsed: (result: ParseResult) => void;
  onError: (error: string) => void;
}

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

  /**
   * Reading the dropped file. The CSV reader lives in
   * `src/lib/csvStatementParser.ts` rather than here: as a hook it could not
   * be tested, and it carried faults that only a real export shows - dropped
   * empty fields shifting every later column, a carriage return stuck to the
   * last value, and an inverted sign that filed card payments as income.
   */

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
          result = parseStatementCsv(await file.text());
        } else {
          result = await parseBankStatementPDF(file);
        }

        clearTimeout(processingTimeout);
        clearInterval(progressInterval);
        setUploadProgress(100);

        // Delay to show completion
        setTimeout(() => {
          if (result.errors.length > 0 && result.transactions.length === 0) {
            // The parser's own message, not a generic one. These say which
            // column is missing or that the file has no rows, and they are
            // about the reader's own file, so there is nothing to disclose.
            onError(
              result.errors[0] ||
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
    [onParsed, onError]
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
