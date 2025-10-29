# Product Requirements Document: Retirement Plan Fee Benchmarking Application

## Executive Summary

A Next.js web application that enables users to compare retirement plan fees against industry benchmarks sourced from a Domo dataset. Users input their plan details and fee structures, and the system retrieves relevant benchmark data to display visual comparisons via interactive charts.

---

## Technical Stack

### Framework & Core Technologies
- **Framework**: Next.js 16.0.0 with App Router
- **Build Tool**: Turbopack (Next.js default)
- **Runtime**: Node.js
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 with OKLCH color system
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Charts**: Recharts library
- **HTTP Client**: Axios (for Domo API)

### Project Structure
```
/app
  /api
    /benchmark/route.ts    # Benchmark data endpoint
    /test-domo/route.ts    # Domo connection test endpoint
  /page.tsx                # Main application page
  /layout.tsx              # Root layout
  /globals.css             # Global styles with Tailwind v4
/components
  /charts
    /FeeBenchmarkChart.tsx # Stacked horizontal bar chart
  /ui                      # shadcn/ui components
  /FeeInputForm.tsx        # Main form component
  /BenchmarkResults.tsx    # Results display component
/lib
  /types.ts                # TypeScript type definitions
  /feeCalculations.ts      # Fee calculation logic
  /benchmarkData.ts        # Benchmark data processing
  /domoApi.ts              # Domo API integration
/public                    # Static assets
/.env.local                # Environment variables (not committed)
```

---

## Environment Configuration

### Required Environment Variables
```bash
DOMO_CLIENT_ID=<domo_oauth_client_id>
DOMO_CLIENT_SECRET=<domo_oauth_client_secret>
DOMO_DATASET_ID=38b1bcb9-55cf-4dc7-8978-867a9fc7021c
```

### Environment Setup
1. Create `.env.local` file in project root
2. Add the three required environment variables
3. Values are sensitive and should not be committed to version control
4. Add `.env.local` to `.gitignore`

---

## Data Architecture

### Type Definitions (lib/types.ts)

```typescript
// Fee structure types
export type FeeStructureType = 'basisPoints' | 'flatFee' | 'flatPlusPerHead' | 'perParticipant';

export interface FeeStructure {
  type: FeeStructureType;
  basisPoints?: number;
  flatFee?: number;
  perHeadFee?: number;
}

// Fee type identifiers
export type FeeType = 'advisor' | 'recordKeeper' | 'tpa' | 'audit';

// AUM bucket categories (13 total, matching Domo dataset)
export type AUMBucket =
  | 'Under $1 million'
  | '$1 to $5 million'
  | '$5 to $10 million'
  | '$10 to $25 million'
  | '$25 to $50 million'
  | '$50 to $100 million'
  | '$100 to $250 million'
  | '$250 to $500 million'
  | '$500 million to $1 billion'
  | '$1 to $5 billion'
  | '$5 to $10 billion'
  | '$10 to $25 billion'
  | 'Over $25 billion';

// Balance bucket categories
export type BalanceBucket =
  | 'Under $10,000'
  | '$10,000 to $25,000'
  | '$25,000 to $50,000'
  | '$50,000 to $100,000'
  | '$100,000 to $250,000'
  | 'Over $250,000';

// Plan data structure
export interface PlanData {
  assetsUnderManagement?: number;
  averageAccountBalance?: number;
  participantCount?: number;
  benchmarkCategory?: AUMBucket;
  fees: {
    advisor: FeeStructure;
    recordKeeper: FeeStructure;
    tpa: FeeStructure;
    audit: FeeStructure;
  };
}

// Comparison data (existing vs proposed)
export interface ComparisonData {
  existing?: PlanData;
  proposed?: PlanData;
}

// Calculated fee result
export interface CalculatedFee {
  dollarAmount: number;
  percentage: number;
}

export interface CalculatedFees {
  advisor: CalculatedFee;
  recordKeeper: CalculatedFee;
  tpa: CalculatedFee;
  audit: CalculatedFee;
  total: CalculatedFee;
}

// Benchmark statistics
export interface BenchmarkStats {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export interface BenchmarkComparison {
  advisor: BenchmarkStats;
  recordKeeper: BenchmarkStats;
  tpa: BenchmarkStats;
  audit: BenchmarkStats;
  total: BenchmarkStats;
}

// Domo dataset row structure
export interface DomoDataRow {
  'AUM Bucket': string;
  'Balance Bucket': string;
  'Bundled / Unbundled': string;
  'Fee Type': string;
  '10th Percentile': number;
  '25th Percentile': number;
  '50th Percentile': number;
  '75th Percentile': number;
  '90th Percentile': number;
}
```

---

## Backend Implementation

### Domo API Integration (lib/domoApi.ts)

**Purpose**: Authenticate with Domo OAuth 2.0 and fetch dataset as CSV

