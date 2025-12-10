"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PlanData, AUMBenchmarkCategory, BalanceBenchmarkCategory } from "@/lib/types";

const isDevelopment = process.env.NODE_ENV === 'development';

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

interface BenchmarkSelectionProps {
  existingPlan: PlanData;
  onUpdateExisting: (plan: PlanData) => void;
  onNext: () => void;
}

export function BenchmarkSelection({ existingPlan, onUpdateExisting, onNext }: BenchmarkSelectionProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const updateField = <K extends keyof PlanData>(field: K, value: PlanData[K]) => {
    onUpdateExisting({ ...existingPlan, [field]: value });
  };

  const loadSampleData = () => {
    // Load sample benchmark selections
    const sampleCategories: Pick<PlanData, 'benchmarkCategory' | 'balanceBenchmarkCategory'> = {
      benchmarkCategory: '$5-10m',
      balanceBenchmarkCategory: '$50-75k',
    };

    onUpdateExisting({
      ...existingPlan,
      ...sampleCategories,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Development-only sample data button */}
      {isDevelopment && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-yellow-800">Development Mode</h3>
              <p className="text-xs text-yellow-700">Quickly populate benchmark selections</p>
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
          <CardTitle>Step 1: Benchmark Selection</CardTitle>
          <CardDescription>
            Choose the benchmark categories for your plan analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="benchmark-category">Assets Under Management *</Label>
              <Select
                id="benchmark-category"
                value={existingPlan.benchmarkCategory ?? ''}
                onChange={(e) => updateField('benchmarkCategory', e.target.value as AUMBenchmarkCategory)}
                required
              >
                <option value="" disabled>Select AUM range...</option>
                {AUM_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {formatAUMCategory(category)}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Select the benchmark category that matches your plan's asset size
              </p>
            </div>

            <div>
              <Label htmlFor="balance-bucket">Average Account Balance *</Label>
              <select
                id="balance-bucket"
                value={existingPlan.balanceBenchmarkCategory || ''}
                onChange={(e) => updateField('balanceBenchmarkCategory', e.target.value as BalanceBenchmarkCategory)}
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
              <p className="text-xs text-muted-foreground mt-2">
                Select the average account balance range for plan participants
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end mt-6">
        <Button type="submit" size="lg">
          Next: Plan Info & Fees
        </Button>
      </div>
    </form>
  );
}
