"use client";

import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/unifiedAuth";
import dynamic from "next/dynamic";

// Dynamically import components that use browser-only APIs
const FileUploader = dynamic(() => import("@/components/pdf/PdfUploader"), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse">
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3 mx-auto"></div>
      </div>
    </div>
  ),
});

const TransactionReview = dynamic(
  () => import("@/components/pdf/TransactionReview"),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse">
        <div className="bg-white rounded-xl p-6 border">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    ),
  }
);

// Types need to be imported separately to avoid SSR issues
import type { ParseResult, ParsedTransaction } from "@/lib/pdfParser";

type ImportStep = "upload" | "review" | "success";

export default function ExpenseImportPage() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<ImportStep>("upload");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  // Check if user is in demo mode
  const isDemoMode =
    typeof window !== "undefined" &&
    localStorage.getItem("demo-mode") === "true";

  // Memoize currentUser to prevent useCallback dependency changes
  const currentUser = useMemo(() => {
    return user || (isDemoMode ? { id: "demo-user-id" } : null);
  }, [user, isDemoMode]);

  const handleParsed = (result: ParseResult) => {
    console.log("Parse result:", result);

    // Show warning if very few transactions found
    if (result.transactions.length < 5 && result.transactions.length > 0) {
      result.errors.push(
        `Only ${result.transactions.length} transactions found. The PDF might not be fully parsed.`
      );
    }

    setParseResult(result);
    setCurrentStep("review");
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setParseResult(null);

    // Log error for debugging
    console.error("Import error:", errorMessage);
  };

  const handleSave = useCallback(
    async (selectedTransactions: ParsedTransaction[]) => {
      if (!currentUser?.id) return;

      try {
        // Use the proxy endpoint with authentication
        const authToken = (isDemoMode ? "demo-token" : user?.token) || null;

        // Convert transactions to expenses
        const expenses = selectedTransactions.map((transaction) => ({
          id: `imported_${transaction.id}`,
          userId: currentUser.id,
          category: transaction.category,
          amount: transaction.amount, // Already in cents
          date: transaction.date,
          description: transaction.description,
          recurrence: "one-time" as const,
          // Add a note to indicate this was imported and whether it's income or expense
          notes: `Imported from bank statement - ${
            transaction.type === "credit" ? "Income" : "Expense"
          }`,
        }));

        // Save each expense
        for (const expense of expenses) {
          const response = await fetch("/api/expenses", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              method: "CREATE",
              ...expense,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          if (data.error) {
            throw new Error(`Failed to save expense: ${data.error}`);
          }
        }

        setCurrentStep("success");
        setSavedCount(expenses.length);
        setParseResult((prev) =>
          prev
            ? {
                ...prev,
                savedCount: expenses.length,
                totalAmount: selectedTransactions.reduce(
                  (sum, t) => sum + (t.type === "debit" ? t.amount : -t.amount),
                  0
                ),
              }
            : null
        );
      } catch (error) {
        console.error("Failed to save expenses:", error);
        setError(
          error instanceof Error ? error.message : "Failed to save expenses"
        );
      }
    },
    [currentUser, isDemoMode, user?.token]
  );

  const handleStartOver = () => {
    setCurrentStep("upload");
    setParseResult(null);
    setError(null);
    setSavedCount(0);
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        {/* Step 1: Upload */}
        <div
          className={`flex items-center space-x-2 ${
            currentStep === "upload"
              ? "text-blue-600 dark:text-blue-400"
              : currentStep === "review" || currentStep === "success"
              ? "text-green-600 dark:text-green-400"
              : "text-gray-400"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === "upload"
                ? "bg-blue-100 dark:bg-blue-500/20"
                : currentStep === "review" || currentStep === "success"
                ? "bg-green-100 dark:bg-green-500/20"
                : "bg-gray-100 dark:bg-gray-700"
            }`}
          >
            {currentStep === "review" || currentStep === "success" ? (
              <i className="fas fa-check text-sm"></i>
            ) : (
              <span className="text-sm font-medium">1</span>
            )}
          </div>
          <span className="text-sm font-medium">Upload PDF</span>
        </div>

        <div
          className={`w-8 h-px ${
            currentStep === "review" || currentStep === "success"
              ? "bg-green-300 dark:bg-green-600"
              : "bg-gray-300 dark:bg-gray-600"
          }`}
        ></div>

        {/* Step 2: Review */}
        <div
          className={`flex items-center space-x-2 ${
            currentStep === "review"
              ? "text-blue-600 dark:text-blue-400"
              : currentStep === "success"
              ? "text-green-600 dark:text-green-400"
              : "text-gray-400"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === "review"
                ? "bg-blue-100 dark:bg-blue-500/20"
                : currentStep === "success"
                ? "bg-green-100 dark:bg-green-500/20"
                : "bg-gray-100 dark:bg-gray-700"
            }`}
          >
            {currentStep === "success" ? (
              <i className="fas fa-check text-sm"></i>
            ) : (
              <span className="text-sm font-medium">2</span>
            )}
          </div>
          <span className="text-sm font-medium">Review & Edit</span>
        </div>

        <div
          className={`w-8 h-px ${
            currentStep === "success"
              ? "bg-green-300 dark:bg-green-600"
              : "bg-gray-300 dark:bg-gray-600"
          }`}
        ></div>

        {/* Step 3: Success */}
        <div
          className={`flex items-center space-x-2 ${
            currentStep === "success"
              ? "text-green-600 dark:text-green-400"
              : "text-gray-400"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === "success"
                ? "bg-green-100 dark:bg-green-500/20"
                : "bg-gray-100 dark:bg-gray-700"
            }`}
          >
            {currentStep === "success" ? (
              <i className="fas fa-check text-sm"></i>
            ) : (
              <span className="text-sm font-medium">3</span>
            )}
          </div>
          <span className="text-sm font-medium">Complete</span>
        </div>
      </div>
    </div>
  );

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#101828]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please sign in to import expenses
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You need to be signed in to upload and save bank statement data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#101828] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
            Import Bank Statement
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Upload your bank statement PDF and we&apos;ll automatically extract
            and categorize your transactions
          </p>
        </motion.div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-2xl mx-auto mb-8"
            >
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4">
                <div className="flex items-center">
                  <i className="fas fa-exclamation-circle text-red-500 mr-3"></i>
                  <div>
                    <h3 className="font-medium text-red-800 dark:text-red-200">
                      Upload Error
                    </h3>
                    <p className="text-red-700 dark:text-red-300 text-sm mt-1">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {currentStep === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-2xl mx-auto"
            >
              <FileUploader onParsed={handleParsed} onError={handleError} />

              {/* Help Section */}
              <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  <i className="fas fa-info-circle text-blue-500 mr-2"></i>
                  How it works
                </h3>
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium">
                      1
                    </span>
                    <p>
                      Upload your bank statement (PDF: Chase, BofA, Wells Fargo,
                      Citi, Capital One, RBS, Monzo | CSV: Monzo format)
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium">
                      2
                    </span>
                    <p>
                      We&apos;ll extract transactions and automatically
                      categorize them
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium">
                      3
                    </span>
                    <p>
                      Review and edit the transactions before saving them as
                      expenses
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === "review" && parseResult && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <TransactionReview
                parseResult={parseResult}
                onSave={handleSave}
                onCancel={handleStartOver}
              />
            </motion.div>
          )}

          {currentStep === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-2xl mx-auto text-center"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="fas fa-check text-2xl text-green-600 dark:text-green-400"></i>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Import Complete!
                </h2>

                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Successfully imported{" "}
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {savedCount} transactions
                  </span>{" "}
                  from your bank statement.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={handleStartOver}
                    className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Import Another Statement
                  </button>
                  <a
                    href="/app/expenseManager"
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl transition-all duration-200 inline-flex items-center justify-center"
                  >
                    <i className="fas fa-eye mr-2"></i>
                    View Expenses
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