**Key Functions**:

```typescript
async function getDomoAccessToken(): Promise<string>
```
- Authenticates using client credentials flow
- Endpoint: `https://api.domo.com/oauth/token?grant_type=client_credentials`
- Uses Basic Auth with base64 encoded `CLIENT_ID:CLIENT_SECRET`
- Returns access token for subsequent requests
- Caches token in memory (expires in 3600 seconds)

```typescript
async function fetchDomoDataset(datasetId: string): Promise<DomoDataRow[]>
```
- Fetches dataset as CSV from Domo
- Endpoint: `https://api.domo.com/v1/datasets/{datasetId}/data?includeHeader=true`
- Headers:
  - `Authorization: Bearer {access_token}`
  - `Accept: text/csv`
- Parses CSV using `csv-parse/sync`
- Converts string numbers to actual numbers
- Returns array of `DomoDataRow` objects
- Error handling:
  - 401: Token expired, re-authenticate
  - Other: Throw descriptive error

**Implementation Notes**:
- Token is cached globally to avoid repeated auth requests
- CSV parsing converts all numeric fields to numbers
- Duplicate headers in CSV are automatically renamed (e.g., "Fee Type_1")
- Uses axios for HTTP requests

### Fee Calculations (lib/feeCalculations.ts)

**Purpose**: Calculate dollar amounts and percentages for all fee structures

**Key Functions**:

```typescript
function calculateFee(feeStructure: FeeStructure, aum: number, participantCount?: number): number
```
- Calculates dollar amount based on fee structure type:
  - **basisPoints**: `(aum × basisPoints) / 10000`
  - **flatFee**: `flatFee`
  - **flatPlusPerHead**: `flatFee + (perHeadFee × participantCount)`
  - **perParticipant**: `perHeadFee × participantCount`
- Returns 0 if required parameters missing
- IMPORTANT: Divide by 10,000 for basis points (not 100)

```typescript
function calculateAllFees(plan: PlanData): CalculatedFees
```
- Calculates all four fee types
- Returns both dollar amounts and percentages
- Percentage formula: `(dollarAmount / aum) × 100`
- Calculates total as sum of all fees

```typescript
function getAUMBucket(aum: number): AUMBucket
```
- Maps AUM dollar amount to bucket category
- Returns appropriate string from 13 predefined buckets

```typescript
function getBalanceBucket(balance: number): BalanceBucket
```
- Maps average account balance to bucket category
- Returns appropriate string from 6 predefined buckets

**Conversion Functions**:

```typescript
function convertDollarsToBasisPoints(feeAmount: number, aum: number): number
```
- Formula: `(feeAmount / aum) × 10000`

```typescript
function convertBasisPointsToDecimal(basisPoints: number): number
```
- Formula: `basisPoints / 10000`

### Benchmark Data Processing (lib/benchmarkData.ts)

**Purpose**: Retrieve and process benchmark data from Domo dataset

**Key Function**:

```typescript
async function getBenchmarkComparison(aumBucket: AUMBucket, balanceBucket: BalanceBucket = 'All'): Promise<BenchmarkComparison>
```

**Process**:
1. Fetch all data from Domo using `fetchDomoDataset()`
2. Filter rows matching:
   - AUM Bucket = specified bucket
   - Balance Bucket = specified bucket (fallback to 'All' if not found)
   - Bundled / Unbundled = 'Unbundled'
3. Map Fee Type to internal fee types:
   - "Advisor - Unbundled" → advisor
   - "Record Keeper - Unbundled" → recordKeeper
   - "TPA - Unbundled" → tpa
   - "Audit / Investment Manager - Unbundled" → audit
4. Extract percentile statistics (10th, 25th, 50th, 75th, 90th)
5. Calculate total benchmarks by summing all four fee types at each percentile
6. Return `BenchmarkComparison` object

**Fallback Logic**:
- If no data found for specified balance bucket, retry with 'All' balance bucket
- Ensures benchmark data always available even for uncommon balance ranges

### API Routes

#### GET /api/benchmark

**Purpose**: Fetch benchmark data for specified criteria

**Query Parameters**:
- `aumBucket` (required): AUM bucket category
- `balanceBucket` (optional): Average balance bucket (defaults to 'All')

**Response**:
```json
{
  "advisor": {
    "p10": 0.05,
    "p25": 0.10,
    "p50": 0.15,
    "p75": 0.20,
    "p90": 0.25
  },
  "recordKeeper": { ... },
  "tpa": { ... },
  "audit": { ... },
  "total": { ... }
}
```

**Error Handling**:
- 400: Missing aumBucket parameter
- 500: Server error with descriptive message

