import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { getCategoryInfo } from '@/lib/transactionClassifier';
import type { Expense } from '@/types/global';

interface ExpenseManagerCardProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  formatCurrency: (value: number) => string;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  showCheckbox?: boolean;
}

export function ExpenseManagerCard({
  expense,
  onEdit,
  onDelete,
  formatCurrency,
  isSelected = false,
  onSelect,
  showCheckbox = false,
}: ExpenseManagerCardProps) {
  const categoryInfo = getCategoryInfo(expense.category);
  const isIncome = ['income', 'salary', 'investment_income', 'freelance'].includes(expense.category);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      className={`bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-xl p-6 border transition-all duration-200 shadow-lg hover:shadow-xl ${
        isSelected
          ? "border-blue-500 ring-2 ring-blue-500/20"
          : "border-white/10 hover:border-white/20"
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          {showCheckbox && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => expense.id && onSelect?.(expense.id)}
              className="form-checkbox h-4 w-4 text-blue-500 rounded mr-3"
            />
          )}
          <div
            className={`p-3 bg-gradient-to-r ${categoryInfo.gradient} rounded-lg mr-4 shadow-lg`}
          >
            <i className={`fas ${categoryInfo.icon} text-white text-xl`}></i>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              {expense.description}
            </h3>
            <p className="text-sm text-gray-400">{categoryInfo.name}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => onEdit(expense)}
            variant="ghost"
            size="sm"
            icon="fa-edit"
            className="text-gray-400 hover:text-blue-400"
          />
          <Button
            onClick={() => expense.id && onDelete(expense.id)}
            variant="ghost"
            size="sm"
            icon="fa-trash"
            className="text-gray-400 hover:text-red-400"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Amount</span>
          <span className={`text-xl font-bold ${isIncome ? 'text-green-400' : 'text-red-400'}`}>
            {isIncome ? '+' : '-'}{formatCurrency(expense.amount)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Date</span>
          <span className="text-white">
            {new Date(expense.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        {expense.recurrence === "recurring" && (
          <div className="flex items-center text-sm text-purple-400 pt-2 border-t border-white/10">
            <i className="fas fa-sync-alt mr-2"></i>
            Recurring {expense.frequency?.toLowerCase()}
          </div>
        )}
      </div>
    </motion.div>
  );
}