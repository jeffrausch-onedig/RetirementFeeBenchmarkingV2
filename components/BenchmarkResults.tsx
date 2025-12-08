"use client";

import { useEffect, useState } from "react";
import { ComparisonData, BenchmarkComparison, CalculatedFees } from "@/lib/types";
import { calculateAllFees, getAUMBucket } from "@/lib/feeCalculations";
import { getBenchmarkComparison } from "@/lib/benchmarkData";
import { getDisclaimerText } from "@/lib/disclaimerText";
import { exportToPowerPoint } from "@/lib/exportToPowerPoint";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeeBenchmarkChart } from "./charts/FeeBenchmarkChart";
import { ItemizedFeeChart, FeeViewMode } from "./charts/ItemizedFeeChart";
import { Button } from "@/components/ui/button";
import { ExecutiveSummary } from "./ExecutiveSummary";
import ServiceComparison from "./ServiceComparison";
import ServiceCoverageCard from "./ServiceCoverageCard";
import ServiceRadarChart from "./charts/ServiceRadarChart";
import type { AISummaryRequest } from "@/lib/types";

interface BenchmarkResultsProps {
  data: ComparisonData;
}

export function BenchmarkResults({ data }: BenchmarkResultsProps) {
  const [benchmarks, setBenchmarks] = useState<BenchmarkComparison | null>(null);
  const [existingFees, setExistingFees] = useState<CalculatedFees | null>(null);
  const [proposedFees, setProposedFees] = useState<CalculatedFees | null>(null);
  const [loading, setLoading] = useState(true);
  const [feeViewMode, setFeeViewMode] = useState<FeeViewMode>("basisPoints");
  const [aiSummary, setAiSummary] = useState<string | undefined>(undefined);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      if (data.existing) {
        const fees = calculateAllFees(data.existing);
        setExistingFees(fees);

        // Use the selected benchmark categories and fee type
        const aumBucket = data.existing.benchmarkCategory || getAUMBucket(data.existing.assetsUnderManagement || 0);
        const balanceBucket = data.existing.balanceBenchmarkCategory || 'All';
        const feeType = data.existing.feeType || 'unbundled';
        const benchmarkData = await getBenchmarkComparison(aumBucket, balanceBucket, feeType);
        setBenchmarks(benchmarkData);
      }

      // Always update proposedFees - set to null if no proposed data
      if (data.proposed) {
        const fees = calculateAllFees(data.proposed);
        setProposedFees(fees);
      } else {
        setProposedFees(null);
      }

      setLoading(false);
    }

    loadData();
  }, [data]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Loading benchmark data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!benchmarks || !existingFees) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">No benchmark data available</p>
        </CardContent>
      </Card>
    );
  }

  const aum = data.existing?.assetsUnderManagement || 0;
  const aumBucket = data.existing?.benchmarkCategory || getAUMBucket(aum);

  // Generate disclaimer text
  const disclaimerText = getDisclaimerText(
    data.existing?.benchmarkCategory,
    data.existing?.balanceBenchmarkCategory
  );

  // Prepare AI summary request
  const aiSummaryRequest: AISummaryRequest = {
    planData: data.existing!,
    calculatedFees: existingFees,
    benchmarks,
    proposedPlanData: data.proposed,
    proposedCalculatedFees: proposedFees || undefined,
    aumBucket,
  };

  // Handle AI summary generation
  const handleSummaryGenerated = (summary: string) => {
    setAiSummary(summary);
    setShowSummary(true);
  };

  // Handle PowerPoint export
  const handleExport = async () => {
    try {
      await exportToPowerPoint({
        benchmarks,
        existingFees,
        proposedFees: proposedFees || undefined,
        aumBucket: data.existing?.benchmarkCategory,
        balanceBucket: data.existing?.balanceBenchmarkCategory,
        aum,
        viewMode: feeViewMode,
        feeType: data.existing?.feeType || 'unbundled',
        aiSummary: aiSummary,
      });
    } catch (error) {
      console.error("Error exporting to PowerPoint:", error);
      alert("Failed to export to PowerPoint. Please try again.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Export Button and Generate Summary Button */}
      <div className="flex justify-between items-center">
        {!showSummary && (
          <Button onClick={() => setShowSummary(true)} variant="outline">
            Generate AI Summary
          </Button>
        )}
        {showSummary && <div></div>}
        <Button onClick={handleExport} variant="default">
          Export to PowerPoint
        </Button>
      </div>

      {/* AI Executive Summary - Only show after user clicks generate */}
      {showSummary && (
        <ExecutiveSummary
          summaryRequest={aiSummaryRequest}
          autoGenerate={true}
          onSummaryGenerated={handleSummaryGenerated}
        />
      )}

      {/* FEE ANALYSIS SECTION */}
      <div className="mt-8 mb-4">
        <div className="border-b-2 border-primary/20 pb-2">
          <h2 className="text-2xl font-bold text-primary">Fee Analysis</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive benchmarking of plan fees against market percentiles
          </p>
        </div>
      </div>

      {/* Fee Benchmark Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Benchmark Comparison</CardTitle>
          <CardDescription>
            Comparing your plan fees against industry benchmarks (50th percentile)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FeeBenchmarkChart
            existingFees={existingFees}
            proposedFees={proposedFees || undefined}
            benchmarks={benchmarks}
          />
          <p className="text-sm text-muted-foreground mt-4 italic">{disclaimerText}</p>
        </CardContent>
      </Card>

      {/* Itemized Fee Comparison Charts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Itemized Fee Analysis</CardTitle>
              <CardDescription>
                Detailed comparison of each fee type against benchmark percentiles
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={feeViewMode === "basisPoints" ? "default" : "outline"}
                size="sm"
                onClick={() => setFeeViewMode("basisPoints")}
              >
                Basis Points
              </Button>
              <Button
                variant={feeViewMode === "dollars" ? "default" : "outline"}
                size="sm"
                onClick={() => setFeeViewMode("dollars")}
              >
                Dollars
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ItemizedFeeChart
              title="Advisor Fee"
              benchmarks={benchmarks.advisor}
              existingFee={existingFees.advisor}
              proposedFee={proposedFees?.advisor}
              color="#0078A2"
              aum={aum}
              viewMode={feeViewMode}
            />
            <ItemizedFeeChart
              title="Record Keeper Fee"
              benchmarks={benchmarks.recordKeeper}
              existingFee={existingFees.recordKeeper}
              proposedFee={proposedFees?.recordKeeper}
              color="#4FB3CD"
              aum={aum}
              viewMode={feeViewMode}
            />
            <ItemizedFeeChart
              title="Investment Menu Fee"
              benchmarks={benchmarks.investmentMenu}
              existingFee={existingFees.investmentMenu}
              proposedFee={proposedFees?.investmentMenu}
              color="#8EB935"
              aum={aum}
              viewMode={feeViewMode}
            />
            <ItemizedFeeChart
              title="TPA Fee"
              benchmarks={benchmarks.tpa}
              existingFee={existingFees.tpa}
              proposedFee={proposedFees?.tpa}
              color="#C2E76B"
              aum={aum}
              viewMode={feeViewMode}
            />
            <ItemizedFeeChart
              title="Total Plan Fee"
              benchmarks={benchmarks.total}
              existingFee={existingFees.total}
              proposedFee={proposedFees?.total}
              color="#F47D20"
              aum={aum}
              viewMode={feeViewMode}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-4 italic">{disclaimerText}</p>
        </CardContent>
      </Card>

      {/* SERVICE ANALYSIS SECTION */}
      {data.existing?.services && (
        <>
          <div className="mt-12 mb-4">
            <div className="border-b-2 border-primary/20 pb-2">
              <h2 className="text-2xl font-bold text-primary">Service Analysis</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Evaluation of service coverage and value relative to fees
              </p>
            </div>
          </div>

          {/* Service & Fee Competitiveness Analysis Card */}
          <Card>
            <CardHeader className="pb-3">
              <div>
                <CardTitle className="text-lg">Service & Fee Competitiveness Analysis</CardTitle>
                <CardDescription className="text-xs">
                  Comprehensive view of service coverage and fee positioning across all providers
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ServiceRadarChart
                existingServices={data.existing.services}
                proposedServices={data.proposed?.services}
                aum={data.existing.assetsUnderManagement || 0}
                existingFees={existingFees || undefined}
                proposedFees={proposedFees || undefined}
                benchmarks={benchmarks || undefined}
              />
            </CardContent>
          </Card>

          {/* Service Coverage Summary Card */}
          <Card>
            <CardHeader className="pb-3">
              <div>
                <CardTitle className="text-lg">Service Coverage Summary</CardTitle>
                <CardDescription className="text-xs">
                  Detailed breakdown of service scores and tier-level coverage by provider
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ServiceCoverageCard
                  services={data.existing.services}
                  aum={data.existing.assetsUnderManagement || 0}
                  planType="existing"
                  comparisonServices={data.proposed?.services}
                />
                {data.proposed?.services && (
                  <ServiceCoverageCard
                    services={data.proposed.services}
                    aum={data.proposed.assetsUnderManagement || data.existing.assetsUnderManagement || 0}
                    planType="proposed"
                    comparisonServices={data.existing.services}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Service Comparison */}
          <Card>
        <CardHeader>
          <CardTitle>Detailed Service Comparison</CardTitle>
          <CardDescription>
            Complete service-by-service comparison organized by tier (Essential, Standard, Premium)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ServiceComparison
            existingServices={data.existing?.services}
            proposedServices={data.proposed?.services}
            aum={data.existing?.assetsUnderManagement}
          />
        </CardContent>
      </Card>
        </>
      )}

      {/* Debug data (can be removed later) */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Data</CardTitle>
          <CardDescription>
            Raw data for verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Calculated Fees:</h3>
              <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                {JSON.stringify({
                  existingFees,
                  proposedFees: proposedFees ? 'Present' : 'None',
                  aum,
                }, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Benchmark Data:</h3>
              <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                {JSON.stringify(benchmarks, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
