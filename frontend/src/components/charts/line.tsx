"use client";

import React, { useState } from "react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ChartDataPoint {
  [key: string]: string | number;
}

interface LineChartProps {
  data: ChartDataPoint[];
  xKey: string;
  lines: { dataKey: string; color: string }[];
}

export default function LineChart({
  data,
  xKey,
  lines,
}: LineChartProps) {
  const [activeLine, setActiveLine] = useState<string | null>(null);

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          onMouseMove={(e: { activePayload?: { dataKey?: string }[] }) => {
            if (e?.activePayload?.[0]?.dataKey) {
              setActiveLine(e.activePayload[0].dataKey);
            }
          }}
          onMouseLeave={() => setActiveLine(null)}
        >
          <defs>
            {lines.map((line) => (
              <linearGradient
                key={line.dataKey}
                id={`gradient-${line.dataKey}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={line.color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={line.color} stopOpacity={0} />
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
            cursor={{ stroke: "#333", strokeWidth: 1 }}
            wrapperStyle={{ outline: "none" }}
          />
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color}
              strokeWidth={2}
              fillOpacity={activeLine && activeLine !== line.dataKey ? 0.1 : 1}
              fill={`url(#gradient-${line.dataKey})`}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
              strokeOpacity={activeLine && activeLine !== line.dataKey ? 0.3 : 1}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}