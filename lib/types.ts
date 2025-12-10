// Fee structure types
export type FeeStructureType = 'basisPoints' | 'flatFee' | 'flatPlusPerHead' | 'perParticipant';
export type PlanFeeType = 'bundled' | 'unbundled';

export interface FeeStructure {
  type: FeeStructureType;
  basisPoints?: number; // For basis points (e.g., 0.50 = 50 basis points = 0.50%)
  flatFee?: number; // For flat dollar fees
  perHeadFee?: number; // For per participant fees
}

export interface FeeInput {
  advisor: FeeStructure;
  recordKeeper: FeeStructure;
  tpa: FeeStructure;
  investmentMenu: FeeStructure;
}

// Service options for each provider type
export interface AdvisorServices {
  planDesignConsulting?: boolean;
  investmentMenuSelection?: boolean;
  participantEducation?: boolean;
  fiduciarySupport321?: boolean;
  fiduciarySupport338?: boolean;
  complianceAssistance?: boolean;
  quarterlyReviews?: boolean;
  customReporting?: boolean;
}

export interface RecordkeeperServices {
  participantWebsite?: boolean;
  mobileApp?: boolean;
  callCenterSupport?: boolean;
  onlineEnrollment?: boolean;
  loanAdministration?: boolean;
  distributionProcessing?: boolean;
  payrollIntegration?: boolean;
  dailyValuation?: boolean;
  autoEnrollment?: boolean;
  participantStatements?: boolean;
}

export interface TPAServices {
  form5500Preparation?: boolean;
  discriminationTesting?: boolean;
  planDocumentUpdates?: boolean;
  amendmentServices?: boolean;
  noticePrparation?: boolean;
  complianceTesting?: boolean;
  governmentFilings?: boolean;
  participantNotices?: boolean;
}

export interface AuditServices {
  fullScopeAudit?: boolean;
  limitedScopeAudit?: boolean;
  annualAudit?: boolean;
  biannualAudit?: boolean;
  triannualAudit?: boolean;
}

export interface ServiceOptions {
  advisor?: AdvisorServices;
  recordKeeper?: RecordkeeperServices;
  tpa?: TPAServices;
  audit?: AuditServices;
}

// Benchmark data from CSV
export interface BenchmarkData {
  clientID: string;
  salesforceAccountID: string;
  d365AccountID: string;
  reportID: string;
  creationDate: string;
  clientName: string;
  sic: string;
  benchmarkSource: string;
  type: string; // e.g., "Advisor Fee", "Record Keeper Fee", etc.
  bmAssets: string; // e.g., "$0-250k", "$1-3m"
  bmAvgBalance: string;
  retirementFee25th: number;
  retirementFee50th: number;
  retirementFee75th: number;
  assets: number;
  avgBalance: number;
  recordKeeperFeePrcnt: number;
  advisorFeePrcnt: number;
  investmentManagerFeePrcnt: number;
  tpaFeePrcnt: number;
  totalPlanFeePrcnt: number;
  recordKeeperFeeDollars: number;
  advisorFeeDollars: number;
  investmentManagerFeeDollars: number;
  tpaFeeDollars: number;
  totalPlanFeeDollars: number;
}

// AUM benchmark categories (must match exactly with BMAssets values in Domo dataset)
export type AUMBenchmarkCategory =
  | '$0-250k'
  | '$250-500k'
  | '$500k-1m'
  | '$1-3m'
  | '$3-5m'
  | '$5-10m'
  | '$10-20m'
  | '$20-30m'
  | '$30-50m'
  | '$50-100m'
  | '$100-250m'
  | '> $250m'
  | 'All';

// Balance bucket categories (must match exactly with BM Avg Balance values in Domo dataset)
export type BalanceBenchmarkCategory =
  | '$0-25k'
  | '$25-50k'
  | '$50-75k'
  | '$75-100k'
  | '> $100k'
  | 'All';

// Plan data
export interface PlanData {
  assetsUnderManagement?: number;
  participantCount?: number;
  benchmarkCategory?: AUMBenchmarkCategory;
  balanceBenchmarkCategory?: BalanceBenchmarkCategory;
  feeType?: PlanFeeType;
  fees: FeeInput;
  services?: ServiceOptions;
}

export interface ComparisonData {
  existing?: PlanData;
  proposed?: PlanData;
}

// Calculated fee result
export interface CalculatedFee {
  feeType: string;
  dollarAmount: number;
  percentage: number;
}

export interface CalculatedFees {
  advisor: CalculatedFee;
  recordKeeper: CalculatedFee;
  tpa: CalculatedFee;
  investmentMenu: CalculatedFee;
  total: CalculatedFee;
}

// Benchmark percentiles for a specific fee type
export interface BenchmarkPercentiles {
  p25: number;
  p50: number;
  p75: number;
}

// Complete benchmark comparison
export interface BenchmarkComparison {
  advisor: BenchmarkPercentiles;
  recordKeeper: BenchmarkPercentiles;
  tpa: BenchmarkPercentiles;
  investmentMenu: BenchmarkPercentiles;
  total: BenchmarkPercentiles;
  dataSource?: 'domo' | 'csv';
}

// AI Summary types
export interface AISummaryRequest {
  planData: PlanData;
  calculatedFees: CalculatedFees;
  benchmarks: BenchmarkComparison;
  proposedPlanData?: PlanData;
  proposedCalculatedFees?: CalculatedFees;
  aumBucket: string;
}

export interface AISummaryResponse {
  summary: string;
  error?: string;
}