**Implementation** (app/api/benchmark/route.ts):
```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const aumBucket = searchParams.get('aumBucket') as AUMBucket;
  const balanceBucket = searchParams.get('balanceBucket') as BalanceBucket | undefined;

  if (!aumBucket) {
    return NextResponse.json(
      { error: 'aumBucket parameter is required' },
      { status: 400 }
    );
  }

  const benchmarks = await getBenchmarkComparison(aumBucket, balanceBucket);
  return NextResponse.json(benchmarks);
}
```

#### GET /api/test-domo

**Purpose**: Test Domo API connection and authentication

**Response**:
```json
{
  "success": true,
  "rowCount": 618,
  "executionTime": 1234,
  "sampleData": [ ... ]
}
```

**Implementation** (app/api/test-domo/route.ts):
- Logs environment variable status
- Fetches dataset
- Returns row count, execution time, and sample rows
- Used for debugging Domo integration

---

## Frontend Implementation

### Main Application Page (app/page.tsx)

**Purpose**: Root page orchestrating form and results

**State Management**:
```typescript
const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
```

**Structure**:
```tsx
<main className="container mx-auto py-12 px-4 max-w-7xl">
  <header>
    <h1>Retirement Plan Fee Benchmarking</h1>
    <p>Compare your plan fees against industry benchmarks</p>
  </header>

  <FeeInputForm onSubmit={handleSubmit} />

  {comparisonData && <BenchmarkResults data={comparisonData} />}
</main>
```

**Flow**:
1. User fills out form
2. On submit, `comparisonData` state is set
3. `BenchmarkResults` component automatically loads and displays

### Fee Input Form (components/FeeInputForm.tsx)

**Purpose**: Collect plan information and fee structures

**Component Structure**:

**State**:
```typescript
const [existingPlan, setExistingPlan] = useState<PlanData>({
  fees: {
    advisor: { type: 'basisPoints' },
    recordKeeper: { type: 'basisPoints' },
    tpa: { type: 'basisPoints' },
    audit: { type: 'basisPoints' },
  },
});
const [proposedPlan, setProposedPlan] = useState<PlanData>({ ... });
const [includeProposed, setIncludeProposed] = useState(false);
```

**Form Sections**:

1. **Existing Plan Information**:
   - Assets Under Management (required, number input)
   - Average Account Balance (optional, number input)
   - Number of Participants (optional, number input)
   - Benchmark Category (required, select dropdown with 13 AUM buckets)

2. **Existing Plan Fee Structures** (4 sections):
   - Advisor Fee
   - Record Keeper Fee
   - TPA Fee
   - Audit/Investment Manager Fee

   Each fee section:
   - Fee Structure Type (select: Basis Points, Flat Fee, Flat + Per Participant, Per Participant)
   - Dynamic inputs based on type:
     - Basis Points: number input (e.g., 50 = 0.50%)
     - Flat Fee: dollar amount input
     - Flat + Per Participant: flat fee + per head fee inputs
     - Per Participant: per head fee input

3. **Proposed Plan Toggle**:
   - Checkbox: "Include Proposed Plan Comparison"
   - When checked, shows proposed fee structures
   - Proposed plan inherits AUM, balance, participants, and benchmark category from existing plan

4. **Proposed Plan Fee Structures** (conditional, same structure as existing)

**Validation Rules**:
- AUM is required
- Benchmark category is required
- If per-participant or flat+per-participant fee structures are used, participant count is required
- Validation triggers on submit with alert messages

**Submit Handler**:
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  // Validate per-participant fees require participant count
  if (usesPerParticipantFees && !existingPlan.participantCount) {
    alert('Number of Participants is required when using Per Participant fees');
    return;
  }

  // Submit with proposed plan inheriting core values from existing
  onSubmit({
    existing: existingPlan,
    proposed: includeProposed ? {
      ...proposedPlan,
      assetsUnderManagement: existingPlan.assetsUnderManagement,
      averageAccountBalance: existingPlan.averageAccountBalance,
      participantCount: existingPlan.participantCount,
      benchmarkCategory: existingPlan.benchmarkCategory,
    } : undefined,
  });
};
```

**Key Implementation Details**:
- No placeholder values (all inputs start empty/undefined)
- Helper text shows examples (e.g., "e.g., 50 = 0.50%" for basis points)
- Controlled components with state management
- Fee structure inputs are modular and reusable

### Fee Structure Input Component

**Purpose**: Reusable component for single fee type input

**Props**:
```typescript
interface FeeStructureInputProps {
  label: string;
  feeStructure: FeeStructure;
  onChange: (updated: FeeStructure) => void;
}
```

**Dynamic Rendering**:
```tsx
<Select value={feeStructure.type} onChange={...}>
  <option value="basisPoints">Basis Points</option>
  <option value="flatFee">Flat Fee</option>
  <option value="flatPlusPerHead">Flat + Per Participant</option>
  <option value="perParticipant">Per Participant</option>
</Select>

