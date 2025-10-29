# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev      # Start development server (uses Turbopack)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

The dev server runs on http://localhost:3000 by default (or next available port).

## Architecture Overview

This is a Next.js 16 application using App Router that helps retirement plan consultants benchmark plan fees against industry data.

### Data Flow Architecture

1. **User Input** → `FeeInputForm.tsx` collects plan details and fee structures
2. **Form Submit** → Data flows to `page.tsx` as `ComparisonData`
3. **Calculation** → `BenchmarkResults.tsx` orchestrates:
   - Fee calculations via `lib/feeCalculations.ts`
   - Benchmark lookup via `lib/benchmarkData.ts`
4. **Visualization** → Chart components in `components/charts/` render results

### Fee Calculation System

The core fee calculation logic in `lib/feeCalculations.ts` supports four fee structure types:

- **basisPoints**: AUM × (basis points / 100)
- **flatFee**: Fixed dollar amount
- **flatPlusPerHead**: Flat fee + (per participant fee × participant count)
- **perParticipant**: Per participant fee × participant count

All calculations are centralized in `calculateAllFees()` which returns a `CalculatedFees` object containing dollar amounts and percentages for advisor, recordKeeper, tpa, audit, and total fees.

### Benchmark Data System

Benchmark data flows through `lib/benchmarkData.ts`:

- Currently loads from CSV in `public/` directory using Papa Parse
- Implements in-memory caching (`benchmarkCache`)
- Matches benchmarks by AUM bucket and fee type
- Returns percentile data (p25, p50, p75) as decimal percentages

**Important**: Benchmark percentiles are stored as decimals (e.g., 0.0025 = 0.25% = 25 basis points). When displaying or calculating dollar amounts, multiply by AUM.

### Type System

All types are defined in `lib/types.ts`. Key interfaces:

- `FeeStructure`: Individual fee configuration with type discriminator
- `PlanData`: Complete plan including AUM, participant count, and all fees
- `ComparisonData`: Container for existing and/or proposed plans
- `BenchmarkData`: Raw CSV row structure
- `BenchmarkPercentiles`: p25/p50/p75 for a single fee type
- `CalculatedFees`: Dollar and percentage results for all fee types

### Component Architecture

**Form Layer** (`FeeInputForm.tsx`):
- Manages state for both existing and proposed plans
- Toggles between plan types via tabs
- Dynamically renders fee structure inputs based on selected type
- Each fee type (advisor, recordKeeper, tpa, audit) uses the same `FeeStructureInput` component

**Results Layer** (`BenchmarkResults.tsx`):
- Async loads benchmark data on mount
- Calculates fees for both plans if provided
- Passes processed data to chart components
- Handles loading and error states

**Chart Components** (`components/charts/`):
- `HorizontalStackedBarChart`: Stacked bars for all fee types across existing/proposed/percentiles
- `FeeSummaryTable`: Tabular comparison with difference calculations
- `PercentileBarChart`: Individual fee type comparison to benchmarks

All charts use Recharts with custom theming via CSS variables defined in `globals.css`.

## Extending the Application

### Adding a New Fee Type

1. Add to `FeeInput` interface in `lib/types.ts`
2. Update the fee type array in `FeeInputForm.tsx` (line ~132)
3. Add calculation in `calculateAllFees()` in `lib/feeCalculations.ts`
4. Update `CalculatedFees` interface in `lib/types.ts`
5. Add corresponding `BenchmarkPercentiles` field in `BenchmarkComparison`
6. Add chart in `BenchmarkResults.tsx` grid
7. Update `FeeSummaryTable.tsx` to include new fee type

### Adding a New Fee Structure Type

1. Add to `FeeStructureType` union in `lib/types.ts`
2. Add optional fields to `FeeStructure` interface
3. Add case to switch statement in `calculateFeeAmount()` in `lib/feeCalculations.ts`
4. Add option to select dropdown in `FeeStructureInput` component
5. Add conditional input fields for new structure's parameters

## Domo Integration

Currently uses static CSV data. To connect to Domo API:

1. Create `.env.local` with: `DOMO_CLIENT_ID`, `DOMO_CLIENT_SECRET`, `DOMO_DATASET_ID`, `DOMO_API_HOST`
2. Install axios: `npm install axios`
3. Implement `lib/domoApi.ts` with OAuth token caching (see README.md)
4. Create `app/api/benchmark/route.ts` API route
5. Update `loadBenchmarkData()` in `lib/benchmarkData.ts` to fetch from `/api/benchmark`

The Domo dataset must match the `BenchmarkData` interface schema. See DOMO_SETUP.md for complete integration guide.

## Important Implementation Details

### Basis Points Handling

**User Input**: Entered as basis points (e.g., 50 = 50 basis points)
**Storage**: Stored as entered in `FeeStructure.basisPoints`
**Calculation**: Divided by 100 then multiplied by AUM (50 bp → 0.50% → 0.005 decimal)

### Benchmark Percentiles

**CSV Storage**: Decimal percentages (0.0025 = 0.25%)
**Chart Display**: Converted to dollars by multiplying by AUM
**Percentile Matching**: Uses `findBenchmarkPercentiles()` which matches on `Type`, `BMAssets`, and optionally `BMAvgBalance`

### AUM Buckets

The `getAUMBucket()` function maps AUM values to string buckets:
- "$0-250k", "$250-500k", "$500k-1m", "$1-3m", "$3-5m", "$5-10m", "$10-20m", "$20-30m", "$30-50m", "$50-100m", "$100-250m", "$250m+"

These strings must match exactly what's in the benchmark dataset.

### Theme Variables

Custom theme uses OKLCH color space defined in `globals.css`. All components reference CSS variables:
- `--chart-1` through `--chart-5` for chart colors
- `--primary`, `--secondary`, `--accent` for UI elements
- Supports dark mode with `.dark` class

## Deployment Context

This application is designed to be embedded as an iframe in Salesforce Experience Cloud. No authentication is required as it's handled by the parent Salesforce environment.
