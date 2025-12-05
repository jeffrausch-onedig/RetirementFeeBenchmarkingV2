'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ServiceOptions } from '@/lib/types';

interface ServiceCheckboxProps {
  id: string;
  label: string;
  description: string;
  checked?: boolean;
  onChange: (checked: boolean) => void;
}

function ServiceCheckbox({ id, label, description, checked, onChange }: ServiceCheckboxProps) {
  return (
    <div className="flex items-start space-x-2 group">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        className="mt-1"
      />
      <div className="flex-1">
        <Label
          htmlFor={id}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          {label}
        </Label>
        <p className="text-sm text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {description}
        </p>
      </div>
    </div>
  );
}

interface ServiceOptionsInputProps {
  planType: 'existing' | 'proposed';
  services: ServiceOptions;
  onChange: (services: ServiceOptions) => void;
}

export default function ServiceOptionsInput({ planType, services, onChange }: ServiceOptionsInputProps) {
  const updateAdvisorService = (key: keyof NonNullable<ServiceOptions['advisor']>, value: boolean) => {
    onChange({
      ...services,
      advisor: {
        ...services.advisor,
        [key]: value,
      },
    });
  };

  const updateRecordkeeperService = (key: keyof NonNullable<ServiceOptions['recordKeeper']>, value: boolean) => {
    onChange({
      ...services,
      recordKeeper: {
        ...services.recordKeeper,
        [key]: value,
      },
    });
  };

  const updateTPAService = (key: keyof NonNullable<ServiceOptions['tpa']>, value: boolean) => {
    onChange({
      ...services,
      tpa: {
        ...services.tpa,
        [key]: value,
      },
    });
  };

  const updateAuditService = (key: keyof NonNullable<ServiceOptions['audit']>, value: boolean) => {
    onChange({
      ...services,
      audit: {
        ...services.audit,
        [key]: value,
      },
    });
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Services Provided - {planType === 'existing' ? 'Existing Plan' : 'Proposed Plan'}</CardTitle>
        <CardDescription>
          Select the services included with each provider. This context helps explain fee differences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Advisor Services */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Advisor Services</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ServiceCheckbox
              id={`${planType}-advisor-plan-design`}
              label="Plan Design Consulting"
              description="Strategic guidance on plan structure and features"
              checked={services.advisor?.planDesignConsulting}
              onChange={(checked) => updateAdvisorService('planDesignConsulting', checked)}
            />
            <ServiceCheckbox
              id={`${planType}-advisor-investment-menu`}
              label="Investment Menu Selection"
              description="Selection and monitoring of investment options"
              checked={services.advisor?.investmentMenuSelection}
              onChange={(checked) => updateAdvisorService('investmentMenuSelection', checked)}
            />
            <ServiceCheckbox
              id={`${planType}-advisor-participant-education`}
              label="Participant Education & Meetings"
              description="On-site meetings and educational resources"
              checked={services.advisor?.participantEducation}
              onChange={(checked) => updateAdvisorService('participantEducation', checked)}
            />
            <ServiceCheckbox
              id={`${planType}-advisor-fiduciary-321`}
              label="3(21) Fiduciary Support"
              description="Co-fiduciary investment advisory services"
              checked={services.advisor?.fiduciarySupport321}
              onChange={(checked) => updateAdvisorService('fiduciarySupport321', checked)}
            />
            <ServiceCheckbox
              id={`${planType}-advisor-fiduciary-338`}
              label="3(38) Fiduciary Support"
              description="Discretionary investment management services"
              checked={services.advisor?.fiduciarySupport338}
              onChange={(checked) => updateAdvisorService('fiduciarySupport338', checked)}
            />
            <ServiceCheckbox
              id={`${planType}-advisor-compliance`}
              label="Compliance Assistance"
              description="Help with regulatory compliance requirements"
              checked={services.advisor?.complianceAssistance}
              onChange={(checked) => updateAdvisorService('complianceAssistance', checked)}
            />
            <ServiceCheckbox
              id={`${planType}-advisor-quarterly-reviews`}
              label="Quarterly Performance Reviews"
              description="Regular investment and plan performance reviews"
              checked={services.advisor?.quarterlyReviews}
              onChange={(checked) => updateAdvisorService('quarterlyReviews', checked)}
            />
            <ServiceCheckbox
              id={`${planType}-advisor-custom-reporting`}
              label="Custom Reporting"
              description="Tailored reports and analytics"
              checked={services.advisor?.customReporting}
              onChange={(checked) => updateAdvisorService('customReporting', checked)}
            />
          </div>
        </div>

        {/* Recordkeeper Services */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Recordkeeper Services</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ServiceCheckbox
              id={`${planType}-rk-website`}
              label="Participant Website/Portal"
              description="Online access to account information"
              checked={services.recordKeeper?.participantWebsite}
              onChange={(checked) => updateRecordkeeperService('participantWebsite', checked)}
            />
            <ServiceCheckbox
              id={`${planType}-rk-mobile-app`}
              label="Mobile App"
              description="Mobile application for participant access"
              checked={services.recordKeeper?.mobileApp}
              onChange={(checked) => updateRecordkeeperService('mobileApp', checked)}
            />
            <ServiceCheckbox
              id={`${planType}-rk-call-center`}
              label="Call Center Support"
              description="Phone support for participants"
              checked={services.recordKeeper?.callCenterSupport}
              onChange={(checked) => updateRecordkeeperService('callCenterSupport', checked)}
            />
            <ServiceCheckbox
              id={`${planType}-rk-online-enrollment`}
              label="Online Enrollment"
              description="Digital enrollment capabilities"
              checked={services.recordKeeper?.onlineEnrollment}
              onChange={(checked) => updateRecordkeeperService('onlineEnrollment', checked)}
            />
            <ServiceCheckbox
              id={`${planType}-rk-loan-admin`}
              label="Loan Administration"
              description="Processing and tracking of participant loans"
              checked={services.recordKeeper?.loanAdministration}
              onChange={(checked) => updateRecordkeeperService('loanAdministration', checked)}
            />
            <ServiceCheckbox
              id={`${planType}-rk-distributions`}
              label="Distribution Processing"
              description="Handling of withdrawals and distributions"
              checked={services.recordKeeper?.distributionProcessing}
              onChange={(checked) => updateRecordkeeperService('distributionProcessing', checked)}
            />
            <ServiceCheckbox
              id={`${planType}-rk-payroll`}
              label="Payroll Integration"
              description="Automated data exchange with payroll system"
              checked={services.recordKeeper?.payrollIntegration}
              onChange={(checked) => updateRecordkeeperService('payrollIntegration', checked)}
            />
            <ServiceCheckbox
              id={`${planType}-rk-daily-valuation`}
              label="Daily Valuation"
              description="Real-time account balance updates"
              checked={services.recordKeeper?.dailyValuation}
              onChange={(checked) => updateRecordkeeperService('dailyValuation', checked)}
            />
            <ServiceCheckbox
              id={`${planType}-rk-auto-enrollment`}
              label="Auto-Enrollment Support"
              description="Automatic enrollment processing"
              checked={services.recordKeeper?.autoEnrollment}
              onChange={(checked) => updateRecordkeeperService('autoEnrollment', checked)}
            />
            <ServiceCheckbox
              id={`${planType}-rk-statements`}
              label="Participant Statements"
              description="Regular account statements"
              checked={services.recordKeeper?.participantStatements}
              onChange={(checked) => updateRecordkeeperService('participantStatements', checked)}
            />
          </div>
        </div>

        {/* TPA Services */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">TPA (Third Party Administrator) Services</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ServiceCheckbox
              id={`${planType}-tpa-5500`}
              label="Form 5500 Preparation"
              description="Annual filing with Department of Labor"
              checked={services.tpa?.form5500Preparation}
              onChange={(checked) => updateTPAService('form5500Preparation', checked)}
            />
            <ServiceCheckbox
              id={`${planType}-tpa-discrimination`}
              label="Discrimination Testing"
              description="ADP/ACP and top-heavy testing"
              checked={services.tpa?.discriminationTesting}
              onChange={(checked) => updateTPAService('discriminationTesting', checked)}
            />
            <ServiceCheckbox
              id={`${planType}-tpa-plan-docs`}
              label="Plan Document Updates"
              description="Maintenance of plan documentation"
              checked={services.tpa?.planDocumentUpdates}
              onChange={(checked) => updateTPAService('planDocumentUpdates', checked)}
            />
            <ServiceCheckbox
              id={`${planType}-tpa-amendments`}
              label="Amendment Services"
              description="Processing plan amendments and changes"
              checked={services.tpa?.amendmentServices}
              onChange={(checked) => updateTPAService('amendmentServices', checked)}
            />
            <ServiceCheckbox
              id={`${planType}-tpa-notices`}
              label="Notice Preparation"
              description="Required participant notices (Safe Harbor, etc.)"
              checked={services.tpa?.noticePrparation}
              onChange={(checked) => updateTPAService('noticePrparation', checked)}
            />
            <ServiceCheckbox
              id={`${planType}-tpa-compliance-testing`}
              label="Compliance Testing"
              description="Annual compliance and nondiscrimination testing"
              checked={services.tpa?.complianceTesting}
              onChange={(checked) => updateTPAService('complianceTesting', checked)}
            />
            <ServiceCheckbox
              id={`${planType}-tpa-government-filings`}
              label="Government Filings"
              description="IRS and DOL reporting requirements"
              checked={services.tpa?.governmentFilings}
              onChange={(checked) => updateTPAService('governmentFilings', checked)}
            />
            <ServiceCheckbox
              id={`${planType}-tpa-participant-notices`}
              label="Participant Notices"
              description="Distribution of required participant communications"
              checked={services.tpa?.participantNotices}
              onChange={(checked) => updateTPAService('participantNotices', checked)}
            />
          </div>
        </div>

        {/* Audit Services */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Audit / Investment Manager Services</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ServiceCheckbox
              id={`${planType}-audit-full-scope`}
              label="Full Scope Audit"
              description="Complete audit of plan assets and operations"
              checked={services.audit?.fullScopeAudit}
              onChange={(checked) => updateAuditService('fullScopeAudit', checked)}
            />
            <ServiceCheckbox
              id={`${planType}-audit-limited-scope`}
              label="Limited Scope Audit"
              description="Audit excluding certified investment information"
              checked={services.audit?.limitedScopeAudit}
              onChange={(checked) => updateAuditService('limitedScopeAudit', checked)}
            />
            <ServiceCheckbox
              id={`${planType}-audit-annual`}
              label="Annual Audit"
              description="Audit conducted yearly"
              checked={services.audit?.annualAudit}
              onChange={(checked) => updateAuditService('annualAudit', checked)}
            />
            <ServiceCheckbox
              id={`${planType}-audit-biannual`}
              label="Biannual Audit"
              description="Audit conducted every two years"
              checked={services.audit?.biannualAudit}
              onChange={(checked) => updateAuditService('biannualAudit', checked)}
            />
            <ServiceCheckbox
              id={`${planType}-audit-triannual`}
              label="Triannual Audit"
              description="Audit conducted every three years"
              checked={services.audit?.triannualAudit}
              onChange={(checked) => updateAuditService('triannualAudit', checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
