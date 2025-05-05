'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import MetricCard from '@/components/ui/metricCard';
import { Tile } from '@/components/ui/tile/tile';
import { Button } from '@/components/ui/button/button';
import { HeaderLayout as Header } from '@/components/layout/headerLayout';
import { FooterLayout as Footer } from '@/components/layout/footerLayout';
// import LineChart from '@/components/charts/line';
import PieChart from '@/components/charts/pie';
import type { Asset, Expense } from "@/types/global";

const tabs = [
  { id: 'overview', label: 'Overview', icon: 'fa-chart-pie' },
  { id: 'assets', label: 'Assets', icon: 'fa-wallet' },
  { id: 'expenses', label: 'Expenses', icon: 'fa-receipt' },
  { id: 'properties', label: 'Properties', icon: 'fa-home' },
];

const timeRanges = ["week", "month", "year"];

function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
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
        fetch(`/api/assets?userId=${userId}`, { cache: 'no-store' }),
        fetch(`/api/expenses?userId=${userId}`, { cache: 'no-store' }),
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
  }, [userId]);

  useEffect(() => {
    const uid = localStorage.getItem('userId');
    if (!uid) {
      router.push('/login');
    } else {
      setUserId(uid);
    }
  }, [router]);

  useEffect(() => {
    if (userId) fetchData();
  }, [userId, fetchData]);

  const netWorth = useMemo(() => {
    return assets.reduce((total, asset) => total + (asset.current_value ?? 0), 0);
  }, [assets]);

  const assetsByType = useMemo(() => {
    return assets.reduce((acc, asset) => {
      const key = asset.type ?? 'other';
      acc[key] = (acc[key] ?? 0) + (asset.current_value ?? 0);
      return acc;
    }, {} as Record<string, number>);
  }, [assets]);

  const recentExpensesTotal = useMemo(() => {
    return expenses.slice(0, 5).reduce((total, exp) => total + (exp.amount ?? 0), 0);
  }, [expenses]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-gray-900">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <h1 className="text-3xl font-semibold mb-4 md:mb-0">Financial Dashboard</h1>
            <div className="flex space-x-2">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center"
                >
                  <i className={`fas ${tab.icon} mr-2`} />
                  <span className="hidden md:inline">{tab.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-400 flex items-center">
                <i className="fas fa-exclamation-circle mr-2"></i>
                {error}
              </p>
            </div>
          )}

          {activeTab === 'overview' && (
            <>
              <div className="flex space-x-2 mb-6">
                {timeRanges.map((range) => (
                  <Button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    variant={timeRange === range ? 'default' : 'ghost'}
                    className="text-sm font-medium"
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <MetricCard
                  title="Net Worth"
                  value={`£${(netWorth / 100).toLocaleString()}`}
                  icon="fa-chart-line"
                  colorClass="text-green-400"
                />
                <MetricCard
                  title="Total Assets"
                  value={assets.length}
                  icon="fa-wallet"
                  colorClass="text-blue-400"
                />
                <MetricCard
                  title="Recent Expenses"
                  value={`£${recentExpensesTotal.toLocaleString()}`}
                  icon="fa-receipt"
                  colorClass="text-red-400"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Tile>
                  <h3 className="text-lg font-semibold mb-4 text-white/80">Asset Distribution</h3>
                  <PieChart
                    data={Object.entries(assetsByType).map(([type, value]) => ({
                      name: type,
                      value,
                      color:
                        type === "stock"
                          ? "#60a5fa"
                          : type === "crypto"
                          ? "#facc15"
                          : type === "property"
                          ? "#34d399"
                          : "#a78bfa",
                    }))}
                  />
                </Tile>

                <Tile>
                  <h3 className="text-lg font-semibold mb-4 text-white/80">Recent Transactions</h3>
                  <div className="space-y-4">
                    {expenses.slice(0, 5).map((expense) => (
                      <div key={expense.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{expense.description}</p>
                          <p className="text-sm text-gray-400">
                            {new Date(expense.date).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-red-400">
                          £{(expense.amount / 100).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </Tile>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default DashboardPage;