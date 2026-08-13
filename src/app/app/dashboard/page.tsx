"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import NetWorthDisplay from "@/components/netWorthDisplay";
import { MarketDataWidget } from "@/components/ui/marketData/marketDataWidget";
import { useAuth } from "@/lib/unifiedAuth";
import { createUserContext } from "@/lib/userUtils";
import { useAppPagePreloader } from "@/hooks/usePagePreloader";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { EnhancedGlassCard } from "@/components/ui/enhanced-glass/EnhancedGlassCard";
import { StatsGrid } from "@/components/common/StatsGrid";
import { Wallet, CreditCard, Home, TrendingUp } from "lucide-react";

// 🚀 PERFORMANCE: Dynamic import of Confetti to reduce initial bundle size and prevent hydration issues
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
  totalLiabilities: number;
  totalExpenses: number;
  properties: number;
  propertyValue: number;
  monthlyIncome: number;
  transactions: Transaction[];
  portfolioHistory: Array<{
    date: string;
    value: number;
  }>;
  news: NewsArticle[];
}

/** Only the asset fields the dashboard totals need. */
interface DashboardAsset {
  current_value?: number;
  purchase_price?: number;
}

/** Only the property fields the dashboard totals need. */
interface DashboardProperty {
  currentValue?: number;
  purchasePrice?: number;
}

/** Compact currency for stat subtitles, e.g. "$2.4M". */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** Only the expense fields the dashboard needs. */
interface DashboardExpense {
  amount?: number;
  date: string;
  description?: string;
  category?: string;
}

/**
 * Value of a holding.
 *
 * current_value is the TOTAL value of the position, not a unit price - the
 * price-sync job writes `quantity * price` into it, and assetManager reads it
 * directly. Multiplying by quantity here would double-count every holding.
 *
 * Falls back to purchase price when no current valuation exists yet, so an
 * asset added before its first price sync still counts rather than reading as
 * zero.
 */
function assetValue(asset: DashboardAsset): number {
  return asset.current_value ?? asset.purchase_price ?? 0;
}

/** Income is recorded as an expense row with a negative amount or an income category. */
/**
 * The categories that mean money arriving.
 *
 * This list has to match the one the expense manager sorts by and the one the
 * import path files credits under, because the expense table has no sign column
 * and the category is the only signal. It did not match: this page recognised
 * only "income", while the expense manager recognised four categories, so a
 * salary row counted as income on one screen and as spending on the other.
 */
const INCOME_CATEGORIES = new Set([
  "income",
  "salary",
  "investment_income",
  "freelance",
]);

