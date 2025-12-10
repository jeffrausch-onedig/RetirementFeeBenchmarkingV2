"use client";

import { useState, useEffect } from "react";
import { ComparisonData, PlanData } from "@/lib/types";
import { BenchmarkSelection } from "./wizard/BenchmarkSelection";
import { PlanAndFeeDetails } from "./wizard/PlanAndFeeDetails";
import { ServiceSelection } from "./wizard/ServiceSelection";
import { BenchmarkResults } from "./BenchmarkResults";
import { Card, CardContent } from "@/components/ui/card";

const emptyPlanData: PlanData = {
  assetsUnderManagement: undefined,
  participantCount: undefined,
  benchmarkCategory: undefined,
  balanceBenchmarkCategory: undefined,
  feeType: 'unbundled',
  fees: {
    advisor: { type: 'basisPoints', basisPoints: undefined },
    recordKeeper: { type: 'basisPoints', basisPoints: undefined },
    tpa: { type: 'basisPoints', basisPoints: undefined },
    investmentMenu: { type: 'basisPoints', basisPoints: undefined },
  },
  services: {
    advisor: {},
    recordKeeper: {},
    tpa: {},
    audit: {},
  },
};

interface FormWizardStep {
  id: number;
  title: string;
  description: string;
}

const WIZARD_STEPS: FormWizardStep[] = [
  { id: 1, title: "Benchmark Selection", description: "Choose benchmark categories" },
  { id: 2, title: "Plan Info & Fees", description: "Enter plan details and fee structures" },
  { id: 3, title: "Service Selection", description: "Select service offerings" },
  { id: 4, title: "Report Preview", description: "Review benchmark analysis" },
];

export function FormWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [existingPlan, setExistingPlan] = useState<PlanData>({ ...emptyPlanData });
  const [proposedPlan, setProposedPlan] = useState<PlanData>({ ...emptyPlanData });
  const [includeProposed, setIncludeProposed] = useState(false);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [isSavedView, setIsSavedView] = useState(false);

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // Create comparison data and move to results
    const data: ComparisonData = {
      existing: existingPlan,
      proposed: includeProposed ? {
        ...proposedPlan,
        assetsUnderManagement: existingPlan.assetsUnderManagement,
        participantCount: existingPlan.participantCount,
        benchmarkCategory: existingPlan.benchmarkCategory,
        balanceBenchmarkCategory: existingPlan.balanceBenchmarkCategory,
      } : undefined,
    };
    setComparisonData(data);
    setCurrentStep(4);
  };

  const handleSaveReport = () => {
    setIsSavedView(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartOver = () => {
    setCurrentStep(1);
    setExistingPlan({ ...emptyPlanData });
    setProposedPlan({ ...emptyPlanData });
    setIncludeProposed(false);
    setComparisonData(null);
    setIsSavedView(false);
  };

  // If in saved view, show only the report without wizard steps
  if (isSavedView && comparisonData) {
    return (
      <div className="space-y-6">
        <BenchmarkResults
          data={comparisonData}
          showSummaryButton={true}
          showExportButton={true}
        />
        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              setIsSavedView(false);
              setCurrentStep(1);
            }}
            className="px-6 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md"
          >
            Edit Report
          </button>
          <button
            onClick={handleStartOver}
            className="px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md"
          >
            Create New Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {WIZARD_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      currentStep === step.id
                        ? "bg-primary text-primary-foreground"
                        : currentStep > step.id
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.id}
                  </div>
                  <div className="text-center mt-2">
                    <div className={`text-sm font-medium ${currentStep === step.id ? "text-primary" : "text-muted-foreground"}`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-muted-foreground hidden md:block">
                      {step.description}
                    </div>
                  </div>
                </div>
                {index < WIZARD_STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 ${
                      currentStep > step.id ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <div>
        {currentStep === 1 && (
          <BenchmarkSelection
            existingPlan={existingPlan}
            onUpdateExisting={setExistingPlan}
            onNext={handleNext}
          />
        )}

        {currentStep === 2 && (
          <PlanAndFeeDetails
            existingPlan={existingPlan}
            proposedPlan={proposedPlan}
            includeProposed={includeProposed}
            onUpdateExisting={setExistingPlan}
            onUpdateProposed={setProposedPlan}
            onToggleProposed={setIncludeProposed}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 3 && (
          <ServiceSelection
            existingPlan={existingPlan}
            proposedPlan={proposedPlan}
            includeProposed={includeProposed}
            onUpdateExisting={setExistingPlan}
            onUpdateProposed={setProposedPlan}
            onSubmit={handleSubmit}
            onBack={handleBack}
          />
        )}

        {currentStep === 4 && comparisonData && (
          <div className="space-y-6">
            <BenchmarkResults
              data={comparisonData}
              showSummaryButton={true}
              showExportButton={true}
            />
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md"
              >
                Edit Inputs
              </button>
              <button
                onClick={handleSaveReport}
                className="px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md"
              >
                Save Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
