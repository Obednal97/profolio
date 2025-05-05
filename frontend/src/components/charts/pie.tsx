"use client";

import { useState } from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PieChartProps {
  data: { name: string; value: number; color: string }[];
  dataKey?: string;
  nameKey?: string;
}

type ActiveShapeProps = {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
  payload: { name: string };
};

export default function PieChart({
  data,
  dataKey = "value",
  nameKey = "name",
}: PieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const renderActiveShape = (props: unknown) => {
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      payload,
    } = props as ActiveShapeProps;
    const RADIAN = Math.PI / 180;
    const midAngle = (startAngle + endAngle) / 2;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 6) * cos;
    const sy = cy + (outerRadius + 6) * sin;

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill="#fff">
          {payload.name}
        </text>
        <path
          d={`
            M ${cx + innerRadius * cos},${cy + innerRadius * sin}
            L ${sx},${sy}
            A ${outerRadius + 6},${outerRadius + 6} 0 1,1 ${cx - (outerRadius + 6) * cos},${cy - (outerRadius + 6) * sin}
            Z
          `}
          fill={fill}
          stroke="#1a1a1a"
          strokeWidth={1}
        />
      </g>
    );
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f1f1f",
              border: "1px solid #333",
              borderRadius: "6px",
              color: "#fff",
              fontSize: "0.875rem",
            }}
            labelStyle={{ color: "#aaa" }}
          />
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={40}
            paddingAngle={2}
            label
            activeIndex={activeIndex ?? undefined}
            activeShape={renderActiveShape}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                stroke="#1a1a1a"
                strokeWidth={1}
                fillOpacity={activeIndex === null || activeIndex === index ? 1 : 0.3}
              />
            ))}
          </Pie>
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}