function isIncome(expense: DashboardExpense): boolean {
  if ((expense.amount ?? 0) < 0) return true;
  return INCOME_CATEGORIES.has((expense.category ?? "").toLowerCase());
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

// DashboardSkeleton is now imported from @/components/ui/skeleton

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

  // IMPROVEMENT: Detect post-authentication state more reliably
  const isPostAuthentication = useMemo(() => {
    if (typeof window === "undefined") return false;

    // Check for specific URL parameters that indicate recent authentication
    const urlParams = new URLSearchParams(window.location.search);
    const hasAuthAction = urlParams.get("auth-action") === "signing-in";
    const hasAuthSuccess = urlParams.get("auth") === "success";
    const hasUpdatedProfile = urlParams.get("updated") === "profile";

    // Also check if this is the first dashboard visit in this session
    const hasVisitedDashboardThisSession = sessionStorage.getItem(
      "dashboard-visited-in-session"
    );
    const isFirstDashboardVisit = !hasVisitedDashboardThisSession;

    // Mark that we've visited the dashboard this session
    if (isFirstDashboardVisit) {
      sessionStorage.setItem("dashboard-visited-in-session", "true");
    }

    // Preload if any auth-related condition is met OR it's the first dashboard visit
    return (
      hasAuthAction ||
      hasAuthSuccess ||
      hasUpdatedProfile ||
      isFirstDashboardVisit
    );
  }, []);

  // 🚀 Intelligent preloader - only runs after authentication, not on every dashboard visit
  useAppPagePreloader({
    delay: 2000, // Wait 2 seconds after dashboard loads
    isPostAuthentication, // Only preload when user has just authenticated
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

      // Real data, from the user's own records.
      //
      // This previously waited 500ms and then displayed hardcoded figures -
      // ~$875k of assets, 2 properties, a fixed transaction list and invented
      // market headlines - to every user, with Math.random() variance to make
      // them look live. A brand new account with nothing in it showed a
      // six-figure net worth. Nothing here was ever fetched.
      const [assetsRes, expensesRes, propertiesRes, liabilitiesRes] =
        await Promise.all([
          fetch("/api/assets", { credentials: "same-origin" }),
          fetch("/api/expenses", { credentials: "same-origin" }),
          fetch("/api/properties", { credentials: "same-origin" }),
          fetch("/api/liabilities", { credentials: "same-origin" }),
        ]);

      if (!assetsRes.ok || !expensesRes.ok || !propertiesRes.ok) {
        throw new Error("Could not load your dashboard data");
      }

      const [assetsJson, expensesJson, propertiesJson] = await Promise.all([
        assetsRes.json(),
        expensesRes.json(),
        propertiesRes.json(),
      ]);

      // Liabilities are read separately and tolerantly. A failure here should
      // not blank the whole dashboard, and until this endpoint existed the
      // headline figure counted assets only.
      const liabilitiesJson = liabilitiesRes.ok
        ? await liabilitiesRes.json()
        : null;

      const assets: DashboardAsset[] = assetsJson?.assets ?? [];
      const expenses: DashboardExpense[] = expensesJson?.expenses ?? [];
      const properties: DashboardProperty[] = propertiesJson?.properties ?? [];

      // Balances arrive in dollars, matching assets and properties.
      const liabilities: Array<{ balance?: number }> =
        liabilitiesJson?.liabilities ?? [];
      const totalLiabilities = liabilities.reduce(
        (sum, liability) => sum + (liability.balance ?? 0),
        0
      );

      const propertyValue = properties.reduce(
        (sum, property) =>
          sum + (property.currentValue ?? property.purchasePrice ?? 0),
        0
      );

      const totalAssets = assets.reduce(
        (sum, asset) => sum + assetValue(asset),
        0
      );

      // Expenses and income are both recorded as expense rows; income is
      // distinguished by a negative amount or an explicit income category.
      const now = new Date();
      const thisMonth = expenses.filter((expense) => {
        const date = new Date(expense.date);
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      });

      // Expense amounts arrive in CENTS - that is the documented wire format
      // for /api/expenses, and the expense manager divides by 100 for the same
      // reason. Assets and properties arrive in dollars. This page was adding
      // the two together, so a month of expenses read a hundred times too
      // large next to the asset values beside it.
      const toDollars = (cents: number) => cents / 100;

      const totalExpenses = toDollars(
        thisMonth
          .filter((expense) => !isIncome(expense))
          .reduce((sum, expense) => sum + Math.abs(expense.amount ?? 0), 0)
      );

      const monthlyIncome = toDollars(
        thisMonth
          .filter(isIncome)
          .reduce((sum, expense) => sum + Math.abs(expense.amount ?? 0), 0)
      );

      const transactions: Transaction[] = [...expenses]
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        .slice(0, 5)
        .map((expense) => ({
          type: isIncome(expense) ? "income" : "expense",
          amount: toDollars(Math.abs(expense.amount ?? 0)),
          date: expense.date,
          description: expense.description || expense.category || "Transaction",
        }));

      setData({
        totalAssets,
        totalLiabilities,
        totalExpenses,
        properties: properties.length,
        propertyValue,
        monthlyIncome,
        transactions,
        portfolioHistory: [],
        // No news provider is wired up. An empty list renders nothing, which
        // is honest; the previous hardcoded headlines were presented as real.
        news: [],
      });

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

  const dashboardData: DashboardData = data || {
    totalAssets: 0,
    totalLiabilities: 0,
    totalExpenses: 0,
    properties: 0,
    propertyValue: 0,
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
        {/*
          Net worth is everything owned less everything owed.

          This used to pass THIS MONTH'S EXPENSES as total liabilities, so the
          headline figure was assets minus one month of spending - which for
          the sample portfolio produced a net worth of minus eight hundred
          thousand. Expenses are not liabilities.

          Property value is included here. It was computed, displayed on its
          own card as "valued at ..." and then left out of both total assets
          and net worth.

          Liabilities now come from /api/liabilities. They read zero until the
          user records one, which is different from the figure being unavailable:
          it previously said zero because nothing exposed the table at all.
        */}
        <NetWorthDisplay
          totalAssets={dashboardData.totalAssets + dashboardData.propertyValue}
          totalLiabilities={dashboardData.totalLiabilities}
          showTaxToggle={true}
        />
      </div>

      {/* Stats Grid */}
      <StatsGrid
        items={[
          // No `trend` values here. They were hardcoded to +12.5% and -5.2%
          // and rendered as though measured, on a dashboard that fetched
          // nothing. Real trends need a historical comparison the app does not
          // yet store; showing nothing is preferable to showing a number that
          // is always the same.
          {
            label: "Total Assets",
            value: dashboardData.totalAssets,
            format: "currency" as const,
            icon: <Wallet />,
            iconColor: "text-blue-500",
          },
          {
            label: "Monthly Expenses",
            value: dashboardData.totalExpenses,
            format: "currency" as const,
            subtitle: "this month",
            icon: <CreditCard />,
            iconColor: "text-red-500",
          },
          {
            label: "Properties",
            value: dashboardData.properties,
            format: "number" as const,
            // Actual combined value, replacing a hardcoded "Valued at $2.4M"
            // that was shown even when the user had no properties.
            subtitle:
              dashboardData.properties > 0
                ? `Valued at ${formatCurrency(dashboardData.propertyValue)}`
                : undefined,
            icon: <Home />,
            iconColor: "text-purple-500",
          },
          {
            label: "Monthly Income",
            value: dashboardData.monthlyIncome,
            format: "currency" as const,
            subtitle: "this month",
            icon: <TrendingUp />,
            iconColor: "text-green-500",
          },
        ]}
        variant="performance"
        columns={4}
        className="mb-8"
        data-testid="portfolio-summary"
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts and Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Portfolio Performance Chart */}
          <EnhancedGlassCard variant="standard" padding="md" animate animationDelay={0.1} enableLensing>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Portfolio Performance
            </h2>
            <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <i className="fas fa-chart-area text-6xl opacity-20"></i>
            </div>
          </EnhancedGlassCard>

          {/* Quick Actions */}
          <EnhancedGlassCard variant="standard" padding="md" animate animationDelay={0.1} enableLensing>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/app/assetManager"
                className="flex items-center justify-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                data-testid="add-asset-button"
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
                href="/app/propertyManager"
                className="flex items-center justify-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
              >
                <i className="fas fa-building text-xl"></i>
                <span className="font-medium">Add Property</span>
              </Link>
              <Link
                href="/app/assetManager"
                className="flex items-center justify-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                <i className="fas fa-file-alt text-xl"></i>
                <span className="font-medium">View Reports</span>
              </Link>
            </div>
          </EnhancedGlassCard>
        </div>

        {/* Right Column - Activity Feed */}
        <div className="space-y-6">
          {/* Recent Transactions */}
          <EnhancedGlassCard
            variant="standard" padding="md" animate animationDelay={0.3}
            data-testid="assets-table"
            enableLensing
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Expenses
              </h2>
              <Link
                href="/app/expenseManager"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                View all expenses
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
          </EnhancedGlassCard>

          {/* Market Data Widget */}
          <MarketDataWidget />

          {/* Financial News */}
          <EnhancedGlassCard variant="standard" padding="md" animate animationDelay={0.1} enableLensing>
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
          </EnhancedGlassCard>
        </div>
      </div>
    </div>
  );
}
