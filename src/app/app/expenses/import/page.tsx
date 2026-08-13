"use client";

import React, { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { EnhancedGlassCard } from "@/components/ui/enhanced-glass/EnhancedGlassCard";
import { useStableAuthToken } from "@/hooks/useStableUser";
import TransactionReview from "@/components/pdf/TransactionReview";
import type { ParsedTransaction, ParseResult } from "@/lib/pdfParser";

/**
 * The uploader pulls in pdf.js, which reaches for the DOM as it loads, so it is
 * only ever rendered in the browser. The rest of the page renders on the server
 * as usual.
 */
const PdfUploader = dynamic(() => import("@/components/pdf/PdfUploader"), {
  ssr: false,
  loading: () => (
    <div className="h-48 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
  ),
});

interface ImportSummary {
  imported: number;
  skipped: number;
}

interface ImportResponse {
  imported?: number;
  skipped?: number;
  message?: string;
}

export default function ImportExpensesPage() {
  const authToken = useStableAuthToken();

  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleParsed = useCallback((result: ParseResult) => {
    setError(null);
    setSummary(null);
    setParseResult(result);
  }, []);

  const handleError = useCallback((message: string) => {
    setParseResult(null);
    setError(message);
  }, []);

  const handleCancel = useCallback(() => {
    setParseResult(null);
    setError(null);
  }, []);

  /**
   * Posts the reviewed rows. Amounts go up exactly as the parser produced them,
   * in cents, which is what the expenses API expects. Only the fields the server
   * accepts are sent: validation is strict, so passing the parser's own id,
   * confidence and raw statement text along would be a 400.
   */
  const handleSave = useCallback(
    async (transactions: ParsedTransaction[]) => {
      setError(null);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      try {
        const response = await fetch("/api/expenses/import", {
          method: "POST",
          headers,
          body: JSON.stringify({
            transactions: transactions.map((transaction) => ({
              amount: transaction.amount,
              date: transaction.date,
              description: transaction.description,
              type: transaction.type,
              category: transaction.category,
            })),
          }),
        });

        const data: ImportResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.message || `Import failed (${response.status})`);
        }

        setSummary({
          imported: data.imported ?? 0,
          skipped: data.skipped ?? 0,
        });
        setParseResult(null);
      } catch (err: unknown) {
        // Surfaced on the page rather than thrown onwards, because
        // TransactionReview only logs what it catches and the reviewer would
        // otherwise see the save button simply stop spinning.
        setError(
          err instanceof Error
            ? err.message
            : "Failed to import transactions. Please try again."
        );
      }
    },
    [authToken]
  );

  return (
    <div className="min-h-screen text-gray-900 dark:text-white">
      <div className="relative z-10 p-4 md:p-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                Import Expenses
              </h1>
              <p className="text-gray-400 mt-2">
                Upload a bank statement, review what we found, then add it to
                your expenses
              </p>
            </div>
            <Button
              as="a"
              href="/app/expenseManager"
              variant="glass"
              animate
              className="w-full sm:w-auto"
              data-testid="back-to-expenses"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Expenses
            </Button>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-900/20 backdrop-blur-sm border border-red-800 rounded-xl p-4 mb-6"
            data-testid="import-error"
          >
            <p className="text-red-400 flex items-center">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </p>
          </motion.div>
        )}

        {summary && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <EnhancedGlassCard
              variant="prominent"
              padding="lg"
              data-testid="import-summary"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold flex items-center">
                    <i className="fas fa-check-circle text-green-400 mr-2"></i>
                    Import complete
                  </h2>
                  <p className="text-gray-400 mt-2">
                    <span data-testid="import-imported-count">
                      {summary.imported}
                    </span>{" "}
                    {summary.imported === 1 ? "transaction" : "transactions"}{" "}
                    imported,{" "}
                    <span data-testid="import-skipped-count">
                      {summary.skipped}
                    </span>{" "}
                    skipped as already recorded
                  </p>
                </div>
                <Button
                  as="a"
                  href="/app/expenseManager"
                  variant="glass-primary"
                  animate
                  data-testid="view-expenses"
                >
                  <i className="fas fa-receipt mr-2"></i>
                  View Expenses
                </Button>
              </div>
            </EnhancedGlassCard>
          </motion.div>
        )}

        {parseResult ? (
          <TransactionReview
            parseResult={parseResult}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <EnhancedGlassCard variant="standard" padding="lg">
            <div data-testid="statement-uploader">
              <PdfUploader onParsed={handleParsed} onError={handleError} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              Nothing is saved until you have reviewed the transactions.
              Statements you have already imported are skipped automatically, so
              overlapping periods will not be counted twice.
            </p>
          </EnhancedGlassCard>
        )}
      </div>
    </div>
  );
}