{feeStructure.type === 'basisPoints' && (
  <Input
    type="number"
    step="0.01"
    value={feeStructure.basisPoints ?? ''}
    onChange={(e) => onChange({
      type: 'basisPoints',
      basisPoints: e.target.value ? parseFloat(e.target.value) : undefined
    })}
  />
)}

{/* Similar conditional rendering for other types */}
```

### Benchmark Results (components/BenchmarkResults.tsx)

**Purpose**: Fetch benchmarks and display comparison charts

**State**:
```typescript
const [benchmarks, setBenchmarks] = useState<BenchmarkComparison | null>(null);
const [existingFees, setExistingFees] = useState<CalculatedFees | null>(null);
const [proposedFees, setProposedFees] = useState<CalculatedFees | null>(null);
const [loading, setLoading] = useState(true);
```

**Data Loading Flow**:
```typescript
useEffect(() => {
  async function loadData() {
    setLoading(true);

    // Calculate fees from plan data
    if (data.existing) {
      const fees = calculateAllFees(data.existing);
      setExistingFees(fees);

      // Fetch benchmarks from API
      const aumBucket = data.existing.benchmarkCategory ||
                        getAUMBucket(data.existing.assetsUnderManagement || 0);
      const response = await fetch(
        `/api/benchmark?aumBucket=${encodeURIComponent(aumBucket)}`
      );
      const benchmarkData = await response.json();
      setBenchmarks(benchmarkData);
    }

    if (data.proposed) {
      const fees = calculateAllFees(data.proposed);
      setProposedFees(fees);
    }

    setLoading(false);
  }

  loadData();
}, [data]);
```

**Component Structure**:
```tsx
{loading ? (
  <Card>
    <CardContent>Loading benchmark data...</CardContent>
  </Card>
) : (
  <div className="space-y-8">
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
      </CardContent>
    </Card>

    {/* Debug data section (optional) */}
    <Card>
      <CardHeader>
        <CardTitle>Debug Data</CardTitle>
      </CardHeader>
      <CardContent>
        <pre>{JSON.stringify({ existingFees, proposedFees, benchmarks }, null, 2)}</pre>
      </CardContent>
    </Card>
  </div>
)}
```

### Fee Benchmark Chart (components/charts/FeeBenchmarkChart.tsx)

**Purpose**: Display stacked horizontal bar chart comparing fees

**Chart Type**: Horizontal Stacked Bar Chart (Recharts)

**Data Transformation**:
```typescript
// CRITICAL: Domo benchmark values are decimals (0.005 = 0.5%)
// Calculated fees are already percentages (0.5 = 0.5%)
// Must multiply benchmark values by 100 to match

const data = [
  {
    name: "Benchmark",
    advisor: benchmarks.advisor.p50 * 100,
    recordKeeper: benchmarks.recordKeeper.p50 * 100,
    audit: benchmarks.audit.p50 * 100,
    tpa: benchmarks.tpa.p50 * 100,
  },
  {
    name: "Existing",
    advisor: existingFees.advisor.percentage,
    recordKeeper: existingFees.recordKeeper.percentage,
    audit: existingFees.audit.percentage,
    tpa: existingFees.tpa.percentage,
  },
];

// Only add if proposed fees exist
if (proposedFees) {
  data.push({
    name: "Proposed",
    advisor: proposedFees.advisor.percentage,
    recordKeeper: proposedFees.recordKeeper.percentage,
    audit: proposedFees.audit.percentage,
    tpa: proposedFees.tpa.percentage,
  });
}
```

**Color Scheme** (MUST USE THESE EXACT COLORS):
```typescript
const colors = {
  advisor: "#0078A2",        // Teal blue
  recordKeeper: "#4FB3CD",   // Light cyan
  audit: "#8EB935",          // Green
  tpa: "#C2E76B",            // Lime green
};
```

**Chart Configuration**:
```tsx
<ResponsiveContainer width="100%" height={400}>
  <BarChart
    data={data}
    layout="vertical"
    margin={{ top: 20, right: 30, left: 150, bottom: 20 }}
  >
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis
      type="number"
      label={{ value: "Percentage (%)", position: "insideBottom", offset: -10 }}
      tickFormatter={(value) => `${value.toFixed(2)}%`}
    />
    <YAxis
      type="category"
      dataKey="name"
      width={140}
    />
    <Tooltip content={<CustomTooltip />} />
    <Legend
      verticalAlign="top"
      height={36}
      formatter={(value) => {
        const labels: Record<string, string> = {
          advisor: "Advisor Fee",
          recordKeeper: "Record Keeper Fee",
          audit: "Investment Manager Fee",
          tpa: "TPA Fee",
        };
        return labels[value] || value;
      }}
    />
    <Bar dataKey="advisor" stackId="a" fill={colors.advisor} />
    <Bar dataKey="recordKeeper" stackId="a" fill={colors.recordKeeper} />
    <Bar dataKey="audit" stackId="a" fill={colors.audit} />
    <Bar dataKey="tpa" stackId="a" fill={colors.tpa} />
  </BarChart>
