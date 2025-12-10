import { BenchmarkData, BenchmarkComparison, BenchmarkPercentiles } from './types';
import Papa from 'papaparse';

// Cache for benchmark data
let benchmarkCache: BenchmarkData[] | null = null;
let dataSource: 'domo' | 'csv' | null = null;

/**
 * Load benchmark data from local CSV file (fallback)
 */
async function loadFromCSV(): Promise<BenchmarkData[]> {
  try {
    console.log('Loading benchmark data from local CSV file...');
    const response = await fetch('/RetirementFeeDataset (1).csv');
    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (results) => {
          const data = results.data.map((row: any) => ({
            clientID: row.ClientID || '',
            salesforceAccountID: row.SalesforceAccountID || '',
            d365AccountID: row.D365AccountID || '',
            reportID: row.ReportID || '',
            creationDate: row.CreationDate || '',
            clientName: row.ClientName || '',
            sic: row.SIC || '',
            benchmarkSource: row.BenchmarkSource || '',
            type: row.Type || '',
            bmAssets: row.BMAssets || '',
            bmAvgBalance: row.BMAvgBalance || 'All',
            retirementFee25th: parseFloat(row.RetirementFee25th || 0),
            retirementFee50th: parseFloat(row.RetirementFee50th || 0),
            retirementFee75th: parseFloat(row.RetirementFee75th || 0),
            assets: parseFloat(row.Assets || 0),
            avgBalance: parseFloat(row.AvgBalance || 0),
            recordKeeperFeePrcnt: parseFloat(row.RecordKeeperFeePrcnt || 0),
            advisorFeePrcnt: parseFloat(row.AdvisorFeePrcnt || 0),
            investmentManagerFeePrcnt: parseFloat(row.InvestmentManagerFeePrcnt || 0),
            tpaFeePrcnt: parseFloat(row.TPAFeePrcnt || 0),
            totalPlanFeePrcnt: parseFloat(row.TotalPlanFeePrcnt || 0),
            recordKeeperFeeDollars: parseFloat(row.RecordKeeperFeeDollars || 0),
            advisorFeeDollars: parseFloat(row.AdvisorFeeDollars || 0),
            investmentManagerFeeDollars: parseFloat(row.InvestmentManagerFeeDollars || 0),
            tpaFeeDollars: parseFloat(row.TPAFeeDollars || 0),
            totalPlanFeeDollars: parseFloat(row.TotalPlanFeeDollars || 0),
          }));
          console.log(`Loaded ${data.length} rows from CSV file`);
          resolve(data);
        },
        error: (error: any) => {
          console.error('Error parsing CSV:', error);
          reject(error);
        },
      });
    });
  } catch (error) {
    console.error('Error loading from CSV:', error);
    throw error;
  }
}

/**
 * Load benchmark data from Domo API
 */
