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

### Development Tools

**Sample Data Generator** (Development Only)
- In development mode (`NODE_ENV=development`), a "Load Sample Data" button appears at the top of the form
- Automatically populates realistic plan data including:
  - Random AUM between $1M-$50M
  - Appropriate participant counts
  - Realistic fee structures (basis points, flat fees, per-participant)
  - Comprehensive service selections for both existing and proposed plans
- The button is automatically hidden in production builds
- Sample data generator: `lib/sampleData.ts`
- Includes predefined scenarios for small plans (<$5M) and large plans (>$50M)

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

**AI Executive Summary** (`ExecutiveSummary.tsx`):
- Generates natural language analysis of fee benchmarking results
- Combines structured fee data with contextual prompts
- Calls Azure OpenAI API via `/api/ai-summary` endpoint
- Provides insights valuable to both advisors and clients
- Handles loading and error states gracefully
- Integrates with PowerPoint export (summary becomes first slide when generated)

All charts use Recharts with custom theming via CSS variables defined in `globals.css`.

## Service Baseline Framework

The application includes a comprehensive service baseline system that evaluates plan service coverage and calculates Service Value Scores.

### Service Tier System

Services are categorized into three tiers based on industry standards (DOL ERISA 408(b)(2), NAPA, PLANSPONSOR):

- **Essential**: Core services required for basic plan operation and fiduciary compliance
- **Standard**: Services expected by most plans in the market segment
- **Premium**: Enhanced services that provide additional value

### Plan Size-Adjusted Scoring

**Critical Implementation Detail**: Service Value Scores (0-100) use plan size-adjusted weighting to reflect different expectations for plans of different sizes.

**Tier Weights by Plan Size** (`lib/serviceBaselines.ts` lines 310-347):

**Small Plans (< $5M AUM)**:
- Essential: 5x weight (heavily emphasized)
- Standard: 1.5x weight (less important)
- Premium: 0.5x weight (nearly irrelevant)
- **Philosophy**: Small plans should focus on cost-effective essential services

**Mid-Market Plans ($5M-$50M AUM)**:
- Essential: 3x weight (still most important)
- Standard: 2x weight (expected)
- Premium: 1x weight (nice to have)
- **Philosophy**: Expected to have comprehensive essential and standard coverage

**Large Plans (> $50M AUM)**:
- Essential: 3x weight (always critical)
- Standard: 2.5x weight (very important)
- Premium: 2x weight (expected for large plans)
- **Philosophy**: Should have comprehensive service packages including premium features

### Score Calculation Example

A plan with **all 3 essential advisor services** but **no standard or premium services**:

- **Small Plan (< $5M AUM)**: Scores ~71% (excellent - covering what matters most)
- **Mid-Market Plan ($5M-$50M AUM)**: Scores ~50% (adequate but missing expected standard services)
- **Large Plan (> $50M AUM)**: Scores ~40% (concerning - large plans need comprehensive coverage)

### Service Coverage Components

**Provider-Specific Baselines** (`lib/serviceBaselines.ts`):
- `advisorServiceBaseline`: Advisory services (8 services across 3 tiers)
- `recordkeeperServiceBaseline`: Recordkeeping services (10 services)
- `tpaServiceBaseline`: TPA/compliance services (8 services)
- `auditServiceBaseline`: Audit services (5 services)

**Key Functions**:
- `calculateServiceValueScore()`: Main scoring function with plan size adjustment
- `calculateServiceCoverage()`: Counts services by tier and calculates percentages
- `getMissingEssentialServices()`: Identifies compliance gaps
- `getPlanSizeCategory()`: Categorizes plans into size buckets

### Plan Size Expectations

Minimum service counts by plan size (`lib/serviceBaselines.ts` lines 136-158):

| Plan Size | Min Advisor | Min Recordkeeper | Min TPA | Recommended Tiers |
|-----------|-------------|------------------|---------|-------------------|
| Small Plan (< $5M AUM) | 3 | 5 | 3 | Essential only |
| Mid-Market Plan ($5M-$50M AUM) | 5 | 6 | 5 | Essential + Standard |
| Large Plan (> $50M AUM) | 6 | 8 | 6 | Essential + Standard + Premium |

**Important**: These minimums generate warnings but don't directly affect the score calculation. The score is calculated using the tier weights shown above.

### UI Components

**Service Analysis Displays**:
- `ServiceRadarChart.tsx`: 5-axis radar showing service scores + fee competitiveness
- `ServiceCoverageCard.tsx`: Individual plan coverage breakdown by provider
- `ServiceComparison.tsx`: Service-by-service comparison with tier badges
- `ServiceSelectionTable.tsx`: Interactive service selection with tier grouping

**Tier Badge System**:
- Essential: Red badge with "E"
- Standard: Blue badge with "S"
- Premium: Purple badge with "P"

### Integration with Fee Analysis

The Service Value Score is integrated into the overall benchmarking analysis to evaluate whether fees are justified by service levels:

- **High fees + High service score**: Fees justified by comprehensive services
- **Low fees + Low service score**: Cost savings but potential service gaps
- **High fees + Low service score**: Major concern requiring immediate attention
- **Low fees + High service score**: Excellent value proposition

The AI Executive Summary (`lib/aiSummary.ts`) automatically factors in service coverage when evaluating fee competitiveness.

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

## Azure OpenAI Integration

The AI Executive Summary feature uses Azure OpenAI to generate natural language insights from benchmarking data.

### Configuration

Add to `.env.local`:
```
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT=your-deployment-name
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

### Implementation Architecture

1. **Prompt Engineering** (`lib/aiSummary.ts`):
   - `buildSummaryPrompt()`: Constructs structured prompt combining:
     - Plan metadata (AUM, participants, AUM bucket)
     - Calculated fee breakdowns (dollar amounts and percentages)
     - Benchmark comparisons (percentile positioning)
     - Context for advisor vs. client perspectives
   - Designed for consistent, professional output suitable for client reports

2. **API Route** (`app/api/ai-summary/route.ts`):
   - Server-side Azure OpenAI API calls
   - Supports streaming responses for better UX
   - Handles authentication via environment variables
   - Error handling with fallback messages

3. **Component** (`ExecutiveSummary.tsx`):
   - Displays AI-generated summary in results section
   - Shows loading state during generation
   - Handles errors gracefully
   - Markdown rendering for formatted output

### Prompt Design

The prompt follows this structure:
- **Role**: Expert retirement plan consultant
- **Task**: Analyze fee benchmarking results
- **Context**: Structured data including all fee types, benchmarks, and comparisons
- **Output**: Professional executive summary highlighting:
  - Overall fee positioning vs. market
  - Specific areas of strength or concern
  - Quantified savings opportunities (if proposed plan exists)
  - Actionable recommendations

The prompt is designed to produce stable, consistent output that avoids hallucination by grounding all statements in the provided structured data.

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