</ResponsiveContainer>
```

**Custom Tooltip**:
```tsx
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);

    return (
      <div className="bg-background border border-border p-3 rounded shadow-lg">
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toFixed(3)}%
          </p>
        ))}
        <p className="text-sm font-semibold mt-2 pt-2 border-t">
          Total: {total.toFixed(3)}%
        </p>
      </div>
    );
  }
  return null;
};
```

**Chart Display Rules**:
- Bar order (top to bottom): Benchmark, Existing, Proposed
- Stack order (left to right): Advisor, Record Keeper, Investment Manager, TPA
- If no proposed plan: only show Benchmark and Existing bars
- Percentages shown with 2-3 decimal places
- Tooltip shows individual fees and total

---

## UI Component Library (shadcn/ui)

### Installed Components
All components from shadcn/ui are installed in `/components/ui/`:

- `button.tsx` - Button component
- `card.tsx` - Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- `input.tsx` - Input field
- `label.tsx` - Form label
- `select.tsx` - Select dropdown
- `checkbox.tsx` - Checkbox
- `separator.tsx` - Visual separator

### Component Usage Pattern
```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <Label htmlFor="field">Label</Label>
    <Input id="field" type="number" />
    <Button type="submit">Submit</Button>
  </CardContent>
</Card>
```

---

## Styling System

### Tailwind CSS v4 Configuration

**Global Styles** (app/globals.css):
```css
@import "tailwindcss";

@theme {
  --color-background: oklch(100% 0 0);
  --color-foreground: oklch(9% 0 0);
  --color-card: oklch(100% 0 0);
  --color-card-foreground: oklch(9% 0 0);
  --color-popover: oklch(100% 0 0);
  --color-popover-foreground: oklch(9% 0 0);
  --color-primary: oklch(25.61% 0 0);
  --color-primary-foreground: oklch(98% 0 0);
  --color-secondary: oklch(96.5% 0 0);
  --color-secondary-foreground: oklch(9% 0 0);
  --color-muted: oklch(96.5% 0 0);
  --color-muted-foreground: oklch(45.1% 0 0);
  --color-accent: oklch(96.5% 0 0);
  --color-accent-foreground: oklch(9% 0 0);
  --color-destructive: oklch(50% 0.2 25);
  --color-destructive-foreground: oklch(98% 0 0);
  --color-border: oklch(90% 0 0);
  --color-input: oklch(90% 0 0);
  --color-ring: oklch(9% 0 0);

  --radius: 0.5rem;
}

@media (prefers-color-scheme: dark) {
  @theme {
    --color-background: oklch(9% 0 0);
    --color-foreground: oklch(98% 0 0);
    /* ... dark mode colors */
  }
}
```

**Key CSS Utilities**:
- Layout: `container`, `mx-auto`, `py-12`, `px-4`, `max-w-7xl`
- Spacing: `space-y-8`, `space-y-4`, `gap-4`
- Grid: `grid`, `grid-cols-1`, `md:grid-cols-2`
- Typography: `text-3xl`, `font-bold`, `text-muted-foreground`
- Colors: `bg-background`, `text-foreground`, `border-border`

---

## Data Flow Diagram

```
User Input (Form)
    ↓
[FeeInputForm Component]
    ↓
Submit Handler (validates & processes)
    ↓
[App Page State] - comparisonData
    ↓
[BenchmarkResults Component]
    ↓
    ├─→ calculateAllFees(existing) → existingFees
    ├─→ calculateAllFees(proposed) → proposedFees
    └─→ fetch(/api/benchmark) → benchmarks
           ↓
    [/api/benchmark Route]
           ↓
    getBenchmarkComparison(aumBucket, balanceBucket)
           ↓
    fetchDomoDataset(datasetId)
           ↓
    [Domo API] - OAuth + CSV Export
           ↓
    Filter & Process Data
           ↓
    Return BenchmarkComparison
           ↓
[FeeBenchmarkChart Component]
    ↓
Display Stacked Bar Chart
```

---

## Critical Implementation Rules

### 1. Basis Points Calculation
**CRITICAL**: Always divide by 10,000, NOT 100
```typescript
// CORRECT
const feeAmount = (aum * basisPoints) / 10000;

// WRONG
const feeAmount = (aum * basisPoints) / 100;
```

### 2. Domo Benchmark Values Format
**CRITICAL**: Domo dataset stores values as decimals, NOT percentages
- Domo value `0.005` = 0.5% (or 50 basis points)
- Calculated fee percentage `0.5` = 0.5%
- **Must multiply Domo values by 100** when displaying in charts with calculated fees

```typescript
// CORRECT - Converting Domo benchmark to match calculated fee format
const chartData = {
  benchmark: benchmarks.advisor.p50 * 100,  // 0.005 → 0.5
  existing: existingFees.advisor.percentage  // Already 0.5
};

