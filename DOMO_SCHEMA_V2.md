# Domo Dataset Schema V2 - Migration Guide

This document outlines the updated schema needed to store client benchmarking analysis results from the V2 application, which includes service tracking, plan size-adjusted scoring, and AI-generated summaries.

---

## Overview

**Current V1 Schema**: Combined benchmark table + client fee data
**Proposed V2 Schema**: Three normalized tables OR one denormalized table (recommendations for both)

**New Features to Support**:
- Service selection tracking (31 services across 4 providers)
- Service Value Scores (0-100) with plan size-adjusted weighting
- Fee Competitiveness Scores (0-100)
- AI-generated executive summaries
- Comparison mode (existing vs. proposed plans)
- PowerPoint export metadata

---

## Option 1: Denormalized Single Table (Recommended for Simplicity)

**Pros**:
- Easier to implement (single API call)
- Simpler to query and report on
- Maintains backward compatibility with V1 structure

**Cons**:
- Wide table (100+ columns)
- Some data duplication
- Harder to add new services in the future

### Table: `client_benchmarking_results`

#### Client & Plan Metadata Columns

| Column Name | Type | Description | Example |
|-------------|------|-------------|---------|
| `ResultID` | STRING | Unique identifier for this analysis | "RES-2024-001234" |
| `AnalysisDate` | DATETIME | When the analysis was run | "2024-12-08 14:30:00" |
| `ClientID` | STRING | Client identifier | "CLIENT-5678" |
| `ClientName` | STRING | Client company name | "Acme Manufacturing Inc." |
| `SalesforceAccountID` | STRING | Salesforce Account ID | "001234567890ABC" |
| `D365AccountID` | STRING | Dynamics 365 Account ID | "d365-12345" |
| `ConsultantName` | STRING | Name of consultant who ran analysis | "John Smith" |
| `ConsultantEmail` | STRING | Email of consultant | "john.smith@onedigital.com" |

#### Plan Characteristics

| Column Name | Type | Description | Example |
|-------------|------|-------------|---------|
| `AssetsUnderManagement` | DECIMAL(15,2) | Total plan AUM | 25000000.00 |
| `ParticipantCount` | INTEGER | Number of participants | 350 |
| `AverageBalance` | DECIMAL(15,2) | Avg account balance | 71428.57 |
| `AUMBenchmarkCategory` | STRING | AUM bucket for benchmarking | "$20-30m" |
| `BalanceBenchmarkCategory` | STRING | Balance bucket for benchmarking | "$50-75k" |
| `PlanSizeCategory` | STRING | Small/Mid/Large classification | "5M-50M" |
| `FeeType` | STRING | Bundled or unbundled | "unbundled" |

#### Existing Plan - Fee Inputs

| Column Name | Type | Description | Example |
|-------------|------|-------------|---------|
| `Existing_Advisor_FeeType` | STRING | basisPoints, flatFee, etc. | "basisPoints" |
| `Existing_Advisor_BasisPoints` | DECIMAL(8,2) | Basis points if applicable | 45.00 |
| `Existing_Advisor_FlatFee` | DECIMAL(12,2) | Flat fee if applicable | NULL |
| `Existing_Advisor_PerParticipantFee` | DECIMAL(8,2) | Per participant if applicable | NULL |
| `Existing_RecordKeeper_FeeType` | STRING | Fee structure type | "flatFee" |
| `Existing_RecordKeeper_BasisPoints` | DECIMAL(8,2) | Basis points if applicable | NULL |
| `Existing_RecordKeeper_FlatFee` | DECIMAL(12,2) | Flat fee if applicable | 15000.00 |
| `Existing_RecordKeeper_PerParticipantFee` | DECIMAL(8,2) | Per participant if applicable | NULL |
| `Existing_TPA_FeeType` | STRING | Fee structure type | "flatPlusPerHead" |
| `Existing_TPA_BasisPoints` | DECIMAL(8,2) | Basis points if applicable | NULL |
| `Existing_TPA_FlatFee` | DECIMAL(12,2) | Flat fee if applicable | 3500.00 |
| `Existing_TPA_PerParticipantFee` | DECIMAL(8,2) | Per participant if applicable | 40.00 |
| `Existing_Audit_FeeType` | STRING | Fee structure type | "flatFee" |
| `Existing_Audit_BasisPoints` | DECIMAL(8,2) | Basis points if applicable | NULL |
| `Existing_Audit_FlatFee` | DECIMAL(12,2) | Flat fee if applicable | 8000.00 |
| `Existing_Audit_PerParticipantFee` | DECIMAL(8,2) | Per participant if applicable | NULL |
| `Existing_InvestmentMenu_FeeType` | STRING | Fee structure type | "basisPoints" |
| `Existing_InvestmentMenu_BasisPoints` | DECIMAL(8,2) | Basis points if applicable | 22.00 |
| `Existing_InvestmentMenu_FlatFee` | DECIMAL(12,2) | Flat fee if applicable | NULL |
| `Existing_InvestmentMenu_PerParticipantFee` | DECIMAL(8,2) | Per participant if applicable | NULL |

