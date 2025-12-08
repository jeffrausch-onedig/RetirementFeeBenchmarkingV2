'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronRight, Info } from 'lucide-react';
import type { ServiceOptions, AdvisorServices, RecordkeeperServices, TPAServices, AuditServices } from '@/lib/types';
import {
  advisorServiceBaseline,
  recordkeeperServiceBaseline,
  tpaServiceBaseline,
  auditServiceBaseline,
  getServiceTier,
  type ServiceTier
} from '@/lib/serviceBaselines';

interface ServiceSelectionTableProps {
  existingServices: ServiceOptions;
  proposedServices?: ServiceOptions;
  onExistingChange: (services: ServiceOptions) => void;
  onProposedChange?: (services: ServiceOptions) => void;
  showProposed: boolean;
}

interface ServiceItem {
  key: string;
  label: string;
  description: string;
  tier: ServiceTier | null;
}

// Helper to create service items with tier information
const createServiceItems = <T,>(
  keys: (keyof T)[],
  labels: Record<keyof T, string>,
  descriptions: Record<keyof T, string>,
  baseline: any
): ServiceItem[] => {
  return keys.map((key) => ({
    key: String(key),
    label: labels[key],
    description: descriptions[key],
    tier: getServiceTier(key, baseline)
  })).sort((a, b) => {
    // Sort by tier: essential first, then standard, then premium
    const tierOrder = { essential: 0, standard: 1, premium: 2 };
    const aTier = a.tier ? tierOrder[a.tier] : 999;
    const bTier = b.tier ? tierOrder[b.tier] : 999;
    return aTier - bTier;
  });
};

const advisorServiceItems: ServiceItem[] = createServiceItems<AdvisorServices>(
  ['investmentMenuSelection', 'fiduciarySupport321', 'complianceAssistance', 'planDesignConsulting', 'participantEducation', 'quarterlyReviews', 'fiduciarySupport338', 'customReporting'],
  {
    planDesignConsulting: 'Plan Design Consulting',
    investmentMenuSelection: 'Investment Menu Selection',
    participantEducation: 'Participant Education',
    fiduciarySupport321: '3(21) Fiduciary Support',
    fiduciarySupport338: '3(38) Fiduciary Support',
    complianceAssistance: 'Compliance Assistance',
    quarterlyReviews: 'Quarterly Performance Reviews',
    customReporting: 'Custom Reporting',
  },
  {
    planDesignConsulting: 'Strategic plan design and consulting services',
    investmentMenuSelection: 'Selection and monitoring of investment options',
    participantEducation: 'Educational meetings and participant communications',
    fiduciarySupport321: 'Co-fiduciary advisory services',
    fiduciarySupport338: 'Full discretionary investment management',
    complianceAssistance: 'ERISA and DOL compliance support',
    quarterlyReviews: 'Regular performance monitoring and reporting',
    customReporting: 'Customized reporting and analytics',
  },
  advisorServiceBaseline
);

const recordkeeperServiceItems: ServiceItem[] = createServiceItems<RecordkeeperServices>(
  ['participantWebsite', 'callCenterSupport', 'onlineEnrollment', 'mobileApp', 'loanAdministration', 'dailyValuation', 'participantStatements', 'payrollIntegration', 'autoEnrollment', 'distributionProcessing'],
  {
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
  },
  {
    participantWebsite: 'Online access for participants',
    mobileApp: 'Mobile application for account access',
    callCenterSupport: '24/7 participant support line',
    onlineEnrollment: 'Digital enrollment process',
    loanAdministration: 'Participant loan processing and tracking',
    distributionProcessing: 'Withdrawal and distribution handling',
    payrollIntegration: 'Automated payroll system integration',
    dailyValuation: 'Daily account value updates',
    autoEnrollment: 'Automatic enrollment features',
    participantStatements: 'Regular account statements',
  },
  recordkeeperServiceBaseline
);

