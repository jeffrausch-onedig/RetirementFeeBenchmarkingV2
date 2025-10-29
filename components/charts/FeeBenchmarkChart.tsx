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
import { CalculatedFees, BenchmarkComparison } from "@/lib/types";

interface FeeBenchmarkChartProps {
  existingFees: CalculatedFees;
  proposedFees?: CalculatedFees;
  benchmarks: BenchmarkComparison;
}

export function FeeBenchmarkChart({
  existingFees,
  proposedFees,
  benchmarks,
}: FeeBenchmarkChartProps) {
  // Transform data into the format needed for stacked horizontal bar chart
  // Each fee type becomes a separate data series (stack)
  // Each comparison group becomes a bar
  // Order: Benchmark, Existing, Proposed (if present)

  // Note: Domo benchmark values are decimals (0.005 = 0.5%)
  // Calculated fees are percentages (0.5 = 0.5%)
  // Convert benchmarks by multiplying by 100

  const data = [
    {
      name: "Benchmark",
      advisor: benchmarks.advisor.p50 * 100,
      recordKeeper: benchmarks.recordKeeper.p50 * 100,
      investmentMenu: benchmarks.investmentMenu.p50 * 100,
      tpa: benchmarks.tpa.p50 * 100,
    },
    {
      name: "Existing",
      advisor: existingFees.advisor.percentage,
      recordKeeper: existingFees.recordKeeper.percentage,
      investmentMenu: existingFees.investmentMenu.percentage,
      tpa: existingFees.tpa.percentage,
    },
  ];

  // Add proposed fees if provided
  if (proposedFees) {
    data.push({
      name: "Proposed",
      advisor: proposedFees.advisor.percentage,
      recordKeeper: proposedFees.recordKeeper.percentage,
      investmentMenu: proposedFees.investmentMenu.percentage,
      tpa: proposedFees.tpa.percentage,
    });
  }

  // Color scheme for fee types
  const colors = {
    advisor: "#0078A2",
    recordKeeper: "#4FB3CD",
    investmentMenu: "#8EB935",
    tpa: "#C2E76B",
  };

  // Custom tooltip with user-friendly labels
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);

      // Map variable names to user-friendly labels
      const feeLabels: Record<string, string> = {
        advisor: "Advisor Fee",
        recordKeeper: "Record Keeper Fee",
        investmentMenu: "Investment Menu Fee",
        tpa: "TPA Fee",
      };

      return (
        <div className="bg-background border border-border p-3 rounded shadow-lg">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {feeLabels[entry.dataKey] || entry.name}: {entry.value.toFixed(3)}%
            </p>
          ))}
          <p className="text-sm font-semibold mt-2 pt-2 border-t">
            Total: {total.toFixed(3)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 20, right: 30, left: 150, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          label={{ value: "", position: "insideBottom", offset: -10 }}
          tickFormatter={(value) => `${value.toFixed(2)}%`}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={140}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="top"
          height={36}
          formatter={(value) => {
            const labels: Record<string, string> = {
              advisor: "Advisor Fee",
              recordKeeper: "Record Keeper Fee",
              investmentMenu: "Investment Menu Fee",
              tpa: "TPA Fee",
            };
            return labels[value] || value;
          }}
        />
        <Bar dataKey="advisor" stackId="a" fill={colors.advisor} />
        <Bar dataKey="recordKeeper" stackId="a" fill={colors.recordKeeper} />
        <Bar dataKey="investmentMenu" stackId="a" fill={colors.investmentMenu} />
        <Bar dataKey="tpa" stackId="a" fill={colors.tpa} />
      </BarChart>
    </ResponsiveContainer>
  );
}