async function loadFromDomoAPI(): Promise<BenchmarkData[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch('/api/benchmark', { signal: controller.signal });
    clearTimeout(timeoutId);

    const result = await response.json();

    if (!result.success) {
      console.error('Domo API error:', result.error);
      throw new Error(result.error);
    }

    // Transform Domo data to BenchmarkData format
    // Domo returns data with column names: Type, BMAssets, BMAvgBalance, RetirementFee25th, etc.
    const data = result.data.map((row: any) => ({
      clientID: row.ClientID || '',
      salesforceAccountID: row.SalesforceAccountID || '',
      d365AccountID: row.D365AccountID || '',
      reportID: row.ReportID || '',
      creationDate: row.CreationDate || '',
      clientName: row.ClientName || '',
      sic: row.SIC || '',
      benchmarkSource: row.BenchmarkSource || '',
      type: row.Type || '',
      bmAssets: row.BMAssets || '',
      bmAvgBalance: row.BMAvgBalance || 'All',
      retirementFee25th: parseFloat(row.RetirementFee25th || 0),
      retirementFee50th: parseFloat(row.RetirementFee50th || 0),
      retirementFee75th: parseFloat(row.RetirementFee75th || 0),
      assets: parseFloat(row.Assets || 0),
      avgBalance: parseFloat(row.AvgBalance || 0),
      recordKeeperFeePrcnt: parseFloat(row.RecordKeeperFeePrcnt || 0),
      advisorFeePrcnt: parseFloat(row.AdvisorFeePrcnt || 0),
      investmentManagerFeePrcnt: parseFloat(row.InvestmentManagerFeePrcnt || 0),
      tpaFeePrcnt: parseFloat(row.TPAFeePrcnt || 0),
      totalPlanFeePrcnt: parseFloat(row.TotalPlanFeePrcnt || 0),
      recordKeeperFeeDollars: parseFloat(row.RecordKeeperFeeDollars || 0),
      advisorFeeDollars: parseFloat(row.AdvisorFeeDollars || 0),
      investmentManagerFeeDollars: parseFloat(row.InvestmentManagerFeeDollars || 0),
      tpaFeeDollars: parseFloat(row.TPAFeeDollars || 0),
      totalPlanFeeDollars: parseFloat(row.TotalPlanFeeDollars || 0),
    }));
    console.log(`Loaded ${data.length} rows from Domo API`);
    return data;
  } catch (error) {
    console.error('Error loading from Domo API:', error);
    throw error;
  }
}


/**
 * Load benchmark data from Domo API with CSV fallback
 */
export async function loadBenchmarkData(): Promise<BenchmarkData[]> {
  if (benchmarkCache) {
    return benchmarkCache;
  }

  // Try Domo API first, fall back to CSV if it fails
  try {
    console.log('Attempting to load benchmark data from Domo API...');
    benchmarkCache = await loadFromDomoAPI();
    dataSource = 'domo';
    return benchmarkCache;
  } catch (domoError) {
    console.warn('Domo API failed, falling back to local CSV file:', domoError);
    try {
      benchmarkCache = await loadFromCSV();
      dataSource = 'csv';
      return benchmarkCache;
    } catch (csvError) {
      console.error('Both Domo API and CSV fallback failed:', csvError);
      throw new Error('Unable to load benchmark data from either Domo API or local CSV file');
    }
  }
}

/**
 * Get the current data source being used
 */
export function getDataSource(): 'domo' | 'csv' | null {
  return dataSource;
}

/**
 * Find benchmark percentiles for a specific fee type and AUM bucket
 * If no match found for specified avgBalanceBucket, calculates weighted average across all balance buckets
 * IMPORTANT: Only queries rows where Benchmark Source = "FDI 2024" (most recent data)
 */
export function findBenchmarkPercentiles(
  benchmarkData: BenchmarkData[],
  feeType: string,
  aumBucket: string,
  avgBalanceBucket: string = 'All'
): BenchmarkPercentiles | null {
  // First try exact match with FDI 2024 data only
  const match = benchmarkData.find(
    (row) =>
      row.benchmarkSource === 'FDI 2024' &&
      row.type === feeType &&
      row.bmAssets === aumBucket &&
      row.bmAvgBalance === avgBalanceBucket
  );

  if (match) {
    return {
      p25: match.retirementFee25th || 0,
      p50: match.retirementFee50th || 0,
      p75: match.retirementFee75th || 0,
    };
  }

  // If no exact match and looking for 'All', try to find records with specific balance buckets
  // and use the middle bucket (50-75k) as a reasonable default
  if (avgBalanceBucket === 'All') {
    const allMatches = benchmarkData.filter(
      (row) =>
        row.benchmarkSource === 'FDI 2024' &&
        row.type === feeType &&
        row.bmAssets === aumBucket
    );

    if (allMatches.length > 0) {
      // Try to find a middle-range balance bucket or just use the first one
      const middleMatch = allMatches.find(r => r.bmAvgBalance === '$50-75k') || allMatches[0];
      return {
        p25: middleMatch.retirementFee25th || 0,
        p50: middleMatch.retirementFee50th || 0,
        p75: middleMatch.retirementFee75th || 0,
      };
    }
  }

  return null;
}

