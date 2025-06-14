"use client";
import type { Expense } from "@/types/global";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useStableUserId, useStableAuthToken } from "@/hooks/useStableUser";
import { useAppContext } from "@/components/layout/layoutWrapper";
import { ExpenseModal } from "@/components/modals/ExpenseModal";
import { Button } from "@/components/ui/button/button";
import { motion, AnimatePresence } from "framer-motion";
import LineChart from "@/components/charts/line";
import PieChart from "@/components/charts/pie";
import FinancialInsights from "@/components/insights/FinancialInsights";
import {
  getAllCategories,
  getSubcategories,
  getCategoryInfo,
} from "@/lib/transactionClassifier";
import {
  SkeletonCard,
  Skeleton,
  SkeletonStat,
  SkeletonButton,
  SkeletonInput,
} from "@/components/ui/skeleton";
import { GlassCard } from "@/components/cards";

function ExpenseManager() {
  const { formatCurrency } = useAppContext();

  // 🚀 PERFORMANCE: Use stable user hooks to prevent unnecessary re-renders
  const userId = useStableUserId();
  const authToken = useStableAuthToken();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState("30");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "table">("grid");
  const [activeTab, setActiveTab] = useState<"expenses" | "insights">(
    "expenses"
  );
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(
    new Set()
  );
  const [openCategoryDropdown, setOpenCategoryDropdown] = useState<
    string | null
  >(null);

  const [filters, setFilters] = useState({
    type: "all",
    amountMin: "",
    amountMax: "",
    dateFrom: "",
    dateTo: "",
    subcategory: "",
  });

  // Use refs to track abort controllers for cleanup
  const fetchAbortControllerRef = useRef<AbortController | null>(null);
  const submitAbortControllerRef = useRef<AbortController | null>(null);
  const deleteAbortControllerRef = useRef<AbortController | null>(null);
  const bulkDeleteAbortControllerRef = useRef<AbortController | null>(null);

  // Cleanup function for all abort controllers
  const cleanup = useCallback(() => {
    if (fetchAbortControllerRef.current) {
      fetchAbortControllerRef.current.abort();
      fetchAbortControllerRef.current = null;
    }
    if (submitAbortControllerRef.current) {
      submitAbortControllerRef.current.abort();
      submitAbortControllerRef.current = null;
    }
    if (deleteAbortControllerRef.current) {
      deleteAbortControllerRef.current.abort();
      deleteAbortControllerRef.current = null;
    }
    if (bulkDeleteAbortControllerRef.current) {
      bulkDeleteAbortControllerRef.current.abort();
      bulkDeleteAbortControllerRef.current = null;
    }
  }, []);

  const fetchExpenses = useCallback(async () => {
    if (!userId) return;

    // Cancel any ongoing request
    cleanup();

    // Create new AbortController for this request
    const controller = new AbortController();
    fetchAbortControllerRef.current = controller;

    setLoading(true);
    try {
      // 🚀 FIX: Convert from legacy POST+method format to proper REST API calls
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Add authentication header
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      // Use GET with query parameters instead of POST with body
      const queryParams = timeRange ? `?days=${timeRange}` : "";
      const response = await fetch(`/api/expenses${queryParams}`, {
        method: "GET", // ✅ Changed from POST to GET
        headers,
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      if (!controller.signal.aborted) {
        setExpenses(data.expenses || []);
        setError(null);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        // Request was aborted, this is expected
        return;
      }
      console.error("Error loading expenses:", err);
      if (!controller.signal.aborted) {
        setError("Failed to load expenses");
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [userId, timeRange, cleanup, authToken]);

  useEffect(() => {
    if (userId) fetchExpenses();
  }, [userId, fetchExpenses]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

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

  // Close category dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openCategoryDropdown && event.target instanceof Element) {
        const closestDropdown = event.target.closest("[data-dropdown]");
        if (!closestDropdown) {
          setOpenCategoryDropdown(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openCategoryDropdown]);

  const handleSubmit = useCallback(
    async (expenseData: Omit<Expense, "id"> & { id?: string }) => {
      if (!userId) return;

      // Cancel any ongoing submit request
      if (submitAbortControllerRef.current) {
        submitAbortControllerRef.current.abort();
      }

      // Create new AbortController for this request
      const controller = new AbortController();
      submitAbortControllerRef.current = controller;

      try {
        // 🚀 FIX: Convert to proper REST API calls
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        // Add authentication header
        if (authToken) {
          headers["Authorization"] = `Bearer ${authToken}`;
        }

        // For new expenses, we need to add an id if it doesn't exist
        const expenseWithId: Expense = {
          ...expenseData,
          id: expenseData.id || Date.now().toString(),
          userId: userId,
        };

        if (editingExpense) {
          // UPDATE: Use PATCH with ID in URL
          const response = await fetch(`/api/expenses/${editingExpense.id}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify(expenseWithId),
            signal: controller.signal,
          });

          if (controller.signal.aborted) return;

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          if (data.error) throw new Error(data.error);
        } else {
          // CREATE: Use POST without method parameter
          const response = await fetch("/api/expenses", {
            method: "POST",
            headers,
            body: JSON.stringify(expenseWithId),
            signal: controller.signal,
          });

          if (controller.signal.aborted) return;

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          if (data.error) throw new Error(data.error);
        }

        if (!controller.signal.aborted) {
          setShowModal(false);
          setEditingExpense(null);
          fetchExpenses();
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          // Request was aborted, this is expected
          return;
        }
        console.error("Expense save error:", err);
        if (!controller.signal.aborted) {
          setError("Failed to save expense");
        }
      }
    },
    [editingExpense, userId, fetchExpenses, authToken]
  );

  const handleDelete = useCallback(
    async (expenseId: string) => {
      if (!userId) return;
      if (!confirm("Are you sure you want to delete this expense?")) return;

      // Cancel any ongoing delete request
      if (deleteAbortControllerRef.current) {
        deleteAbortControllerRef.current.abort();
      }

      // Create new AbortController for this request
      const controller = new AbortController();
      deleteAbortControllerRef.current = controller;

      try {
        // 🚀 FIX: Convert to proper REST API calls
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        // Add authentication header
        if (authToken) {
          headers["Authorization"] = `Bearer ${authToken}`;
        }

        // DELETE: Use DELETE with ID in URL
        const response = await fetch(`/api/expenses/${expenseId}`, {
          method: "DELETE",
          headers,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        if (!controller.signal.aborted) {
          fetchExpenses();
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          // Request was aborted, this is expected
          return;
        }
        console.error("Expense deletion error:", err);
        if (!controller.signal.aborted) {
          setError("Failed to delete expense");
        }
      }
    },
    [userId, fetchExpenses, authToken]
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

  // Memoized categories for performance
  const allCategories = useMemo(() => getAllCategories(), []);

  // Calculate metrics
  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  const expensesByCategory = useMemo(() => {
    return expenses.reduce((acc, expense) => {
      const category = expense.category || "other";
      if (!acc[category]) acc[category] = { count: 0, amount: 0 };
      acc[category].count++;
      acc[category].amount += expense.amount;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    let filtered = expenses;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (expense) =>
          expense.description.toLowerCase().includes(query) ||
          getCategoryInfo(expense.category)
            .name.toLowerCase()
            .includes(query) ||
          (expense.notes && expense.notes.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (filterCategory !== "all") {
      filtered = filtered.filter((expense) => {
        if (filters.subcategory) {
          return expense.category === filters.subcategory;
        }
        // Check if expense category is the parent category or a subcategory of it
        const categoryInfo = getCategoryInfo(expense.category);
        return (
          expense.category === filterCategory ||
          categoryInfo.parent === filterCategory
        );
      });
    }

    // Type filter
    if (filters.type !== "all") {
      if (filters.type === "recurring") {
        filtered = filtered.filter(
          (expense) => expense.recurrence === "recurring"
        );
      } else if (filters.type === "one-time") {
        filtered = filtered.filter(
          (expense) => expense.recurrence !== "recurring"
        );
      }
    }

    // Amount filters
    if (filters.amountMin) {
      const minAmount = parseFloat(filters.amountMin) * 100;
      filtered = filtered.filter((expense) => expense.amount >= minAmount);
    }
    if (filters.amountMax) {
      const maxAmount = parseFloat(filters.amountMax) * 100;
      filtered = filtered.filter((expense) => expense.amount <= maxAmount);
    }

    // Date filters
    if (filters.dateFrom) {
      filtered = filtered.filter((expense) => expense.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter((expense) => expense.date <= filters.dateTo);
    }

    return filtered;
  }, [expenses, filterCategory, filters, searchQuery]);

  const monthlyExpensesTrend = useMemo(() => {
    const monthsCount = timeRange === "365" ? 12 : timeRange === "90" ? 3 : 1;
    const months = Array.from({ length: monthsCount }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date.toISOString().slice(0, 7);
    }).reverse();

    return months.map((month) => {
      const monthExpenses = expenses.filter((exp) =>
        exp.date.startsWith(month)
      );
      const total = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      return {
        month: new Date(month + "-01").toLocaleDateString("en-US", {
          month: "short",
        }),
        amount: total / 100,
      };
    });
  }, [expenses, timeRange]);

  // Count subscriptions
  const subscriptionCount = useMemo(() => {
    return expenses.filter((e) => e.recurrence === "recurring" || e.frequency)
      .length;
  }, [expenses]);

  // CSV Export functionality - memoized for performance
  const exportToCSV = useCallback(() => {
    const headers = [
      "Date",
      "Description",
      "Category",
      "Amount",
      "Type",
      "Frequency",
      "Notes",
    ];

    const csvData = filteredExpenses.map((expense) => {
      const categoryInfo = getCategoryInfo(expense.category);
      return [
        expense.date,
        `"${expense.description}"`,
        `"${categoryInfo.name}"`,
        (expense.amount / 100).toFixed(2),
        expense.recurrence === "recurring" ? "Recurring" : "One-time",
        expense.frequency || "",
        `"${expense.notes || ""}"`,
      ];
    });

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `expenses_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSuccess("Expenses exported successfully!");
  }, [filteredExpenses]);

  // Enhanced Filters Component
  const AdvancedFilters = () => (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <i className="fas fa-filter mr-2"></i>
        Advanced Filters
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Transaction Type
          </label>
          <select
            value={filters.type}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, type: e.target.value }))
            }
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
          >
            <option value="all">All Types</option>
            <option value="one-time">One-time</option>
            <option value="recurring">Recurring</option>
          </select>
        </div>

        {/* Amount Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount Range
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.amountMin}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, amountMin: e.target.value }))
              }
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.amountMax}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, amountMax: e.target.value }))
              }
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date Range
          </label>
          <div className="flex space-x-2">
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
              }
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
            />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
              }
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={() =>
            setFilters({
              type: "all",
              amountMin: "",
              amountMax: "",
              dateFrom: "",
              dateTo: "",
              subcategory: "",
            })
          }
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Clear All Filters
        </button>
      </div>
    </motion.div>
  );

  // Bulk Actions Bar
  const BulkActionsBar = () => (
    <AnimatePresence>
      {showBulkActions && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 px-6 py-3"
        >
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {selectedExpenses.size} selected
            </span>

            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>

            <select
              onChange={(e) =>
                e.target.value && handleBulkCategoryUpdate(e.target.value)
              }
              className="text-sm bg-transparent border-none focus:outline-none text-gray-700 dark:text-gray-300"
              defaultValue=""
            >
              <option value="">Change Category</option>
              {allCategories.map((category) => (
                <optgroup key={category.id} label={category.name}>
                  <option value={category.id}>{category.name}</option>
                  {getSubcategories(category.id).map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            <button
              onClick={handleBulkDelete}
              className="text-sm text-red-600 hover:text-red-700 transition-colors flex items-center"
            >
              <i className="fas fa-trash mr-1"></i>
              Delete
            </button>

            <button
              onClick={() => {
                setSelectedExpenses(new Set());
                setShowBulkActions(false);
              }}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Bulk selection functions
  const handleSelectExpense = useCallback((expenseId: string) => {
    setSelectedExpenses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(expenseId)) {
        newSet.delete(expenseId);
      } else {
        newSet.add(expenseId);
      }
      setShowBulkActions(newSet.size > 0);
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedExpenses.size === filteredExpenses.length) {
      setSelectedExpenses(new Set());
      setShowBulkActions(false);
    } else {
      const allIds = new Set(filteredExpenses.map((e) => e.id).filter(Boolean));
      setSelectedExpenses(allIds);
      setShowBulkActions(allIds.size > 0);
    }
  }, [filteredExpenses, selectedExpenses.size]);

  const handleBulkDelete = useCallback(async () => {
    if (!userId || selectedExpenses.size === 0) return;

    const count = selectedExpenses.size;
    if (!confirm(`Are you sure you want to delete ${count} selected expenses?`))
      return;

    try {
      // 🚀 FIX: Convert to proper REST API calls
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Add authentication header
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      // Delete each selected expense using proper REST API
      for (const expenseId of selectedExpenses) {
        await fetch(`/api/expenses/${expenseId}`, {
          method: "DELETE",
          headers,
        });
      }

      setSelectedExpenses(new Set());
      setShowBulkActions(false);
      fetchExpenses();
      setSuccess(`Successfully deleted ${count} expenses`);
    } catch (err: unknown) {
      console.error("Bulk deletion error:", err);
      setError("Failed to delete selected expenses");
    }
  }, [
    userId,
    selectedExpenses,
    fetchExpenses,
    setSuccess,
    setError,
    authToken,
  ]);

  const handleBulkCategoryUpdate = useCallback(
    async (newCategory: string) => {
      if (!userId || selectedExpenses.size === 0) return;

      try {
        // 🚀 FIX: Convert to proper REST API calls
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        // Add authentication header
        if (authToken) {
          headers["Authorization"] = `Bearer ${authToken}`;
        }

        // Update each selected expense using proper REST API
        for (const expenseId of selectedExpenses) {
          const expense = expenses.find((e) => e.id === expenseId);
          if (expense) {
            await fetch(`/api/expenses/${expenseId}`, {
              method: "PATCH",
              headers,
              body: JSON.stringify({
                ...expense,
                category: newCategory,
              }),
            });
          }
        }

        setSelectedExpenses(new Set());
        setShowBulkActions(false);
        fetchExpenses();
        setSuccess(`Successfully updated ${selectedExpenses.size} expenses`);
      } catch (err: unknown) {
        console.error("Bulk update error:", err);
        setError("Failed to update selected expenses");
      }
    },
    [
      userId,
      selectedExpenses,
      expenses,
      fetchExpenses,
      setSuccess,
      setError,
      authToken,
    ]
  );

  // Comprehensive Expense Manager Skeleton
  const ExpenseManagerSkeleton = () => (
    <div className="min-h-screen text-gray-900 dark:text-white">
      <div className="relative z-10 p-4 md:p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-5 w-48" />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <SkeletonButton size="lg" className="w-40" />
              <SkeletonButton size="lg" className="w-36" />
              <SkeletonButton size="lg" className="w-36" />
            </div>
          </div>
        </div>

        {/* Stats Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <SkeletonStat key={i} />
          ))}
        </div>

        {/* Tab navigation skeleton */}
        <div className="flex space-x-1 mb-6">
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>

        {/* Filters skeleton */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search skeleton */}
            <div className="flex-1 max-w-md">
              <SkeletonInput className="w-full" />
            </div>

            {/* Filter controls skeleton */}
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-10 w-28 rounded-lg" />
              <Skeleton className="h-10 w-20 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Content area skeleton based on view mode */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} className="h-48" />
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <ExpenseManagerSkeleton />;
  }

  // Error Boundary Component
  const ErrorBoundary = ({
    children,
    error,
    retry,
  }: {
    children: React.ReactNode;
    error?: string | null;
    retry?: () => void;
  }) => {
    if (error) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <div className="text-red-500 text-6xl mb-4">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h3 className="text-xl font-medium text-gray-400 mb-2">
            Something went wrong
          </h3>
          <p className="text-gray-500 mb-6">{error}</p>
          {retry && (
            <Button
              onClick={retry}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium"
            >
              <i className="fas fa-redo mr-2"></i>
              Try Again
            </Button>
          )}
        </motion.div>
      );
    }
    return <>{children}</>;
  };

  const ExpenseCard = ({
    expense,
    onEdit,
    onDelete,
    isSelected,
    onSelect,
    showCheckbox = false,
  }: {
    expense: Expense;
    onEdit: (expense: Expense) => void;
    onDelete: (id: string) => void;
    isSelected?: boolean;
    onSelect?: (id: string) => void;
    showCheckbox?: boolean;
  }) => {
    const categoryInfo = getCategoryInfo(expense.category);

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
                checked={isSelected || false}
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
  };

  // Table Row Component
  const ExpenseTableRow = ({
    expense,
    onEdit,
    onDelete,
    isSelected,
    onSelect,
  }: {
    expense: Expense;
    onEdit: (expense: Expense) => void;
    onDelete: (id: string) => void;
    isSelected: boolean;
    onSelect: (id: string) => void;
  }) => {
    const categoryInfo = getCategoryInfo(expense.category);

    return (
      <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        <td className="px-4 py-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => expense.id && onSelect(expense.id)}
            className="form-checkbox h-4 w-4 text-blue-500 rounded"
          />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center">
            <div
              className={`p-2 bg-gradient-to-r ${categoryInfo.gradient} rounded-lg mr-3`}
            >
              <i className={`fas ${categoryInfo.icon} text-white text-sm`}></i>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {expense.description}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {categoryInfo.name}
              </div>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 font-medium text-red-500">
          -{formatCurrency(expense.amount)}
        </td>
        <td className="px-4 py-3 text-gray-900 dark:text-white">
          {new Date(expense.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </td>
        <td className="px-4 py-3">
          {expense.recurrence === "recurring" ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              <i className="fas fa-sync-alt mr-1"></i>
              {expense.frequency}
            </span>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">One-time</span>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(expense)}
              className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
            >
              <i className="fas fa-edit"></i>
            </button>
            <button
              onClick={() => expense.id && onDelete(expense.id)}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen text-gray-900 dark:text-white">
      <div className="relative z-10 p-4 md:p-6 max-w-7xl mx-auto">
        <BulkActionsBar />

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
              <p className="text-gray-400 mt-2">
                Track and manage your spending
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="/app/expenses/import"
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium shadow-lg px-6 py-3 rounded-xl transition-all duration-200 inline-flex items-center justify-center"
              >
                <i className="fas fa-upload mr-2"></i>
                Import Expenses
              </a>
              <button
                onClick={exportToCSV}
                className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium shadow-lg px-6 py-3 rounded-xl transition-all duration-200 inline-flex items-center justify-center"
              >
                <i className="fas fa-download mr-2"></i>
                Export CSV
              </button>
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

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="relative max-w-md mx-auto md:mx-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fas fa-search text-gray-400"></i>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all duration-200"
              placeholder="Search expenses by description, category, or notes..."
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center md:text-left">
              Found {filteredExpenses.length} expense
              {filteredExpenses.length !== 1 ? "s" : ""} matching &ldquo;
              {searchQuery}&rdquo;
            </p>
          )}
        </motion.div>

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

        <AnimatePresence mode="wait">
          {activeTab === "expenses" ? (
            <motion.div
              key="expenses"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
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
                      <div className="flex items-center mt-2">
                        <div className="flex space-x-1">
                          {/* Spending intensity dots */}
                          {Array.from({ length: 7 }, (_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                Math.random() > 0.3
                                  ? "bg-red-400"
                                  : "bg-gray-600"
                              }`}
                              title={`Day ${i + 1}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 ml-2">
                          Last 7 days
                        </span>
                      </div>
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
                      <div className="mt-2">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-700 rounded-full h-1.5">
                            <div
                              className="bg-purple-400 h-1.5 rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(
                                  (subscriptionCount / 10) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 ml-2">
                            of 10
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-purple-500/20 rounded-lg">
                      <i className="fas fa-sync-alt text-purple-400 text-xl"></i>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-sm rounded-xl p-6 border border-orange-500/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-400 text-sm">
                        Total Transactions
                      </p>
                      <p className="text-3xl font-bold text-orange-400 mt-1">
                        {expenses.length}
                      </p>
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <i className="fas fa-arrow-up mr-1"></i>
                          12% vs last month
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-orange-500/20 rounded-lg">
                      <i className="fas fa-exchange-alt text-orange-400 text-xl"></i>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
              >
                <GlassCard
                  variant="prominent"
                  padding="lg"
                  animate
                  animationDelay={0.2}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-white">
                      Spending Trend
                    </h3>
                    <div className="flex gap-2">
                      {["30", "90", "365"].map((days) => (
                        <button
                          key={days}
                          onClick={() => setTimeRange(days)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                            timeRange === days
                              ? "bg-gradient-to-r from-red-500 to-orange-500 text-white"
                              : "bg-white/10 text-gray-400 hover:bg-white/20"
                          }`}
                        >
                          {days === "365"
                            ? "Year"
                            : days === "90"
                            ? "Quarter"
                            : "Month"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <LineChart
                    data={monthlyExpensesTrend}
                    xKey="month"
                    lines={[{ dataKey: "amount", color: "#ef4444" }]}
                  />
                </GlassCard>

                <GlassCard
                  variant="prominent"
                  padding="lg"
                  animate
                  animationDelay={0.25}
                >
                  <h3 className="text-xl font-semibold text-white mb-6">
                    Spending by Category
                  </h3>
                  <PieChart
                    data={Object.entries(expensesByCategory).map(
                      ([category, data]) => {
                        const categoryInfo = getCategoryInfo(category);
                        return {
                          name: categoryInfo.name,
                          value: data.amount / 100,
                          color: categoryInfo.color,
                        };
                      }
                    )}
                  />
                </GlassCard>
              </motion.div>

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
                        ? "bg-gradient-to-r from-red-500 to-orange-500 text-white"
                        : "bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
                    }`}
                  >
                    All Categories
                  </button>
                  {allCategories.map((category) => {
                    const categoryExpenses = Object.keys(
                      expensesByCategory
                    ).filter((cat) => {
                      const catInfo = getCategoryInfo(cat);
                      return (
                        cat === category.id || catInfo.parent === category.id
                      );
                    });
                    const totalCount = categoryExpenses.reduce(
                      (sum, cat) => sum + (expensesByCategory[cat]?.count || 0),
                      0
                    );

                    if (totalCount === 0) return null;

                    return (
                      <div key={category.id} className="relative">
                        <button
                          onClick={() => {
                            if (openCategoryDropdown === category.id) {
                              setOpenCategoryDropdown(null);
                            } else {
                              setFilterCategory(category.id);
                              setOpenCategoryDropdown(category.id);
                            }
                          }}
                          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center ${
                            filterCategory === category.id
                              ? "bg-gradient-to-r from-red-500 to-orange-500 text-white"
                              : "bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
                          }`}
                          data-dropdown
                        >
                          <i className={`fas ${category.icon} mr-2`}></i>
                          {category.name} ({totalCount})
                          <i className="fas fa-chevron-down ml-2 text-xs"></i>
                        </button>

                        {openCategoryDropdown === category.id && (
                          <div
                            className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-48"
                            data-dropdown
                          >
                            <button
                              onClick={() => {
                                setFilterCategory(category.id);
                                setFilters((prev) => ({
                                  ...prev,
                                  subcategory: "",
                                }));
                                setOpenCategoryDropdown(null);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              All {category.name}
                            </button>
                            {getSubcategories(category.id).map((sub) => {
                              const subCount =
                                expensesByCategory[sub.id]?.count || 0;
                              if (subCount === 0) return null;
                              return (
                                <button
                                  key={sub.id}
                                  onClick={() => {
                                    setFilterCategory(category.id);
                                    setFilters((prev) => ({
                                      ...prev,
                                      subcategory: sub.id,
                                    }));
                                    setOpenCategoryDropdown(null);
                                  }}
                                  className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white flex items-center"
                                >
                                  <i
                                    className={`fas ${sub.icon} mr-2 text-sm`}
                                  ></i>
                                  {sub.name} ({subCount})
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === "grid"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
                    }`}
                    title="Grid View"
                  >
                    <i className="fas fa-th"></i>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === "list"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
                    }`}
                    title="List View"
                  >
                    <i className="fas fa-list"></i>
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === "table"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
                    }`}
                    title="Table View"
                  >
                    <i className="fas fa-table"></i>
                  </button>
                </div>
              </motion.div>

              <AdvancedFilters />

              {viewMode === "table" && filteredExpenses.length > 0 && (
                <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={
                          selectedExpenses.size === filteredExpenses.length &&
                          filteredExpenses.length > 0
                        }
                        onChange={handleSelectAll}
                        className="form-checkbox h-4 w-4 text-blue-500 rounded"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Select All ({filteredExpenses.length})
                      </span>
                    </label>
                    {selectedExpenses.size > 0 && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedExpenses.size} selected
                      </span>
                    )}
                  </div>

                  {selectedExpenses.size > 0 && (
                    <div className="flex items-center space-x-2">
                      <select
                        onChange={(e) =>
                          e.target.value &&
                          handleBulkCategoryUpdate(e.target.value)
                        }
                        className="text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-3 py-1"
                        defaultValue=""
                      >
                        <option value="">Change Category</option>
                        {allCategories.map((category) => (
                          <optgroup key={category.id} label={category.name}>
                            <option value={category.id}>{category.name}</option>
                            {getSubcategories(category.id).map((sub) => (
                              <option key={sub.id} value={sub.id}>
                                {sub.name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>

                      <button
                        onClick={handleBulkDelete}
                        className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors"
                      >
                        <i className="fas fa-trash mr-1"></i>
                        Delete Selected
                      </button>
                    </div>
                  )}
                </div>
              )}

              <AnimatePresence mode="wait">
                <ErrorBoundary error={error || undefined} retry={fetchExpenses}>
                  {loading ? (
                    <ExpenseManagerSkeleton />
                  ) : filteredExpenses.length === 0 ? (
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
                        {filterCategory === "all"
                          ? "No Expenses Yet"
                          : `No ${
                              getCategoryInfo(filterCategory).name
                            } Expenses`}
                      </h3>
                      <p className="text-gray-500 mb-6">
                        {filterCategory === "all"
                          ? "Start by adding your first expense to track your spending"
                          : "No expenses found in this category"}
                      </p>
                      <button
                        onClick={handleOpenModal}
                        className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-medium px-6 py-3 rounded-xl transition-all duration-200"
                      >
                        <i className="fas fa-plus mr-2"></i>
                        Add Your First Expense
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={`${viewMode}-${filterCategory}-${JSON.stringify(
                        filters
                      )}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      {viewMode === "grid" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filteredExpenses.map((expense) => (
                            <ExpenseCard
                              key={expense.id}
                              expense={expense}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              isSelected={selectedExpenses.has(
                                expense.id || ""
                              )}
                              onSelect={handleSelectExpense}
                              showCheckbox={filteredExpenses.length > 1}
                            />
                          ))}
                        </div>
                      )}

                      {viewMode === "list" && (
                        <div className="space-y-4">
                          {filteredExpenses.map((expense) => (
                            <ExpenseCard
                              key={expense.id}
                              expense={expense}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                              isSelected={selectedExpenses.has(
                                expense.id || ""
                              )}
                              onSelect={handleSelectExpense}
                              showCheckbox={filteredExpenses.length > 1}
                            />
                          ))}
                        </div>
                      )}

                      {viewMode === "table" && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                          <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  <input
                                    type="checkbox"
                                    checked={
                                      selectedExpenses.size ===
                                        filteredExpenses.length &&
                                      filteredExpenses.length > 0
                                    }
                                    onChange={handleSelectAll}
                                    className="form-checkbox h-4 w-4 text-blue-500 rounded"
                                  />
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Expense
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Amount
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Date
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Type
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                              {filteredExpenses.map((expense) => (
                                <ExpenseTableRow
                                  key={expense.id}
                                  expense={expense}
                                  onEdit={handleEdit}
                                  onDelete={handleDelete}
                                  isSelected={selectedExpenses.has(
                                    expense.id || ""
                                  )}
                                  onSelect={handleSelectExpense}
                                />
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </motion.div>
                  )}
                </ErrorBoundary>
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="insights"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <FinancialInsights expenses={expenses} timeRange={timeRange} />
            </motion.div>
          )}
        </AnimatePresence>

        {showModal && (
          <ExpenseModal
            onClose={handleCloseModal}
            onSubmit={handleSubmit}
            initialData={editingExpense}
            currentUserId={userId || undefined}
            categories={allCategories}
          />
        )}
      </div>
    </div>
  );
}

export default ExpenseManager;
