"use client";

import React from "react";

// Demo component showing Liquid Glass usage
export function LiquidGlassDemo() {
  return (
    <div className="space-y-6 p-8">
      <h2 className="text-2xl font-bold glass-typography">Liquid Glass Demo</h2>

      {/* Basic Glass Card */}
      <div className="glass-card">
        <h3 className="text-lg font-semibold mb-2">Basic Glass Card</h3>
        <p>This demonstrates Apple&apos;s Liquid Glass design language</p>
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card liquid-glass--performance-positive">
          <h4 className="font-medium text-green-600">Positive Performance</h4>
          <p className="glass-typography--numbers">+2.4%</p>
        </div>

        <div className="glass-card liquid-glass--performance-negative">
          <h4 className="font-medium text-red-600">Negative Performance</h4>
          <p className="glass-typography--numbers">-1.2%</p>
        </div>
      </div>

      {/* Glass Button */}
      <button className="glass-button--primary">Liquid Glass Button</button>
    </div>
  );
}
