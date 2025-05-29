'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { parseBankStatementPDF, ParseResult } from '@/lib/pdfParser';

interface PdfUploaderProps {
  onParsed: (result: ParseResult) => void;
  onError: (error: string) => void;
}

const PdfUploader: React.FC<PdfUploaderProps> = ({ onParsed, onError }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      onError('Please upload a PDF file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      onError('PDF file must be smaller than 10MB');
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

      // Parse the PDF
      const result = await parseBankStatementPDF(file);
      
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
      onError(error instanceof Error ? error.message : 'Failed to parse PDF');
    }
  }, [onParsed, onError]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
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
                      <i className="fas fa-file-pdf text-red-500 text-lg"></i>
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Processing PDF...
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
                      Drop your bank statement here
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
                      Please upload a PDF file
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Upload Bank Statement PDF
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Drag and drop your PDF here, or click to browse
                    </p>
                    
                    <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                      <p>• Supports Chase, Bank of America, Wells Fargo, Citi, Capital One</p>
                      <p>• Automatically categorizes transactions</p>
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

export default PdfUploader; 