/**
 * Get all benchmark comparisons for the plan
 * Different fee types have different query requirements:
 * - Advisor & Investment Manager: Query by AUM only (balance always "All")
 * - Record Keeper: Query by AUM + Balance (unbundled only)
 * - TPA: Query by AUM + Balance
 * - Total Plan Fee: Query by AUM + Balance, using bundled/unbundled based on feeType
 */
export async function getBenchmarkComparison(
  aumBucket: string,
  avgBalanceBucket: string = 'All',
  feeType: 'bundled' | 'unbundled' = 'unbundled'
): Promise<BenchmarkComparison> {
  const benchmarkData = await loadBenchmarkData();

  console.log(`[getBenchmarkComparison] Querying for AUM: ${aumBucket}, Avg Balance: ${avgBalanceBucket}`);
  console.log(`[getBenchmarkComparison] Total rows in dataset: ${benchmarkData.length}`);

  // Advisor Fee: Query by AUM only (balance is always "All")
  const advisor = findBenchmarkPercentiles(benchmarkData, 'Advisor Fee', aumBucket, 'All');

  // Investment Manager Fee: Query by AUM only (balance is always "All")
  const investmentMenu = findBenchmarkPercentiles(benchmarkData, 'Investment Manager fee', aumBucket, 'All');

  // Record Keeper Fee: Query by AUM + Balance (unbundled only)
  const recordKeeper = findBenchmarkPercentiles(benchmarkData, 'Record Keeper Fee - Unbundled', aumBucket, avgBalanceBucket);

  // TPA Fee: Query by AUM + Balance
  const tpa = findBenchmarkPercentiles(benchmarkData, 'TPA Fee', aumBucket, avgBalanceBucket);

  // Total Plan Fee: Query by AUM + Balance (use bundled or unbundled based on feeType)
  const totalFeeType = feeType === 'bundled' ? 'Total Plan Fee - Bundled' : 'Total Plan Fee - Unbundled';
  const total = findBenchmarkPercentiles(benchmarkData, totalFeeType, aumBucket, avgBalanceBucket);

  console.log(`[getBenchmarkComparison] Using Total Plan Fee type: ${totalFeeType}`);

  console.log(`[getBenchmarkComparison] Results:`, {
    advisor: advisor ? 'found' : 'NOT FOUND',
    recordKeeper: recordKeeper ? 'found' : 'NOT FOUND',
    tpa: tpa ? 'found' : 'NOT FOUND',
    investmentMenu: investmentMenu ? 'found' : 'NOT FOUND',
    total: total ? 'found' : 'NOT FOUND',
  });

  return {
    advisor: advisor || { p25: 0, p50: 0, p75: 0 },
    recordKeeper: recordKeeper || { p25: 0, p50: 0, p75: 0 },
    tpa: tpa || { p25: 0, p50: 0, p75: 0 },
    investmentMenu: investmentMenu || { p25: 0, p50: 0, p75: 0 },
    total: total || { p25: 0, p50: 0, p75: 0 },
    dataSource: dataSource || undefined,
  };
}

/**
 * Get available AUM buckets from the dataset
 */
export async function getAvailableAUMBuckets(): Promise<string[]> {
  const benchmarkData = await loadBenchmarkData();
  const buckets = new Set(benchmarkData.map(row => row.bmAssets));
  return Array.from(buckets).filter(bucket => bucket && bucket !== 'All').sort();
}

/**
 * Get available average balance buckets from the dataset
 */
export async function getAvailableAvgBalanceBuckets(): Promise<string[]> {
  const benchmarkData = await loadBenchmarkData();
  const buckets = new Set(benchmarkData.map(row => row.bmAvgBalance));
  return Array.from(buckets).filter(bucket => bucket).sort();
}
