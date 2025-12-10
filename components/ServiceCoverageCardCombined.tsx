'use client';

import React from 'react';
import { AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import type { ServiceOptions } from '@/lib/types';
import {
  calculateServiceValueScore,
  calculateServiceCoverage,
  advisorServiceBaseline,
  recordkeeperServiceBaseline,
  tpaServiceBaseline,
  auditServiceBaseline,
  getPlanSizeCategory,
  planSizeExpectations
} from '@/lib/serviceBaselines';

interface ServiceCoverageCardCombinedProps {
  existingServices: ServiceOptions;
  proposedServices?: ServiceOptions;
  aum: number;
}

export default function ServiceCoverageCardCombined({
  existingServices,
  proposedServices,
  aum
}: ServiceCoverageCardCombinedProps) {
  const existingValueScore = calculateServiceValueScore(existingServices, aum);
  const proposedValueScore = proposedServices
    ? calculateServiceValueScore(proposedServices, aum)
    : null;

  const planSize = getPlanSizeCategory(aum);
  const expectations = planSizeExpectations[planSize];

  // Calculate coverage for each provider - existing
  const existingAdvisorCoverage = calculateServiceCoverage(
    existingServices.advisor,
    advisorServiceBaseline
  );
  const existingRecordkeeperCoverage = calculateServiceCoverage(
    existingServices.recordKeeper,
    recordkeeperServiceBaseline
  );
  const existingTpaCoverage = calculateServiceCoverage(
    existingServices.tpa,
    tpaServiceBaseline
  );
  const existingAuditCoverage = calculateServiceCoverage(
    existingServices.audit,
    auditServiceBaseline
  );

  // Calculate coverage for each provider - proposed
  const proposedAdvisorCoverage = proposedServices
    ? calculateServiceCoverage(proposedServices.advisor, advisorServiceBaseline)
    : null;
  const proposedRecordkeeperCoverage = proposedServices
    ? calculateServiceCoverage(proposedServices.recordKeeper, recordkeeperServiceBaseline)
    : null;
  const proposedTpaCoverage = proposedServices
    ? calculateServiceCoverage(proposedServices.tpa, tpaServiceBaseline)
    : null;
  const proposedAuditCoverage = proposedServices
    ? calculateServiceCoverage(proposedServices.audit, auditServiceBaseline)
    : null;

  // Helper to get score color
  const getScoreColor = (score: number): string => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 75) return 'bg-green-50 border-green-200';
    if (score >= 50) return 'bg-yellow-50 border-yellow-200';
    return 'bg-orange-50 border-orange-200';
  };

  // Helper to render stacked tier progress bars for comparison
  const renderComparisonBars = (
    label: string,
    existingCoverage: { provided: number; total: number; percentage: number },
    proposedCoverage: { provided: number; total: number; percentage: number } | null,
    tierColor: string
  ) => {
    return (
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs">
          <span className="font-medium text-muted-foreground">{label}</span>
        </div>
        {/* Existing bar */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-16">Current:</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${tierColor} transition-all duration-300`}
                style={{ width: `${existingCoverage.percentage}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold w-16 text-right">
              {existingCoverage.provided}/{existingCoverage.total}
            </span>
          </div>
          {/* Proposed bar */}
          {proposedCoverage && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-16">Proposed:</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${tierColor} transition-all duration-300 opacity-70`}
                  style={{ width: `${proposedCoverage.percentage}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold w-16 text-right">
                {proposedCoverage.provided}/{proposedCoverage.total}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Helper to render provider comparison card
  const renderProviderComparisonCard = (
    title: string,
    existingScore: number,
    proposedScore: number | null,
    existingCoverage: ReturnType<typeof calculateServiceCoverage>,
    proposedCoverage: ReturnType<typeof calculateServiceCoverage> | null
  ) => {
    const tierColors = {
      essential: 'bg-red-500',
      standard: 'bg-blue-500',
      premium: 'bg-purple-500'
    };

    const scoreDelta = proposedScore !== null ? proposedScore - existingScore : null;

    return (
      <div className="border rounded-md p-3 space-y-2 bg-white hover:shadow-sm transition-shadow">
        <div className="flex justify-between items-start">
          <h4 className="font-semibold text-sm">{title}</h4>
          <div className="flex items-center gap-2">
            <div className="text-center">
              <div className={`text-lg font-bold ${getScoreColor(existingScore)}`}>
                {existingScore}
              </div>
              <div className="text-[9px] text-muted-foreground">Current</div>
            </div>
            {proposedScore !== null && (
              <>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <div className="text-center">
                  <div className={`text-lg font-bold ${getScoreColor(proposedScore)}`}>
                    {proposedScore}
                  </div>
                  <div className="text-[9px] text-muted-foreground">Proposed</div>
                </div>
                {scoreDelta !== null && scoreDelta !== 0 && (
                  <div
                    className={`text-xs font-semibold ${
                      scoreDelta > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {scoreDelta > 0 ? '+' : ''}
                    {scoreDelta}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <div className="space-y-1.5">
          {renderComparisonBars(
            'Essential',
            existingCoverage.essential,
            proposedCoverage?.essential || null,
            tierColors.essential
          )}
          {renderComparisonBars(
            'Standard',
            existingCoverage.standard,
            proposedCoverage?.standard || null,
            tierColors.standard
          )}
          {renderComparisonBars(
            'Premium',
            existingCoverage.premium,
            proposedCoverage?.premium || null,
            tierColors.premium
          )}
        </div>
      </div>
    );
  };

  // Combine insights from both plans
  const allInsights = [
    ...existingValueScore.insights.map(insight => ({ type: 'existing', text: insight })),
    ...(proposedValueScore?.insights.map(insight => ({ type: 'proposed', text: insight })) || [])
  ];

  const hasNoIssues =
    existingValueScore.insights.length === 0 &&
    existingValueScore.score >= 75 &&
    (!proposedValueScore || (proposedValueScore.insights.length === 0 && proposedValueScore.score >= 75));

  return (
    <div className="space-y-4">
      {/* Header with scores */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-muted-foreground">
            Side-by-side comparison based on {planSize === 'under5M' ? 'small' : planSize === '5M-50M' ? 'mid-market' : 'large'} plan expectations
          </p>
        </div>
        {/* Overall scores side by side */}
        <div className="flex items-center gap-3">
            <div className={`border rounded-lg px-3 py-2 ${getScoreBgColor(existingValueScore.score)}`}>
              <div className="text-center">
                <div className={`text-xl font-bold ${getScoreColor(existingValueScore.score)}`}>
                  {existingValueScore.score}
                </div>
                <div className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide">
                  Current
                </div>
              </div>
            </div>
            {proposedValueScore && (
              <>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className={`border rounded-lg px-3 py-2 ${getScoreBgColor(proposedValueScore.score)}`}>
                  <div className="text-center">
                    <div className={`text-xl font-bold ${getScoreColor(proposedValueScore.score)}`}>
                      {proposedValueScore.score}
                    </div>
                    <div className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide">
                      Proposed
                    </div>
                  </div>
                </div>
                {/* Delta badge */}
                {proposedValueScore.score !== existingValueScore.score && (
                  <div
                    className={`px-2 py-1 rounded-md text-xs font-bold ${
                      proposedValueScore.score > existingValueScore.score
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {proposedValueScore.score > existingValueScore.score ? '+' : ''}
                    {proposedValueScore.score - existingValueScore.score}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Insights/Warnings */}
      {allInsights.length > 0 && (
        <div className="space-y-1.5">
          {allInsights.map((insight, index) => (
            <div
              key={index}
              className="flex items-start gap-2 text-xs bg-orange-50 border border-orange-200 rounded-md p-2"
            >
              <AlertCircle className="h-3.5 w-3.5 text-orange-600 mt-0.5 flex-shrink-0" />
              <span className="text-orange-800">
                <span className="font-semibold">
                  {insight.type === 'existing' ? '[Current] ' : '[Proposed] '}
                </span>
                {insight.text}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* No issues message */}
      {hasNoIssues && (
        <div className="flex items-center gap-2 text-xs bg-green-50 border border-green-200 rounded-md p-2">
          <CheckCircle className="h-3.5 w-3.5 text-green-600" />
          <span className="text-green-800">
            All essential services included. Service packages appropriate for plan size.
          </span>
        </div>
      )}

      {/* Provider breakdown grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {renderProviderComparisonCard(
          'Advisor',
          existingValueScore.breakdown.advisor,
          proposedValueScore?.breakdown.advisor || null,
          existingAdvisorCoverage,
          proposedAdvisorCoverage
        )}
        {renderProviderComparisonCard(
          'Recordkeeper',
          existingValueScore.breakdown.recordKeeper,
          proposedValueScore?.breakdown.recordKeeper || null,
          existingRecordkeeperCoverage,
          proposedRecordkeeperCoverage
        )}
        {renderProviderComparisonCard(
          'TPA',
          existingValueScore.breakdown.tpa,
          proposedValueScore?.breakdown.tpa || null,
          existingTpaCoverage,
          proposedTpaCoverage
        )}
        {renderProviderComparisonCard(
          'Audit',
          existingValueScore.breakdown.audit,
          proposedValueScore?.breakdown.audit || null,
          existingAuditCoverage,
          proposedAuditCoverage
        )}
      </div>

      {/* Disclaimers */}
      <div className="space-y-1">
        {/* Service Score Explanation */}
        <div className="text-[10px] text-muted-foreground bg-muted/20 px-3 py-1.5 rounded-md">
          <strong>Service Scores (0-100):</strong> Measures coverage of essential, standard, and premium services with plan size-adjusted weighting. Scoring reflects {planSize === 'under5M' ? 'Small Plan (< $5M AUM) priorities (essential 5x, standard 1.5x, premium 0.5x)' : planSize === '5M-50M' ? 'Mid-Market Plan ($5M-$50M AUM) expectations (essential 3x, standard 2x, premium 1x)' : 'Large Plan (> $50M AUM) requirements (essential 3x, standard 2.5x, premium 2x)'}.
        </div>

        {/* Plan size expectations note */}
        <div className="text-[10px] text-muted-foreground bg-muted/20 px-2 py-1.5 rounded-md">
          <span className="font-semibold">Plan Size Guidance:</span> {expectations.notes}
        </div>
      </div>
    </div>
  );
}
