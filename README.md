# Retirement Plan Fee Benchmarking Application

A comprehensive fee benchmarking tool designed for retirement plan consultants to compare plan fees against industry benchmarks. The application supports comparing existing plans with proposed alternatives and visualizes results through interactive charts and tables.

## Features

- **Multi-Fee Structure Support**: Handles basis points, flat fees, flat + per participant, and per participant fee structures
- **Comprehensive Comparisons**: Compare existing vs proposed plans side-by-side
- **Plan Size-Adjusted Service Scoring**: Evaluates service coverage with plan size-appropriate expectations
  - Small Plans (< $5M AUM): Emphasizes essential services
  - Mid-Market Plans ($5M-$50M AUM): Expects essential + standard services
  - Large Plans (> $50M AUM): Requires comprehensive service packages
- **Service Tier System**: Categorizes services as Essential, Standard, or Premium based on industry standards
- **AI-Powered Executive Summary**: Generates professional analysis using Azure OpenAI
- **Interactive Visualizations**:
  - Horizontal stacked bar charts showing total fee breakdowns
  - Service radar charts showing coverage across all providers
  - Detailed fee summary tables with dollar and percentage amounts
  - Vertical bar charts comparing fees to 25th, 50th, and 75th percentile benchmarks
  - Service-by-service comparison tables with tier badges
- **Benchmark Categories**: Support for AUM buckets and optional average account balance filtering
- **PowerPoint Export**: One-click export of complete analysis to presentation format
- **Custom Themed UI**: Built with shadcn/ui components using your brand colors

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Accessible UI components
- **Recharts** - Data visualization
- **Papa Parse** - CSV parsing

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Usage

### Entering Plan Data

1. **Plan Details**:
   - Enter Assets Under Management (required)
   - Optionally enter Average Account Balance for more precise benchmarking
   - Enter Number of Participants if using per-participant fee structures

2. **Fee Structures**: For each fee type (Advisor, Record Keeper, TPA, Audit):
   - Select the fee structure type
   - Enter the appropriate values based on the structure type:
     - **Basis Points**: Enter as percentage (e.g., 50 = 0.50%)
     - **Flat Fee**: Enter dollar amount
     - **Flat + Per Participant**: Enter both flat fee and per-participant amount
     - **Per Participant**: Enter per-participant dollar amount

3. **Comparison Mode**:
   - Check "Compare existing vs proposed plan" to enter both existing and proposed fee structures
   - Toggle between tabs to enter data for each plan type

4. **Generate Report**: Click the "Generate Benchmark Report" button to view results

### Understanding Results

#### Fee Analysis

**Horizontal Stacked Bar Chart**: Shows breakdown of all fee types for existing, proposed, and benchmark percentiles

**Fee Summary Table**: Detailed breakdown showing:
- Fee amounts in dollars and percentages
- Difference calculations when comparing existing vs proposed
- Color-coded increases (red) and decreases (green)

**Percentile Bar Charts**: Individual charts for each fee type showing:
- 25th, 50th, and 75th percentile benchmarks
- Your existing plan fees
- Your proposed plan fees (if applicable)

#### Service Analysis

**Service Radar Chart**: 5-axis visualization showing:
- Service coverage scores for Advisor, Recordkeeper, TPA, and Audit
- Total fee competitiveness score (lower fees = higher score)
- Visual comparison between existing and proposed plans
- Market median reference line (50th percentile)

**Service Value Score (0-100)**: Plan size-adjusted scoring that evaluates service coverage:
- **Score Interpretation**:
  - 80-100: Comprehensive service coverage
  - 60-79: Adequate service coverage
  - 40-59: Limited service coverage
  - 0-39: Concerning service gaps

- **Plan Size Adjustments**:
  - **Small Plans (< $5M AUM)**: Heavily weighted toward essential services (5x)
    - A plan with only essential services scores ~71% (excellent)
  - **Mid-Market Plans ($5M-$50M AUM)**: Balanced weighting (essential 3x, standard 2x)
    - A plan with only essential services scores ~50% (adequate but incomplete)
  - **Large Plans (> $50M AUM)**: Higher expectations for comprehensive coverage
    - A plan with only essential services scores ~40% (concerning)

**Service Tiers**:
- **Essential (E - Red badge)**: Core services required for basic plan operation and fiduciary compliance
- **Standard (S - Blue badge)**: Services expected by most plans in the market segment
- **Premium (P - Purple badge)**: Enhanced services that provide additional value

**Service Coverage Cards**: Breakdown by provider showing:
- Essential, Standard, and Premium service coverage percentages
- Service count comparisons
- Missing essential services warnings
- Plan size-specific guidance

**Detailed Service Comparison**: Service-by-service comparison organized by tier with:
- Visual tier badges for easy identification
- Side-by-side comparison of existing vs proposed
- Coverage percentage by tier for each provider

#### AI Executive Summary

AI-generated professional analysis that:
- Evaluates overall fee positioning vs. market benchmarks
- Analyzes each fee component with service coverage context
- Identifies optimization opportunities or justifications for fee levels
- Provides specific, actionable recommendations prioritized by impact
- Considers both fee competitiveness AND service adequacy

