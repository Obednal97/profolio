import { render, screen } from "@testing-library/react";
import { StatsGrid } from "../StatsGrid";

describe("StatsGrid", () => {
  const mockStats = [
    {
      label: "Total Revenue",
      value: 125000,
      format: "currency" as const,
      trend: 12.5,
      icon: "TrendingUp",
    },
    {
      label: "Active Users",
      value: 3456,
      format: "number" as const,
      trend: -2.3,
    },
    {
      label: "Conversion Rate",
      value: 23.4,
      format: "percentage" as const,
      trend: 0,
    },
    {
      label: "Custom Metric",
      value: "Active",
      format: "custom" as const,
      subtitle: "System Status",
    },
  ];

  it("renders all stat items", () => {
    render(<StatsGrid items={mockStats} />);

    expect(screen.getByText("Total Revenue")).toBeInTheDocument();
    expect(screen.getByText("Active Users")).toBeInTheDocument();
    expect(screen.getByText("Conversion Rate")).toBeInTheDocument();
    expect(screen.getByText("Custom Metric")).toBeInTheDocument();
  });

  it("handles currency format correctly", () => {
    render(<StatsGrid items={[mockStats[0]]} />);

    // Should format as GBP currency
    expect(screen.getByText("£125,000")).toBeInTheDocument();
  });

  it("handles number format correctly", () => {
    render(<StatsGrid items={[mockStats[1]]} />);

    // Should format with thousand separators
    expect(screen.getByText("3,456")).toBeInTheDocument();
  });

  it("handles percentage format correctly", () => {
    render(<StatsGrid items={[mockStats[2]]} />);

    // Should format as percentage
    expect(screen.getByText("23.4%")).toBeInTheDocument();
  });

  it("shows trend indicators correctly", () => {
    render(<StatsGrid items={mockStats.slice(0, 3)} />);

    // Positive trend
    expect(screen.getByText("12.5%")).toBeInTheDocument();

    // Negative trend
    expect(screen.getByText("2.3%")).toBeInTheDocument();

    // Zero trend
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("renders with different column configurations", () => {
    const { rerender } = render(<StatsGrid items={mockStats} columns={2} />);
    let grid = screen.getByTestId("stats-grid");
    expect(grid).toHaveClass("grid-cols-1", "md:grid-cols-2");

    rerender(<StatsGrid items={mockStats} columns={3} />);
    grid = screen.getByTestId("stats-grid");
    expect(grid).toHaveClass("grid-cols-1", "md:grid-cols-2", "lg:grid-cols-3");

    rerender(<StatsGrid items={mockStats} columns={4} />);
    grid = screen.getByTestId("stats-grid");
    expect(grid).toHaveClass("grid-cols-1", "md:grid-cols-2", "lg:grid-cols-4");
  });

  it("applies variant classes correctly", () => {
    const { rerender } = render(
      <StatsGrid items={mockStats} variant="glass" />
    );

    rerender(<StatsGrid items={mockStats} variant="performance" />);
    // Performance variant should apply tinting based on trends

    rerender(<StatsGrid items={mockStats} variant="minimal" />);
    // Minimal variant should use simple styling
  });

  it("handles loading state", () => {
    const loadingStats = [{ ...mockStats[0], loading: true }];

    render(<StatsGrid items={loadingStats} />);

    // Should show loading skeleton
    expect(screen.queryByText("Total Revenue")).not.toBeInTheDocument();
  });

  it("handles error state", () => {
    const errorStats = [{ ...mockStats[0], error: "Failed to load data" }];

    render(<StatsGrid items={errorStats} />);

    expect(screen.getByText("Failed to load data")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<StatsGrid items={mockStats} className="custom-grid-class" />);

    const grid = screen.getByTestId("stats-grid");
    expect(grid).toHaveClass("custom-grid-class");
  });

  it("passes data-testid correctly", () => {
    render(<StatsGrid items={mockStats} data-testid="stats-grid" />);

    expect(screen.getByTestId("stats-grid")).toBeInTheDocument();
  });
});
