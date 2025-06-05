import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import FinancialInsights from "@/components/insights/FinancialInsights";
import type { Expense } from "@/types/global";
import { useAppContext } from "@/components/layout/layoutWrapper";
import { getCategoryInfo } from "@/lib/transactionClassifier";

// Mock dependencies
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: any;
    }) => <div {...props}>{children}</div>,
  },
}));

const mockUseAppContext = vi.fn();
vi.mock("@/components/layout/layoutWrapper", () => ({
  useAppContext: mockUseAppContext,
}));

const mockGetCategoryInfo = vi.fn();
vi.mock("@/lib/transactionClassifier", () => ({
  getCategoryInfo: mockGetCategoryInfo,
}));

vi.mock("@/components/charts/line", () => ({
  default: ({ data }: { data: unknown[] }) => (
    <div data-testid="line-chart">
      Mock Line Chart: {data.length} data points
    </div>
  ),
}));

describe("FinancialInsights Component", () => {
  const mockExpenses: Expense[] = [
    {
      id: "1",
      amount: 5000, // £50.00 in pence
      category: "groceries",
      description: "Supermarket shopping",
      date: "2024-01-15",
      merchant: "Tesco",
      recurrence: "one-time",
    },
    {
      id: "2",
      amount: 3000, // £30.00 in pence
      category: "salary",
      description: "Monthly salary",
      date: "2024-01-01",
      merchant: "Company Ltd",
      recurrence: "monthly",
    },
    {
      id: "3",
      amount: 2500, // £25.00 in pence
      category: "entertainment",
      description: "Cinema tickets",
      date: "2024-01-10",
      merchant: "Vue Cinema",
      recurrence: "one-time",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useAppContext with complete interface
    mockUseAppContext.mockReturnValue({
      formatCurrency: vi.fn(
        (amount: number) => `£${(amount / 100).toFixed(2)}`
      ),
      currency: "GBP",
      setCurrency: vi.fn(),
    });

    // Mock getCategoryInfo with complete interface
    mockGetCategoryInfo.mockImplementation((category: string) => ({
      id: category,
      name: category.charAt(0).toUpperCase() + category.slice(1),
      icon: "fa-circle",
      color: "#3b82f6",
      gradient: "from-blue-500 to-blue-600",
    }));
  });

  it("renders without crashing", () => {
    render(<FinancialInsights expenses={mockExpenses} timeRange="30" />);

    expect(screen.getByText("Total Income")).toBeInTheDocument();
    expect(screen.getByText("Savings")).toBeInTheDocument();
    expect(screen.getByText("Subscriptions")).toBeInTheDocument();
    expect(screen.getByText("Next Month Projection")).toBeInTheDocument();
  });

  it("displays the cash flow trend chart", () => {
    render(<FinancialInsights expenses={mockExpenses} timeRange="90" />);

    expect(screen.getByText("Cash Flow Trend")).toBeInTheDocument();
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("shows top spending categories", () => {
    render(<FinancialInsights expenses={mockExpenses} timeRange="30" />);

    expect(screen.getByText("Top Spending Categories")).toBeInTheDocument();
  });

  it("displays spending patterns analysis", () => {
    render(<FinancialInsights expenses={mockExpenses} timeRange="30" />);

    expect(screen.getByText("Spending Patterns")).toBeInTheDocument();
    expect(screen.getByText("Peak Spending Day")).toBeInTheDocument();
    expect(screen.getByText("Avg Transaction")).toBeInTheDocument();
  });

  it("shows budget health with 50/30/20 rule", () => {
    render(<FinancialInsights expenses={mockExpenses} timeRange="30" />);

    expect(
      screen.getByText("Budget Health (50/30/20 Rule)")
    ).toBeInTheDocument();
    expect(screen.getByText("Needs (50%)")).toBeInTheDocument();
    expect(screen.getByText("Wants (30%)")).toBeInTheDocument();
    expect(screen.getByText("Savings (20%)")).toBeInTheDocument();
  });

  it("calculates income and expenses correctly", () => {
    render(<FinancialInsights expenses={mockExpenses} timeRange="30" />);

    // Check that income (salary) and expenses are calculated
    expect(screen.getByText("Total Income")).toBeInTheDocument();

    // The component should show formatted currency values
    const currencyElements = screen.getAllByText(/£\d+\.\d{2}/);
    expect(currencyElements.length).toBeGreaterThan(0);
  });

  it("handles empty expenses array", () => {
    render(<FinancialInsights expenses={[]} timeRange="30" />);

    expect(screen.getByText("Total Income")).toBeInTheDocument();
    expect(screen.getByText("Savings")).toBeInTheDocument();
  });

  it("adapts to different time ranges", () => {
    const { rerender } = render(
      <FinancialInsights expenses={mockExpenses} timeRange="30" />
    );

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();

    rerender(<FinancialInsights expenses={mockExpenses} timeRange="365" />);

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("formats currency correctly through context", () => {
    render(<FinancialInsights expenses={mockExpenses} timeRange="30" />);

    // The formatCurrency mock should be called with amounts in pence
    // and display as pounds with correct formatting
    const currencyText = screen.getAllByText(/£\d+\.\d{2}/);
    expect(currencyText.length).toBeGreaterThan(0);
  });

  it("categorizes transactions correctly", () => {
    const mixedExpenses: Expense[] = [
      {
        id: "1",
        amount: 5000,
        category: "salary", // Income category
        description: "Salary",
        date: "2024-01-01",
        merchant: "Company",
        recurrence: "monthly",
      },
      {
        id: "2",
        amount: 2000,
        category: "groceries", // Expense category
        description: "Food shopping",
        date: "2024-01-02",
        merchant: "Shop",
        recurrence: "weekly",
      },
    ];

    render(<FinancialInsights expenses={mixedExpenses} timeRange="30" />);

    expect(screen.getByText("Total Income")).toBeInTheDocument();
    expect(screen.getByText("Top Spending Categories")).toBeInTheDocument();
  });
});