#### Existing Plan - Calculated Fees

| Column Name | Type | Description | Example |
|-------------|------|-------------|---------|
| `Existing_Advisor_DollarAmount` | DECIMAL(12,2) | Calculated advisor fee ($) | 112500.00 |
| `Existing_Advisor_Percentage` | DECIMAL(8,4) | Advisor fee as % of AUM | 0.4500 |
| `Existing_RecordKeeper_DollarAmount` | DECIMAL(12,2) | Calculated RK fee ($) | 15000.00 |
| `Existing_RecordKeeper_Percentage` | DECIMAL(8,4) | RK fee as % of AUM | 0.0600 |
| `Existing_TPA_DollarAmount` | DECIMAL(12,2) | Calculated TPA fee ($) | 17500.00 |
| `Existing_TPA_Percentage` | DECIMAL(8,4) | TPA fee as % of AUM | 0.0700 |
| `Existing_Audit_DollarAmount` | DECIMAL(12,2) | Calculated audit fee ($) | 8000.00 |
| `Existing_Audit_Percentage` | DECIMAL(8,4) | Audit fee as % of AUM | 0.0320 |
| `Existing_InvestmentMenu_DollarAmount` | DECIMAL(12,2) | Calculated inv menu fee ($) | 55000.00 |
| `Existing_InvestmentMenu_Percentage` | DECIMAL(8,4) | Inv menu fee as % of AUM | 0.2200 |
| `Existing_Total_DollarAmount` | DECIMAL(12,2) | Total calculated fees ($) | 208000.00 |
| `Existing_Total_Percentage` | DECIMAL(8,4) | Total fees as % of AUM | 0.8320 |

#### Existing Plan - Benchmark Comparisons

| Column Name | Type | Description | Example |
|-------------|------|-------------|---------|
| `Benchmark_Advisor_P25` | DECIMAL(8,4) | 25th percentile (decimal) | 0.0035 |
| `Benchmark_Advisor_P50` | DECIMAL(8,4) | 50th percentile (decimal) | 0.0040 |
| `Benchmark_Advisor_P75` | DECIMAL(8,4) | 75th percentile (decimal) | 0.0050 |
| `Benchmark_RecordKeeper_P25` | DECIMAL(8,4) | 25th percentile (decimal) | 0.0015 |
| `Benchmark_RecordKeeper_P50` | DECIMAL(8,4) | 50th percentile (decimal) | 0.0020 |
| `Benchmark_RecordKeeper_P75` | DECIMAL(8,4) | 75th percentile (decimal) | 0.0025 |
| `Benchmark_TPA_P25` | DECIMAL(8,4) | 25th percentile (decimal) | 0.0005 |
| `Benchmark_TPA_P50` | DECIMAL(8,4) | 50th percentile (decimal) | 0.0007 |
| `Benchmark_TPA_P75` | DECIMAL(8,4) | 75th percentile (decimal) | 0.0010 |
| `Benchmark_Audit_P25` | DECIMAL(8,4) | 25th percentile (decimal) | 0.0002 |
| `Benchmark_Audit_P50` | DECIMAL(8,4) | 50th percentile (decimal) | 0.0003 |
| `Benchmark_Audit_P75` | DECIMAL(8,4) | 75th percentile (decimal) | 0.0004 |
| `Benchmark_InvestmentMenu_P25` | DECIMAL(8,4) | 25th percentile (decimal) | 0.0015 |
| `Benchmark_InvestmentMenu_P50` | DECIMAL(8,4) | 50th percentile (decimal) | 0.0020 |
| `Benchmark_InvestmentMenu_P75` | DECIMAL(8,4) | 75th percentile (decimal) | 0.0025 |
| `Benchmark_Total_P25` | DECIMAL(8,4) | 25th percentile (decimal) | 0.0072 |
| `Benchmark_Total_P50` | DECIMAL(8,4) | 50th percentile (decimal) | 0.0090 |
| `Benchmark_Total_P75` | DECIMAL(8,4) | 75th percentile (decimal) | 0.0110 |