// WRONG - Mixing decimal and percentage formats
const chartData = {
  benchmark: benchmarks.advisor.p50,        // 0.005 (decimal)
  existing: existingFees.advisor.percentage // 0.5 (percentage)
};
```

### 3. AUM Bucket Categories
Must match exactly (13 total):
- Under $1 million
- $1 to $5 million
- $5 to $10 million
- $10 to $25 million
- $25 to $50 million
- $50 to $100 million
- $100 to $250 million
- $250 to $500 million
- $500 million to $1 billion
- $1 to $5 billion
- $5 to $10 billion
- $10 to $25 billion
- Over $25 billion

### 3. Fee Type Mapping
Domo dataset uses these exact names:
- "Advisor - Unbundled" → advisor
- "Record Keeper - Unbundled" → recordKeeper
- "TPA - Unbundled" → tpa
- "Audit / Investment Manager - Unbundled" → audit

### 4. Bundled/Unbundled Filter
Always filter for `'Bundled / Unbundled' === 'Unbundled'`

### 5. Balance Bucket Fallback
If no data for specified balance bucket, retry with 'All'

### 6. Participant Count Validation
If fee structure is 'perParticipant' or 'flatPlusPerHead', participant count is required

### 7. Proposed Plan Inheritance
Proposed plan MUST inherit from existing plan:
- assetsUnderManagement
- averageAccountBalance
- participantCount
- benchmarkCategory

### 8. Chart Colors (MUST USE EXACT VALUES)
```typescript
{
  advisor: "#0078A2",
  recordKeeper: "#4FB3CD",
  audit: "#8EB935",
  tpa: "#C2E76B",
}
```

### 9. Chart Bar Order
Top to bottom: Benchmark, Existing, Proposed (if present)

### 10. No Placeholder Values
Form inputs should NOT have placeholder values that look like defaults

---

## Installation & Setup Instructions

### 1. Initialize Project
```bash
npx create-next-app@latest retirement-fee-benchmark --typescript --tailwind --app --turbopack
cd retirement-fee-benchmark
```

### 2. Install Dependencies
```bash
npm install axios recharts
npm install csv-parse
npm install -D @types/node
```

### 3. Install shadcn/ui
```bash
npx shadcn@latest init
```
Select:
- TypeScript: Yes
- Style: Default
- Base color: Slate
- CSS variables: Yes

Install components:
```bash
npx shadcn@latest add card input label button select checkbox separator
```

### 4. Configure Tailwind v4
Update `app/globals.css` with OKLCH color system (see Styling System section)

### 5. Setup Environment Variables
Create `.env.local`:
```bash
DOMO_CLIENT_ID=your_client_id
DOMO_CLIENT_SECRET=your_client_secret
DOMO_DATASET_ID=38b1bcb9-55cf-4dc7-8978-867a9fc7021c
```

### 6. Create Directory Structure
```bash
mkdir -p lib components/charts app/api/benchmark app/api/test-domo
```

### 7. Implement Files
Create all files according to specifications above in this order:
1. `lib/types.ts` - Type definitions
2. `lib/domoApi.ts` - Domo API integration
3. `lib/feeCalculations.ts` - Fee calculation logic
4. `lib/benchmarkData.ts` - Benchmark data processing
5. `app/api/benchmark/route.ts` - Benchmark API endpoint
6. `app/api/test-domo/route.ts` - Test endpoint
7. `components/FeeInputForm.tsx` - Form component
8. `components/charts/FeeBenchmarkChart.tsx` - Chart component
9. `components/BenchmarkResults.tsx` - Results component
10. `app/page.tsx` - Main page

### 8. Run Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000`

### 9. Test Domo Connection
Navigate to `http://localhost:3000/api/test-domo`
Should return JSON with row count and sample data

---

## Testing Checklist

### Functional Tests
- [ ] Form validates required fields (AUM, benchmark category)
- [ ] Form validates per-participant fees require participant count
- [ ] Fee calculations correct for all structure types
- [ ] Basis points divide by 10,000 (not 100)
- [ ] Benchmark API returns data for all 13 AUM buckets
- [ ] Balance bucket fallback works when specific bucket has no data
- [ ] Proposed plan inherits values from existing plan
- [ ] Chart displays only Benchmark + Existing when no proposed plan
- [ ] Chart displays all 3 bars when proposed plan included
- [ ] Chart colors match specification exactly
- [ ] Chart bar order is Benchmark, Existing, Proposed (top to bottom)
- [ ] Tooltip shows individual fees and total
- [ ] Page responsive on mobile and desktop

### Integration Tests
- [ ] Domo OAuth authentication succeeds
- [ ] Domo dataset fetches and parses correctly
- [ ] API endpoint returns proper error codes (400, 500)
- [ ] CSV parsing handles duplicate headers
- [ ] Environment variables load correctly

