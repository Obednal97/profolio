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
  payload: { name: string; value: number };
};

// Custom tooltip component with glassmorphism design
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-gray-900/90 backdrop-blur-xl border border-white/20 rounded-xl p-3 shadow-2xl">
        <p className="text-white font-medium text-sm">{data.name}</p>
        <p className="text-gray-300 text-sm">
          Value: <span className="text-white font-semibold">${data.value.toLocaleString()}</span>
        </p>
      </div>
    );
  }
  return null;
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
      outerRadius,
      startAngle,
      endAngle,
      fill,
      payload,
    } = props as ActiveShapeProps;
    const RADIAN = Math.PI / 180;
    const midAngle = (startAngle + endAngle) / 2;
    const cos = Math.cos(-RADIAN * midAngle);
    const sin = Math.sin(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <path
          d={`M ${sx},${sy} L ${mx},${my} L ${ex},${ey}`}
          stroke={fill}
          fill="none"
          strokeWidth={2}
        />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none"/>
        <text 
          x={ex + (cos >= 0 ? 1 : -1) * 12} 
          y={ey} 
          textAnchor={textAnchor} 
          fill="#fff"
          className="text-sm font-medium"
        >
          {payload.name}
        </text>
        <text 
          x={ex + (cos >= 0 ? 1 : -1) * 12} 
          y={ey} 
          dy={18} 
          textAnchor={textAnchor} 
          fill="#9ca3af"
          className="text-xs"
        >
          ${payload.value.toLocaleString()}
        </text>
      </g>
    );
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Tooltip content={<CustomTooltip />} />
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={40}
            paddingAngle={2}
            activeIndex={activeIndex ?? undefined}
            activeShape={renderActiveShape}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={1}
                fillOpacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                className="transition-all duration-200 hover:brightness-110"
              />
            ))}
          </Pie>
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}