#### Existing Plan - Service Selection (Boolean columns)

**Advisor Services (8 columns)**:
- `Existing_Svc_Advisor_InvestmentMenuSelection` BOOLEAN
- `Existing_Svc_Advisor_FiduciarySupport321` BOOLEAN
- `Existing_Svc_Advisor_ComplianceAssistance` BOOLEAN
- `Existing_Svc_Advisor_PlanDesignConsulting` BOOLEAN
- `Existing_Svc_Advisor_ParticipantEducation` BOOLEAN
- `Existing_Svc_Advisor_QuarterlyReviews` BOOLEAN
- `Existing_Svc_Advisor_FiduciarySupport338` BOOLEAN
- `Existing_Svc_Advisor_CustomReporting` BOOLEAN

**Recordkeeper Services (10 columns)**:
- `Existing_Svc_RK_ParticipantWebsite` BOOLEAN
- `Existing_Svc_RK_CallCenterSupport` BOOLEAN
- `Existing_Svc_RK_OnlineEnrollment` BOOLEAN
- `Existing_Svc_RK_MobileApp` BOOLEAN
- `Existing_Svc_RK_LoanAdministration` BOOLEAN
- `Existing_Svc_RK_DailyValuation` BOOLEAN
- `Existing_Svc_RK_ParticipantStatements` BOOLEAN
- `Existing_Svc_RK_PayrollIntegration` BOOLEAN
- `Existing_Svc_RK_AutoEnrollment` BOOLEAN
- `Existing_Svc_RK_DistributionProcessing` BOOLEAN

**TPA Services (8 columns)**:
- `Existing_Svc_TPA_Form5500Preparation` BOOLEAN
- `Existing_Svc_TPA_DiscriminationTesting` BOOLEAN
- `Existing_Svc_TPA_ComplianceTesting` BOOLEAN
- `Existing_Svc_TPA_PlanDocumentUpdates` BOOLEAN
- `Existing_Svc_TPA_GovernmentFilings` BOOLEAN
- `Existing_Svc_TPA_ParticipantNotices` BOOLEAN
- `Existing_Svc_TPA_AmendmentServices` BOOLEAN
- `Existing_Svc_TPA_NoticePreparation` BOOLEAN

**Audit Services (5 columns)**:
- `Existing_Svc_Audit_AnnualAudit` BOOLEAN
- `Existing_Svc_Audit_FullScopeAudit` BOOLEAN
- `Existing_Svc_Audit_LimitedScopeAudit` BOOLEAN
- `Existing_Svc_Audit_BiannualAudit` BOOLEAN
- `Existing_Svc_Audit_TriannualAudit` BOOLEAN

#### Existing Plan - Service Scores

