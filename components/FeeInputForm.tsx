"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ComparisonData, FeeStructure, FeeStructureType, PlanData, AUMBenchmarkCategory, BalanceBenchmarkCategory, PlanFeeType } from "@/lib/types";

const AUM_CATEGORIES: AUMBenchmarkCategory[] = [
  '$0-250k',
  '$250-500k',
  '$500k-1m',
  '$1-3m',
  '$3-5m',
  '$5-10m',
  '$10-20m',
  '$20-30m',
  '$30-50m',
  '$50-100m',
  '$100-250m',
  '> $250m',
];

const BALANCE_CATEGORIES: BalanceBenchmarkCategory[] = [
  '$0-25k',
  '$25-50k',
  '$50-75k',
  '$75-100k',
  '> $100k',
];

// Format AUM category for display with consistent k/m notation
function formatAUMCategory(category: AUMBenchmarkCategory): string {
  const formats: Record<AUMBenchmarkCategory, string> = {
    '$0-250k': '$0 - $250k',
    '$250-500k': '$250k - $500k',
    '$500k-1m': '$500k - $1m',
    '$1-3m': '$1m - $3m',
    '$3-5m': '$3m - $5m',
    '$5-10m': '$5m - $10m',
    '$10-20m': '$10m - $20m',
    '$20-30m': '$20m - $30m',
    '$30-50m': '$30m - $50m',
    '$50-100m': '$50m - $100m',
    '$100-250m': '$100m - $250m',
    '> $250m': 'Over $250m',
    'All': 'All Categories',
  };
  return formats[category];
}

interface FeeInputFormProps {
  onSubmit: (data: ComparisonData) => void;
}

const emptyFeeStructure: FeeStructure = {
  type: 'basisPoints' as FeeStructureType,
  basisPoints: undefined,
};

const emptyPlanData: PlanData = {
  assetsUnderManagement: undefined,
  participantCount: undefined,
  benchmarkCategory: undefined,
  balanceBenchmarkCategory: undefined,
  feeType: 'unbundled',
  fees: {
    advisor: { ...emptyFeeStructure },
    recordKeeper: { ...emptyFeeStructure },
    tpa: { ...emptyFeeStructure },
    investmentMenu: { ...emptyFeeStructure },
  },
};