const tpaServiceItems: ServiceItem[] = createServiceItems<TPAServices>(
  ['form5500Preparation', 'discriminationTesting', 'complianceTesting', 'planDocumentUpdates', 'governmentFilings', 'participantNotices', 'amendmentServices', 'noticePrparation'],
  {
    form5500Preparation: 'Form 5500 Preparation',
    discriminationTesting: 'Discrimination Testing',
    planDocumentUpdates: 'Plan Document Updates',
    amendmentServices: 'Amendment Services',
    noticePrparation: 'Notice Preparation',
    complianceTesting: 'Compliance Testing',
    governmentFilings: 'Government Filings',
    participantNotices: 'Participant Notices',
  },
  {
    form5500Preparation: 'Annual government reporting',
    discriminationTesting: 'ADP/ACP and other compliance tests',
    planDocumentUpdates: 'Ongoing plan document maintenance',
    amendmentServices: 'Plan amendment preparation',
    noticePrparation: 'Required participant notices',
    complianceTesting: 'Full compliance testing suite',
    governmentFilings: 'IRS and DOL filing services',
    participantNotices: 'Distribution of required notices',
  },
  tpaServiceBaseline
);

const auditServiceItems: ServiceItem[] = createServiceItems<AuditServices>(
  ['annualAudit', 'fullScopeAudit', 'limitedScopeAudit', 'biannualAudit', 'triannualAudit'],
  {
    fullScopeAudit: 'Full Scope Audit',
    limitedScopeAudit: 'Limited Scope Audit',
    annualAudit: 'Annual Audit',
    biannualAudit: 'Biannual Audit',
    triannualAudit: 'Triannual Audit',
  },
  {
    fullScopeAudit: 'Complete financial audit',
    limitedScopeAudit: 'ERISA 103(a)(3)(C) limited scope',
    annualAudit: 'Annual audit cycle',
    biannualAudit: 'Every two years',
    triannualAudit: 'Every three years',
  },
  auditServiceBaseline
);