| Column Name | Type | Description | Example |
|-------------|------|-------------|---------|
| `Existing_ServiceScore_Overall` | INTEGER | Overall service value score (0-100) | 68 |
| `Existing_ServiceScore_Advisor` | INTEGER | Advisor service score (0-100) | 75 |
| `Existing_ServiceScore_RecordKeeper` | INTEGER | RK service score (0-100) | 70 |
| `Existing_ServiceScore_TPA` | INTEGER | TPA service score (0-100) | 60 |
| `Existing_ServiceScore_Audit` | INTEGER | Audit service score (0-100) | 67 |
| `Existing_FeeCompetitivenessScore` | INTEGER | Fee competitiveness (0-100, inverted) | 42 |

#### Proposed Plan - Fee Inputs

*Repeat same structure as Existing Plan but with `Proposed_` prefix*
- `Proposed_Advisor_FeeType`, `Proposed_Advisor_BasisPoints`, etc.
- All 20 fee input columns

#### Proposed Plan - Calculated Fees

*Repeat same structure as Existing Plan but with `Proposed_` prefix*
- `Proposed_Advisor_DollarAmount`, `Proposed_Advisor_Percentage`, etc.
- All 12 calculated fee columns

#### Proposed Plan - Service Selection

*Repeat same structure as Existing Plan but with `Proposed_` prefix*
- All 31 service boolean columns

#### Proposed Plan - Service Scores

| Column Name | Type | Description | Example |
|-------------|------|-------------|---------|
| `Proposed_ServiceScore_Overall` | INTEGER | Overall service value score (0-100) | 73 |
| `Proposed_ServiceScore_Advisor` | INTEGER | Advisor service score (0-100) | 80 |
| `Proposed_ServiceScore_RecordKeeper` | INTEGER | RK service score (0-100) | 75 |
| `Proposed_ServiceScore_TPA` | INTEGER | TPA service score (0-100) | 65 |
| `Proposed_ServiceScore_Audit` | INTEGER | Audit service score (0-100) | 67 |
| `Proposed_FeeCompetitivenessScore` | INTEGER | Fee competitiveness (0-100, inverted) | 58 |

#### Comparison & Analysis

| Column Name | Type | Description | Example |
|-------------|------|-------------|---------|
| `HasProposedPlan` | BOOLEAN | Whether comparison was done | TRUE |
| `TotalSavingsDollars` | DECIMAL(12,2) | Existing - Proposed total fees | 15000.00 |
| `TotalSavingsPercentage` | DECIMAL(8,4) | Percentage point difference | 0.0600 |
| `ServiceScoreDelta` | INTEGER | Proposed - Existing score | 5 |
| `RecommendProposedPlan` | BOOLEAN | AI recommendation to proceed | TRUE |

#### AI-Generated Content

| Column Name | Type | Description | Example |
|-------------|------|-------------|---------|
| `AI_ExecutiveSummary` | TEXT | Full AI-generated summary (Markdown) | "**BENCHMARKING OVERVIEW**: This retirement plan..." |
| `AI_GeneratedDate` | DATETIME | When AI summary was generated | "2024-12-08 14:32:15" |
| `AI_Model` | STRING | Which AI model was used | "gpt-4o-2024-08-06" |

#### Export & Metadata

| Column Name | Type | Description | Example |
|-------------|------|-------------|---------|
| `PowerPointExported` | BOOLEAN | Whether PPT was generated | TRUE |
| `PowerPointExportDate` | DATETIME | When PPT was exported | "2024-12-08 14:35:00" |
| `ApplicationVersion` | STRING | Version of benchmarking app | "2.0.1" |
| `DataSource` | STRING | Where benchmark data came from | "NAPA 2024 Q3" |

---

## Option 2: Normalized Multi-Table Schema (Recommended for Scalability)

**Pros**:
- More flexible for adding services
- Reduces data duplication
- Better for complex queries

**Cons**:
- More complex to implement (multiple API calls)
- Requires joins for reporting
- More tables to maintain

### Table 1: `benchmarking_analyses`

Primary table storing one row per analysis.