## Integrating with Domo API

The application currently uses a static CSV file for benchmark data. To integrate with your Domo environment:

### Step 1: Get Domo API Credentials

1. Log into your Domo instance
2. Navigate to **Admin** > **Authentication** > **Access Tokens**
3. Create a new **Client ID** and **Client Secret**
4. Grant access to the dataset containing your benchmark data

### Step 2: Create Environment Variables

Create a `.env.local` file in the root directory:

```env
DOMO_CLIENT_ID=your_client_id_here
DOMO_CLIENT_SECRET=your_client_secret_here
DOMO_DATASET_ID=your_dataset_id_here
DOMO_API_HOST=https://api.domo.com
```

### Step 3: Install Domo SDK

```bash
npm install axios
```

### Step 4: Create Domo API Integration

Create a new file at `lib/domoApi.ts`:

```typescript
import axios from 'axios';

interface DomoAuthResponse {
  access_token: string;
  expires_in: number;
}

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const response = await axios.post<DomoAuthResponse>(
    `${process.env.DOMO_API_HOST}/oauth/token`,
    new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'data',
    }),
    {
      auth: {
        username: process.env.DOMO_CLIENT_ID!,
        password: process.env.DOMO_CLIENT_SECRET!,
      },
    }
  );

  cachedToken = response.data.access_token;
  tokenExpiry = Date.now() + (response.data.expires_in * 1000);

  return cachedToken;
}

export async function fetchBenchmarkData() {
  const token = await getAccessToken();

  const response = await axios.get(
    `${process.env.DOMO_API_HOST}/v1/datasets/${process.env.DOMO_DATASET_ID}/data`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}
```

### Step 5: Create API Route

Create `app/api/benchmark/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { fetchBenchmarkData } from '@/lib/domoApi';

export async function GET() {
  try {
    const data = await fetchBenchmarkData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching Domo data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch benchmark data' },
      { status: 500 }
    );
  }
}
```

### Step 6: Update benchmarkData.ts

Modify `lib/benchmarkData.ts` to use the API instead of CSV:

```typescript
export async function loadBenchmarkData(): Promise<BenchmarkData[]> {
  if (benchmarkCache) {
    return benchmarkCache;
  }

  try {
    const response = await fetch('/api/benchmark');
    if (!response.ok) {
      throw new Error('Failed to fetch benchmark data');
    }

    benchmarkCache = await response.json();
    return benchmarkCache;
  } catch (error) {
    console.error('Error loading benchmark data:', error);
    return [];
  }
}
```

### Data Format Requirements

Your Domo dataset should have the following columns to match the expected schema:

- `ClientID`
- `SalesforceAccountID`
- `D365AccountID`
- `ReportID`
- `CreationDate`
- `ClientName`
- `SIC`
- `BenchmarkSource`
- `Type` (e.g., "Advisor Fee", "Record Keeper Fee", "TPA Fee", "Audit Fee", "Total Plan Fee")
- `BMAssets` (e.g., "$0-250k", "$1-3m", etc.)
- `BMAvgBalance`
- `RetirementFee25th` (decimal percentage, e.g., 0.005 for 0.5%)
- `RetirementFee50th`
- `RetirementFee75th`

## Deployment

### Salesforce Experience Cloud (iframe)

Since this app will be embedded in Salesforce Experience Cloud:

1. **Build the production version**:
```bash
npm run build
```

2. **Deploy to a hosting service** (Vercel, AWS, Azure, etc.)

3. **Configure CORS** if needed for API calls

4. **Add to Salesforce Experience Cloud**:
   - Create a new component or page
   - Add an iframe component
   - Set the src to your deployed application URL
   - Configure height/width as needed

### Environment Variables in Production

Make sure to set all environment variables in your hosting platform:
- `DOMO_CLIENT_ID`
- `DOMO_CLIENT_SECRET`
- `DOMO_DATASET_ID`
- `DOMO_API_HOST`

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout with global styles
│   ├── page.tsx            # Main page component
│   └── globals.css         # Global styles with custom theme
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── charts/             # Chart components
│   ├── FeeInputForm.tsx    # Fee input form
│   └── BenchmarkResults.tsx # Results container
├── lib/
│   ├── types.ts            # TypeScript type definitions
│   ├── utils.ts            # Utility functions
│   ├── feeCalculations.ts  # Fee calculation logic
│   └── benchmarkData.ts    # Benchmark data loading
└── public/
    └── RetirementFeeDataset (1).csv  # Sample benchmark data
```

## Customization

### Adding New Fee Types

1. Update the `FeeInput` interface in `lib/types.ts`
2. Add the new fee type to the form in `components/FeeInputForm.tsx`
3. Update calculations in `lib/feeCalculations.ts`
4. Add corresponding chart in `components/BenchmarkResults.tsx`

### Adding New Fee Structures

1. Add the new structure type to `FeeStructureType` in `lib/types.ts`
2. Update the `FeeStructure` interface to include new fields
3. Add calculation logic in `lib/feeCalculations.ts`
4. Update the form UI in `components/FeeInputForm.tsx`

## Support

For questions or issues, please contact your development team.

## License

Internal use only.
