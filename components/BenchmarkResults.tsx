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

interface BenchmarkResultsProps {
  data: ComparisonData;
}

export function BenchmarkResults({ data }: BenchmarkResultsProps) {
  const [benchmarks, setBenchmarks] = useState<BenchmarkComparison | null>(null);
  const [existingFees, setExistingFees] = useState<CalculatedFees | null>(null);
  const [proposedFees, setProposedFees] = useState<CalculatedFees | null>(null);
  const [loading, setLoading] = useState(true);
  const [feeViewMode, setFeeViewMode] = useState<FeeViewMode>("basisPoints");

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

  // Generate disclaimer text
  const disclaimerText = getDisclaimerText(
    data.existing?.benchmarkCategory,
    data.existing?.balanceBenchmarkCategory
  );

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
      });
    } catch (error) {
      console.error("Error exporting to PowerPoint:", error);
      alert("Failed to export to PowerPoint. Please try again.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Export Button */}
      <div className="flex justify-end">
        <Button onClick={handleExport} variant="default">
          Export to PowerPoint
        </Button>
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