| Column Name | Type | Description |
|-------------|------|-------------|
| `AnalysisID` | STRING (PK) | Unique identifier |
| `AnalysisDate` | DATETIME | When analysis was run |
| `ClientID` | STRING | Client identifier |
| `ClientName` | STRING | Client company name |
| `SalesforceAccountID` | STRING | Salesforce ID |
| `D365AccountID` | STRING | Dynamics 365 ID |
| `ConsultantName` | STRING | Consultant name |
| `ConsultantEmail` | STRING | Consultant email |
| `AssetsUnderManagement` | DECIMAL(15,2) | Plan AUM |
| `ParticipantCount` | INTEGER | Number of participants |
| `AverageBalance` | DECIMAL(15,2) | Avg account balance |
| `AUMBenchmarkCategory` | STRING | AUM bucket |
| `BalanceBenchmarkCategory` | STRING | Balance bucket |
| `PlanSizeCategory` | STRING | Small/Mid/Large |
| `FeeType` | STRING | Bundled/unbundled |
| `HasProposedPlan` | BOOLEAN | Comparison mode |
| `TotalSavingsDollars` | DECIMAL(12,2) | Fee savings |
| `TotalSavingsPercentage` | DECIMAL(8,4) | % savings |
| `AI_ExecutiveSummary` | TEXT | AI summary |
| `AI_GeneratedDate` | DATETIME | AI generation time |
| `PowerPointExported` | BOOLEAN | PPT export flag |
| `ApplicationVersion` | STRING | App version |

### Table 2: `plan_fees`

Stores fee data for both existing and proposed plans.

| Column Name | Type | Description |
|-------------|------|-------------|
| `FeeID` | STRING (PK) | Unique identifier |
| `AnalysisID` | STRING (FK) | Links to analyses table |
| `PlanType` | STRING | "existing" or "proposed" |
| `FeeCategory` | STRING | "advisor", "recordKeeper", "tpa", "audit", "investmentMenu" |
| `FeeStructureType` | STRING | "basisPoints", "flatFee", etc. |
| `BasisPoints` | DECIMAL(8,2) | If applicable |
| `FlatFee` | DECIMAL(12,2) | If applicable |
| `PerParticipantFee` | DECIMAL(8,2) | If applicable |
| `CalculatedDollarAmount` | DECIMAL(12,2) | Calculated fee ($) |
| `CalculatedPercentage` | DECIMAL(8,4) | Fee as % of AUM |
| `BenchmarkP25` | DECIMAL(8,4) | 25th percentile |
| `BenchmarkP50` | DECIMAL(8,4) | 50th percentile |
| `BenchmarkP75` | DECIMAL(8,4) | 75th percentile |

**Example Rows**:
```
FeeID | AnalysisID | PlanType | FeeCategory | FeeStructureType | BasisPoints | CalculatedDollarAmount | CalculatedPercentage
F-001 | A-001      | existing | advisor     | basisPoints      | 45.00      | 112500.00              | 0.4500
F-002 | A-001      | existing | recordKeeper| flatFee          | NULL       | 15000.00               | 0.0600
F-003 | A-001      | proposed | advisor     | basisPoints      | 40.00      | 100000.00              | 0.4000
```

### Table 3: `plan_services`

Stores service selections for both existing and proposed plans.

| Column Name | Type | Description |
|-------------|------|-------------|
| `ServiceID` | STRING (PK) | Unique identifier |
| `AnalysisID` | STRING (FK) | Links to analyses table |
| `PlanType` | STRING | "existing" or "proposed" |
| `ProviderCategory` | STRING | "advisor", "recordKeeper", "tpa", "audit" |
| `ServiceKey` | STRING | Service identifier (e.g., "investmentMenuSelection") |
| `ServiceName` | STRING | Human-readable name |
| `ServiceTier` | STRING | "essential", "standard", "premium" |
| `IsIncluded` | BOOLEAN | Whether service is included |

**Example Rows**:
```
ServiceID | AnalysisID | PlanType | ProviderCategory | ServiceKey                | ServiceTier | IsIncluded
S-001     | A-001      | existing | advisor          | investmentMenuSelection   | essential   | TRUE
S-002     | A-001      | existing | advisor          | fiduciarySupport321       | essential   | TRUE
S-003     | A-001      | existing | advisor          | customReporting           | premium     | FALSE
S-004     | A-001      | proposed | advisor          | customReporting           | premium     | TRUE
```

