"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import NetWorthDisplay from "@/components/netWorthDisplay";
import { MarketDataWidget } from "@/components/ui/marketData/marketDataWidget";
import { useAuth } from "@/lib/unifiedAuth";
import { createUserContext } from "@/lib/userUtils";
import { useAppPagePreloader } from "@/hooks/usePagePreloader";
import {
  SkeletonCard,
  SkeletonChart,
  SkeletonStat,
  Skeleton,
  SkeletonList,
  SkeletonButton,
} from "@/components/ui/skeleton";

// IMPROVEMENT: Dynamic import of Confetti to prevent hydration issues
const Confetti = dynamic(() => import("react-confetti"), {
  ssr: false,
  loading: () => null,
});

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

// IMPROVEMENT: Safe localStorage access utility
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn("localStorage access failed:", error);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn("localStorage write failed:", error);
    }
  },
};

// IMPROVEMENT: Safe window dimensions access
const getWindowDimensions = () => {
  if (typeof window === "undefined") {
    return { width: 1920, height: 1080 }; // Default dimensions for SSR
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

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
  const [dimensions, setDimensions] = useState(getWindowDimensions());

  // IMPROVEMENT: Check if user is in demo mode with safe localStorage access
  const isDemoMode = useMemo(() => {
    return safeLocalStorage.getItem("demo-mode") === "true";
  }, []);

  // Use centralized user context utility for consistent display
  const currentUser = useMemo(() => {
    return createUserContext(user, userProfile, isDemoMode);
  }, [user, userProfile, isDemoMode]);

  // 🚀 Intelligent preloader - starts after dashboard loads successfully
  useAppPagePreloader({
    delay: 2000, // Wait 2 seconds after dashboard loads
  });

  // IMPROVEMENT: Safe window resize handling for Confetti
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setDimensions(getWindowDimensions());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // IMPROVEMENT: Enhanced greeting system with better error handling
  const greeting = useMemo(() => {
    if (!currentUser?.name) return "Welcome to Profolio";

    const name = currentUser.name;
    const isFirstVisit = !safeLocalStorage.getItem(
      "user-has-visited-dashboard"
    );

    // First-time user greetings
    if (isFirstVisit) {
      const firstTimeGreetings = [
        `Hey there ${name}, great to meet you! 👋`,
        `Welcome to Profolio, ${name}! 🎉`,
        `Hi ${name}! Excited to have you aboard! ✨`,
        `Hello ${name}, let's build your wealth together! 💪`,
        `Welcome ${name}! Your financial journey starts here 🚀`,
        `Great to see you ${name}! Ready to take control? 📈`,
      ];
      return firstTimeGreetings[
        Math.floor(Math.random() * firstTimeGreetings.length)
      ];
    }

    // Returning user greetings - 20+ variations
    const returningGreetings = [
      `Welcome back, ${name}! 👋`,
      `Hey ${name}! Ready to conquer today? 💪`,
      `Good to see you again, ${name}! 🌟`,
      `Hello ${name}! Let's check your progress 📊`,
      `Hi there ${name}! Time to grow that wealth 📈`,
      `${name}! Your portfolio awaits 💼`,
      `Greetings ${name}! Another day, another opportunity 🎯`,
      `Hey ${name}! Let's make some money moves 💰`,
      `Welcome back ${name}! Fortune favours the prepared 🍀`,
      `${name}! Ready to build your empire? 🏰`,
      `Good day ${name}! Your financial future looks bright ☀️`,
      `Hello ${name}! Time to check those gains 📊`,
      `Hey there ${name}! Let's see what's happening 👀`,
      `${name}! Another step towards financial freedom 🗽`,
      `Welcome ${name}! Your wealth journey continues 🛤️`,
      `Hi ${name}! Ready to make smart moves? 🧠`,
      `Good to have you back, ${name}! 🤝`,
      `${name}! Let's turn goals into reality 🎯`,
      `Hey ${name}! Your future self will thank you 🙏`,
      `Welcome back ${name}! Every day is a new opportunity 🌅`,
      `Hello ${name}! Time to level up your game 🎮`,
      `${name}! Ready to outsmart the market? 📈`,
      `Hi there ${name}! Your dedication is inspiring 💎`,
      `Welcome ${name}! Success is a journey, not a destination 🚀`,
    ];

    return returningGreetings[
      Math.floor(Math.random() * returningGreetings.length)
    ];
  }, [currentUser]);

  // Dynamic subtitle
  const subtitle = useMemo(() => {
    const isFirstVisit = !safeLocalStorage.getItem(
      "user-has-visited-dashboard"
    );

    if (isFirstVisit) {
      const firstTimeSubtitles = [
        "Let's set up your financial dashboard and start tracking your wealth",
        "Welcome to your personal wealth command center",
        "Time to take control of your financial future",
        "Your journey to financial freedom starts here",
        "Let's build something amazing together",
        "Ready to transform how you manage money?",
      ];
      return firstTimeSubtitles[
        Math.floor(Math.random() * firstTimeSubtitles.length)
      ];
    }

    const returningSubtitles = [
      "Here's your financial overview for today",
      "Let's see how your portfolio is performing",
      "Your wealth summary awaits",
      "Time to check your financial progress",
      "Here's what's happening with your investments",
      "Your financial snapshot for today",
      "Let's dive into your numbers",
      "Ready to review your financial health?",
      "Here's your latest portfolio update",
      "Time to see how your money is working",
    ];

    return returningSubtitles[
      Math.floor(Math.random() * returningSubtitles.length)
    ];
  }, []);

  // IMPROVEMENT: Enhanced data fetching with better error handling
  const fetchDashboardData = useCallback(async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Mark that user has visited dashboard (for greeting system)
      safeLocalStorage.setItem("user-has-visited-dashboard", "true");

      // IMPROVEMENT: Reduced artificial delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      // IMPROVEMENT: More realistic mock data generation
      const mockDashboardData: DashboardData = {
        totalAssets: 875420 + Math.floor(Math.random() * 50000), // Add some variance
        totalExpenses: 4230 + Math.floor(Math.random() * 1000),
        properties: 2,
        monthlyIncome: 12500,
        transactions: [
          {
            type: "income",
            amount: 5000,
            date: "2024-01-15",
            description: "Salary Payment",
          },
          {
            type: "expense",
            amount: 150,
            date: "2024-01-14",
            description: "Grocery Shopping",
          },
          {
            type: "expense",
            amount: 89,
            date: "2024-01-13",
            description: "Netflix Subscription",
          },
          {
            type: "income",
            amount: 250,
            date: "2024-01-12",
            description: "Freelance Project",
          },
          {
            type: "expense",
            amount: 45,
            date: "2024-01-11",
            description: "Gas Station",
          },
        ],
        portfolioHistory: [],
        news: [
          {
            title: "S&P 500 Reaches New All-Time High",
            source: "Reuters",
            time: "2 hours ago",
            url: "#",
          },
          {
            title: "Fed Signals Potential Rate Cuts in 2024",
            source: "Bloomberg",
            time: "4 hours ago",
            url: "#",
          },
          {
            title: "Bitcoin Surges Past $70,000",
            source: "CoinDesk",
            time: "6 hours ago",
            url: "#",
          },
        ],
      };

      setData(mockDashboardData);

      // IMPROVEMENT: Enhanced confetti logic with safe localStorage
      const lastVisit = safeLocalStorage.getItem("lastDashboardVisit");
      const today = new Date().toDateString();
      if (lastVisit !== today) {
        setShowConfetti(true);
        safeLocalStorage.setItem("lastDashboardVisit", today);
        // IMPROVEMENT: Automatic cleanup of confetti
        setTimeout(() => setShowConfetti(false), 5000);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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
            onClick={fetchDashboardData}
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
    news: [],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      {showConfetti && (
        <Confetti
          width={dimensions.width}
          height={dimensions.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.1}
        />
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {greeting}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>
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
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Assets
              </p>
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
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Monthly Expenses
              </p>
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
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Properties
              </p>
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
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Monthly Income
              </p>
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
                data-testid="portfolio-dashboard-link"
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
              {dashboardData.transactions
                .slice(0, 5)
                .map((transaction: Transaction, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === "income"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                            : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                        }`}
                      >
                        <i
                          className={`fas ${
                            transaction.type === "income"
                              ? "fa-arrow-down"
                              : "fa-arrow-up"
                          }`}
                        ></i>
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
                    <p
                      className={`text-sm font-semibold ${
                        transaction.type === "income"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}$
                      {transaction.amount.toLocaleString()}
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
              {dashboardData.news
                .slice(0, 3)
                .map((article: NewsArticle, index: number) => (
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
