'use client';

import React from 'react';
import { ServiceOptions, AdvisorServices, RecordkeeperServices, TPAServices, AuditServices } from '@/lib/types';
import { Check, X, AlertCircle } from 'lucide-react';
import {
  advisorServiceBaseline,
  recordkeeperServiceBaseline,
  tpaServiceBaseline,
  auditServiceBaseline,
  getServiceTier,
  type ServiceTier
} from '@/lib/serviceBaselines';

interface ServiceComparisonProps {
  existingServices?: ServiceOptions;
  proposedServices?: ServiceOptions;
  aum?: number;
}

interface ServiceRow {
  label: string;
  existingChecked: boolean;
  proposedChecked: boolean;
  tier: ServiceTier | null;
  serviceKey: string;
}

export default function ServiceComparison({ existingServices, proposedServices, aum }: ServiceComparisonProps) {
  const hasProposed = !!proposedServices;

  // Helper to get tier badge styling
  const getTierBadge = (tier: ServiceTier | null) => {
    if (!tier) return null;

    const styles = {
      essential: 'bg-red-100 text-red-700 border-red-200',
      standard: 'bg-blue-100 text-blue-700 border-blue-200',
      premium: 'bg-purple-100 text-purple-700 border-purple-200'
    };

    const labels = {
      essential: 'E',
      standard: 'S',
      premium: 'P'
    };

    return (
      <span
        className={`inline-block w-4 h-4 text-[9px] font-bold rounded-sm border flex items-center justify-center ${styles[tier]}`}
        title={`${tier.charAt(0).toUpperCase() + tier.slice(1)} service`}
      >
        {labels[tier]}
      </span>
    );
  };

  // Helper to get service label
  const getAdvisorServiceLabel = (key: keyof AdvisorServices): string => {
    const labels: Record<keyof AdvisorServices, string> = {
      planDesignConsulting: 'Plan Design Consulting',
      investmentMenuSelection: 'Investment Menu Selection',
      participantEducation: 'Participant Education & Meetings',
      fiduciarySupport321: '3(21) Fiduciary Support',
      fiduciarySupport338: '3(38) Fiduciary Support',
      complianceAssistance: 'Compliance Assistance',
      quarterlyReviews: 'Quarterly Performance Reviews',
      customReporting: 'Custom Reporting',
    };
    return labels[key];
  };

  const getRecordkeeperServiceLabel = (key: keyof RecordkeeperServices): string => {
    const labels: Record<keyof RecordkeeperServices, string> = {
      participantWebsite: 'Participant Website/Portal',
      mobileApp: 'Mobile App',
      callCenterSupport: 'Call Center Support',
      onlineEnrollment: 'Online Enrollment',
      loanAdministration: 'Loan Administration',
      distributionProcessing: 'Distribution Processing',
      payrollIntegration: 'Payroll Integration',
      dailyValuation: 'Daily Valuation',
      autoEnrollment: 'Auto-Enrollment Support',
      participantStatements: 'Participant Statements',
    };
    return labels[key];
  };

  const getTPAServiceLabel = (key: keyof TPAServices): string => {
    const labels: Record<keyof TPAServices, string> = {
      form5500Preparation: 'Form 5500 Preparation',
      discriminationTesting: 'Discrimination Testing',
      planDocumentUpdates: 'Plan Document Updates',
      amendmentServices: 'Amendment Services',
      noticePrparation: 'Notice Preparation',
      complianceTesting: 'Compliance Testing',
      governmentFilings: 'Government Filings',
      participantNotices: 'Participant Notices',
    };
    return labels[key];
  };

  const getAuditServiceLabel = (key: keyof AuditServices): string => {
    const labels: Record<keyof AuditServices, string> = {
      fullScopeAudit: 'Full Scope Audit',
      limitedScopeAudit: 'Limited Scope Audit',
      annualAudit: 'Annual Audit',
      biannualAudit: 'Biannual Audit',
      triannualAudit: 'Triannual Audit',
    };
    return labels[key];
  };

  // Build service rows for each category
  const buildAdvisorRows = (): ServiceRow[] => {
    const keys: (keyof AdvisorServices)[] = [
      'planDesignConsulting',
      'investmentMenuSelection',
      'participantEducation',
      'fiduciarySupport321',
      'fiduciarySupport338',
      'complianceAssistance',
      'quarterlyReviews',
      'customReporting',
    ];

    return keys.map((key) => ({
      label: getAdvisorServiceLabel(key),
      existingChecked: existingServices?.advisor?.[key] || false,
      proposedChecked: proposedServices?.advisor?.[key] || false,
      tier: getServiceTier(key, advisorServiceBaseline),
      serviceKey: key
    }));
  };

  const buildRecordkeeperRows = (): ServiceRow[] => {
    const keys: (keyof RecordkeeperServices)[] = [
      'participantWebsite',
      'mobileApp',
      'callCenterSupport',
      'onlineEnrollment',
      'loanAdministration',
      'distributionProcessing',
      'payrollIntegration',
      'dailyValuation',
      'autoEnrollment',
      'participantStatements',
    ];

    return keys.map((key) => ({
      label: getRecordkeeperServiceLabel(key),
      existingChecked: existingServices?.recordKeeper?.[key] || false,
      proposedChecked: proposedServices?.recordKeeper?.[key] || false,
      tier: getServiceTier(key, recordkeeperServiceBaseline),
      serviceKey: key
    }));
  };

  const buildTPARows = (): ServiceRow[] => {
    const keys: (keyof TPAServices)[] = [
      'form5500Preparation',
      'discriminationTesting',
      'planDocumentUpdates',
      'amendmentServices',
      'noticePrparation',
      'complianceTesting',
      'governmentFilings',
      'participantNotices',
    ];

    return keys.map((key) => ({
      label: getTPAServiceLabel(key),
      existingChecked: existingServices?.tpa?.[key] || false,
      proposedChecked: proposedServices?.tpa?.[key] || false,
      tier: getServiceTier(key, tpaServiceBaseline),
      serviceKey: key
    }));
  };

  const buildAuditRows = (): ServiceRow[] => {
    const keys: (keyof AuditServices)[] = [
      'fullScopeAudit',
      'limitedScopeAudit',
      'annualAudit',
      'biannualAudit',
      'triannualAudit',
    ];

    return keys.map((key) => ({
      label: getAuditServiceLabel(key),
      existingChecked: existingServices?.audit?.[key] || false,
      proposedChecked: proposedServices?.audit?.[key] || false,
      tier: getServiceTier(key, auditServiceBaseline),
      serviceKey: key
    }));
  };

  const renderServiceTable = (title: string, rows: ServiceRow[]) => {
    if (rows.length === 0) {
      return null;
    }

    // Group services by tier
    const essentialRows = rows.filter(row => row.tier === 'essential');
    const standardRows = rows.filter(row => row.tier === 'standard');
    const premiumRows = rows.filter(row => row.tier === 'premium');

    // Check for missing essential services
    const missingEssential = essentialRows.filter(
      row => !row.existingChecked && !row.proposedChecked
    );

    // Helper to render tier section
    const renderTierSection = (tierRows: ServiceRow[], tierName: string, tierColor: string) => {
      if (tierRows.length === 0) return null;

      return (
        <>
          <tr className={`${tierColor} border-t-2 border-border`}>
            <td colSpan={hasProposed ? 4 : 3} className="px-2 py-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">{tierName}</span>
                <div className="flex-1 h-px bg-border"></div>
              </div>
            </td>
          </tr>
          {tierRows.map((row, index) => {
            const isEssentialMissing = row.tier === 'essential' && !row.existingChecked;
            return (
              <tr key={`${tierName}-${index}`} className={`border-t border-border/50 hover:bg-muted/20 ${isEssentialMissing ? 'bg-orange-50/30' : ''}`}>
                <td className="px-2 py-1 text-xs pl-4">{row.label}</td>
                <td className="px-2 py-1 text-center">{getTierBadge(row.tier)}</td>
                <td className="px-2 py-1 text-center">
                  {row.existingChecked ? (
                    <Check className="inline-block h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <X className={`inline-block h-3.5 w-3.5 ${isEssentialMissing ? 'text-orange-400' : 'text-gray-300'}`} />
                  )}
                </td>
                {hasProposed && (
                  <td className="px-2 py-1 text-center">
                    {row.proposedChecked ? (
                      <Check className="inline-block h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <X className="inline-block h-3.5 w-3.5 text-gray-300" />
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </>
      );
    };

    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">{title}</h4>
          {missingEssential.length > 0 && (
            <div title={`${missingEssential.length} essential service(s) missing`}>
              <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
            </div>
          )}
        </div>
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left px-2 py-1 font-medium text-xs">Service</th>
                <th className="text-center px-2 py-1 font-medium text-xs w-6">Tier</th>
                <th className="text-center px-2 py-1 font-medium text-xs w-20">Existing</th>
                {hasProposed && <th className="text-center px-2 py-1 font-medium text-xs w-20">Proposed</th>}
              </tr>
            </thead>
            <tbody>
              {renderTierSection(essentialRows, 'Essential Services', 'bg-red-50/50')}
              {renderTierSection(standardRows, 'Standard Services', 'bg-blue-50/50')}
              {renderTierSection(premiumRows, 'Premium Services', 'bg-purple-50/50')}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const advisorRows = buildAdvisorRows();
  const recordkeeperRows = buildRecordkeeperRows();
  const tpaRows = buildTPARows();
  const auditRows = buildAuditRows();

  // Check if there are any services selected
  const hasAnyServices = [...advisorRows, ...recordkeeperRows, ...tpaRows, ...auditRows].some(
    (row) => row.existingChecked || row.proposedChecked
  );

  if (!hasAnyServices) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Service tier legend */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground bg-muted/20 px-2 py-1.5 rounded-md">
        <span className="font-medium">Service Tiers:</span>
        <div className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 text-[9px] font-bold rounded-sm border flex items-center justify-center bg-red-100 text-red-700 border-red-200">E</span>
          <span>Essential</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 text-[9px] font-bold rounded-sm border flex items-center justify-center bg-blue-100 text-blue-700 border-blue-200">S</span>
          <span>Standard</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 text-[9px] font-bold rounded-sm border flex items-center justify-center bg-purple-100 text-purple-700 border-purple-200">P</span>
          <span>Premium</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {renderServiceTable('Advisor Services', advisorRows)}
        {renderServiceTable('Recordkeeper Services', recordkeeperRows)}
        {renderServiceTable('TPA Services', tpaRows)}
        {renderServiceTable('Audit Services', auditRows)}
      </div>
    </div>
  );
}
