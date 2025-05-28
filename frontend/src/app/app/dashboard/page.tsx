'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { User } from '@/types/global';
import { Tile } from '@/components/ui/tile/tile';
import { Button } from '@/components/ui/button/button';
import LineChart from '@/components/charts/line';
import PieChart from '@/components/charts/pie';
import type { Asset, Expense } from "@/types/global";
import { useUser } from '@/lib/user';
import { motion, AnimatePresence } from 'framer-motion';

const tabs = [
  { id: 'overview', label: 'Overview', icon: 'fa-chart-pie' },
  { id: 'assets', label: 'Assets', icon: 'fa-wallet' },
  { id: 'expenses', label: 'Expenses', icon: 'fa-receipt' },
  { id: 'insights', label: 'Insights', icon: 'fa-lightbulb' },
];

const timeRanges = ["week", "month", "quarter", "year", "all"];

function DashboardPage() {
  const { data: user } = useUser() as { data: User | null };
  const [assets, setAssets] = useState<Asset[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState("month");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [assetsRes, expensesRes] = await Promise.all([
        fetch(`/api/assets?userId=${user?.id}`, { cache: 'no-store' }),
        fetch(`/api/expenses?userId=${user?.id}`, { cache: 'no-store' }),
      ]);

      const assetsData = await assetsRes.json();
      const expensesData = await expensesRes.json();

      if (!Array.isArray(assetsData) || !Array.isArray(expensesData)) {
        throw new Error('Invalid data received from API');
      }

      setAssets(assetsData);
      setExpenses(expensesData);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4 md:p-6">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />
      </div>

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
            <p className="text-gray-400">Welcome back, {user?.name || 'User'}</p>
          </div>
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center transition-all duration-200 ${
                  activeTab === tab.id 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                    : 'hover:bg-white/10'
                }`}
              >
                <i className={`fas ${tab.icon} mr-2`} />
                <span className="hidden md:inline">{tab.label}</span>
              </Button>
            ))}
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

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
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
                        : 'bg-white/10 hover:bg-white/20 text-gray-300'
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
                  <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-xl p-6 border border-green-500/30 hover:border-green-400/50 transition-all duration-200 hover:shadow-lg hover:shadow-green-500/20">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">Net Worth</p>
                        <p className="text-3xl font-bold text-green-400 mt-1">
                          £{(netWorth / 100).toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 bg-green-500/20 rounded-lg">
                        <i className="fas fa-chart-line text-green-400 text-xl"></i>
                      </div>
                    </div>
                    <div className="flex items-center text-sm">
                      <i className="fas fa-arrow-up text-green-400 mr-1"></i>
                      <span className="text-green-400">12.5%</span>
                      <span className="text-gray-400 ml-1">vs last month</span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">Total Assets</p>
                        <p className="text-3xl font-bold text-blue-400 mt-1">
                          {assets.length}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-500/20 rounded-lg">
                        <i className="fas fa-wallet text-blue-400 text-xl"></i>
                      </div>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-gray-400">Across {Object.keys(assetsByType).length} categories</span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm rounded-xl p-6 border border-red-500/30 hover:border-red-400/50 transition-all duration-200 hover:shadow-lg hover:shadow-red-500/20">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">Monthly Expenses</p>
                        <p className="text-3xl font-bold text-red-400 mt-1">
                          £{(recentExpensesTotal / 100).toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 bg-red-500/20 rounded-lg">
                        <i className="fas fa-receipt text-red-400 text-xl"></i>
                      </div>
                    </div>
                    <div className="flex items-center text-sm">
                      <i className="fas fa-arrow-down text-green-400 mr-1"></i>
                      <span className="text-green-400">8.2%</span>
                      <span className="text-gray-400 ml-1">vs last month</span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/20">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">Savings Rate</p>
                        <p className="text-3xl font-bold text-purple-400 mt-1">
                          32%
                        </p>
                      </div>
                      <div className="p-3 bg-purple-500/20 rounded-lg">
                        <i className="fas fa-piggy-bank text-purple-400 text-xl"></i>
                      </div>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-gray-400">Of monthly income</span>
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
                  <Tile className="h-full bg-white/5 backdrop-blur-sm border border-white/10 hover:border-blue-500/30">
                    <h3 className="text-xl font-semibold mb-6 text-white flex items-center">
                      <i className="fas fa-chart-pie mr-2 text-blue-400"></i>
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
                  <Tile className="h-full bg-white/5 backdrop-blur-sm border border-white/10 hover:border-purple-500/30">
                    <h3 className="text-xl font-semibold mb-6 text-white flex items-center">
                      <i className="fas fa-chart-line mr-2 text-purple-400"></i>
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
                  <Tile className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-green-500/30">
                    <h3 className="text-xl font-semibold mb-4 text-white flex items-center">
                      <i className="fas fa-history mr-2 text-green-400"></i>
                      Recent Transactions
                    </h3>
                    <div className="space-y-3">
                      {expenses.slice(0, 5).map((expense, index) => (
                        <motion.div
                          key={expense.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + index * 0.1 }}
                          className="flex justify-between items-center p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200"
                        >
                          <div className="flex items-center">
                            <div className="p-2 bg-red-500/20 rounded-lg mr-3">
                              <i className={`fas ${
                                expense.category === 'Food' ? 'fa-utensils' :
                                expense.category === 'Transportation' ? 'fa-car' :
                                expense.category === 'Shopping' ? 'fa-shopping-bag' :
                                expense.category === 'Entertainment' ? 'fa-film' :
                                'fa-receipt'
                              } text-red-400`}></i>
                            </div>
                            <div>
                              <p className="font-medium">{expense.description}</p>
                              <p className="text-sm text-gray-400">
                                {new Date(expense.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <span className="text-red-400 font-semibold">
                            -£{(expense.amount / 100).toLocaleString()}
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
                  <Tile className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-orange-500/30">
                    <h3 className="text-xl font-semibold mb-4 text-white flex items-center">
                      <i className="fas fa-fire mr-2 text-orange-400"></i>
                      Top Spending Categories
                    </h3>
                    <div className="space-y-3">
                      {topExpenseCategories.map((category, index) => (
                        <motion.div
                          key={category.category}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.9 + index * 0.1 }}
                          className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{category.category}</span>
                            <span className="text-orange-400 font-semibold">
                              £{category.amount.toLocaleString()}
                            </span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${category.percentage}%` }}
                              transition={{ delay: 1 + index * 0.1, duration: 0.5 }}
                              className="bg-gradient-to-r from-orange-400 to-red-400 h-2 rounded-full"
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {category.percentage}% of total expenses
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </Tile>
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeTab === 'assets' && (
            <motion.div
              key="assets"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center py-12"
            >
              <i className="fas fa-wallet text-6xl text-blue-400 mb-4"></i>
              <h3 className="text-2xl font-semibold mb-2">Asset Details</h3>
              <p className="text-gray-400">Navigate to the Asset Manager for detailed asset management</p>
              <Button
                onClick={() => window.location.href = '/app/assetManager'}
                className="mt-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                Go to Asset Manager
              </Button>
            </motion.div>
          )}

          {activeTab === 'expenses' && (
            <motion.div
              key="expenses"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center py-12"
            >
              <i className="fas fa-receipt text-6xl text-red-400 mb-4"></i>
              <h3 className="text-2xl font-semibold mb-2">Expense Details</h3>
              <p className="text-gray-400">Navigate to the Expense Manager for detailed expense tracking</p>
              <Button
                onClick={() => window.location.href = '/app/expenseManager'}
                className="mt-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
              >
                Go to Expense Manager
              </Button>
            </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Tile className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-blue-500/30">
                    <h3 className="text-xl font-semibold mb-4 text-white flex items-center">
                      <i className="fas fa-lightbulb mr-2 text-yellow-400"></i>
                      Financial Health Score
                    </h3>
                    <div className="text-center py-8">
                      <div className="relative inline-flex items-center justify-center">
                        <svg className="w-32 h-32 transform -rotate-90">
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="none"
                            className="text-gray-700"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 56}`}
                            strokeDashoffset={`${2 * Math.PI * 56 * (1 - 0.78)}`}
                            className="text-green-400 transition-all duration-1000"
                          />
                        </svg>
                        <span className="absolute text-3xl font-bold text-green-400">78</span>
                      </div>
                      <p className="mt-4 text-gray-400">Excellent financial health!</p>
                    </div>
                  </Tile>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Tile className="bg-gradient-to-br from-green-500/10 to-blue-500/10 backdrop-blur-sm border border-green-500/30">
                    <h3 className="text-xl font-semibold mb-4 text-white flex items-center">
                      <i className="fas fa-chart-line mr-2 text-green-400"></i>
                      Key Insights
                    </h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-white/5 rounded-lg">
                        <p className="text-sm text-gray-400">Best Performing Asset</p>
                        <p className="font-semibold text-green-400">AAPL Stock (+24.5%)</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg">
                        <p className="text-sm text-gray-400">Biggest Expense Category</p>
                        <p className="font-semibold text-orange-400">Housing (35%)</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg">
                        <p className="text-sm text-gray-400">Monthly Savings</p>
                        <p className="font-semibold text-blue-400">£2,450</p>
                      </div>
                    </div>
                  </Tile>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

export default DashboardPage;