export function FeeInputForm({ onSubmit }: FeeInputFormProps) {
  const [existingPlan, setExistingPlan] = useState<PlanData>({ ...emptyPlanData });
  const [proposedPlan, setProposedPlan] = useState<PlanData>({ ...emptyPlanData });
  const [includeProposed, setIncludeProposed] = useState(false);

  const updateExistingPlanField = <K extends keyof PlanData>(field: K, value: PlanData[K]) => {
    setExistingPlan(prev => ({ ...prev, [field]: value }));
  };

  const updateProposedPlanField = <K extends keyof PlanData>(field: K, value: PlanData[K]) => {
    setProposedPlan(prev => ({ ...prev, [field]: value }));
  };

  const updateExistingFeeStructure = (
    feeType: keyof PlanData['fees'],
    updates: Partial<FeeStructure>
  ) => {
    setExistingPlan(prev => ({
      ...prev,
      fees: {
        ...prev.fees,
        [feeType]: {
          ...prev.fees[feeType],
          ...updates,
        },
      },
    }));
  };

  const updateProposedFeeStructure = (
    feeType: keyof PlanData['fees'],
    updates: Partial<FeeStructure>
  ) => {
    setProposedPlan(prev => ({
      ...prev,
      fees: {
        ...prev.fees,
        [feeType]: {
          ...prev.fees[feeType],
          ...updates,
        },
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that participant count is provided if any fee uses per-participant structure
    const checkPerParticipantFees = (fees: PlanData['fees'], planName: string) => {
      const requiresParticipants = Object.entries(fees).some(([feeType, feeStructure]) =>
        feeStructure.type === 'perParticipant' || feeStructure.type === 'flatPlusPerHead'
      );

      if (requiresParticipants && !existingPlan.participantCount) {
        alert(`${planName}: Number of Participants is required when using Per Participant or Flat + Per Participant fee structures.`);
        return false;
      }
      return true;
    };

    if (!checkPerParticipantFees(existingPlan.fees, 'Existing Plan')) {
      return;
    }

    if (includeProposed && !checkPerParticipantFees(proposedPlan.fees, 'Proposed Plan')) {
      return;
    }

    onSubmit({
      existing: existingPlan,
      proposed: includeProposed ? {
        ...proposedPlan,
        // Use the existing plan's AUM, participant count, and benchmark categories for proposed plan
        assetsUnderManagement: existingPlan.assetsUnderManagement,
        participantCount: existingPlan.participantCount,
        benchmarkCategory: existingPlan.benchmarkCategory,
        balanceBenchmarkCategory: existingPlan.balanceBenchmarkCategory,
        feeType: proposedPlan.feeType,
      } : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Benchmark Category Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Benchmark Categories</CardTitle>
          <CardDescription>
            Make a selection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="benchmark-category">Assets Under Management *</Label>
              <Select
                id="benchmark-category"
                value={existingPlan.benchmarkCategory ?? ''}
                onChange={(e) => updateExistingPlanField('benchmarkCategory', e.target.value as AUMBenchmarkCategory)}
                required
              >
                <option value="" disabled>Select AUM range...</option>
                {AUM_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {formatAUMCategory(category)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="balance-bucket">Average Balance *</Label>
              <select
                id="balance-bucket"
                value={existingPlan.balanceBenchmarkCategory || ''}
                onChange={(e) => updateExistingPlanField('balanceBenchmarkCategory', e.target.value as BalanceBenchmarkCategory)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Select balance range...</option>
                {BALANCE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Plan Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Existing Plan Information</CardTitle>
          <CardDescription>
            Enter current plan details and fee structures for benchmarking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Existing Plan Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Plan Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="existing-aum">Assets Under Management ($) *</Label>
                <Input
                  id="existing-aum"
                  type="number"
                  value={existingPlan.assetsUnderManagement ?? ''}
                  onChange={(e) => updateExistingPlanField('assetsUnderManagement', e.target.value ? parseFloat(e.target.value) : undefined)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="existing-participantCount">Number of Participants</Label>
                <Input
                  id="existing-participantCount"
                  type="number"
                  value={existingPlan.participantCount ?? ''}
                  onChange={(e) => updateExistingPlanField('participantCount', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
            </div>
          </div>

          {/* Existing Plan Fee Inputs */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Fee Details</h3>

              {/* Fee Type Toggle */}
              <div className="space-y-2">
                <Label>Fee Type *</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="existing-fee-type"
                      value="bundled"
                      checked={existingPlan.feeType === 'bundled'}
                      onChange={(e) => updateExistingPlanField('feeType', 'bundled')}
                      className="w-4 h-4"
                    />
                    <span>Bundled</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="existing-fee-type"
                      value="unbundled"
                      checked={existingPlan.feeType === 'unbundled'}
                      onChange={(e) => updateExistingPlanField('feeType', 'unbundled')}
                      className="w-4 h-4"
                    />
                    <span>Unbundled</span>
                  </label>
                </div>
              </div>
            </div>

            <FeeStructureInput
              label="Advisor Fee"
              feeStructure={existingPlan.fees.advisor}
              onChange={(updates) => updateExistingFeeStructure('advisor', updates)}
            />
            <FeeStructureInput
              label="Record Keeper Fee"
              feeStructure={existingPlan.fees.recordKeeper}
              onChange={(updates) => updateExistingFeeStructure('recordKeeper', updates)}
            />
            {existingPlan.feeType === 'unbundled' && (
              <FeeStructureInput
                label="TPA Fee"
                feeStructure={existingPlan.fees.tpa}
                onChange={(updates) => updateExistingFeeStructure('tpa', updates)}
              />
            )}
            <FeeStructureInput
              label="Investment Menu Fee"
              feeStructure={existingPlan.fees.investmentMenu}
              onChange={(updates) => updateExistingFeeStructure('investmentMenu', updates)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Add Proposed Plan Button or Proposed Plan Section */}
      {!includeProposed ? (
        <div className="mt-6">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => setIncludeProposed(true)}
          >
            + Add Proposed Plan for Comparison
          </Button>
        </div>
      ) : (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Proposed Plan Fee Structures</CardTitle>
                <CardDescription>
                  Enter proposed fee structures to compare against existing plan (uses same plan size)
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIncludeProposed(false)}
              >
                Remove
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Proposed Plan Fee Inputs */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Fee Details</h3>

                {/* Fee Type Toggle */}
                <div className="space-y-2">
                  <Label>Fee Type *</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="proposed-fee-type"
                        value="bundled"
                        checked={proposedPlan.feeType === 'bundled'}
                        onChange={(e) => updateProposedPlanField('feeType', 'bundled')}
                        className="w-4 h-4"
                      />
                      <span>Bundled</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="proposed-fee-type"
                        value="unbundled"
                        checked={proposedPlan.feeType === 'unbundled'}
                        onChange={(e) => updateProposedPlanField('feeType', 'unbundled')}
                        className="w-4 h-4"
                      />
                      <span>Unbundled</span>
                    </label>
                  </div>
                </div>
              </div>

              <FeeStructureInput
                label="Advisor Fee"
                feeStructure={proposedPlan.fees.advisor}
                onChange={(updates) => updateProposedFeeStructure('advisor', updates)}
              />
              <FeeStructureInput
                label="Record Keeper Fee"
                feeStructure={proposedPlan.fees.recordKeeper}
                onChange={(updates) => updateProposedFeeStructure('recordKeeper', updates)}
              />
              {proposedPlan.feeType === 'unbundled' && (
                <FeeStructureInput
                  label="TPA Fee"
                  feeStructure={proposedPlan.fees.tpa}
                  onChange={(updates) => updateProposedFeeStructure('tpa', updates)}
                />
              )}
              <FeeStructureInput
                label="Investment Menu Fee"
                feeStructure={proposedPlan.fees.investmentMenu}
                onChange={(updates) => updateProposedFeeStructure('investmentMenu', updates)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-6">
        <Button type="submit" className="w-full" size="lg">
          Generate Benchmark Report
        </Button>
      </div>
    </form>
  );
}

interface FeeStructureInputProps {
  label: string;
  feeStructure: FeeStructure;
  onChange: (updates: Partial<FeeStructure>) => void;
}

function FeeStructureInput({ label, feeStructure, onChange }: FeeStructureInputProps) {
  return (
    <div className="p-4 border rounded-lg space-y-3">
      <h4 className="font-medium">{label}</h4>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1">
          <Label htmlFor={`${label}-type`}>Fee Type</Label>
          <Select
            id={`${label}-type`}
            value={feeStructure.type}
            onChange={(e) => onChange({ type: e.target.value as FeeStructureType })}
          >
            <option value="basisPoints">Basis Points (%)</option>
            <option value="flatFee">Flat Fee ($)</option>
            <option value="flatPlusPerHead">Flat + Per Participant</option>
            <option value="perParticipant">Per Participant</option>
          </Select>
        </div>

        {feeStructure.type === 'basisPoints' && (
          <div>
            <Label htmlFor={`${label}-bp`}>Basis Points</Label>
            <Input
              id={`${label}-bp`}
              type="number"
              step="0.01"
              value={feeStructure.basisPoints ?? ''}
              onChange={(e) => onChange({ basisPoints: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              e.g., 50 = 0.50%
            </p>
          </div>
        )}

        {(feeStructure.type === 'flatFee' || feeStructure.type === 'flatPlusPerHead') && (
          <div>
            <Label htmlFor={`${label}-flat`}>Flat Fee ($)</Label>
            <Input
              id={`${label}-flat`}
              type="number"
              step="0.01"
              value={feeStructure.flatFee ?? ''}
              onChange={(e) => onChange({ flatFee: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
          </div>
        )}

        {(feeStructure.type === 'flatPlusPerHead' || feeStructure.type === 'perParticipant') && (
          <div>
            <Label htmlFor={`${label}-perhead`}>Per Participant ($)</Label>
            <Input
              id={`${label}-perhead`}
              type="number"
              step="0.01"
              value={feeStructure.perHeadFee ?? ''}
              onChange={(e) => onChange({ perHeadFee: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