### Edge Cases
- [ ] Zero AUM handled gracefully
- [ ] Missing participant count for non-per-participant fees works
- [ ] Empty/undefined fee structure values handled
- [ ] Very large AUM values (>$25B) map correctly
- [ ] Domo token expiration triggers re-authentication

---

## Performance Considerations

### API Response Time
- Domo API calls typically 500-1000ms
- CSV parsing adds ~50-100ms
- Total benchmark fetch: ~600-1100ms

### Caching Strategy
- Domo access token cached in memory (3600s TTL)
- Consider caching benchmark data if frequent requests
- Client-side: React state management (no additional caching)

### Optimization Opportunities
1. Cache benchmark data in API route (5-10 min TTL)
2. Implement loading skeletons instead of simple "Loading..." text
3. Lazy load Recharts library
4. Compress Domo API responses (gzip)

---

## Security Considerations

### Environment Variables
- NEVER commit `.env.local` to version control
- Use environment variable validation on server startup
- Rotate Domo credentials periodically

### API Security
- Domo credentials only accessible server-side (API routes)
- No client-side exposure of secrets
- CORS not needed (same-origin)

### Input Validation
- Validate all user inputs before processing
- Sanitize AUM bucket string before API query
- Type checking via TypeScript

---

## Deployment Considerations

### Environment Setup
1. Add environment variables to hosting platform:
   - Vercel: Project Settings → Environment Variables
   - Netlify: Site Settings → Build & Deploy → Environment
   - AWS/GCP: Use secrets manager

### Build Configuration
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### Production Checklist
- [ ] Environment variables configured
- [ ] Domo credentials valid and tested
- [ ] Build completes without errors
- [ ] Static assets optimized
- [ ] Remove debug logging
- [ ] Test on production URL
- [ ] Monitor API rate limits (Domo)

---

## Known Issues & Limitations

### Current Limitations
1. **Domo Dataset Dependency**: Application requires specific dataset structure
2. **No Offline Mode**: Requires internet connection for benchmarks
3. **Single Dataset**: Only supports one predefined Domo dataset
4. **No Data Persistence**: Form data not saved between sessions
5. **Limited Error Messages**: Could provide more specific validation feedback

### Future Enhancements
1. Support multiple benchmark datasets
2. Add data export (PDF, Excel)
3. Save/load comparison scenarios
4. Historical trend analysis
5. Additional chart types (detailed breakdowns, percentile comparisons)
6. Print-friendly report generation
7. Email report functionality

---

## Troubleshooting Guide

### Issue: "Failed to fetch Domo dataset"
**Causes**:
- Invalid credentials
- Expired token
- Network issues
- Dataset ID incorrect

**Solutions**:
1. Verify `.env.local` has correct values
2. Test at `/api/test-domo`
3. Check Domo console for API access
4. Verify dataset ID: `38b1bcb9-55cf-4dc7-8978-867a9fc7021c`

### Issue: "Module not found" errors
**Causes**:
- Missing dependencies
- Incorrect import paths

**Solutions**:
1. Run `npm install`
2. Verify `@` alias configured in `tsconfig.json`
3. Check file paths match exactly

### Issue: Chart not displaying
**Causes**:
- Missing Recharts dependency
- Data format incorrect
- Props not passed correctly

**Solutions**:
1. Verify `recharts` installed: `npm list recharts`
2. Check browser console for errors
3. Verify data structure matches expected format

### Issue: Basis points calculations wrong
**Causes**:
- Dividing by 100 instead of 10,000

**Solutions**:
1. Search codebase for `/100` and verify context
2. Ensure formula: `(aum * basisPoints) / 10000`

### Issue: Tailwind styles not applying
**Causes**:
- Tailwind v4 configuration incorrect
- CSS not imported

**Solutions**:
1. Verify `app/globals.css` has `@import "tailwindcss";`
2. Check `app/layout.tsx` imports `globals.css`
3. Restart dev server

---

## API Reference

### Internal API Endpoints

#### GET /api/benchmark
Fetch benchmark data for specified AUM bucket.

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| aumBucket | AUMBucket | Yes | AUM bucket category (must match one of 13 predefined) |
| balanceBucket | BalanceBucket | No | Average balance bucket (defaults to 'All') |

**Response Schema**:
```typescript
{
  advisor: BenchmarkStats,
  recordKeeper: BenchmarkStats,
  tpa: BenchmarkStats,
  audit: BenchmarkStats,
  total: BenchmarkStats
}

interface BenchmarkStats {
  p10: number,   // 10th percentile
  p25: number,   // 25th percentile
  p50: number,   // 50th percentile (median)
  p75: number,   // 75th percentile
  p90: number    // 90th percentile
}
```

**Example Request**:
```
GET /api/benchmark?aumBucket=$50%20to%20$100%20million
```

