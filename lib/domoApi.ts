import axios from 'axios';

interface DomoAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface DomoDatasetRow {
  [key: string]: string | number;
}

// Cache for access token
let cachedToken: string | null = null;
let tokenExpiration: number = 0;

/**
 * Authenticate with Domo API using OAuth 2.0 client credentials flow
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiration) {
    return cachedToken;
  }

  const clientId = process.env.DOMO_CLIENT_ID;
  const clientSecret = process.env.DOMO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('DOMO_CLIENT_ID and DOMO_CLIENT_SECRET must be set in environment variables');
  }

  try {
    const response = await axios.post<DomoAuthResponse>(
      'https://api.domo.com/oauth/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'data',
      }),
      {
        auth: {
          username: clientId,
          password: clientSecret,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    cachedToken = response.data.access_token;
    // Set expiration to 5 minutes before actual expiration for safety
    tokenExpiration = Date.now() + (response.data.expires_in - 300) * 1000;

    return cachedToken;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Domo authentication failed: ${error.response?.data?.message || error.message}`);
    }
    throw error;
  }
}

/**
 * Fetch data from a Domo dataset
 * @param datasetId The ID of the dataset to fetch
 * @param limit Optional limit on number of rows to return (default: all)
 * @param offset Optional offset for pagination (default: 0)
 */
export async function fetchDomoDataset<T = DomoDatasetRow>(
  datasetId: string,
  limit?: number,
  offset: number = 0
): Promise<T[]> {
  try {
    const token = await getAccessToken();

    const params: Record<string, string> = {};
    if (limit) {
      params.limit = limit.toString();
    }
    if (offset) {
      params.offset = offset.toString();
    }

    // Fetch as CSV since Domo's data export API works with CSV format
    const response = await axios.get(
      `https://api.domo.com/v1/datasets/${datasetId}/data`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'text/csv',
        },
        params,
        responseType: 'text',
      }
    );

    // Parse CSV response
    const Papa = await import('papaparse');

    // First, check if the CSV has a header row by looking at the first line
    const lines = response.data.split('\n');
    const firstLine = lines[0];

    // If the first line contains "ClientID", it has headers
    const hasHeaders = firstLine.includes('ClientID');

    if (hasHeaders) {
      // Parse with headers
      const parsed = Papa.default.parse(response.data, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: (header: string) => {
          // Remove BOM and convert to expected format
          return header.replace(/^\uFEFF/, '');
        },
      });
      return parsed.data as T[];
    } else {
      // No headers - manually map columns based on known structure
      const columnNames = [
        'ClientID',
        'SalesforceAccountID',
        'D365AccountID',
        'ReportID',
        'CreationDate',
        'ClientName',
        'SIC',
        'BenchmarkSource',
        'Type',
        'BMAssets',
        'BMAvgBalance',
        'RetirementFee25th',
        'RetirementFee50th',
        'RetirementFee75th',
        'Assets',
        'AvgBalance',
        'RecordKeeperFeePrcnt',
        'AdvisorFeePrcnt',
        'InvestmentManagerFeePrcnt',
        'TPAFeePrcnt',
        'TotalPlanFeePrcnt',
        'RecordKeeperFeeDollars',
        'AdvisorFeeDollars',
        'InvestmentManagerFeeDollars',
        'TPAFeeDollars',
        'TotalPlanFeeDollars',
      ];

      const parsed = Papa.default.parse(response.data, {
        header: false,
        skipEmptyLines: true,
        dynamicTyping: true,
      });

      // Convert array rows to objects with proper column names
      return parsed.data.map((row: any) => {
        const obj: any = {};
        columnNames.forEach((name, index) => {
          obj[name] = row[index];
        });
        return obj;
      }) as T[];
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        // Token might be invalid, clear cache and retry once
        cachedToken = null;
        tokenExpiration = 0;
        throw new Error('Domo authentication expired. Please try again.');
      }
      throw new Error(`Failed to fetch Domo dataset: ${error.response?.data?.message || error.message}`);
    }
    throw error;
  }
}

/**
 * Fetch benchmark data from the retirement fee dataset
 */
export async function fetchBenchmarkData(): Promise<DomoDatasetRow[]> {
  const datasetId = process.env.DOMO_DATASET_ID || '38b1bcb9-55cf-4dc7-8978-867a9fc7021c';
  return fetchDomoDataset(datasetId);
}
