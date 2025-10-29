"use client";

import { useState } from "react";
import { FeeInputForm } from "@/components/FeeInputForm";
import { ComparisonData } from "@/lib/types";
import { BenchmarkResults } from "@/components/BenchmarkResults";

export default function Home() {
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);

  return (
    <main className="min-h-screen p-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Retirement Plan Fee Benchmarking
          </h1>
          <p className="text-muted-foreground">
            Compare your plan fees against industry benchmarks
          </p>
        </header>

        <div className="grid gap-8">
          <FeeInputForm onSubmit={setComparisonData} />

          {comparisonData && (
            <BenchmarkResults data={comparisonData} />
          )}
        </div>
      </div>
    </main>
  );
}
