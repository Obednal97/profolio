"use client";
import type { Expense, ExpenseFormData } from "@/types/global";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from '@/lib/auth';
import { useAppContext } from "@/components/layout/layoutWrapper";
import { BaseModal as Modal } from "@/components/modals/modal";
import { Button } from "@/components/ui/button/button";
import { motion, AnimatePresence } from "framer-motion";
import LineChart from "@/components/charts/line";
import PieChart from "@/components/charts/pie";
import FinancialInsights from "@/components/insights/FinancialInsights";
import { getAllCategories, getSubcategories, getCategoryInfo } from "@/lib/transactionClassifier";

function ExpenseManager() {
  const { formatCurrency } = useAppContext();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [timeRange, setTimeRange] = useState("30");
  const [activeTab, setActiveTab] = useState<"expenses" | "insights">("expenses");
  const { user } = useAuth();

  // Get all available categories
  const allCategories = getAllCategories();

  // Check if user is in demo mode
  const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('demo-mode') === 'true';
  
  // Use Firebase user data or demo user data
  const currentUser = user ? {
    id: user.uid,
    name: user.displayName || user.email?.split('@')[0] || 'User',
    email: user.email || ''
  } : (isDemoMode ? {
    id: 'demo-user-id',
    name: 'Demo User',
    email: 'demo@profolio.com'
  } : null);

  const fetchExpenses = useCallback(async () => {
    if (!currentUser?.id) return;
    
    setLoading(true);
    try {
      const { apiCall } = await import('@/lib/mockApi');
      
      const response = await apiCall('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          method: 'READ', 
          userId: currentUser.id,
          days: parseInt(timeRange)
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setExpenses(data.expenses || []);
      setError(null);
    } catch (err: unknown) {
      console.error('Error loading expenses:', err);
      setError('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, timeRange]);

  useEffect(() => {
    if (currentUser?.id) fetchExpenses();
  }, [currentUser?.id, fetchExpenses]);

  // Auto-clear notifications
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleSubmit = useCallback(async (expenseData: Omit<Expense, 'id'> & { id?: string }) => {
    if (!currentUser) return;
    
    try {
      const { apiCall } = await import('@/lib/mockApi');
      
      const method = editingExpense ? 'UPDATE' : 'CREATE';
      
      // For new expenses, we need to add an id if it doesn't exist
      const expenseWithId: Expense = {
        ...expenseData,
        id: expenseData.id || Date.now().toString(),
        userId: currentUser.id,
      };
      
      const response = await apiCall('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method,
          ...expenseWithId,
          ...(editingExpense?.id ? { id: editingExpense.id } : {}),
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setShowModal(false);
      setEditingExpense(null);
      fetchExpenses();
    } catch (err: unknown) {
      console.error('Expense save error:', err);
      setError('Failed to save expense');
    }
  }, [editingExpense, currentUser, fetchExpenses]);

  const handleDelete = useCallback(async (expenseId: string) => {
    if (!currentUser) return;
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const { apiCall } = await import('@/lib/mockApi');
      
      const response = await apiCall('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'DELETE',
          userId: currentUser.id,
          id: expenseId,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      fetchExpenses();
    } catch (err: unknown) {
      console.error('Expense deletion error:', err);
      setError('Failed to delete expense');
    }
  }, [currentUser, fetchExpenses]);

  const handleOpenModal = useCallback(() => {
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingExpense(null);
  }, []);

  const handleEdit = useCallback((expense: Expense) => {
    setEditingExpense(expense);
    setShowModal(true);
  }, []);

  // Calculate metrics
  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  const expensesByCategory = useMemo(() => {
    return expenses.reduce((acc, expense) => {
      const category = expense.category || 'other';
      if (!acc[category]) acc[category] = { count: 0, amount: 0 };
      acc[category].count++;
      acc[category].amount += expense.amount;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    if (filterCategory === "all") return expenses;
    return expenses.filter(expense => expense.category === filterCategory);
  }, [expenses, filterCategory]);

  const monthlyExpensesTrend = useMemo(() => {
    const monthsCount = timeRange === "365" ? 12 : timeRange === "90" ? 3 : 1;
    const months = Array.from({ length: monthsCount }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date.toISOString().slice(0, 7);
    }).reverse();

    return months.map(month => {
      const monthExpenses = expenses.filter(exp => 
        exp.date.startsWith(month)
      );
      const total = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      return {
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
        amount: total / 100
      };
    });
  }, [expenses, timeRange]);

  // Count subscriptions
  const subscriptionCount = useMemo(() => {
    return expenses.filter(e => e.recurrence === 'recurring' || e.frequency).length;
  }, [expenses]);

  interface ExpenseModalProps {
    onClose: () => void;
    onSubmit: (expense: Omit<Expense, 'id'> & { id?: string }) => void;
    initialData: Expense | null;
  }

  const ExpenseModal = ({ onClose, onSubmit, initialData }: ExpenseModalProps) => {
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

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser) return;
      onSubmit({
        ...formData,
        amount: parseFloat(formData.amount) * 100,
        userId: currentUser.id,
        date: formData.date,
        description: formData.description,
        category: formData.category,
        recurrence: formData.recurrence ?? "one-time",
        frequency: formData.recurrence === "recurring" ? formData.frequency : undefined,
      });
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-md border border-gray-200 dark:border-gray-700 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            {initialData ? "Edit Expense" : "Add New Expense"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-red-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
              required
            >
              <option value="" className="bg-white dark:bg-gray-800">Select Category</option>
              {allCategories.map((category) => (
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
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-red-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-red-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-red-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
              placeholder="What was this expense for?"
              required
            />
          </div>

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
              </label>
              <select
                value={formData.frequency}
                onChange={(e) =>
                  setFormData({ ...formData, frequency: e.target.value as ExpenseFormData["frequency"] })
                }
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-red-500 focus:bg-white dark:focus:bg-gray-600 transition-all duration-200"
              >
                {["Daily", "Weekly", "Biweekly", "Monthly", "Quarterly", "Yearly"].map((f) => (
                  <option key={f} value={f} className="bg-white dark:bg-gray-800">
                    {f}
                  </option>
                ))}
              </select>
            </motion.div>
          )}

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              onClick={onClose}
              variant="ghost"
              className="px-6 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-medium shadow-lg"
            >
              {initialData ? "Update Expense" : "Add Expense"}
            </Button>
          </div>
        </form>
      </div>
    );
  };

  const ExpenseCard = ({
    expense,
    onEdit,
    onDelete,
  }: {
    expense: Expense;
    onEdit: (expense: Expense) => void;
    onDelete: (id: string) => void;
  }) => {
    const categoryInfo = getCategoryInfo(expense.category);

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ y: -4 }}
        className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <div className={`p-3 bg-gradient-to-r ${categoryInfo.gradient} rounded-lg mr-4 shadow-lg`}>
              <i className={`fas ${categoryInfo.icon} text-white text-xl`}></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{expense.description}</h3>
              <p className="text-sm text-gray-400">{categoryInfo.name}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(expense)}
              className="p-2 text-gray-400 hover:text-blue-400 transition-colors hover:bg-white/10 rounded-lg"
            >
              <i className="fas fa-edit"></i>
            </button>
            <button
              onClick={() => expense.id && onDelete(expense.id)}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors hover:bg-white/10 rounded-lg"
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Amount</span>
            <span className="text-xl font-bold text-red-400">
              -{formatCurrency(expense.amount)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Date</span>
            <span className="text-white">
              {new Date(expense.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
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
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="relative z-10 p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                Expense Manager
              </h1>
              <p className="text-gray-400 mt-2">Track and manage your spending</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="/app/expenses/import"
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium shadow-lg px-6 py-3 rounded-xl transition-all duration-200 inline-flex items-center justify-center"
              >
                <i className="fas fa-upload mr-2"></i>
                Import Expenses
              </a>
              <Button
                onClick={handleOpenModal}
                className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-medium shadow-lg px-6 py-3 rounded-xl transition-all duration-200"
              >
                <i className="fas fa-plus mr-2"></i>
                Add Expense
              </Button>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-900/20 backdrop-blur-sm border border-red-800 rounded-xl p-4 mb-6"
          >
            <p className="text-red-400 flex items-center">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </p>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-900/20 backdrop-blur-sm border border-green-800 rounded-xl p-4 mb-6"
          >
            <p className="text-green-400 flex items-center">
              <i className="fas fa-check-circle mr-2"></i>
              {success}
            </p>
          </motion.div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          <button
            onClick={() => setActiveTab("expenses")}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === "expenses"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <i className="fas fa-receipt mr-2"></i>
            Expenses
          </button>
          <button
            onClick={() => setActiveTab("insights")}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === "insights"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <i className="fas fa-chart-line mr-2"></i>
            Insights
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "expenses" ? (
            <motion.div
              key="expenses"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Summary Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
              >
                <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm rounded-xl p-6 border border-red-500/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-400 text-sm">Total Expenses</p>
                      <p className="text-3xl font-bold text-red-400 mt-1">
                        {formatCurrency(totalExpenses)}
                      </p>
                    </div>
                    <div className="p-3 bg-red-500/20 rounded-lg">
                      <i className="fas fa-receipt text-red-400 text-xl"></i>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-400 text-sm">Subscriptions</p>
                      <p className="text-3xl font-bold text-purple-400 mt-1">
                        {subscriptionCount}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-500/20 rounded-lg">
                      <i className="fas fa-sync-alt text-purple-400 text-xl"></i>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-sm rounded-xl p-6 border border-orange-500/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-400 text-sm">Total Transactions</p>
                      <p className="text-3xl font-bold text-orange-400 mt-1">
                        {expenses.length}
                      </p>
                    </div>
                    <div className="p-3 bg-orange-500/20 rounded-lg">
                      <i className="fas fa-exchange-alt text-orange-400 text-xl"></i>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Charts Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
              >
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-white">Spending Trend</h3>
                    <div className="flex gap-2">
                      {["30", "90", "365"].map((days) => (
                        <button
                          key={days}
                          onClick={() => setTimeRange(days)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                            timeRange === days
                              ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                              : 'bg-white/10 text-gray-400 hover:bg-white/20'
                          }`}
                        >
                          {days === "365" ? "Year" : days === "90" ? "Quarter" : "Month"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <LineChart
                    data={monthlyExpensesTrend}
                    xKey="month"
                    lines={[{ dataKey: "amount", color: "#ef4444" }]}
                  />
                </div>

                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <h3 className="text-xl font-semibold text-white mb-6">Spending by Category</h3>
                  <PieChart
                    data={Object.entries(expensesByCategory).map(([category, data]) => {
                      const categoryInfo = getCategoryInfo(category);
                      return {
                        name: categoryInfo.name,
                        value: data.amount / 100,
                        color: categoryInfo.color,
                      };
                    })}
                  />
                </div>
              </motion.div>

              {/* Filter and View Controls */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4"
              >
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterCategory("all")}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      filterCategory === "all"
                        ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    All Categories
                  </button>
                  {Object.keys(expensesByCategory).map((category) => {
                    const categoryInfo = getCategoryInfo(category);
                    return (
                      <button
                        key={category}
                        onClick={() => setFilterCategory(category)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          filterCategory === category
                            ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                            : 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        {categoryInfo.name} ({expensesByCategory[category].count})
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === "grid"
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <i className="fas fa-th"></i>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === "list"
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <i className="fas fa-list"></i>
                  </button>
                </div>
              </motion.div>

              {/* Expenses Grid/List */}
              <AnimatePresence mode="wait">
                {filteredExpenses.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-16"
                  >
                    <div className="text-gray-500 text-6xl mb-4">
                      <i className="fas fa-receipt"></i>
                    </div>
                    <h3 className="text-xl font-medium text-gray-400 mb-2">
                      {filterCategory === "all" ? "No Expenses Yet" : `No ${getCategoryInfo(filterCategory).name} expenses`}
                    </h3>
                    <p className="text-gray-500 mb-6">
                      {filterCategory === "all" 
                        ? "Start tracking your expenses by adding your first expense."
                        : "You don't have any expenses in this category yet."}
                    </p>
                    <Button
                      onClick={handleOpenModal}
                      className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-medium"
                    >
                      <i className="fas fa-plus mr-2"></i>
                      Add Your First Expense
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    layout
                    className={viewMode === "grid" 
                      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                      : "space-y-4"
                    }
                  >
                    {filteredExpenses.map((expense) => (
                      <ExpenseCard
                        key={expense.id}
                        expense={expense}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="insights"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <FinancialInsights expenses={expenses} timeRange={timeRange} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal - Moved outside the relative z-10 container */}
      {(showModal || editingExpense) && (
        <Modal isOpen={showModal || !!editingExpense} onClose={handleCloseModal}>
          <ExpenseModal
            onClose={handleCloseModal}
            onSubmit={handleSubmit}
            initialData={editingExpense}
          />
        </Modal>
      )}
    </div>
  );
}

export default ExpenseManager;