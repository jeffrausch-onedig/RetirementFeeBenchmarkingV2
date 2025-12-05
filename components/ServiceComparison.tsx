'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ServiceOptions, AdvisorServices, RecordkeeperServices, TPAServices, AuditServices } from '@/lib/types';
import { Check, X } from 'lucide-react';

interface ServiceComparisonProps {
  existingServices?: ServiceOptions;
  proposedServices?: ServiceOptions;
}

interface ServiceRow {
  label: string;
  existingChecked: boolean;
  proposedChecked: boolean;
}

export default function ServiceComparison({ existingServices, proposedServices }: ServiceComparisonProps) {
  const hasProposed = !!proposedServices;

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
    }));
  };

  const renderServiceTable = (title: string, rows: ServiceRow[]) => {
    // Only show rows where at least one plan has the service
    const activeRows = rows.filter((row) => row.existingChecked || row.proposedChecked);

    if (activeRows.length === 0) {
      return null;
    }

    return (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm text-muted-foreground">{title}</h4>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-2 font-medium">Service</th>
                <th className="text-center p-2 font-medium w-24">Existing</th>
                {hasProposed && <th className="text-center p-2 font-medium w-24">Proposed</th>}
              </tr>
            </thead>
            <tbody>
              {activeRows.map((row, index) => (
                <tr key={index} className="border-t">
                  <td className="p-2">{row.label}</td>
                  <td className="p-2 text-center">
                    {row.existingChecked ? (
                      <Check className="inline-block h-4 w-4 text-green-600" />
                    ) : (
                      <X className="inline-block h-4 w-4 text-gray-300" />
                    )}
                  </td>
                  {hasProposed && (
                    <td className="p-2 text-center">
                      {row.proposedChecked ? (
                        <Check className="inline-block h-4 w-4 text-green-600" />
                      ) : (
                        <X className="inline-block h-4 w-4 text-gray-300" />
                      )}
                    </td>
                  )}
                </tr>
              ))}
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
    <Card>
      <CardHeader>
        <CardTitle>Service Comparison</CardTitle>
        <CardDescription>
          Services included with each provider help explain fee differences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderServiceTable('Advisor Services', advisorRows)}
        {renderServiceTable('Recordkeeper Services', recordkeeperRows)}
        {renderServiceTable('TPA Services', tpaRows)}
        {renderServiceTable('Audit Services', auditRows)}
      </CardContent>
    </Card>
  );
}
