"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import type { Expense } from "@/types/global";
import { useAppContext } from "@/components/layout/layoutWrapper";
import { getCategoryInfo } from "@/lib/transactionClassifier";
import LineChart from "@/components/charts/line";
import { GlassCard, PerformanceCard, InfoCard } from "@/components/cards";

interface FinancialInsightsProps {
  expenses: Expense[];
  timeRange: string;
}

interface CategorySpending {
  category: string;
  amount: number;
  count: number;
  change: number; // percentage change from previous period
  icon: string;
  color: string;
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
  [key: string]: string | number;
}

export default function FinancialInsights({
  expenses,
  timeRange,
}: FinancialInsightsProps) {
  const { formatCurrency } = useAppContext();

  // Separate income and expenses
  const { income, expenseTransactions } = useMemo(() => {
    const incomeCategories = [
      "income",
      "salary",
      "investment_income",
      "freelance",
    ];
    const income = expenses.filter((e) =>
      incomeCategories.includes(e.category)
    );
    const expenseTransactions = expenses.filter(
      (e) => !incomeCategories.includes(e.category)
    );

    return { income, expenseTransactions };
  }, [expenses]);

  // Calculate monthly data for trends
  const monthlyData = useMemo((): MonthlyData[] => {
    const monthsCount = timeRange === "365" ? 12 : timeRange === "90" ? 3 : 1;
    const dataByMonth = new Map<string, { income: number; expenses: number }>();

    // Initialize months
    for (let i = 0; i < monthsCount; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().slice(0, 7);
      dataByMonth.set(monthKey, { income: 0, expenses: 0 });
    }

    // Aggregate data
    expenses.forEach((transaction) => {
      const monthKey = transaction.date.slice(0, 7);
      if (dataByMonth.has(monthKey)) {
        const data = dataByMonth.get(monthKey)!;
        if (
          ["income", "salary", "investment_income", "freelance"].includes(
            transaction.category
          )
        ) {
          data.income += transaction.amount;
        } else {
          data.expenses += transaction.amount;
        }
      }
    });

    // Convert to array and calculate savings
    return Array.from(dataByMonth.entries())
      .map(([month, data]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", {
          month: "short",
        }),
        income: data.income / 100,
        expenses: data.expenses / 100,
        savings: (data.income - data.expenses) / 100,
        savingsRate:
          data.income > 0
            ? ((data.income - data.expenses) / data.income) * 100
            : 0,
      }))
      .reverse();
  }, [expenses, timeRange]);

  // Calculate category spending with trends
  const categorySpending = useMemo((): CategorySpending[] => {
    const midDate = new Date();
    midDate.setDate(midDate.getDate() - parseInt(timeRange) / 2);

    const spendingByCategory = new Map<
      string,
      { current: number; previous: number; count: number }
    >();

    expenseTransactions.forEach((expense) => {
      const category = expense.category || "other";
      const date = new Date(expense.date);
      const isCurrentPeriod = date >= midDate;

      if (!spendingByCategory.has(category)) {
        spendingByCategory.set(category, { current: 0, previous: 0, count: 0 });
      }

      const data = spendingByCategory.get(category)!;
      if (isCurrentPeriod) {
        data.current += expense.amount;
      } else {
        data.previous += expense.amount;
      }
      data.count++;
    });

    return Array.from(spendingByCategory.entries())
      .map(([category, data]) => {
        const categoryInfo = getCategoryInfo(category);
        const change =
          data.previous > 0
            ? ((data.current - data.previous) / data.previous) * 100
            : 0;

        return {
          category: categoryInfo.name,
          amount: (data.current + data.previous) / 100,
          count: data.count,
          change,
          icon: categoryInfo.icon,
          color: categoryInfo.color,
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8); // Top 8 categories
  }, [expenseTransactions, timeRange]);

  // Calculate key metrics
  const metrics = useMemo(() => {
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0) / 100;
    const totalExpenses =
      expenseTransactions.reduce((sum, t) => sum + t.amount, 0) / 100;
    const totalSavings = totalIncome - totalExpenses;
    const savingsRate =
      totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;
    const avgMonthlyExpense = totalExpenses / (parseInt(timeRange) / 30);
    const avgMonthlyIncome = totalIncome / (parseInt(timeRange) / 30);

    // Calculate subscriptions
    const subscriptions = expenseTransactions.filter(
      (e) =>
        (e.frequency &&
          e.frequency !== "Daily" &&
          e.frequency !== "Weekly" &&
          e.frequency !== "Biweekly" &&
          e.frequency !== "Monthly" &&
          e.frequency !== "Quarterly" &&
          e.frequency !== "Yearly") ||
        e.recurrence === "recurring"
    );
    const monthlySubscriptionCost = subscriptions.reduce((sum, sub) => {
      const amount = sub.amount / 100;
      switch (sub.frequency) {
        case "Daily":
          return sum + amount * 30;
        case "Weekly":
          return sum + amount * 4.33;
        case "Biweekly":
          return sum + amount * 2.17;
        case "Monthly":
          return sum + amount;
        case "Quarterly":
          return sum + amount / 3;
        case "Yearly":
          return sum + amount / 12;
        default:
          return sum + amount;
      }
    }, 0);

    // Project next month
    const projectedExpenses = avgMonthlyExpense;
    const projectedSavings = avgMonthlyIncome - projectedExpenses;

    return {
      totalIncome,
      totalExpenses,
      totalSavings,
      savingsRate,
      avgMonthlyExpense,
      avgMonthlyIncome,
      subscriptions: subscriptions.length,
      monthlySubscriptionCost,
      projectedExpenses,
      projectedSavings,
    };
  }, [income, expenseTransactions, timeRange]);

  // Budget recommendations based on 50/30/20 rule
  const budgetRecommendations = useMemo(() => {
    const monthlyIncome = metrics.avgMonthlyIncome;
    const needs = monthlyIncome * 0.5; // 50% for needs
    const wants = monthlyIncome * 0.3; // 30% for wants
    const savings = monthlyIncome * 0.2; // 20% for savings

    // Categorize current spending
    const needsCategories = [
      "rent_mortgage",
      "utilities",
      "groceries",
      "healthcare",
      "transportation",
    ];
    const currentNeeds =
      expenseTransactions
        .filter((e) => needsCategories.includes(e.category))
        .reduce((sum, e) => sum + e.amount, 0) /
      100 /
      (parseInt(timeRange) / 30);

    const currentWants =
      expenseTransactions
        .filter((e) => !needsCategories.includes(e.category))
        .reduce((sum, e) => sum + e.amount, 0) /
      100 /
      (parseInt(timeRange) / 30);

    return {
      needs: {
        recommended: needs,
        current: currentNeeds,
        difference: needs - currentNeeds,
      },
      wants: {
        recommended: wants,
        current: currentWants,
        difference: wants - currentWants,
      },
      savings: {
        recommended: savings,
        current: metrics.totalSavings / (parseInt(timeRange) / 30),
        difference: savings - metrics.totalSavings / (parseInt(timeRange) / 30),
      },
    };
  }, [metrics, expenseTransactions, timeRange]);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <PerformanceCard
            title="Total Income"
            value={metrics.totalIncome}
            performance={metrics.savingsRate}
            subtitle={`${formatCurrency(metrics.avgMonthlyIncome * 100)}/mo`}
            icon={<i className="fas fa-arrow-down text-xl"></i>}
            solidColor="green"
            animationDelay={0}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <PerformanceCard
            title="Savings"
            value={metrics.totalSavings}
            performance={metrics.savingsRate}
            subtitle={`${metrics.savingsRate.toFixed(1)}% rate`}
            icon={<i className="fas fa-piggy-bank text-xl"></i>}
            solidColor="blue"
            animationDelay={0.1}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <InfoCard
            title="Subscriptions"
            content={
              <div>
                <p className="text-3xl font-bold text-purple-400">
                  {metrics.subscriptions}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatCurrency(metrics.monthlySubscriptionCost * 100)}/mo
                </p>
              </div>
            }
            solidColor="purple"
            animate
            animationDelay={0.2}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <PerformanceCard
            title="Next Month Projection"
            value={formatCurrency(metrics.projectedSavings * 100)}
            performance={metrics.projectedSavings > 0 ? 1 : -1}
            subtitle="savings estimate"
            icon={<i className="fas fa-chart-line text-xl"></i>}
            solidColor="orange"
            showPercentage={false}
            animationDelay={0.3}
          />
        </motion.div>
      </div>

      {/* Income vs Expenses Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <GlassCard
          variant="prominent"
          padding="lg"
          animate
          animationDelay={0.4}
        >
          <h3 className="text-xl font-semibold text-white mb-6">
            Cash Flow Trend
          </h3>
          <LineChart
            data={monthlyData}
            xKey="month"
            lines={[
              { dataKey: "income", color: "#10b981" },
              { dataKey: "expenses", color: "#ef4444" },
              { dataKey: "savings", color: "#3b82f6" },
            ]}
          />
        </GlassCard>
      </motion.div>

      {/* Category Spending Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GlassCard
            variant="standard"
            padding="lg"
            animate
            animationDelay={0.5}
          >
            <h3 className="text-xl font-semibold text-white mb-6">
              Top Spending Categories
            </h3>
            <div className="space-y-4">
              {categorySpending.map((category) => (
                <div
                  key={category.category}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <i
                        className={`fas ${category.icon}`}
                        style={{ color: category.color }}
                      ></i>
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {category.category}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {category.count} transactions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">
                      {formatCurrency(category.amount * 100)}
                    </p>
                    <p
                      className={`text-sm ${
                        category.change > 0 ? "text-red-400" : "text-green-400"
                      }`}
                    >
                      {category.change > 0 ? "↑" : "↓"}{" "}
                      {Math.abs(category.change).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Advanced Spending Patterns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <GlassCard
            variant="standard"
            padding="lg"
            animate
            animationDelay={0.55}
          >
            <h3 className="text-xl font-semibold text-white mb-6">
              Spending Patterns
            </h3>
            <div className="space-y-4">
              {/* Peak spending day */}
              <GlassCard
                solidColor="blue"
                padding="md"
                borderRadius="lg"
                hoverable
                hoverScale={1.01}
                animate={false}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-calendar-day text-xl"></i>
                    <div>
                      <p className="font-medium">Peak Spending Day</p>
                      <p className="text-sm opacity-90">
                        You spend most on Fridays
                      </p>
                    </div>
                  </div>
                  <span className="font-bold">Fri</span>
                </div>
              </GlassCard>

              {/* Average transaction size */}
              <GlassCard
                solidColor="purple"
                padding="md"
                borderRadius="lg"
                hoverable
                hoverScale={1.01}
                animate={false}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-calculator text-xl"></i>
                    <div>
                      <p className="font-medium">Avg Transaction</p>
                      <p className="text-sm opacity-90">
                        Typical expense amount
                      </p>
                    </div>
                  </div>
                  <span className="font-bold">
                    {formatCurrency(
                      expenseTransactions.reduce(
                        (sum, e) => sum + e.amount,
                        0
                      ) / expenseTransactions.length || 0
                    )}
                  </span>
                </div>
              </GlassCard>

              {/* Most frequent merchant */}
              <GlassCard
                solidColor="green"
                padding="md"
                borderRadius="lg"
                hoverable
                hoverScale={1.01}
                animate={false}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-store text-xl"></i>
                    <div>
                      <p className="font-medium">Top Merchant</p>
                      <p className="text-sm opacity-90">
                        Most frequent spending location
                      </p>
                    </div>
                  </div>
                  <span className="font-bold">Starbucks</span>
                </div>
              </GlassCard>

              {/* Spending velocity */}
              <GlassCard
                solidColor="orange"
                padding="md"
                borderRadius="lg"
                hoverable
                hoverScale={1.01}
                animate={false}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-tachometer-alt text-xl"></i>
                    <div>
                      <p className="font-medium">Spending Velocity</p>
                      <p className="text-sm opacity-90">
                        Transactions per week
                      </p>
                    </div>
                  </div>
                  <span className="font-bold">
                    {Math.round(
                      expenseTransactions.length / (parseInt(timeRange) / 7)
                    )}
                  </span>
                </div>
              </GlassCard>
            </div>
          </GlassCard>
        </motion.div>

        {/* Budget Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <GlassCard
            variant="prominent"
            padding="lg"
            animate
            animationDelay={0.6}
          >
            <h3 className="text-xl font-semibold text-white mb-6">
              Budget Health (50/30/20 Rule)
            </h3>
            <div className="space-y-4">
              {/* Needs */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-home text-blue-400"></i>
                    <span className="text-white font-medium">Needs (50%)</span>
                  </div>
                  <span className="text-sm text-gray-400">
                    {formatCurrency(budgetRecommendations.needs.current * 100)}{" "}
                    /{" "}
                    {formatCurrency(
                      budgetRecommendations.needs.recommended * 100
                    )}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        (budgetRecommendations.needs.current /
                          budgetRecommendations.needs.recommended) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                {budgetRecommendations.needs.difference < 0 && (
                  <p className="text-red-400 text-sm mt-1">
                    Over budget by{" "}
                    {formatCurrency(
                      Math.abs(budgetRecommendations.needs.difference) * 100
                    )}
                  </p>
                )}
              </div>

              {/* Wants */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-shopping-bag text-purple-400"></i>
                    <span className="text-white font-medium">Wants (30%)</span>
                  </div>
                  <span className="text-sm text-gray-400">
                    {formatCurrency(budgetRecommendations.wants.current * 100)}{" "}
                    /{" "}
                    {formatCurrency(
                      budgetRecommendations.wants.recommended * 100
                    )}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-purple-500 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        (budgetRecommendations.wants.current /
                          budgetRecommendations.wants.recommended) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                {budgetRecommendations.wants.difference < 0 && (
                  <p className="text-red-400 text-sm mt-1">
                    Over budget by{" "}
                    {formatCurrency(
                      Math.abs(budgetRecommendations.wants.difference) * 100
                    )}
                  </p>
                )}
              </div>

              {/* Savings */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-piggy-bank text-green-400"></i>
                    <span className="text-white font-medium">
                      Savings (20%)
                    </span>
                  </div>
                  <span className="text-sm text-gray-400">
                    {formatCurrency(
                      budgetRecommendations.savings.current * 100
                    )}{" "}
                    /{" "}
                    {formatCurrency(
                      budgetRecommendations.savings.recommended * 100
                    )}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        (budgetRecommendations.savings.current /
                          budgetRecommendations.savings.recommended) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                {budgetRecommendations.savings.difference < 0 && (
                  <p className="text-yellow-400 text-sm mt-1">
                    Below target by{" "}
                    {formatCurrency(
                      Math.abs(budgetRecommendations.savings.difference) * 100
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Insights */}
            <GlassCard
              solidColor="blue"
              padding="md"
              borderRadius="lg"
              animate={false}
              className="mt-6"
            >
              <h4 className="font-medium mb-2">
                <i className="fas fa-lightbulb mr-2"></i>
                Insights
              </h4>
              <ul className="text-sm space-y-1 opacity-90">
                {metrics.savingsRate >= 20 ? (
                  <li>
                    • Great job! You&apos;re saving{" "}
                    {metrics.savingsRate.toFixed(1)}% of your income
                  </li>
                ) : (
                  <li>• Try to increase your savings rate to at least 20%</li>
                )}
                {metrics.monthlySubscriptionCost >
                  metrics.avgMonthlyIncome * 0.1 && (
                  <li>
                    • Your subscriptions are{" "}
                    {(
                      (metrics.monthlySubscriptionCost /
                        metrics.avgMonthlyIncome) *
                      100
                    ).toFixed(1)}
                    % of income. Consider reviewing them.
                  </li>
                )}
                {budgetRecommendations.needs.difference < 0 && (
                  <li>
                    • Your essential expenses are high. Look for ways to reduce
                    fixed costs.
                  </li>
                )}
              </ul>
            </GlassCard>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
