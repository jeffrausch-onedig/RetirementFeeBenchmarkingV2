# Calculations and Logic Documentation

This document provides comprehensive technical documentation for all calculation methods, scoring algorithms, and business logic used in the Retirement Plan Fee Benchmarking Application.

---

## Table of Contents

1. [Fee Calculations](#fee-calculations)
2. [Benchmark Matching](#benchmark-matching)
3. [Fee Competitiveness Scoring](#fee-competitiveness-scoring)
4. [Service Value Scoring](#service-value-scoring)
5. [Service Coverage Calculations](#service-coverage-calculations)
6. [Plan Size Categorization](#plan-size-categorization)
7. [Percentile Positioning](#percentile-positioning)

---

## Fee Calculations

### Overview
All fee calculations are centralized in `lib/feeCalculations.ts` and support four distinct fee structure types.

### Fee Structure Types

#### 1. Basis Points
**Formula**: `AUM × (basis points ÷ 100)`

**Example**:
- AUM: $10,000,000
- Basis Points: 50 (user enters this)
- Calculation: $10,000,000 × (50 ÷ 100) = $10,000,000 × 0.005 = $50,000
- Percentage: 0.50%

**Code Location**: `lib/feeCalculations.ts:46-50`

#### 2. Flat Fee
**Formula**: Fixed dollar amount

**Example**:
- Flat Fee: $12,000
- Calculation: $12,000 (direct amount)
- Percentage: ($12,000 ÷ AUM) × 100

**Code Location**: `lib/feeCalculations.ts:51-53`

#### 3. Flat Plus Per Participant
**Formula**: `Flat Fee + (Per Participant Fee × Participant Count)`

**Example**:
- Flat Fee: $2,500
- Per Participant Fee: $50
- Participant Count: 100
- Calculation: $2,500 + ($50 × 100) = $2,500 + $5,000 = $7,500
- Percentage: ($7,500 ÷ AUM) × 100

**Code Location**: `lib/feeCalculations.ts:54-61`

#### 4. Per Participant Only
**Formula**: `Per Participant Fee × Participant Count`

**Example**:
- Per Participant Fee: $75
- Participant Count: 100
- Calculation: $75 × 100 = $7,500
- Percentage: ($7,500 ÷ AUM) × 100

**Code Location**: `lib/feeCalculations.ts:62-67`

### Total Fee Calculation

The total plan fee is the sum of all component fees:

```typescript
total = advisor + recordKeeper + tpa + audit + investmentMenu
```

**Important**: All percentage values in `CalculatedFees` are stored as actual percentages (e.g., 0.9 for 0.9%), NOT as decimals (0.009).

**Code Location**: `lib/feeCalculations.ts:87-119`

---

## Benchmark Matching

### AUM Bucket Mapping

The application maps a plan's AUM to predefined benchmark categories that must match the CSV data exactly.

**Buckets** (defined in `lib/benchmarkData.ts:69-82`):
- "$0-250k"
- "$250-500k"
- "$500k-1m"
- "$1-3m"
- "$3-5m"
- "$5-10m"
- "$10-20m"
- "$20-30m"
- "$30-50m"
- "$50-100m"
- "$100-250m"
- "$250m+"

**Function**: `getAUMBucket(aum: number): string`

### Average Balance Bucket Mapping

Optional secondary filter for more precise benchmarking.

**Buckets** (defined in `lib/benchmarkData.ts:87-96`):
- "$0-25k"
- "$25-50k"
- "$50-75k"
- "$75-100k"
- "$100k+"

**Function**: `getBalanceBucket(avgBalance: number): string`

### Benchmark Lookup Process

The `findBenchmarkPercentiles` function matches benchmark data using:

1. **Primary Filter**: Fee type (e.g., "Advisor Fee", "Record Keeper Fee", "TPA Fee")
2. **Secondary Filter**: AUM bucket (e.g., "$10-20m")
3. **Tertiary Filter** (optional): Average balance bucket (e.g., "$50-75k")

**Returns**: `{ p25: number, p50: number, p75: number }`

**Data Format**: Benchmark percentiles are stored as **decimals** in the CSV (e.g., 0.0025 = 0.25% = 25 basis points)

**Code Location**: `lib/benchmarkData.ts:117-167`

---

## Fee Competitiveness Scoring

### Purpose

Converts a plan's total fees into a 0-100 competitiveness score based on how they compare to market benchmark percentiles. This is a pure cost metric that does NOT consider service quality.

### Scoring Philosophy

**Inverted Scoring**: Lower fees = higher score (better competitiveness)

### Algorithm

**Location**: `components/charts/ServiceRadarChart.tsx:32-62`

**Function**: `calculateFeePercentileScore(feePercentage: number, benchmarkPercentiles: { p25, p50, p75 }): number`

#### Step 1: Convert Input Format
```typescript
const feeDecimal = feePercentage / 100;
```
Converts fee percentage (e.g., 1.25%) to decimal (0.0125) to match benchmark format.

#### Step 2: Extrapolate p100 (Worst Case)
```typescript
const p100 = p75 + (p75 - p50);
```
Extends the benchmark range beyond the 75th percentile to define a "worst case" scenario.

**Example**:
- p50 = 0.010 (1.0%)
- p75 = 0.012 (1.2%)
- p100 = 0.012 + (0.012 - 0.010) = 0.014 (1.4%)

#### Step 3: Calculate Score Based on Quartile

**Scoring Bands**:

| Fee Range | Score Range | Description |
|-----------|-------------|-------------|
| ≤ p25 | 100 | Top quartile (very competitive) |
| p25 to p50 | 50-100 | Better than median |
| p50 to p75 | 25-50 | Median to below median |
| p75 to p100 | 0-25 | Expensive |
| ≥ p100 | 0 | Very expensive (worst case) |

**Linear Interpolation Formula**:

For fees **between p25 and p50**:
```typescript
score = 50 + 50 * (1 - (feeDecimal - p25) / (p50 - p25))
```

For fees **between p50 and p75**:
```typescript
score = 25 + 25 * (1 - (feeDecimal - p50) / (p75 - p50))
```

For fees **between p75 and p100**:
```typescript
score = 25 * (1 - (feeDecimal - p75) / (p100 - p75))
```

#### Step 4: Clamp to 0-100 Range
```typescript
return Math.min(100, Math.max(0, score));
```

### Worked Example

**Given**:
- Your total fee: 0.9% (0.009 decimal)
- Benchmarks: p25 = 0.8% (0.008), p50 = 1.0% (0.010), p75 = 1.2% (0.012)

**Calculation**:
1. Extrapolate p100: 0.012 + (0.012 - 0.010) = 0.014
2. Fee (0.009) falls between p25 (0.008) and p50 (0.010)
3. Score = 50 + 50 × (1 - (0.009 - 0.008) / (0.010 - 0.008))
4. Score = 50 + 50 × (1 - 0.001 / 0.002)
5. Score = 50 + 50 × (1 - 0.5)
6. Score = 50 + 50 × 0.5
7. **Score = 75**

### Usage in Application

This score appears as the 5th axis on the Service Radar Chart labeled "Total Fee Competitiveness" and is calculated for both existing and proposed plans.

**Important Distinction**: This metric measures **only fee levels**, not value. A high competitiveness score means low fees relative to market, but doesn't consider what services you're receiving. Service coverage is measured separately via the Service Value Score.

**Code References**:
- Calculation: `components/charts/ServiceRadarChart.tsx:32-62`
- Usage: `components/charts/ServiceRadarChart.tsx:65-71, 100-105`

---

## Service Value Scoring

### Purpose

Evaluates service coverage quality with plan size-adjusted weighting to reflect different expectations for small, mid-market, and large plans.

### Service Tier System

Services are categorized into three tiers based on industry standards (DOL ERISA 408(b)(2), NAPA, PLANSPONSOR):

- **Essential (E)**: Core services required for basic plan operation and fiduciary compliance
- **Standard (S)**: Services expected by most plans in the market segment
- **Premium (P)**: Enhanced services that provide additional value

**Tier Definitions**: `lib/serviceBaselines.ts:17-142`

### Plan Size Categories

Plans are categorized by AUM to apply appropriate expectations:

| Category | AUM Range | Label |
|----------|-----------|-------|
| Small Plan | < $5M | 'under5M' |
| Mid-Market Plan | $5M - $50M | '5M-50M' |
| Large Plan | > $50M | 'over50M' |

**Function**: `getPlanSizeCategory(aum: number)` at `lib/serviceBaselines.ts:145-149`

### Tier Weighting by Plan Size

Different plan sizes have different service expectations, reflected in tier weights:

#### Small Plans (< $5M AUM)
- Essential: **5x** weight (heavily emphasized)
- Standard: **1.5x** weight (less important)
- Premium: **0.5x** weight (nearly irrelevant)

**Philosophy**: Small plans should focus on cost-effective essential services.

#### Mid-Market Plans ($5M-$50M AUM)
- Essential: **3x** weight (still most important)
- Standard: **2x** weight (expected)
- Premium: **1x** weight (nice to have)

**Philosophy**: Expected to have comprehensive essential and standard coverage.

#### Large Plans (> $50M AUM)
- Essential: **3x** weight (always critical)
- Standard: **2.5x** weight (very important)
- Premium: **2x** weight (expected for large plans)

**Philosophy**: Should have comprehensive service packages including premium features.

**Code Location**: `lib/serviceBaselines.ts:310-347`

### Score Calculation Algorithm

**Function**: `calculateServiceValueScore(services: ServiceOptions, aum: number)` at `lib/serviceBaselines.ts:293-408`

#### Step 1: Determine Plan Size Category
```typescript
const planSizeCategory = getPlanSizeCategory(aum);
```

#### Step 2: Calculate Provider-Specific Scores

For each provider (Advisor, Recordkeeper, TPA, Audit):

1. **Count services by tier**:
   ```typescript
   const essentialCount = countServicesInTier(services.advisor, advisorServiceBaseline, 'essential');
   const standardCount = countServicesInTier(services.advisor, advisorServiceBaseline, 'standard');
   const premiumCount = countServicesInTier(services.advisor, advisorServiceBaseline, 'premium');
   ```

2. **Get total services by tier**:
   ```typescript
   const totalEssential = getTotalServicesInTier(advisorServiceBaseline, 'essential');
   const totalStandard = getTotalServicesInTier(advisorServiceBaseline, 'standard');
   const totalPremium = getTotalServicesInTier(advisorServiceBaseline, 'premium');
   ```

3. **Apply tier weights based on plan size**:
   ```typescript
   const tierWeights = planSizeExpectations[planSizeCategory].tierWeights;

   const weightedScore =
     (essentialCount / totalEssential) * 100 * tierWeights.essential +
     (standardCount / totalStandard) * 100 * tierWeights.standard +
     (premiumCount / totalPremium) * 100 * tierWeights.premium;
   ```

4. **Normalize to 0-100 scale**:
   ```typescript
   const maxPossibleScore = 100 * (tierWeights.essential + tierWeights.standard + tierWeights.premium);
   const providerScore = Math.round((weightedScore / maxPossibleScore) * 100);
   ```

#### Step 3: Calculate Overall Score

Average the provider-specific scores:
```typescript
const overallScore = Math.round(
  (advisorScore + recordkeeperScore + tpaScore + auditScore) / 4
);
```

### Worked Example: Small Plan

**Scenario**: Small plan (< $5M AUM) with **all 3 essential advisor services** but **no standard or premium services**

**Tier Weights** (Small Plan):
- Essential: 5x
- Standard: 1.5x
- Premium: 0.5x

**Calculation**:
```typescript
// Advisor has 3 essential, 4 standard, 1 premium service available
essentialCoverage = 3/3 = 100%
standardCoverage = 0/4 = 0%
premiumCoverage = 0/1 = 0%

weightedScore = (100 * 5) + (0 * 1.5) + (0 * 0.5) = 500
maxPossibleScore = 100 * (5 + 1.5 + 0.5) = 700
advisorScore = (500 / 700) * 100 = 71.4 ≈ 71
```

**Result**: **71/100** - Excellent for a small plan (covering what matters most)

**Same Services, Mid-Market Plan** ($5M-$50M AUM):
```typescript
// Tier weights: Essential 3x, Standard 2x, Premium 1x
weightedScore = (100 * 3) + (0 * 2) + (0 * 1) = 300
maxPossibleScore = 100 * (3 + 2 + 1) = 600
advisorScore = (300 / 600) * 100 = 50
```

**Result**: **50/100** - Adequate but missing expected standard services

**Same Services, Large Plan** (> $50M AUM):
```typescript
// Tier weights: Essential 3x, Standard 2.5x, Premium 2x
weightedScore = (100 * 3) + (0 * 2.5) + (0 * 2) = 300
maxPossibleScore = 100 * (3 + 2.5 + 2) = 750
advisorScore = (300 / 750) * 100 = 40
```

**Result**: **40/100** - Concerning (large plans need comprehensive coverage)

### Score Interpretation

| Score Range | Interpretation |
|-------------|----------------|
| 80-100 | Comprehensive service coverage |
| 60-79 | Adequate service coverage |
| 40-59 | Limited service coverage |
| 0-39 | Concerning service gaps |

### Service Insights Generation

The scoring function also generates contextual insights:

- Missing essential services warnings
- Plan size expectation mismatches
- Provider-specific coverage gaps

**Code Location**: `lib/serviceBaselines.ts:363-408`

---

## Service Coverage Calculations

### Purpose

Counts and calculates percentage coverage of services by tier for each provider.

### Function

**Location**: `lib/serviceBaselines.ts:152-196`

**Signature**: `calculateServiceCoverage(services, baseline): CoverageResult`

### Algorithm

For each tier (essential, standard, premium):

1. **Count total services in tier**:
   ```typescript
   const totalInTier = Object.entries(baseline)
     .filter(([_, tier]) => tier === 'essential')
     .length;
   ```

2. **Count provided services in tier**:
   ```typescript
   const providedInTier = Object.entries(baseline)
     .filter(([key, tier]) => tier === 'essential' && services[key] === true)
     .length;
   ```

3. **Calculate percentage**:
   ```typescript
   const percentage = totalInTier > 0
     ? Math.round((providedInTier / totalInTier) * 100)
     : 0;
   ```

### Return Structure

```typescript
{
  essential: { provided: number, total: number, percentage: number },
  standard: { provided: number, total: number, percentage: number },
  premium: { provided: number, total: number, percentage: number }
}
```

### Example

**Advisor Services**:
- Essential: 3 total, 2 provided → 67%
- Standard: 4 total, 4 provided → 100%
- Premium: 1 total, 0 provided → 0%

---

## Plan Size Categorization

### Overview

Plans are categorized by AUM to apply size-appropriate service expectations and scoring weights.

### Categories

Defined in `lib/serviceBaselines.ts:136-158`:

```typescript
export const planSizeExpectations: Record<PlanSizeCategory, PlanSizeExpectation> = {
  'under5M': {
    minAdvisorServices: 3,
    minRecordkeeperServices: 5,
    minTPAServices: 3,
    recommendedTiers: ['essential'],
    notes: 'Small plans should focus on essential services for cost-effectiveness.',
    tierWeights: { essential: 5, standard: 1.5, premium: 0.5 }
  },
  '5M-50M': {
    minAdvisorServices: 5,
    minRecordkeeperServices: 6,
    minTPAServices: 5,
    recommendedTiers: ['essential', 'standard'],
    notes: 'Mid-market plans should have comprehensive essential and standard coverage.',
    tierWeights: { essential: 3, standard: 2, premium: 1 }
  },
  'over50M': {
    minAdvisorServices: 6,
    minRecordkeeperServices: 8,
    minTPAServices: 6,
    recommendedTiers: ['essential', 'standard', 'premium'],
    notes: 'Large plans should include premium services for comprehensive coverage.',
    tierWeights: { essential: 3, standard: 2.5, premium: 2 }
  }
};
```

### Function

```typescript
export function getPlanSizeCategory(aum: number): PlanSizeCategory {
  if (aum < 5_000_000) return 'under5M';
  if (aum < 50_000_000) return '5M-50M';
  return 'over50M';
}
```

**Code Location**: `lib/serviceBaselines.ts:145-149`

---

## Percentile Positioning

### Purpose

Determines where a plan's fee falls relative to market benchmarks and provides human-readable descriptions.

### Percentile Ranges

| Fee Position | Percentile Range | Description |
|--------------|------------------|-------------|
| Best quartile | ≤ p25 | "Below the 25th percentile" (top 25% most competitive) |
| Better than median | p25 - p50 | "At the lower end of the market" |
| Median range | p50 - p75 | "Near the market median" |
| Below median | > p75 | "Above the 75th percentile" (expensive) |

### Usage in AI Summary

The AI summary generation uses percentile positioning to describe fee competitiveness:

**Code Location**: `lib/aiSummary.ts:360-406`

Example outputs:
- "The advisor fee of 0.40% positions **below the 25th percentile** (median: 0.50%)"
- "The recordkeeper fee of 0.15% is **at the lower end of the market** (median: 0.20%)"
- "The TPA fee of 0.08% is **near the market median** (median: 0.07%)"
- "The investment menu fee of 0.30% is **above the 75th percentile** (median: 0.18%)"

---

## Integration: Fees + Services = Value

### Philosophy

The application evaluates retirement plan value by combining TWO independent metrics:

1. **Fee Competitiveness Score (0-100)**: How your fees compare to market (cost only)
2. **Service Value Score (0-100)**: How your service coverage compares to plan size expectations (quality only)

### Value Matrix

| Fee Level | Service Level | Assessment |
|-----------|---------------|------------|
| Low fees (high competitiveness) | High service score | **Excellent value** |
| Low fees (high competitiveness) | Low service score | **Cost savings but service gaps** |
| High fees (low competitiveness) | High service score | **Fees justified by services** |
| High fees (low competitiveness) | Low service score | **Major concern - poor value** |

### Implementation

**Service Radar Chart** (`components/charts/ServiceRadarChart.tsx`):
- 4 axes for service coverage (Advisor, Recordkeeper, TPA, Audit)
- 1 axis for total fee competitiveness
- Allows visual comparison of fees vs. services

**AI Executive Summary** (`lib/aiSummary.ts`):
- Evaluates fee positioning WITH service context
- Flags high fees with low services as concerns
- Justifies high fees when services are comprehensive
- Warns about low fees when essential services are missing

**Example Analysis** (from AI summary):
> "The advisor fee of 0.60% is above the 75th percentile at 0.55%, but includes 7 comprehensive services (score: 85/100), which may justify the higher cost through enhanced fiduciary support and participant education."

---

## Data Format Standards

### User Input
- **Basis Points**: Entered as whole numbers (e.g., 50 for 50 bps)
- **Dollar Amounts**: Entered as currency (e.g., 12000 for $12,000)

### Internal Storage
- **Fee Percentages** (CalculatedFees): Stored as percentages (e.g., 0.50 for 0.50%)
- **Benchmark Percentiles** (CSV): Stored as decimals (e.g., 0.005 for 0.5% = 50 bps)

### Display Format
- **Percentages**: Displayed with 2 decimal places (e.g., "0.50%")
- **Dollar Amounts**: Displayed with thousands separators (e.g., "$12,000")
- **Basis Points**: Displayed when relevant (e.g., "50 bps")

### Conversion Reference

| User Input | Internal Storage | Benchmark CSV | Display |
|------------|------------------|---------------|---------|
| 50 bps | 0.50 (percentage) | 0.005 (decimal) | "0.50%" |
| $12,000 flat | 12000 (dollars) | N/A | "$12,000" |
| 1.25% fee | 1.25 (percentage) | 0.0125 (decimal) | "1.25%" |

---

## Testing Examples

### Fee Calculation Test
```typescript
// Input
AUM = $10,000,000
Advisor Fee = 50 bps
Recordkeeper Fee = $15,000 flat
TPA Fee = $3,000 + $40/participant
Participants = 100
Investment Menu = 20 bps

// Calculations
Advisor = $10M × 0.005 = $50,000 (0.50%)
Recordkeeper = $15,000 (0.15%)
TPA = $3,000 + ($40 × 100) = $7,000 (0.07%)
Investment Menu = $10M × 0.002 = $20,000 (0.20%)
Total = $92,000 (0.92%)
```

### Service Score Test (Small Plan)
```typescript
// Input
AUM = $3,000,000 (Small Plan)
Advisor Services: 3 essential, 0 standard, 0 premium
Tier Weights: Essential 5x, Standard 1.5x, Premium 0.5x

// Calculation
Weighted = (100% × 5) + (0% × 1.5) + (0% × 0.5) = 500
Max Possible = 100 × (5 + 1.5 + 0.5) = 700
Score = (500 / 700) × 100 = 71/100

// Interpretation: Excellent for small plan
```

### Fee Competitiveness Test
```typescript
// Input
Your Fee = 0.9% (0.009 decimal)
Benchmarks: p25 = 0.008, p50 = 0.010, p75 = 0.012

// Calculation
p100 = 0.012 + (0.012 - 0.010) = 0.014
Fee falls between p25 and p50
Score = 50 + 50 × (1 - (0.009 - 0.008) / (0.010 - 0.008))
Score = 50 + 50 × 0.5 = 75/100

// Interpretation: Better than median, competitive
```

---

## References

### Key Files

- **Fee Calculations**: `lib/feeCalculations.ts`
- **Benchmark Data**: `lib/benchmarkData.ts`
- **Service Scoring**: `lib/serviceBaselines.ts`
- **Fee Competitiveness**: `components/charts/ServiceRadarChart.tsx`
- **AI Summary Generation**: `lib/aiSummary.ts`

### Industry Standards

- DOL ERISA 408(b)(2) disclosure requirements
- NAPA (National Association of Plan Advisors) best practices
- PLANSPONSOR industry benchmarks

### External Dependencies

- **Papa Parse**: CSV parsing for benchmark data
- **Recharts**: Visualization of fee and service metrics

---

*Last Updated: 2024-12-08*
*Version: 1.0*
