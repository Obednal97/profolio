'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ParsedTransaction, ParseResult } from '@/lib/pdfParser';
import { Button } from '@/components/ui/button/button';
import { useAppContext } from '@/components/layout/layoutWrapper';
import { getAllCategories, getSubcategories } from '@/lib/transactionClassifier';

interface TransactionReviewProps {
  parseResult: ParseResult;
  onSave: (transactions: ParsedTransaction[]) => Promise<void>;
  onCancel: () => void;
}

const TransactionReview: React.FC<TransactionReviewProps> = ({ 
  parseResult, 
  onSave, 
  onCancel 
}) => {
  const { formatCurrency } = useAppContext();
  const [transactions, setTransactions] = useState<ParsedTransaction[]>(parseResult.transactions);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(
    new Set(parseResult.transactions.map(t => t.id))
  );
  const [saving, setSaving] = useState(false);
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);

  // Get all available categories
  const allCategories = getAllCategories();

  const totalAmount = useMemo(() => {
    return transactions
      .filter(t => selectedTransactions.has(t.id))
      .reduce((sum, t) => {
        return sum + (t.type === 'debit' ? t.amount : -t.amount);
      }, 0);
  }, [transactions, selectedTransactions]);

  const handleTransactionUpdate = (id: string, updates: Partial<ParsedTransaction>) => {
    setTransactions(prev => 
      prev.map(t => t.id === id ? { ...t, ...updates } : t)
    );
  };

  const handleSelectAll = () => {
    if (selectedTransactions.size === transactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(transactions.map(t => t.id)));
    }
  };

  const handleSelectTransaction = (id: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTransactions(newSelected);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const selectedTransactionsList = transactions.filter(t => 
        selectedTransactions.has(t.id)
      );
      await onSave(selectedTransactionsList);
    } catch (error) {
      console.error('Failed to save transactions:', error);
    } finally {
      setSaving(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Review Transactions
          </h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedTransactions.size} of {transactions.length} selected
            </span>
            <Button
              variant="ghost"
              onClick={handleSelectAll}
              className="text-blue-600 dark:text-blue-400"
            >
              {selectedTransactions.size === transactions.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">Bank</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {parseResult.bankName || 'Unknown'}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">Net Total</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {formatCurrency(totalAmount)}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">Subscriptions</p>
            <p className="font-semibold text-purple-600 dark:text-purple-400">
              {transactions.filter(t => t.isSubscription).length}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">Need Review</p>
            <p className="font-semibold text-yellow-600 dark:text-yellow-400">
              {transactions.filter(t => t.confidence < 0.8).length}
            </p>
          </div>
        </div>

        {/* Warnings */}
        {parseResult.errors.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              Warnings
            </h3>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              {parseResult.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        <AnimatePresence>
          {transactions.map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.02 }}
              className={`
                bg-white dark:bg-gray-800 rounded-lg border-2 transition-all duration-200
                ${selectedTransactions.has(transaction.id)
                  ? 'border-blue-200 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/5'
                  : 'border-gray-200 dark:border-gray-700'
                }
              `}
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.has(transaction.id)}
                        onChange={() => handleSelectTransaction(transaction.id)}
                        className="form-checkbox h-5 w-5 text-blue-500 rounded border-gray-300 dark:border-gray-600"
                      />
                    </label>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {transaction.merchant || transaction.description}
                          </h3>
                          {transaction.isSubscription && (
                            <span className="bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs px-2 py-1 rounded-full font-medium">
                              <i className="fas fa-sync-alt mr-1"></i>
                              Subscription
                            </span>
                          )}
                          {transaction.merchant && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {transaction.description}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`text-sm font-medium ${getConfidenceColor(transaction.confidence)}`}>
                            {getConfidenceLabel(transaction.confidence)} ({Math.round(transaction.confidence * 100)}%)
                          </span>
                          <span className={`font-semibold ${transaction.type === 'debit' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {transaction.type === 'debit' ? '-' : '+'}{formatCurrency(transaction.amount)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>{transaction.date}</span>
                        <div className="flex items-center space-x-4">
                          <select
                            value={transaction.category}
                            onChange={(e) => handleTransactionUpdate(transaction.id, { category: e.target.value })}
                            className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs"
                          >
                            {allCategories.map(category => (
                              <optgroup key={category.id} label={category.name}>
                                <option value={category.id}>{category.name}</option>
                                {getSubcategories(category.id).map(sub => (
                                  <option key={sub.id} value={sub.id}>
                                    &nbsp;&nbsp;{sub.name}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                          <button
                            onClick={() => setExpandedTransaction(
                              expandedTransaction === transaction.id ? null : transaction.id
                            )}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                          >
                            <i className={`fas ${expandedTransaction === transaction.id ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedTransaction === transaction.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600"
                    >
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={transaction.description}
                            onChange={(e) => handleTransactionUpdate(transaction.id, { description: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm"
                          />
                        </div>
                        
                        {transaction.merchant && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Merchant
                            </label>
                            <input
                              type="text"
                              value={transaction.merchant}
                              onChange={(e) => handleTransactionUpdate(transaction.id, { merchant: e.target.value })}
                              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm"
                            />
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Date
                            </label>
                            <input
                              type="date"
                              value={transaction.date}
                              onChange={(e) => handleTransactionUpdate(transaction.id, { date: e.target.value })}
                              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Amount
                            </label>
                            <input
                              type="number"
                              value={transaction.amount / 100}
                              onChange={(e) => handleTransactionUpdate(transaction.id, { amount: Math.round(parseFloat(e.target.value) * 100) })}
                              step="0.01"
                              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm"
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                            <input
                              type="checkbox"
                              checked={transaction.isSubscription || false}
                              onChange={(e) => handleTransactionUpdate(transaction.id, { isSubscription: e.target.checked })}
                              className="form-checkbox h-4 w-4 text-purple-500 rounded border-gray-300 dark:border-gray-600 mr-2"
                            />
                            Mark as subscription
                          </label>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Raw Text
                          </label>
                          <code className="block w-full bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs text-gray-600 dark:text-gray-400">
                            {transaction.rawText}
                          </code>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="text-gray-600 dark:text-gray-400"
          >
            Cancel
          </Button>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedTransactions.size} transactions • {formatCurrency(totalAmount)} net total
            </span>
            <Button
              onClick={handleSave}
              disabled={selectedTransactions.size === 0 || saving}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
            >
              {saving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  Save {selectedTransactions.size} Transactions
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionReview; 