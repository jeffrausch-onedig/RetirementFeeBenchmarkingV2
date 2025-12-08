'use client';

import React from 'react';
import type { ServiceOptions } from '@/lib/types';
import {
  calculateServiceCoverage,
  advisorServiceBaseline,
  recordkeeperServiceBaseline,
  tpaServiceBaseline,
  auditServiceBaseline
} from '@/lib/serviceBaselines';

interface ServiceHeatmapProps {
  existingServices: ServiceOptions;
  proposedServices?: ServiceOptions;
  aum: number;
}

export default function ServiceHeatmap({
  existingServices,
  proposedServices,
  aum
}: ServiceHeatmapProps) {
  // Calculate coverage for each provider
  const existingAdvisor = calculateServiceCoverage(existingServices.advisor, advisorServiceBaseline);
  const existingRecordkeeper = calculateServiceCoverage(existingServices.recordKeeper, recordkeeperServiceBaseline);
  const existingTpa = calculateServiceCoverage(existingServices.tpa, tpaServiceBaseline);
  const existingAudit = calculateServiceCoverage(existingServices.audit, auditServiceBaseline);

  const proposedAdvisor = proposedServices
    ? calculateServiceCoverage(proposedServices.advisor, advisorServiceBaseline)
    : null;
  const proposedRecordkeeper = proposedServices
    ? calculateServiceCoverage(proposedServices.recordKeeper, recordkeeperServiceBaseline)
    : null;
  const proposedTpa = proposedServices
    ? calculateServiceCoverage(proposedServices.tpa, tpaServiceBaseline)
    : null;
  const proposedAudit = proposedServices
    ? calculateServiceCoverage(proposedServices.audit, auditServiceBaseline)
    : null;

  // Helper to get complete background class based on percentage and color
  const getBackgroundClass = (percentage: number, baseColor: string): string => {
    // Map complete class names for Tailwind JIT compiler
    const colorMap: Record<string, Record<string, string>> = {
      red: {
        '600': 'bg-red-600',
        '500': 'bg-red-500',
        '400': 'bg-red-400',
        '300': 'bg-red-300',
        '200': 'bg-red-200',
      },
      blue: {
        '600': 'bg-blue-600',
        '500': 'bg-blue-500',
        '400': 'bg-blue-400',
        '300': 'bg-blue-300',
        '200': 'bg-blue-200',
      },
      purple: {
        '600': 'bg-purple-600',
        '500': 'bg-purple-500',
        '400': 'bg-purple-400',
        '300': 'bg-purple-300',
        '200': 'bg-purple-200',
      },
    };

    let intensity: string;
    if (percentage >= 100) intensity = '600';
    else if (percentage >= 75) intensity = '500';
    else if (percentage >= 50) intensity = '400';
    else if (percentage >= 25) intensity = '300';
    else if (percentage > 0) intensity = '200';
    else return 'bg-gray-100';

    return colorMap[baseColor]?.[intensity] || 'bg-gray-100';
  };

  // Helper to render a heatmap cell
  const renderCell = (
    percentage: number,
    provided: number,
    total: number,
    tierColor: string
  ) => {
    const bgClass = getBackgroundClass(percentage, tierColor);
    const textColorClass = percentage >= 50 ? 'text-white' : 'text-gray-700';

    return (
      <div
        className={`${bgClass} ${textColorClass} p-3 rounded-md flex flex-col items-center justify-center min-h-[60px] transition-all hover:scale-105`}
        title={`${provided} of ${total} services (${Math.round(percentage)}%)`}
      >
        <div className="text-lg font-bold">{Math.round(percentage)}%</div>
        <div className="text-[10px] opacity-80">{provided}/{total}</div>
      </div>
    );
  };

  const providers = [
    { name: 'Advisor', existing: existingAdvisor, proposed: proposedAdvisor },
    { name: 'Recordkeeper', existing: existingRecordkeeper, proposed: proposedRecordkeeper },
    { name: 'TPA', existing: existingTpa, proposed: proposedTpa },
    { name: 'Audit', existing: existingAudit, proposed: proposedAudit }
  ];

  const tiers = [
    { key: 'essential', label: 'Essential', color: 'red' },
    { key: 'standard', label: 'Standard', color: 'blue' },
    { key: 'premium', label: 'Premium', color: 'purple' }
  ] as const;

  return (
    <div className="space-y-6">
      {/* Current Plan Heatmap */}
      <div>
        <h4 className="font-semibold text-sm mb-3 text-gray-700">Current Plan Coverage</h4>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-xs font-semibold text-gray-600 p-2 w-32">Provider</th>
                {tiers.map(tier => (
                  <th key={tier.key} className="text-center text-xs font-semibold text-gray-600 p-2">
                    {tier.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {providers.map((provider) => (
                <tr key={provider.name} className="border-t border-gray-200">
                  <td className="text-sm font-medium text-gray-700 p-2">{provider.name}</td>
                  {tiers.map(tier => {
                    const coverage = provider.existing[tier.key];
                    return (
                      <td key={tier.key} className="p-2">
                        {renderCell(
                          coverage.percentage,
                          coverage.provided,
                          coverage.total,
                          tier.color
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proposed Plan Heatmap */}
      {proposedServices && (
        <div>
          <h4 className="font-semibold text-sm mb-3 text-gray-700">Proposed Plan Coverage</h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-600 p-2 w-32">Provider</th>
                  {tiers.map(tier => (
                    <th key={tier.key} className="text-center text-xs font-semibold text-gray-600 p-2">
                      {tier.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {providers.map((provider) => {
                  if (!provider.proposed) return null;
                  return (
                    <tr key={provider.name} className="border-t border-gray-200">
                      <td className="text-sm font-medium text-gray-700 p-2">{provider.name}</td>
                      {tiers.map(tier => {
                        const coverage = provider.proposed![tier.key];
                        return (
                          <td key={tier.key} className="p-2">
                            {renderCell(
                              coverage.percentage,
                              coverage.provided,
                              coverage.total,
                              tier.color
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-600 bg-gray-50 p-3 rounded-md">
        <span className="font-semibold">Coverage:</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 rounded"></div>
          <span>0%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-300 rounded"></div>
          <span>1-49%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>50-99%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-600 rounded"></div>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
