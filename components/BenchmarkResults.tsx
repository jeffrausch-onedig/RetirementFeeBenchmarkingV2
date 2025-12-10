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
  showSummaryButton?: boolean;
  showExportButton?: boolean;
  renderTopButtons?: (summaryButton: React.ReactNode, exportButton: React.ReactNode) => React.ReactNode;
}

export function BenchmarkResults({ data, showSummaryButton = true, showExportButton = true, renderTopButtons }: BenchmarkResultsProps) {
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

  // Handle regenerate summary
  const handleRegenerateSummary = () => {
    setAiSummary(undefined); // Clear existing summary to trigger regeneration
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
        existingServices: data.existing?.services,
        proposedServices: data.proposed?.services,
      });
    } catch (error) {
      console.error("Error exporting to PowerPoint:", error);
      alert("Failed to export to PowerPoint. Please try again.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Data Source Indicator */}
      {benchmarks.dataSource === 'csv' && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-yellow-800">Using Fallback Data Source</p>
                <p className="text-xs text-yellow-700">Benchmark data is currently being loaded from local CSV file. Domo API is unavailable.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {benchmarks.dataSource === 'domo' && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-green-800">Connected to Domo API</p>
                <p className="text-xs text-green-700">Benchmark data is being loaded from the live Domo dataset.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Button and Generate Summary Button */}
      {renderTopButtons ? (
        renderTopButtons(
          // Summary Button
          <>
            {!showSummary && (
              <Button onClick={() => setShowSummary(true)} variant="outline">
                Generate AI Summary
              </Button>
            )}
            {showSummary && aiSummary && (
              <Button onClick={handleRegenerateSummary} variant="outline">
                Regenerate AI Summary
              </Button>
            )}
          </>,
          // Export Button
          <Button onClick={handleExport} variant="default">
            Export to PowerPoint
          </Button>
        )
      ) : (
        (showSummaryButton || showExportButton) && (
          <div className="flex justify-between items-center">
            {showSummaryButton && (
              <>
                {!showSummary && (
                  <Button onClick={() => setShowSummary(true)} variant="outline">
                    Generate AI Summary
                  </Button>
                )}
                {showSummary && aiSummary && (
                  <Button onClick={handleRegenerateSummary} variant="outline">
                    Regenerate AI Summary
                  </Button>
                )}
                {showSummary && !aiSummary && <div></div>}
              </>
            )}
            {!showSummaryButton && <div></div>}
            {showExportButton && (
              <Button onClick={handleExport} variant="default">
                Export to PowerPoint
              </Button>
            )}
          </div>
        )
      )}

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
    </div>
  );
}