### Table 4: `plan_scores`

Stores calculated scores for both plans.

| Column Name | Type | Description |
|-------------|------|-------------|
| `ScoreID` | STRING (PK) | Unique identifier |
| `AnalysisID` | STRING (FK) | Links to analyses table |
| `PlanType` | STRING | "existing" or "proposed" |
| `ProviderCategory` | STRING | "advisor", "recordKeeper", "tpa", "audit", "overall" |
| `ServiceScore` | INTEGER | Service value score (0-100) |
| `FeeCompetitivenessScore` | INTEGER | Fee competitiveness (0-100) |

**Example Rows**:
```
ScoreID | AnalysisID | PlanType | ProviderCategory | ServiceScore | FeeCompetitivenessScore
SC-001  | A-001      | existing | overall          | 68           | 42
SC-002  | A-001      | existing | advisor          | 75           | NULL
SC-003  | A-001      | proposed | overall          | 73           | 58
```

---

## Data Flow Architecture

### Saving Analysis Results to Domo

**Step 1: User Completes Analysis**
- User fills out form, selects services, generates report

**Step 2: Export to Domo Button Clicked**
- Frontend calls `/api/domo/save-analysis` endpoint

**Step 3: Backend Processes Data**
```typescript
// app/api/domo/save-analysis/route.ts
export async function POST(request: Request) {
  const data = await request.json();

  // 1. Authenticate with Domo API
  const token = await getDomoAccessToken();

  // 2. Transform application data to Domo schema
  const domoRecord = transformToDomoSchema(data);

  // 3. Append to Domo dataset
  await appendToDomoDataset(token, DATASET_ID, domoRecord);

  return NextResponse.json({ success: true });
}
```

**Step 4: Data Transformation**
```typescript
function transformToDomoSchema(data: ComparisonData) {
  return {
    // Denormalized approach (Option 1)
    ResultID: generateResultID(),
    AnalysisDate: new Date().toISOString(),
    ClientID: data.clientID,
    ClientName: data.clientName,

    // Plan characteristics
    AssetsUnderManagement: data.existing.assetsUnderManagement,
    ParticipantCount: data.existing.participantCount,

    // Existing fees
    Existing_Advisor_FeeType: data.existing.fees.advisor.type,
    Existing_Advisor_BasisPoints: data.existing.fees.advisor.basisPoints,
    // ... all other fee fields

    // Existing services (31 boolean columns)
    Existing_Svc_Advisor_InvestmentMenuSelection: data.existing.services.advisor.investmentMenuSelection,
    Existing_Svc_Advisor_FiduciarySupport321: data.existing.services.advisor.fiduciarySupport321,
    // ... all other service fields

    // Calculated scores
    Existing_ServiceScore_Overall: calculateServiceValueScore(data.existing.services, data.existing.assetsUnderManagement).score,

    // AI summary
    AI_ExecutiveSummary: data.aiSummary,

    // Metadata
    ApplicationVersion: '2.0.1',
    DataSource: 'NAPA 2024 Q3'
  };
}
```

---

## API Implementation

### Create Domo API Module

**File**: `lib/domoDatasetApi.ts`

```typescript
import axios from 'axios';

interface DomoAuthResponse {
  access_token: string;
  expires_in: number;
}

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

/**
 * Get Domo OAuth access token (cached)
 */
export async function getDomoAccessToken(): Promise<string> {
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
  tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 min buffer

  return cachedToken;
}

/**
 * Append data to Domo dataset
 */
export async function appendToDomoDataset(
  token: string,
  datasetId: string,
  data: Record<string, any>[]
): Promise<void> {
  await axios.post(
    `${process.env.DOMO_API_HOST}/v1/datasets/${datasetId}/data`,
    {
      rows: data
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Create new Domo dataset with schema
 */
export async function createDomoDataset(
  token: string,
  name: string,
  description: string,
  schema: { name: string; type: string }[]
): Promise<string> {
  const response = await axios.post(
    `${process.env.DOMO_API_HOST}/v1/datasets`,
    {
      name,
      description,
      schema: {
        columns: schema
      }
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data.id;
}
```

