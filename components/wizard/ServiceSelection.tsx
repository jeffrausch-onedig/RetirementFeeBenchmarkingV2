"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlanData, ServiceOptions } from "@/lib/types";
import ServiceSelectionTable from "@/components/ServiceSelectionTable";

const isDevelopment = process.env.NODE_ENV === 'development';

interface ServiceSelectionProps {
  existingPlan: PlanData;
  proposedPlan: PlanData;
  includeProposed: boolean;
  onUpdateExisting: (plan: PlanData) => void;
  onUpdateProposed: (plan: PlanData) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export function ServiceSelection({
  existingPlan,
  proposedPlan,
  includeProposed,
  onUpdateExisting,
  onUpdateProposed,
  onSubmit,
  onBack,
}: ServiceSelectionProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const handleExistingServicesChange = (services: ServiceOptions) => {
    onUpdateExisting({
      ...existingPlan,
      services,
    });
  };

  const handleProposedServicesChange = (services: ServiceOptions) => {
    onUpdateProposed({
      ...proposedPlan,
      services,
    });
  };

  const loadSampleData = () => {
    // Load sample services for existing plan
    const sampleExistingServices: ServiceOptions = {
      advisor: {
        investmentMenuSelection: true,
        fiduciarySupport321: true,
        complianceAssistance: true,
        participantEducation: true,
      },
      recordKeeper: {
        participantPortal: true,
        callCenter: true,
        quarterlyReporting: true,
        enrollmentSupport: true,
      },
      tpa: {
        annualCompliance: true,
        form5500Preparation: true,
        nondiscriminationTesting: true,
      },
      audit: {
        annualAudit: true,
        limitedScopeAudit: true,
      },
    };

    onUpdateExisting({
      ...existingPlan,
      services: sampleExistingServices,
    });

    // Load sample services for proposed plan (if shown)
    if (includeProposed) {
      const sampleProposedServices: ServiceOptions = {
        advisor: {
          investmentMenuSelection: true,
          fiduciarySupport321: true,
          fiduciarySupport338: true,
          complianceAssistance: true,
          participantEducation: true,
          planDesignConsulting: true,
        },
        recordKeeper: {
          participantPortal: true,
          mobileApp: true,
          callCenter: true,
          quarterlyReporting: true,
          enrollmentSupport: true,
          financialWellnessTools: true,
        },
        tpa: {
          annualCompliance: true,
          form5500Preparation: true,
          nondiscriminationTesting: true,
          planDocumentUpdates: true,
        },
        audit: {
          annualAudit: true,
          fullScopeAudit: true,
        },
      };

      onUpdateProposed({
        ...proposedPlan,
        services: sampleProposedServices,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Development-only sample data button */}
      {isDevelopment && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-yellow-800">Development Mode</h3>
              <p className="text-xs text-yellow-700">Quickly populate service selections</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={loadSampleData}
              className="bg-yellow-100 hover:bg-yellow-200 border-yellow-300"
            >
              Load Sample Data
            </Button>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Step 3: Service Selection</CardTitle>
          <CardDescription>
            Select the services provided by each provider for your plan(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceSelectionTable
            existingServices={existingPlan.services || { advisor: {}, recordKeeper: {}, tpa: {}, audit: {} }}
            proposedServices={includeProposed ? (proposedPlan.services || { advisor: {}, recordKeeper: {}, tpa: {}, audit: {} }) : undefined}
            onExistingChange={handleExistingServicesChange}
            onProposedChange={includeProposed ? handleProposedServicesChange : undefined}
            showProposed={includeProposed}
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button type="button" variant="outline" size="lg" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" size="lg">
          Generate Benchmark Report
        </Button>
      </div>
    </form>
  );
}
