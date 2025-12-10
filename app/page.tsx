"use client";

import { FormWizard } from "@/components/FormWizard";

export default function Home() {
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

        <FormWizard />
      </div>
    </main>
  );
}
