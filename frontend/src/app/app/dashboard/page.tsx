'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Confetti from 'react-confetti';
import NetWorthDisplay from '@/components/netWorthDisplay';
import { MarketDataWidget } from '@/components/ui/marketData/marketDataWidget';
import { useAuth } from '@/lib/unifiedAuth';
import { 
  SkeletonCard, 
  SkeletonChart, 
  SkeletonStat,
  Skeleton,
  SkeletonList,
  SkeletonButton
} from '@/components/ui/skeleton';

interface Transaction {
  type: string;
  amount: number;
  date: string;
  description: string;
}

interface NewsArticle {
  title: string;
  source: string;
  time: string;
  url: string;
}

interface DashboardData {
  totalAssets: number;
  totalExpenses: number;
  properties: number;
  monthlyIncome: number;
  transactions: Transaction[];
  portfolioHistory: Array<{
    date: string;
    value: number;
  }>;
  news: NewsArticle[];
}

// Skeleton component for the entire dashboard
function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      {/* Header skeleton */}
      <div className="mb-8">
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>

      {/* Net Worth skeleton */}
      <div className="mb-8">
        <SkeletonCard className="h-32" />
      </div>

      {/* Stats Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <SkeletonStat key={i} />
        ))}
      </div>

      {/* Main content grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart skeleton */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <SkeletonChart height="h-80" />
          </div>

          {/* Quick Actions skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <SkeletonButton key={i} size="lg" className="w-full" />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar skeleton */}
        <div className="space-y-6">
          {/* Recent Transactions skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <SkeletonList items={5} />
          </div>

          {/* Market Data skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          </div>

          {/* News skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <div className="flex gap-4">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, userProfile } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Check if user is in demo mode
  const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('demo-mode') === 'true';
  
  // Use database user profile or demo user - same logic as LayoutWrapper
  const currentUser = useMemo(() => {
    if (user) {
      // Priority: database profile name > Firebase displayName > email username
      const name = userProfile?.name || user.displayName || user.email?.split('@')[0] || 'User';
      return {
        id: user.id,
        name: name,
        email: user.email || ''
      };
    } else if (isDemoMode) {
      // Check for stored demo user data
      const demoUser = {
        id: 'demo-user-id',
        name: 'Demo User',
        email: 'demo@profolio.com'
      };
      
      if (typeof window !== 'undefined') {
        try {
          const storedUserData = localStorage.getItem('user-data');
          if (storedUserData) {
            const parsedData = JSON.parse(storedUserData);
            demoUser.name = parsedData.name || demoUser.name;
            demoUser.email = parsedData.email || demoUser.email;
          }
        } catch (error) {
          console.error('Error parsing demo user data:', error);
        }
      }
      
      return demoUser;
    }
    return null;
  }, [user?.id, user?.displayName, user?.email, userProfile?.name, isDemoMode]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Add artificial delay to show skeleton
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock the dashboard data for now
        const mockDashboardData: DashboardData = {
          totalAssets: 875420,
          totalExpenses: 4230,
          properties: 2,
          monthlyIncome: 12500,
          transactions: [
            { type: 'income', amount: 5000, date: '2024-01-15', description: 'Salary Payment' },
            { type: 'expense', amount: 150, date: '2024-01-14', description: 'Grocery Shopping' },
            { type: 'expense', amount: 89, date: '2024-01-13', description: 'Netflix Subscription' },
            { type: 'income', amount: 250, date: '2024-01-12', description: 'Freelance Project' },
            { type: 'expense', amount: 45, date: '2024-01-11', description: 'Gas Station' },
          ],
          portfolioHistory: [],
          news: [
            { title: 'S&P 500 Reaches New All-Time High', source: 'Reuters', time: '2 hours ago', url: '#' },
            { title: 'Fed Signals Potential Rate Cuts in 2024', source: 'Bloomberg', time: '4 hours ago', url: '#' },
            { title: 'Bitcoin Surges Past $70,000', source: 'CoinDesk', time: '6 hours ago', url: '#' },
          ]
        };
        
        setData(mockDashboardData);

        // Check if it's user's first login today
        const lastVisit = localStorage.getItem('lastDashboardVisit');
        const today = new Date().toDateString();
        if (lastVisit !== today) {
          setShowConfetti(true);
          localStorage.setItem('lastDashboardVisit', today);
          setTimeout(() => setShowConfetti(false), 5000);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <i className="fas fa-exclamation-circle text-red-500 text-3xl mb-3"></i>
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Failed to Load Dashboard
          </h3>
          <p className="text-red-600 dark:text-red-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const dashboardData = data || {
    totalAssets: 0,
    totalExpenses: 0,
    properties: 0,
    monthlyIncome: 0,
    transactions: [],
    portfolioHistory: [],
    news: []
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          gravity={0.1}
        />
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {currentUser?.name} 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here&apos;s your financial overview for today
        </p>
      </div>

      {/* Net Worth Display */}
      <div className="mb-8">
        <NetWorthDisplay
          totalAssets={dashboardData.totalAssets}
          totalLiabilities={dashboardData.totalExpenses}
          showTaxToggle={true}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Assets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${dashboardData.totalAssets.toLocaleString()}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                <i className="fas fa-arrow-up mr-1"></i>
                +12.5% this month
              </p>
            </div>
            <div className="text-3xl text-blue-500">
              <i className="fas fa-wallet"></i>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Expenses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${dashboardData.totalExpenses.toLocaleString()}
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                <i className="fas fa-arrow-down mr-1"></i>
                -5.2% vs last month
              </p>
            </div>
            <div className="text-3xl text-red-500">
              <i className="fas fa-credit-card"></i>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Properties</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardData.properties}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Valued at $2.4M
              </p>
            </div>
            <div className="text-3xl text-purple-500">
              <i className="fas fa-home"></i>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Income</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${dashboardData.monthlyIncome.toLocaleString()}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                <i className="fas fa-check-circle mr-1"></i>
                On track
              </p>
            </div>
            <div className="text-3xl text-green-500">
              <i className="fas fa-chart-line"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts and Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Portfolio Performance Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Portfolio Performance
            </h2>
            <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <i className="fas fa-chart-area text-6xl opacity-20"></i>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/app/portfolio"
                className="flex items-center justify-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <i className="fas fa-plus-circle text-xl"></i>
                <span className="font-medium">Add Asset</span>
              </Link>
              <Link
                href="/app/expenseManager"
                className="flex items-center justify-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <i className="fas fa-receipt text-xl"></i>
                <span className="font-medium">Add Expense</span>
              </Link>
              <Link
                href="/app/properties"
                className="flex items-center justify-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
              >
                <i className="fas fa-building text-xl"></i>
                <span className="font-medium">Add Property</span>
              </Link>
              <Link
                href="/app/reports"
                className="flex items-center justify-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                <i className="fas fa-file-alt text-xl"></i>
                <span className="font-medium">View Reports</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column - Activity Feed */}
        <div className="space-y-6">
          {/* Recent Transactions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Activity
              </h2>
              <Link
                href="/app/transactions"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {dashboardData.transactions.slice(0, 5).map((transaction: Transaction, index: number) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'income' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    }`}>
                      <i className={`fas ${
                        transaction.type === 'income' ? 'fa-arrow-down' : 'fa-arrow-up'
                      }`}></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold ${
                    transaction.type === 'income' 
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Market Data Widget */}
          <MarketDataWidget />

          {/* Financial News */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Market News
            </h2>
            <div className="space-y-4">
              {dashboardData.news.slice(0, 3).map((article: NewsArticle, index: number) => (
                <a
                  key={index}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 -m-2 rounded-lg transition-colors"
                >
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                    {article.title}
                  </h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {article.source}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {article.time}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}