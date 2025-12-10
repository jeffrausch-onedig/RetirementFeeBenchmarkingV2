"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PlanData, FeeStructure, FeeStructureType } from "@/lib/types";

const isDevelopment = process.env.NODE_ENV === 'development';

interface PlanAndFeeDetailsProps {
  existingPlan: PlanData;
  proposedPlan: PlanData;
  includeProposed: boolean;
  onUpdateExisting: (plan: PlanData) => void;
  onUpdateProposed: (plan: PlanData) => void;
  onToggleProposed: (include: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

export function PlanAndFeeDetails({
  existingPlan,
  proposedPlan,
  includeProposed,
  onUpdateExisting,
  onUpdateProposed,
  onToggleProposed,
  onNext,
  onBack,
}: PlanAndFeeDetailsProps) {
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

    onNext();
  };

  const updateExistingField = <K extends keyof PlanData>(field: K, value: PlanData[K]) => {
    onUpdateExisting({ ...existingPlan, [field]: value });
  };

  const updateProposedField = <K extends keyof PlanData>(field: K, value: PlanData[K]) => {
    onUpdateProposed({ ...proposedPlan, [field]: value });
  };

  const updateExistingFeeStructure = (
    feeType: keyof PlanData['fees'],
    updates: Partial<FeeStructure>
  ) => {
    onUpdateExisting({
      ...existingPlan,
      fees: {
        ...existingPlan.fees,
        [feeType]: {
          ...existingPlan.fees[feeType],
          ...updates,
        },
      },
    });
  };

  const updateProposedFeeStructure = (
    feeType: keyof PlanData['fees'],
    updates: Partial<FeeStructure>
  ) => {
    onUpdateProposed({
      ...proposedPlan,
      fees: {
        ...proposedPlan.fees,
        [feeType]: {
          ...proposedPlan.fees[feeType],
          ...updates,
        },
      },
    });
  };

  const loadSampleData = () => {
    // Load sample plan info and fees
    const aum = 7_500_000;
    const participants = 125;

    const sampleFees = {
      assetsUnderManagement: aum,
      participantCount: participants,
      feeType: 'unbundled' as const,
      fees: {
        advisor: { type: 'basisPoints' as FeeStructureType, basisPoints: 40 },
        recordKeeper: { type: 'flatFee' as FeeStructureType, flatFee: 12000 },
        tpa: { type: 'flatPlusPerHead' as FeeStructureType, flatFee: 3000, perParticipantFee: 45 },
        investmentMenu: { type: 'basisPoints' as FeeStructureType, basisPoints: 20 },
      },
    };

    onUpdateExisting({
      ...existingPlan,
      ...sampleFees,
    });

    // Also load sample proposed plan with lower fees
    const sampleProposedFees = {
      feeType: 'unbundled' as const,
      fees: {
        advisor: { type: 'basisPoints' as FeeStructureType, basisPoints: 35 },
        recordKeeper: { type: 'flatFee' as FeeStructureType, flatFee: 10000 },
        tpa: { type: 'flatPlusPerHead' as FeeStructureType, flatFee: 2500, perParticipantFee: 40 },
        investmentMenu: { type: 'basisPoints' as FeeStructureType, basisPoints: 18 },
      },
    };

    onUpdateProposed({
      ...proposedPlan,
      ...sampleProposedFees,
    });

    onToggleProposed(true);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Development-only sample data button */}
      {isDevelopment && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-yellow-800">Development Mode</h3>
              <p className="text-xs text-yellow-700">Quickly populate plan info and fees</p>
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

      {/* Existing Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Step 2: Plan Info & Fee Details</CardTitle>
          <CardDescription>
            Enter plan details and fee structures for your existing plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Plan Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="existing-aum">Assets Under Management ($) *</Label>
                <Input
                  id="existing-aum"
                  type="number"
                  value={existingPlan.assetsUnderManagement ?? ''}
                  onChange={(e) => updateExistingField('assetsUnderManagement', e.target.value ? parseFloat(e.target.value) : undefined)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="existing-participantCount">Number of Participants</Label>
                <Input
                  id="existing-participantCount"
                  type="number"
                  value={existingPlan.participantCount ?? ''}
                  onChange={(e) => updateExistingField('participantCount', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
            </div>
          </div>

          {/* Fee Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Existing Plan Fees</h3>

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
                    onChange={(e) => updateExistingField('feeType', 'bundled')}
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
                    onChange={(e) => updateExistingField('feeType', 'unbundled')}
                    className="w-4 h-4"
                  />
                  <span>Unbundled</span>
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Bundled plans combine recordkeeping and TPA services; Unbundled plans separate these services
              </p>
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

      {/* Add/Show Proposed Plan */}
      {!includeProposed ? (
        <div className="mt-6">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => onToggleProposed(true)}
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
                  Enter proposed fee structures to compare against existing plan
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onUpdateProposed({
                      ...existingPlan,
                    });
                  }}
                >
                  Copy from Existing
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleProposed(false)}
                >
                  Remove
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Proposed Plan Fees</h3>

              {/* Fee Type Toggle for Proposed */}
              <div className="space-y-2">
                <Label>Fee Type *</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="proposed-fee-type"
                      value="bundled"
                      checked={proposedPlan.feeType === 'bundled'}
                      onChange={(e) => updateProposedField('feeType', 'bundled')}
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
                      onChange={(e) => updateProposedField('feeType', 'unbundled')}
                      className="w-4 h-4"
                    />
                    <span>Unbundled</span>
                  </label>
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

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button type="button" variant="outline" size="lg" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" size="lg">
          Next: Service Selection
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
