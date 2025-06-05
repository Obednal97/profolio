import { describe, it, expect } from "vitest";

describe("Frontend Test Suite", () => {
  it("should pass basic test", () => {
    expect(1 + 1).toBe(2);
  });

  it("should handle string operations", () => {
    const testString = "Profolio";
    expect(testString.toLowerCase()).toBe("profolio");
  });

  it("should handle array operations", () => {
    const testArray = [1, 2, 3];
    expect(testArray.length).toBe(3);
    expect(testArray.includes(2)).toBe(true);
  });
});

describe("Math Utilities", () => {
  it("should calculate percentages correctly", () => {
    const percentage = (50 / 100) * 100;
    expect(percentage).toBe(50);
  });

  it("should handle decimal calculations", () => {
    const result = 0.1 + 0.2;
    expect(Math.round(result * 10) / 10).toBe(0.3);
  });
});
