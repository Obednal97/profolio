'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { User } from '@/types/global';
import { useAppContext } from '@/components/layout/layoutWrapper';
import { Tile } from '@/components/ui/tile/tile';
import LineChart from '@/components/charts/line';
import PieChart from '@/components/charts/pie';
import type { Asset, Expense } from "@/types/global";
import { useUser } from '@/lib/user';
import { motion } from 'framer-motion';

const timeRanges = ["week", "month", "quarter", "year", "all"];

function DashboardPage() {
  const { data: user } = useUser() as { data: User | null };
  const { formatCurrency } = useAppContext();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("month");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { apiCall } = await import('@/lib/mockApi');
      
      const [assetsRes, expensesRes] = await Promise.all([
        apiCall('/api/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ method: 'READ', userId: user?.id }),
        }),
        apiCall('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ method: 'READ', userId: user?.id }),
        }),
      ]);

      const assetsData = await assetsRes.json();
      const expensesData = await expensesRes.json();

      if (assetsData.error) throw new Error(assetsData.error);
      if (expensesData.error) throw new Error(expensesData.error);

      setAssets(assetsData.assets || []);
      setExpenses(expensesData.expenses || []);
      setError(null); // Clear any previous errors
    } catch (err: unknown) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user?.id, fetchData]);

  const netWorth = useMemo(() => {
    return assets.reduce((total, asset) => total + (asset.current_value ?? 0), 0);
  }, [assets]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((total, exp) => total + (exp.amount ?? 0), 0);
  }, [expenses]);

  const assetsByType = useMemo(() => {
    return assets.reduce((acc, asset) => {
      const key = asset.type ?? 'other';
      acc[key] = (acc[key] ?? 0) + (asset.current_value ?? 0);
      return acc;
    }, {} as Record<string, number>);
  }, [assets]);

  const expensesByCategory = useMemo(() => {
    return expenses.reduce((acc, expense) => {
      const key = expense.category ?? 'Other';
      acc[key] = (acc[key] ?? 0) + (expense.amount ?? 0);
      return acc;
    }, {} as Record<string, number>);
  }, [expenses]);

  const recentExpensesTotal = useMemo(() => {
    return expenses.slice(0, 5).reduce((total, exp) => total + (exp.amount ?? 0), 0);
  }, [expenses]);

  const monthlyExpensesTrend = useMemo(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date.toISOString().slice(0, 7);
    }).reverse();

    return last6Months.map(month => {
      const monthExpenses = expenses.filter(exp => 
        exp.date.startsWith(month)
      );
      const total = monthExpenses.reduce((sum, exp) => sum + (exp.amount ?? 0), 0);
      return {
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
        amount: total / 100
      };
    });
  }, [expenses]);

  const topExpenseCategories = useMemo(() => {
    return Object.entries(expensesByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({
        category,
        amount: amount / 100,
        percentage: ((amount / totalExpenses) * 100).toFixed(1)
      }));
  }, [expensesByCategory, totalExpenses]);

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
    <main className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Financial Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Welcome back, {user?.name || 'User'}</p>
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

        {/* Time Range Selector */}
        <div className="flex flex-wrap gap-2 mb-8">
          {timeRanges.map((range) => (
            <motion.button
              key={range}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                timeRange === range
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </motion.button>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-400 transition-all duration-200 hover:shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Net Worth</p>
                  <p className="text-3xl font-bold text-green-500 mt-1">
                    {formatCurrency(netWorth / 100)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <i className="fas fa-chart-line text-green-500 text-xl"></i>
                </div>
              </div>
              <div className="flex items-center text-sm">
                <i className="fas fa-arrow-up text-green-500 mr-1"></i>
                <span className="text-green-500">12.5%</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">vs last month</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-400 transition-all duration-200 hover:shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Total Assets</p>
                  <p className="text-3xl font-bold text-blue-500 mt-1">
                    {assets.length}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <i className="fas fa-wallet text-blue-500 text-xl"></i>
                </div>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Across {Object.keys(assetsByType).length} categories</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-red-400 dark:hover:border-red-400 transition-all duration-200 hover:shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Monthly Expenses</p>
                  <p className="text-3xl font-bold text-red-500 mt-1">
                    {formatCurrency(recentExpensesTotal / 100)}
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <i className="fas fa-receipt text-red-500 text-xl"></i>
                </div>
              </div>
              <div className="flex items-center text-sm">
                <i className="fas fa-arrow-down text-green-500 mr-1"></i>
                <span className="text-green-500">8.2%</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">vs last month</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-400 transition-all duration-200 hover:shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Savings Rate</p>
                  <p className="text-3xl font-bold text-purple-500 mt-1">
                    32%
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <i className="fas fa-piggy-bank text-purple-500 text-xl"></i>
                </div>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Of monthly income</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts and Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Tile className="h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-400">
              <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white flex items-center">
                <i className="fas fa-chart-pie mr-2 text-blue-500"></i>
                Asset Distribution
              </h3>
              <div className="h-64">
                <PieChart
                  data={Object.entries(assetsByType).map(([type, value]) => ({
                    name: type.charAt(0).toUpperCase() + type.slice(1),
                    value: value / 100,
                    color:
                      type === "stock"
                        ? "#3b82f6"
                        : type === "crypto"
                        ? "#f59e0b"
                        : type === "property"
                        ? "#10b981"
                        : type === "cash"
                        ? "#8b5cf6"
                        : "#ec4899",
                  }))}
                />
              </div>
            </Tile>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Tile className="h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-400">
              <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white flex items-center">
                <i className="fas fa-chart-line mr-2 text-purple-500"></i>
                Expense Trend
              </h3>
              <div className="h-64">
                <LineChart
                  data={monthlyExpensesTrend}
                  xKey="month"
                  lines={[{ dataKey: "amount", color: "#a855f7" }]}
                />
              </div>
            </Tile>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Tile className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-400">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                <i className="fas fa-history mr-2 text-green-500"></i>
                Recent Transactions
              </h3>
              <div className="space-y-3">
                {expenses.slice(0, 5).map((expense, index) => (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200"
                  >
                    <div className="flex items-center">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg mr-3">
                        <i className={`fas ${
                          expense.category === 'Food' ? 'fa-utensils' :
                          expense.category === 'Transportation' ? 'fa-car' :
                          expense.category === 'Shopping' ? 'fa-shopping-bag' :
                          expense.category === 'Entertainment' ? 'fa-film' :
                          'fa-receipt'
                        } text-red-500`}></i>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{expense.description}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(expense.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-red-500 font-semibold">
                      -{formatCurrency(expense.amount / 100)}
                    </span>
                  </motion.div>
                ))}
              </div>
            </Tile>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Tile className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-400">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                <i className="fas fa-fire mr-2 text-orange-500"></i>
                Top Spending Categories
              </h3>
              <div className="space-y-3">
                {topExpenseCategories.map((category, index) => (
                  <motion.div
                    key={category.category}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">{category.category}</span>
                      <span className="text-orange-500 font-semibold">
                        {formatCurrency(category.amount)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${category.percentage}%` }}
                        transition={{ delay: 1 + index * 0.1, duration: 0.5 }}
                        className="bg-gradient-to-r from-orange-400 to-red-400 h-2 rounded-full"
                      />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {category.percentage}% of total expenses
                    </p>
                  </motion.div>
                ))}
              </div>
            </Tile>
          </motion.div>
        </div>
      </div>
    </main>
  );
}

export default DashboardPage;