"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { CalculatedFee, BenchmarkPercentiles } from "@/lib/types";

export type FeeViewMode = "percentage" | "dollars" | "basisPoints";

interface ItemizedFeeChartProps {
  title: string;
  benchmarks: BenchmarkPercentiles;
  existingFee: CalculatedFee;
  proposedFee?: CalculatedFee;
  color: string;
  aum: number;
  viewMode: FeeViewMode;
}

export function ItemizedFeeChart({
  title,
  benchmarks,
  existingFee,
  proposedFee,
  color,
  aum,
  viewMode,
}: ItemizedFeeChartProps) {
  // Helper function to convert values based on view mode
  const convertValue = (benchmarkDecimal: number, calculatedPercentage: number, calculatedDollar: number) => {
    switch (viewMode) {
      case "percentage":
        // Benchmarks are decimals (0.005 = 0.5%), multiply by 100
        // Calculated fees are already percentages
        return benchmarkDecimal !== undefined ? benchmarkDecimal * 100 : calculatedPercentage;
      case "dollars":
        // Convert benchmark decimal to dollar amount: decimal * AUM
        // Calculated fees already have dollar amount
        return benchmarkDecimal !== undefined ? benchmarkDecimal * aum : calculatedDollar;
      case "basisPoints":
        // Convert to basis points: percentage * 100 or decimal * 10000
        return benchmarkDecimal !== undefined ? benchmarkDecimal * 10000 : calculatedPercentage * 100;
    }
  };

  const data = [
    {
      name: "25th\nPercentile",
      value: convertValue(benchmarks.p25, 0, 0),
      fill: "#0078A2", // Teal blue (Advisor Fee color)
    },
    {
      name: "50th\nPercentile",
      value: convertValue(benchmarks.p50, 0, 0),
      fill: "#4FB3CD", // Light cyan (Record Keeper color)
    },
    {
      name: "75th\nPercentile",
      value: convertValue(benchmarks.p75, 0, 0),
      fill: "#8EB935", // Green (Investment Manager color)
    },
    {
      name: "Client\nExisting",
      value: convertValue(undefined as any, existingFee.percentage, existingFee.dollarAmount),
      fill: "#C2E76B", // Lime green (TPA color)
    },
  ];

  // Add proposed if provided
  if (proposedFee) {
    data.push({
      name: "Client\nProposed",
      value: convertValue(undefined as any, proposedFee.percentage, proposedFee.dollarAmount),
      fill: "#F47D20", // Orange (5th color)
    });
  }

  // Format value based on view mode
  const formatValue = (value: number) => {
    switch (viewMode) {
      case "percentage":
        return `${value.toFixed(3)}%`;
      case "dollars":
        return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      case "basisPoints":
        return `${Math.round(value)} bps`;
    }
  };

  // Get Y-axis label based on view mode
  const getYAxisLabel = () => {
    switch (viewMode) {
      case "percentage":
        return "Percentage (%)";
      case "dollars":
        return "Dollar Amount ($)";
      case "basisPoints":
        return "Basis Points";
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      return (
        <div className="bg-background border border-border p-3 rounded shadow-lg">
          <p className="font-semibold mb-1">{entry.payload.name.replace('\n', ' ')}</p>
          <p className="text-sm">{formatValue(entry.value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={0}
            textAnchor="middle"
            height={60}
            interval={0}
            style={{ fontSize: '12px' }}
          />
          <YAxis
            tickFormatter={formatValue}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
