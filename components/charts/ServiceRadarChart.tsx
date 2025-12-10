'use client';

import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { ServiceOptions, CalculatedFees, BenchmarkComparison } from '@/lib/types';
import { calculateServiceValueScore } from '@/lib/serviceBaselines';

interface ServiceRadarChartProps {
  existingServices: ServiceOptions;
  proposedServices?: ServiceOptions;
  aum: number;
  existingFees?: CalculatedFees;
  proposedFees?: CalculatedFees;
  benchmarks?: BenchmarkComparison;
}

export default function ServiceRadarChart({
  existingServices,
  proposedServices,
  aum,
  existingFees,
  proposedFees,
  benchmarks
}: ServiceRadarChartProps) {
  const existingScore = calculateServiceValueScore(existingServices, aum);
  const proposedScore = proposedServices
    ? calculateServiceValueScore(proposedServices, aum)
    : null;

  // Helper to convert fee percentage to percentile score (0-100)
  // Lower fees = higher score
  const calculateFeePercentileScore = (
    feePercentage: number,
    benchmarkPercentiles: { p25: number; p50: number; p75: number }
  ): number => {
    const { p25, p50, p75 } = benchmarkPercentiles;

    // Convert fee percentage to decimal (e.g., 1.25% -> 0.0125) to match benchmark format
    const feeDecimal = feePercentage / 100;

    // Extrapolate p100 (worst case) as p75 + (p75 - p50)
    const p100 = p75 + (p75 - p50);

    // Convert fee to percentile score (inverted - lower fees = higher score)
    let score: number;
    if (feeDecimal <= p25) {
      score = 100; // Better than 75th percentile
    } else if (feeDecimal >= p100) {
      score = 0; // Worse than extrapolated 100th percentile
    } else if (feeDecimal >= p75) {
      // Between p75 and p100: score 0-25
      score = 25 * (1 - (feeDecimal - p75) / (p100 - p75));
    } else if (feeDecimal >= p50) {
      // Between p50 and p75: score 25-50
      score = 25 + 25 * (1 - (feeDecimal - p50) / (p75 - p50));
    } else {
      // Between p25 and p50: score 50-100
      score = 50 + 50 * (1 - (feeDecimal - p25) / (p50 - p25));
    }

    return Math.min(100, Math.max(0, score)); // Ensure score is between 0-100
  };

  // Calculate total fee percentile scores if we have fee data
  const existingTotalFeeScore = existingFees && benchmarks
    ? calculateFeePercentileScore(existingFees.total.percentage, benchmarks.total)
    : 0;

  const proposedTotalFeeScore = proposedFees && benchmarks
    ? calculateFeePercentileScore(proposedFees.total.percentage, benchmarks.total)
    : 0;


  // Prepare data for radar chart with 5 axes
  const data = [
    {
      category: 'Advisor\nServices',
      existing: existingScore.breakdown.advisor,
      proposed: proposedScore?.breakdown.advisor || 0,
      p50: 50, // Median reference line
    },
    {
      category: 'Recordkeeper\nServices',
      existing: existingScore.breakdown.recordKeeper,
      proposed: proposedScore?.breakdown.recordKeeper || 0,
      p50: 50,
    },
    {
      category: 'TPA\nServices',
      existing: existingScore.breakdown.tpa,
      proposed: proposedScore?.breakdown.tpa || 0,
      p50: 50,
    },
    {
      category: 'Audit\nServices',
      existing: existingScore.breakdown.audit,
      proposed: proposedScore?.breakdown.audit || 0,
      p50: 50,
    },
    {
      category: 'Total Fee\nCompetitiveness',
      existing: existingTotalFeeScore,
      proposed: proposedTotalFeeScore,
      p50: 50,
    },
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const category = payload[0].payload.category.replace('\n', ' ');
      const isFeeAxis = category.includes('Total Fee');

      return (
        <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3">
          <p className="font-semibold text-sm mb-2">{category}</p>
          {payload.map((entry: any, index: number) => {
            if (entry.dataKey === 'p50') return null; // Don't show median in tooltip
            return (
              <p key={index} className="text-xs" style={{ color: entry.color }}>
                {entry.name === 'existing' ? 'Current' : 'Proposed'}: {Math.round(entry.value)}
                {isFeeAxis ? ' (lower fees = higher score)' : ''}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fill: '#6b7280', fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: '#6b7280', fontSize: 10 }}
            />
            {/* Median reference line (50th percentile) */}
            <Radar
              name="50th Percentile"
              dataKey="p50"
              stroke="#cbd5e1"
              fill="#cbd5e1"
              fillOpacity={0.1}
              strokeWidth={1}
              strokeDasharray="5 5"
            />
            {/* Existing plan */}
            <Radar
              name="existing"
              dataKey="existing"
              stroke="#0078A2"
              fill="#0078A2"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            {/* Proposed plan */}
            {proposedScore && (
              <Radar
                name="proposed"
                dataKey="proposed"
                stroke="#8EB935"
                fill="#8EB935"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            )}
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value) => {
                if (value === 'existing') return 'Current Plan';
                if (value === 'proposed') return 'Proposed Plan';
                if (value === '50th Percentile') return 'Market Median';
                return value;
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary tables - split into Service Scores and Fee Competitiveness */}
      <div className="mt-6 space-y-4">
        {/* Service Scores Table */}
        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Service Coverage Scores</h4>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Provider</th>
                  <th className="text-center px-4 py-2 font-medium w-24">Current</th>
                  {proposedScore && <th className="text-center px-4 py-2 font-medium w-24">Proposed</th>}
                  {proposedScore && <th className="text-center px-4 py-2 font-medium w-24">Change</th>}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-2">Advisor Services</td>
                  <td className="text-center px-4 py-2 font-semibold tabular-nums">{existingScore.breakdown.advisor}</td>
                  {proposedScore && (
                    <>
                      <td className="text-center px-4 py-2 font-semibold tabular-nums">{proposedScore.breakdown.advisor}</td>
                      <td className="text-center px-4 py-2">
                        <span className={`font-semibold tabular-nums ${
                          proposedScore.breakdown.advisor > existingScore.breakdown.advisor
                            ? 'text-green-600'
                            : proposedScore.breakdown.advisor < existingScore.breakdown.advisor
                            ? 'text-red-600'
                            : 'text-gray-500'
                        }`}>
                          {proposedScore.breakdown.advisor > existingScore.breakdown.advisor ? '+' : ''}
                          {proposedScore.breakdown.advisor - existingScore.breakdown.advisor}
                        </span>
                      </td>
                    </>
                  )}
                </tr>
                <tr className="border-t border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-2">Recordkeeper Services</td>
                  <td className="text-center px-4 py-2 font-semibold tabular-nums">{existingScore.breakdown.recordKeeper}</td>
                  {proposedScore && (
                    <>
                      <td className="text-center px-4 py-2 font-semibold tabular-nums">{proposedScore.breakdown.recordKeeper}</td>
                      <td className="text-center px-4 py-2">
                        <span className={`font-semibold tabular-nums ${
                          proposedScore.breakdown.recordKeeper > existingScore.breakdown.recordKeeper
                            ? 'text-green-600'
                            : proposedScore.breakdown.recordKeeper < existingScore.breakdown.recordKeeper
                            ? 'text-red-600'
                            : 'text-gray-500'
                        }`}>
                          {proposedScore.breakdown.recordKeeper > existingScore.breakdown.recordKeeper ? '+' : ''}
                          {proposedScore.breakdown.recordKeeper - existingScore.breakdown.recordKeeper}
                        </span>
                      </td>
                    </>
                  )}
                </tr>
                <tr className="border-t border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-2">TPA Services</td>
                  <td className="text-center px-4 py-2 font-semibold tabular-nums">{existingScore.breakdown.tpa}</td>
                  {proposedScore && (
                    <>
                      <td className="text-center px-4 py-2 font-semibold tabular-nums">{proposedScore.breakdown.tpa}</td>
                      <td className="text-center px-4 py-2">
                        <span className={`font-semibold tabular-nums ${
                          proposedScore.breakdown.tpa > existingScore.breakdown.tpa
                            ? 'text-green-600'
                            : proposedScore.breakdown.tpa < existingScore.breakdown.tpa
                            ? 'text-red-600'
                            : 'text-gray-500'
                        }`}>
                          {proposedScore.breakdown.tpa > existingScore.breakdown.tpa ? '+' : ''}
                          {proposedScore.breakdown.tpa - existingScore.breakdown.tpa}
                        </span>
                      </td>
                    </>
                  )}
                </tr>
                <tr className="border-t border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-2">Audit Services</td>
                  <td className="text-center px-4 py-2 font-semibold tabular-nums">{existingScore.breakdown.audit}</td>
                  {proposedScore && (
                    <>
                      <td className="text-center px-4 py-2 font-semibold tabular-nums">{proposedScore.breakdown.audit}</td>
                      <td className="text-center px-4 py-2">
                        <span className={`font-semibold tabular-nums ${
                          proposedScore.breakdown.audit > existingScore.breakdown.audit
                            ? 'text-green-600'
                            : proposedScore.breakdown.audit < existingScore.breakdown.audit
                            ? 'text-red-600'
                            : 'text-gray-500'
                        }`}>
                          {proposedScore.breakdown.audit > existingScore.breakdown.audit ? '+' : ''}
                          {proposedScore.breakdown.audit - existingScore.breakdown.audit}
                        </span>
                      </td>
                    </>
                  )}
                </tr>
                <tr className="border-t-2 border-border bg-blue-50/50">
                  <td className="px-4 py-2 font-semibold">Overall Service Score</td>
                  <td className="text-center px-4 py-2 font-bold text-lg text-blue-700 tabular-nums">{existingScore.score}</td>
                  {proposedScore && (
                    <>
                      <td className="text-center px-4 py-2 font-bold text-lg text-blue-700 tabular-nums">{proposedScore.score}</td>
                      <td className="text-center px-4 py-2">
                        <span className={`font-bold text-lg tabular-nums ${
                          proposedScore.score > existingScore.score
                            ? 'text-green-600'
                            : proposedScore.score < existingScore.score
                            ? 'text-red-600'
                            : 'text-gray-500'
                        }`}>
                          {proposedScore.score > existingScore.score ? '+' : ''}
                          {proposedScore.score - existingScore.score}
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="text-[10px] text-muted-foreground bg-muted/20 px-3 py-1.5 rounded-md mt-2">
            <strong>Service Scores (0-100):</strong> Measures coverage of essential, standard, and premium services with plan size-adjusted weighting. Small Plans (&lt; $5M AUM) emphasize essential services (5x weight), Mid-Market Plans ($5M-$50M AUM) balance essential (3x) and standard (2x), while Large Plans (&gt; $50M AUM) increasingly value standard (2.5x) and premium (2x) services.
          </div>
        </div>

        {/* Fee Competitiveness Table - only show if fee data exists */}
        {existingFees && benchmarks && (
          <div>
            <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Fee Competitiveness</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Metric</th>
                    <th className="text-center px-4 py-2 font-medium w-24">Current</th>
                    {proposedFees && proposedScore && <th className="text-center px-4 py-2 font-medium w-24">Proposed</th>}
                    {proposedFees && proposedScore && <th className="text-center px-4 py-2 font-medium w-24">Change</th>}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border/50 bg-green-50/50">
                    <td className="px-4 py-2 font-semibold">Total Fee Competitiveness Score</td>
                    <td className="text-center px-4 py-2 font-bold text-lg text-green-700 tabular-nums">{Math.round(existingTotalFeeScore)}</td>
                    {proposedFees && proposedScore && (
                      <>
                        <td className="text-center px-4 py-2 font-bold text-lg text-green-700 tabular-nums">{Math.round(proposedTotalFeeScore)}</td>
                        <td className="text-center px-4 py-2">
                          <span className={`font-bold text-lg tabular-nums ${
                            proposedTotalFeeScore > existingTotalFeeScore
                              ? 'text-green-600'
                              : proposedTotalFeeScore < existingTotalFeeScore
                              ? 'text-red-600'
                              : 'text-gray-500'
                          }`}>
                            {proposedTotalFeeScore > existingTotalFeeScore ? '+' : ''}
                            {Math.round(proposedTotalFeeScore - existingTotalFeeScore)}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="text-[10px] text-muted-foreground bg-muted/20 px-3 py-1.5 rounded-md mt-2">
              <strong>Fee Competitiveness (0-100):</strong> Measures how your total plan fees compare to market percentiles based solely on cost. Higher score = lower fees relative to market. This metric does NOT consider services provided - it only evaluates fee levels. Service coverage is measured separately in the Service Scores table above.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