export default function ServiceSelectionTable({
  existingServices,
  proposedServices,
  onExistingChange,
  onProposedChange,
  showProposed,
}: ServiceSelectionTableProps) {
  // Track which provider sections are expanded
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    advisor: true,
    recordKeeper: true,
    tpa: true,
    audit: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleExistingCheck = (category: keyof ServiceOptions, serviceKey: string, checked: boolean) => {
    const updatedServices = {
      ...existingServices,
      [category]: {
        ...existingServices[category],
        [serviceKey]: checked,
      },
    };
    onExistingChange(updatedServices);
  };

  const handleProposedCheck = (category: keyof ServiceOptions, serviceKey: string, checked: boolean) => {
    if (!proposedServices || !onProposedChange) return;

    const updatedServices = {
      ...proposedServices,
      [category]: {
        ...proposedServices[category],
        [serviceKey]: checked,
      },
    };
    onProposedChange(updatedServices);
  };

  // Helper to count selected services
  const countSelectedServices = (category: keyof ServiceOptions, services: ServiceOptions) => {
    return Object.values(services[category] || {}).filter(v => v === true).length;
  };

  const renderServiceSection = (
    title: string,
    category: keyof ServiceOptions,
    items: ServiceItem[]
  ) => {
    const isExpanded = expandedSections[category];
    const existingCount = countSelectedServices(category, existingServices);
    const totalCount = items.length;

    // Group items by tier
    const groupedItems: Record<string, ServiceItem[]> = {
      essential: [],
      standard: [],
      premium: []
    };

    items.forEach(item => {
      if (item.tier) {
        groupedItems[item.tier].push(item);
      }
    });

    const tierBadges = {
      essential: { label: 'E', color: 'bg-red-100 text-red-700 border-red-300' },
      standard: { label: 'S', color: 'bg-blue-100 text-blue-700 border-blue-300' },
      premium: { label: 'P', color: 'bg-purple-100 text-purple-700 border-purple-300' }
    };

    return (
      <div className="border rounded-lg overflow-hidden">
        {/* Collapsible Header */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggleSection(category);
          }}
          className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors bg-muted/20"
        >
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <h3 className="font-semibold text-sm">{title}</h3>
            <span className="text-xs text-muted-foreground">
              ({existingCount}/{totalCount} selected)
            </span>
          </div>
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="p-2 space-y-1">
            {(['essential', 'standard', 'premium'] as const).map(tier => {
              if (groupedItems[tier].length === 0) return null;

              return (
                <div key={tier} className="space-y-0.5">
                  {groupedItems[tier].map((item) => {
                    const existingChecked = (existingServices[category] as any)?.[item.key] || false;
                    const proposedChecked = (proposedServices?.[category] as any)?.[item.key] || false;

                    return (
                      <div
                        key={item.key}
                        className="grid gap-2 py-1.5 px-2 hover:bg-muted/30 rounded-sm transition-colors items-center"
                        style={{
                          gridTemplateColumns: showProposed ? 'auto 1fr 60px 60px' : 'auto 1fr 60px',
                        }}
                      >
                        {/* Tier Badge */}
                        <div
                          className={`inline-flex items-center justify-center w-5 h-5 text-[9px] font-bold rounded border ${tierBadges[item.tier!].color}`}
                          title={`${item.tier!.charAt(0).toUpperCase() + item.tier!.slice(1)} service`}
                        >
                          {tierBadges[item.tier!].label}
                        </div>

                        {/* Service Label with Tooltip */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-sm truncate">{item.label}</span>
                          <div className="group relative flex-shrink-0">
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 w-64">
                              <div className="bg-gray-900 text-white text-xs rounded-md p-2 shadow-lg">
                                {item.description}
                                <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Existing Checkbox */}
                        <div className="flex items-center justify-center">
                          <Checkbox
                            id={`existing-${category}-${item.key}`}
                            checked={existingChecked}
                            onCheckedChange={(checked) =>
                              handleExistingCheck(category, item.key, checked as boolean)
                            }
                          />
                        </div>

                        {/* Proposed Checkbox */}
                        {showProposed && (
                          <div className="flex items-center justify-center">
                            <Checkbox
                              id={`proposed-${category}-${item.key}`}
                              checked={proposedChecked}
                              onCheckedChange={(checked) =>
                                handleProposedCheck(category, item.key, checked as boolean)
                              }
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Service Selection</CardTitle>
        <CardDescription>
          Select the services included with each provider. Hover over the info icon for service descriptions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Tier Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/20 px-3 py-2 rounded-md">
          <span className="font-medium">Service Tiers:</span>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-5 h-5 text-[9px] font-bold rounded border bg-red-100 text-red-700 border-red-300">E</span>
            <span>Essential</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-5 h-5 text-[9px] font-bold rounded border bg-blue-100 text-blue-700 border-blue-300">S</span>
            <span>Standard</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-5 h-5 text-[9px] font-bold rounded border bg-purple-100 text-purple-700 border-purple-300">P</span>
            <span>Premium</span>
          </div>
        </div>

        {/* Column headers - only show when at least one section is expanded */}
        {Object.values(expandedSections).some(v => v) && (
          <div
            className="grid gap-2 px-3 pb-2 text-xs font-medium text-muted-foreground"
            style={{
              gridTemplateColumns: showProposed ? 'auto 1fr 60px 60px' : 'auto 1fr 60px',
            }}
          >
            <div className="w-5"></div>
            <div>Service</div>
            <div className="text-center">Existing</div>
            {showProposed && <div className="text-center">Proposed</div>}
          </div>
        )}

        {/* Service sections */}
        <div className="space-y-2">
          {renderServiceSection('Advisor Services', 'advisor', advisorServiceItems)}
          {renderServiceSection('Recordkeeper Services', 'recordKeeper', recordkeeperServiceItems)}
          {renderServiceSection('TPA Services', 'tpa', tpaServiceItems)}
          {renderServiceSection('Audit Services', 'audit', auditServiceItems)}
        </div>
      </CardContent>
    </Card>
  );
}
