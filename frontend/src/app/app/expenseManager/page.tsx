"use client";
import type { Expense, ExpenseFormData } from "@/types/global";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useUser } from "@/lib/user";
import { BaseModal as Modal } from "@/components/modals/modal";
import { Button } from "@/components/ui/button/button";
import { motion, AnimatePresence } from "framer-motion";
import LineChart from "@/components/charts/line";
import PieChart from "@/components/charts/pie";

const categories = [
  "Housing",
  "Transportation",
  "Food",
  "Utilities",
  "Healthcare",
  "Entertainment",
  "Shopping",
  "Education",
  "Travel",
  "Other",
];

const categoryConfig = {
  Housing: { icon: "fa-home", color: "#3b82f6", gradient: "from-blue-500 to-blue-600" },
  Transportation: { icon: "fa-car", color: "#10b981", gradient: "from-green-500 to-green-600" },
  Food: { icon: "fa-utensils", color: "#f59e0b", gradient: "from-orange-500 to-orange-600" },
  Utilities: { icon: "fa-bolt", color: "#eab308", gradient: "from-yellow-500 to-yellow-600" },
  Healthcare: { icon: "fa-heartbeat", color: "#ef4444", gradient: "from-red-500 to-red-600" },
  Entertainment: { icon: "fa-film", color: "#8b5cf6", gradient: "from-purple-500 to-purple-600" },
  Shopping: { icon: "fa-shopping-bag", color: "#ec4899", gradient: "from-pink-500 to-pink-600" },
  Education: { icon: "fa-graduation-cap", color: "#06b6d4", gradient: "from-cyan-500 to-cyan-600" },
  Travel: { icon: "fa-plane", color: "#6366f1", gradient: "from-indigo-500 to-indigo-600" },
  Other: { icon: "fa-ellipsis-h", color: "#6b7280", gradient: "from-gray-500 to-gray-600" },
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatCurrency(cents: number) {
  return currencyFormatter.format(cents / 100);
}

function ExpenseManager() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [timeRange, setTimeRange] = useState("30");
  const { data: user } = useUser();

  const fetchExpenses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "READ", userId: user.id }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch expenses");
      }
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setExpenses(data.expenses || []);
    } catch (err) {
      console.error("Expense fetch error:", err);
      setError("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchExpenses();
    }
  }, [user, fetchExpenses]);

  const handleSubmit = useCallback(
    async (expenseData: Expense) => {
      if (!user) return;
      try {
        const method = editingExpense ? "UPDATE" : "CREATE";
        const response = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method,
            ...expenseData,
            id: editingExpense?.id,
          }),
        });
        if (!response.ok) {
          throw new Error("Failed to save expense");
        }
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        setShowModal(false);
        setEditingExpense(null);
        fetchExpenses();
      } catch (err) {
        console.error("Expense save error:", err);
        setError("Failed to save expense");
      }
    },
    [editingExpense, fetchExpenses, user]
  );

  const handleDelete = useCallback(
    async (expenseId: string) => {
      if (!user) return;
      if (!confirm("Are you sure you want to delete this expense?")) return;
      try {
        const response = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "DELETE",
            userId: user.id,
            id: expenseId,
          }),
        });
        if (!response.ok) {
          throw new Error("Failed to delete expense");
        }
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        fetchExpenses();
      } catch (err) {
        console.error("Expense deletion error:", err);
        setError("Failed to delete expense");
      }
    },
    [fetchExpenses, user]
  );

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
      const category = expense.category || 'Other';
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

  const averageMonthlyExpense = useMemo(() => {
    const total = monthlyExpensesTrend.reduce((sum, month) => sum + month.amount, 0);
    return total / (monthlyExpensesTrend.length || 1);
  }, [monthlyExpensesTrend]);

  interface ExpenseModalProps {
    onClose: () => void;
    onSubmit: (expense: Expense) => void;
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

    const { data: user } = useUser();

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      onSubmit({
        ...formData,
        amount: parseFloat(formData.amount) * 100,
        userId: user?.id ?? "",
        date: formData.date,
        description: formData.description,
        category: formData.category,
        recurrence: formData.recurrence ?? "one-time",
        frequency: formData.recurrence === "recurring" ? formData.frequency : undefined,
      });
    };

    return (
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 w-full max-w-md border border-white/10 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            {initialData ? "Edit Expense" : "Add New Expense"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-all duration-200"
              required
            >
              <option value="" className="bg-gray-800">Select Category</option>
              {categories.map((category) => (
                <option key={category} value={category} className="bg-gray-800">
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-all duration-200"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-all duration-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-all duration-200"
              placeholder="What was this expense for?"
              required
            />
          </div>

          <div>
            <label className="inline-flex items-center text-gray-300 space-x-3 cursor-pointer">
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
                className="form-checkbox h-5 w-5 text-red-500 rounded border-gray-600 bg-white/10 focus:ring-red-500"
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Recurrence Frequency
              </label>
              <select
                value={formData.frequency}
                onChange={(e) =>
                  setFormData({ ...formData, frequency: e.target.value as ExpenseFormData["frequency"] })
                }
                className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-all duration-200"
              >
                {["Daily", "Weekly", "Biweekly", "Monthly", "Quarterly", "Yearly"].map((f) => (
                  <option key={f} value={f} className="bg-gray-800">
                    {f}
                  </option>
                ))}
              </select>
            </motion.div>
          )}

          <div className="flex justify-end space-x-4 pt-6 border-t border-white/10">
            <Button
              type="button"
              onClick={onClose}
              variant="ghost"
              className="px-6 py-3 hover:bg-white/10"
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
    const config = categoryConfig[expense.category as keyof typeof categoryConfig] || categoryConfig.Other;

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
            <div className={`p-3 bg-gradient-to-r ${config.gradient} rounded-lg mr-4 shadow-lg`}>
              <i className={`fas ${config.icon} text-white text-xl`}></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{expense.description}</h3>
              <p className="text-sm text-gray-400">{expense.category}</p>
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 border-4 border-red-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
      </div>

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
            <Button
              onClick={handleOpenModal}
              className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-medium shadow-lg px-6 py-3"
            >
              <i className="fas fa-plus mr-2"></i>
              Add Expense
            </Button>
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

          <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-sm rounded-xl p-6 border border-orange-500/30">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Monthly Average</p>
                <p className="text-3xl font-bold text-orange-400 mt-1">
                  ${averageMonthlyExpense.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <i className="fas fa-calendar text-orange-400 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Total Transactions</p>
                <p className="text-3xl font-bold text-purple-400 mt-1">
                  {expenses.length}
                </p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <i className="fas fa-exchange-alt text-purple-400 text-xl"></i>
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
              data={Object.entries(expensesByCategory).map(([category, data]) => ({
                name: category,
                value: data.amount / 100,
                color: categoryConfig[category as keyof typeof categoryConfig]?.color || "#6b7280",
              }))}
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
                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
            >
              All Categories
            </button>
            {Object.keys(expensesByCategory).map((category) => (
              <button
                key={category}
                onClick={() => setFilterCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  filterCategory === category
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                }`}
              >
                {category} ({expensesByCategory[category].count})
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === "grid"
                  ? 'bg-white/20 text-white'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
            >
              <i className="fas fa-th"></i>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === "list"
                  ? 'bg-white/20 text-white'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
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
                {filterCategory === "all" ? "No Expenses Yet" : `No ${filterCategory} expenses`}
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
      </div>

      {/* Modal */}
      {(showModal || editingExpense) && (
        <Modal isOpen={true} onClose={handleCloseModal}>
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