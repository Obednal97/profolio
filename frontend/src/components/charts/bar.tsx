"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";

interface ChartDataPoint {
    [key: string]: string | number;
  }

interface BarChartProps {
  data: ChartDataPoint[];
  xKey: string;
  bars: { dataKey: string; color: string }[];
}

export default function BarChart({ data, xKey, bars }: BarChartProps) {
  const [activeBar, setActiveBar] = useState<string | null>(null);

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data}>
          <defs>
            {bars.map((bar) => (
              <linearGradient
                key={bar.dataKey}
                id={`gradient-${bar.dataKey}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={bar.color} stopOpacity={0.6} />
                <stop offset="100%" stopColor={bar.color} stopOpacity={0.1} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
          <XAxis dataKey={xKey} stroke="#8884d8" />
          <YAxis stroke="#8884d8" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f1f1f",
              border: "1px solid #333",
              borderRadius: "6px",
              color: "#fff",
              fontSize: "0.875rem",
            }}
            labelStyle={{ color: "#aaa" }}
            cursor={{ fill: "#333", opacity: 0.2 }}
          />
          {bars.map((bar) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              fill={`url(#gradient-${bar.dataKey})`}
              stroke={bar.color}
              onMouseOver={() => setActiveBar(bar.dataKey)}
              onMouseLeave={() => setActiveBar(null)}
              fillOpacity={
                activeBar === null || activeBar === bar.dataKey ? 1 : 0.3
              }
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}