**Example Response**:
```json
{
  "advisor": {
    "p10": 0.05,
    "p25": 0.10,
    "p50": 0.15,
    "p75": 0.20,
    "p90": 0.25
  },
  "recordKeeper": { ... },
  "tpa": { ... },
  "audit": { ... },
  "total": { ... }
}
```

#### GET /api/test-domo
Test Domo API connection and authentication.

**No Parameters**

**Response Schema**:
```typescript
{
  success: boolean,
  rowCount: number,
  executionTime: number,  // milliseconds
  sampleData: DomoDataRow[]
}
```

**Example Response**:
```json
{
  "success": true,
  "rowCount": 618,
  "executionTime": 1234,
  "sampleData": [
    {
      "AUM Bucket": "$50 to $100 million",
      "Balance Bucket": "All",
      "Bundled / Unbundled": "Unbundled",
      "Fee Type": "Advisor - Unbundled",
      "10th Percentile": 0.05,
      "25th Percentile": 0.10,
      "50th Percentile": 0.15,
      "75th Percentile": 0.20,
      "90th Percentile": 0.25
    }
  ]
}
```

### External API (Domo)

#### POST https://api.domo.com/oauth/token
Authenticate and retrieve access token.

**Headers**:
```
Authorization: Basic base64(CLIENT_ID:CLIENT_SECRET)
Content-Type: application/x-www-form-urlencoded
```

**Body**:
```
grant_type=client_credentials
```

**Response**:
```json
{
  "access_token": "...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

#### GET https://api.domo.com/v1/datasets/{datasetId}/data
Fetch dataset as CSV.

**Headers**:
```
Authorization: Bearer {access_token}
Accept: text/csv
```

**Query Parameters**:
```
includeHeader=true
```

**Response**: CSV data with headers

---

## Glossary

**AUM**: Assets Under Management - Total value of assets in the retirement plan

**Basis Points**: Unit of measure equal to 1/100th of 1% (0.01%). 50 basis points = 0.50%

**Benchmark**: Industry standard fee rates based on statistical analysis of similar plans

**Bundled/Unbundled**: Fee structure where services are either packaged together (bundled) or separate (unbundled)

**Fee Type**: Category of fee (Advisor, Record Keeper, TPA, Audit/Investment Manager)

**Percentile**: Statistical measure indicating the value below which a percentage of observations fall (e.g., 50th percentile = median)

**Per Head Fee**: Fixed dollar amount charged per participant in the plan

**TPA**: Third Party Administrator - Entity that handles plan administration tasks

---

## Version History

**v1.0** - Initial implementation
- Core fee input and calculation
- Domo API integration
- Benchmark comparison chart
- Responsive UI with Tailwind v4

---

## Contact & Support

For issues related to:
- **Domo API Access**: Contact Domo support or dataset administrator
- **Application Bugs**: Check browser console and server logs
- **Feature Requests**: Document in project requirements

---

## Appendix A: Complete Type Definitions

See `lib/types.ts` section above for full TypeScript interfaces.

## Appendix B: Color Palette Reference

**Chart Colors**:
- Advisor Fee: `#0078A2` (Teal Blue)
- Record Keeper Fee: `#4FB3CD` (Light Cyan)
- Investment Manager Fee: `#8EB935` (Green)
- TPA Fee: `#C2E76B` (Lime Green)

**UI Colors** (Tailwind/OKLCH):
- Background: `oklch(100% 0 0)` (White)
- Foreground: `oklch(9% 0 0)` (Near Black)
- Primary: `oklch(25.61% 0 0)` (Dark Gray)
- Border: `oklch(90% 0 0)` (Light Gray)

## Appendix C: Sample Data

**Sample Form Input**:
```json
{
  "existing": {
    "assetsUnderManagement": 75000000,
    "averageAccountBalance": 45000,
    "participantCount": 250,
    "benchmarkCategory": "$50 to $100 million",
    "fees": {
      "advisor": { "type": "basisPoints", "basisPoints": 50 },
      "recordKeeper": { "type": "flatPlusPerHead", "flatFee": 25000, "perHeadFee": 50 },
      "tpa": { "type": "flatFee", "flatFee": 15000 },
      "audit": { "type": "basisPoints", "basisPoints": 10 }
    }
  }
}
```

**Sample Calculated Output**:
```json
{
  "advisor": {
    "dollarAmount": 37500,
    "percentage": 0.05
  },
  "recordKeeper": {
    "dollarAmount": 37500,
    "percentage": 0.05
  },
  "tpa": {
    "dollarAmount": 15000,
    "percentage": 0.02
  },
  "audit": {
    "dollarAmount": 7500,
    "percentage": 0.01
  },
  "total": {
    "dollarAmount": 97500,
    "percentage": 0.13
  }
}
```

---

END OF DOCUMENT
