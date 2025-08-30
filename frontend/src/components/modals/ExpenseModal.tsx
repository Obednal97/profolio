import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { EnhancedGlassCard } from "@/components/ui/enhanced-glass/EnhancedGlassCard";
import { BaseModal } from "./modal";
import type { Expense } from "@/types/global";

interface ExpenseModalProps {
  onClose: () => void;
  onSubmit: (expense: Omit<Expense, 'id'> & { id?: string }) => void;
  initialData: Expense | null;
  categories: Array<{
    id: string;
    name: string;
    icon: string;
    gradient: string;
    subcategories?: Array<{ id: string; name: string; }>;
  }>;
  currentUserId?: string;
}

type ExpenseFormData = {
  category: string;
  amount: string;
  date: string;
  description: string;
  recurrence: "one-time" | "recurring";
  frequency?: "Daily" | "Weekly" | "Biweekly" | "Monthly" | "Quarterly" | "Yearly";
};

export function ExpenseModal({ 
  onClose, 
  onSubmit, 
  initialData, 
  categories,
  currentUserId 
}: ExpenseModalProps) {
  const [formData, setFormData] = useState<ExpenseFormData>(
    initialData
      ? {
          category: initialData.category,
          amount: (initialData.amount / 100).toString(),
          date: initialData.date,
          description: initialData.description,
          recurrence: initialData.recurrence ?? "one-time",
          frequency: initialData.frequency,
        }
      : {
          category: "",
          amount: "",
          date: new Date().toISOString().split("T")[0],
          description: "",
          recurrence: "one-time",
          frequency: undefined,
        }
  );

  const getSubcategories = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.subcategories || [];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) return;
    
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount) * 100,
      userId: currentUserId,
      date: formData.date,
      description: formData.description,
      category: formData.category,
      recurrence: formData.recurrence ?? "one-time",
      frequency: formData.recurrence === "recurring" ? formData.frequency : undefined,
    });
  };

  return (
    <BaseModal isOpen={true} onClose={onClose}>
      <EnhancedGlassCard
        variant="prominent"
        padding="lg"
        hoverable={false}
        enableLensing={false}
        animate={false}
        className="w-full max-w-2xl relative z-50">
      <div className="flex justify-between items-center mb-6 sm:mb-8">
        <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
          {initialData ? "Edit Expense" : "Add New Expense"}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-manipulation"
          aria-label="Close Modal"
        >
          <i className="fas fa-times text-lg sm:text-xl"></i>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {/* Expense Information */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 sm:p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <i className="fas fa-receipt mr-2 text-red-500"></i>
            Expense Details
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
                <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-white/10 dark:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-red-500 focus:bg-white/20 dark:focus:bg-black/30 transition-all duration-200 touch-manipulation"
                required
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full bg-white/10 dark:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl pl-8 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-red-500 focus:bg-white/20 dark:focus:bg-black/30 transition-all duration-200 touch-manipulation"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-white/10 dark:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-red-500 focus:bg-white/20 dark:focus:bg-black/30 transition-all duration-200 touch-manipulation"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-red-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200 touch-manipulation"
                placeholder="What was this expense for?"
                required
              />
            </div>
          </div>
        </div>

        {/* Recurrence Settings */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 sm:p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <i className="fas fa-sync-alt mr-2 text-purple-500"></i>
            Recurrence Settings
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="inline-flex items-center text-gray-700 dark:text-gray-300 space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.recurrence === "recurring"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recurrence: e.target.checked ? "recurring" : "one-time",
                      frequency: e.target.checked ? formData.frequency ?? "Monthly" : undefined,
                    })
                  }
                  className="form-checkbox h-5 w-5 text-red-500 rounded border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-red-500"
                />
                <span>Recurring Expense</span>
              </label>
            </div>

            {formData.recurrence === "recurring" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recurrence Frequency
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) =>
                    setFormData({ 
                      ...formData, 
                      frequency: e.target.value as ExpenseFormData["frequency"] 
                    })
                  }
                  className="w-full bg-white/10 dark:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-red-500 focus:bg-white/20 dark:focus:bg-black/30 transition-all duration-200 touch-manipulation"
                  required={formData.recurrence === "recurring"}
                >
                  <option value="">Select frequency</option>
                  {["Daily", "Weekly", "Biweekly", "Monthly", "Quarterly", "Yearly"].map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </motion.div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            onClick={onClose}
            variant="ghost"
            className="w-full sm:w-auto px-6 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 touch-manipulation"
            aria-label="Cancel"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-medium shadow-lg touch-manipulation"
            aria-label={initialData ? "Update Expense" : "Add Expense"}
          >
            {initialData ? "Update Expense" : "Add Expense"}
          </Button>
        </div>
      </form>
      </EnhancedGlassCard>
    </BaseModal>
  );
} 