### Create Save Analysis API Route

**File**: `app/api/domo/save-analysis/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getDomoAccessToken, appendToDomoDataset } from '@/lib/domoDatasetApi';
import { calculateAllFees } from '@/lib/feeCalculations';
import { calculateServiceValueScore } from '@/lib/serviceBaselines';
import type { ComparisonData } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const data: ComparisonData & {
      clientID?: string;
      clientName?: string;
      consultantName?: string;
      consultantEmail?: string;
      aiSummary?: string;
    } = await request.json();

    // Get Domo access token
    const token = await getDomoAccessToken();

    // Transform to Domo schema
    const domoRecord = transformToDomoSchema(data);

    // Append to dataset
    await appendToDomoDataset(
      token,
      process.env.DOMO_RESULTS_DATASET_ID!,
      [domoRecord]
    );

    return NextResponse.json({
      success: true,
      resultId: domoRecord.ResultID
    });
  } catch (error) {
    console.error('Error saving to Domo:', error);
    return NextResponse.json(
      { error: 'Failed to save analysis to Domo' },
      { status: 500 }
    );
  }
}

function transformToDomoSchema(data: any) {
  const resultId = `RES-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const analysisDate = new Date().toISOString();

  // Calculate fees and scores
  const existingFees = calculateAllFees(
    data.existing.fees,
    data.existing.assetsUnderManagement,
    data.existing.participantCount
  );
  const existingServiceScore = calculateServiceValueScore(
    data.existing.services,
    data.existing.assetsUnderManagement
  );

  const proposedFees = data.proposed
    ? calculateAllFees(
        data.proposed.fees,
        data.proposed.assetsUnderManagement,
        data.proposed.participantCount
      )
    : null;
  const proposedServiceScore = data.proposed
    ? calculateServiceValueScore(
        data.proposed.services,
        data.proposed.assetsUnderManagement
      )
    : null;

  return {
    // Metadata
    ResultID: resultId,
    AnalysisDate: analysisDate,
    ClientID: data.clientID || 'UNKNOWN',
    ClientName: data.clientName || 'Unknown Client',
    SalesforceAccountID: data.salesforceAccountID || null,
    D365AccountID: data.d365AccountID || null,
    ConsultantName: data.consultantName || null,
    ConsultantEmail: data.consultantEmail || null,

    // Plan characteristics
    AssetsUnderManagement: data.existing.assetsUnderManagement,
    ParticipantCount: data.existing.participantCount,
    AverageBalance: data.existing.assetsUnderManagement / data.existing.participantCount,
    AUMBenchmarkCategory: data.existing.benchmarkCategory,
    BalanceBenchmarkCategory: data.existing.balanceBenchmarkCategory,
    PlanSizeCategory: data.existing.assetsUnderManagement < 5_000_000 ? 'under5M' :
                      data.existing.assetsUnderManagement < 50_000_000 ? '5M-50M' : 'over50M',
    FeeType: data.existing.feeType,

    // Existing plan fees (inputs)
    Existing_Advisor_FeeType: data.existing.fees.advisor.type,
    Existing_Advisor_BasisPoints: data.existing.fees.advisor.basisPoints || null,
    Existing_Advisor_FlatFee: data.existing.fees.advisor.flatFee || null,
    Existing_Advisor_PerParticipantFee: data.existing.fees.advisor.perParticipantFee || null,

    // ... (repeat for all fee categories)

    // Existing plan fees (calculated)
    Existing_Advisor_DollarAmount: existingFees.advisor.dollarAmount,
    Existing_Advisor_Percentage: existingFees.advisor.percentage,
    Existing_Total_DollarAmount: existingFees.total.dollarAmount,
    Existing_Total_Percentage: existingFees.total.percentage,

    // Existing plan services
    Existing_Svc_Advisor_InvestmentMenuSelection: data.existing.services.advisor?.investmentMenuSelection || false,
    Existing_Svc_Advisor_FiduciarySupport321: data.existing.services.advisor?.fiduciarySupport321 || false,
    // ... (repeat for all 31 services)

    // Existing plan scores
    Existing_ServiceScore_Overall: existingServiceScore.score,
    Existing_ServiceScore_Advisor: existingServiceScore.breakdown.advisor,
    Existing_ServiceScore_RecordKeeper: existingServiceScore.breakdown.recordKeeper,
    Existing_ServiceScore_TPA: existingServiceScore.breakdown.tpa,
    Existing_ServiceScore_Audit: existingServiceScore.breakdown.audit,
    Existing_FeeCompetitivenessScore: data.existingFeeCompetitivenessScore || null,

    // Proposed plan (all fields nullable)
    HasProposedPlan: !!data.proposed,
    Proposed_Advisor_FeeType: data.proposed?.fees.advisor.type || null,
    // ... (repeat all proposed fields)

    // Comparison
    TotalSavingsDollars: proposedFees
      ? existingFees.total.dollarAmount - proposedFees.total.dollarAmount
      : null,
    TotalSavingsPercentage: proposedFees
      ? existingFees.total.percentage - proposedFees.total.percentage
      : null,
    ServiceScoreDelta: proposedServiceScore
      ? proposedServiceScore.score - existingServiceScore.score
      : null,

    // AI content
    AI_ExecutiveSummary: data.aiSummary || null,
    AI_GeneratedDate: data.aiSummary ? new Date().toISOString() : null,
    AI_Model: data.aiSummary ? 'gpt-4o-2024-08-06' : null,

    // Metadata
    PowerPointExported: data.powerPointExported || false,
    PowerPointExportDate: data.powerPointExportDate || null,
    ApplicationVersion: '2.0.1',
    DataSource: 'NAPA 2024 Q3',

    // Benchmark data (from original benchmark lookup)
    // ... (include benchmark percentiles for each fee type)
  };
}
```

---

## Environment Variables

Add to `.env.local`:

```env
# Domo API Configuration
DOMO_CLIENT_ID=your_client_id_here
DOMO_CLIENT_SECRET=your_client_secret_here
DOMO_API_HOST=https://api.domo.com
DOMO_RESULTS_DATASET_ID=9628ad97-d8c1-45cb-b9e4-96005f40c457
```

---

## Migration Strategy

### Option A: Create New Dataset (Recommended)

1. **Create new dataset** with V2 schema in Domo
2. **Run both versions** in parallel for 30-60 days
3. **Migrate historical data** using Domo ETL/SQL dataflows
4. **Sunset V1 dataset** after validation

### Option B: In-Place Migration

1. **Add new columns** to existing dataset (all nullable)
2. **Update API** to write to new columns
3. **Backfill** NULL values where possible
4. **Deprecate** old columns after transition period

---

## Recommended Approach

**I recommend Option 1 (Denormalized Single Table) with Migration Strategy A (New Dataset)** because:

1. **Simplicity**: Single API call, easier to implement
2. **Reporting**: Easier for business users to query
3. **Performance**: No joins required for common queries
4. **Clean Start**: Allows you to fix any V1 schema issues
5. **Parallel Operation**: Can run both systems during transition

**Estimated Column Count**: ~180 columns (manageable for Domo)

---

## Next Steps

1. **Review schema** with stakeholders
2. **Create new Domo dataset** using provided schema
3. **Implement API endpoint** (`app/api/domo/save-analysis/route.ts`)
4. **Add "Save to Domo" button** to results page
5. **Test with sample data**
6. **Create Domo cards/dashboards** for reporting
7. **Document for end users**

---

## Sample Domo Cards to Build

Once data is flowing, create these visualizations:

1. **Analysis Volume by Consultant** - Bar chart
2. **Average Fee by Plan Size** - Line chart over time
3. **Service Adoption Rate** - % of plans with each service
4. **Savings Opportunities** - Plans with high fees + low service scores
5. **AI Recommendation Acceptance** - % where proposed plan was implemented
6. **Service Score Distribution** - Histogram by plan size category

---

*Last Updated: 2024-12-08*
*Version: 2.0*
