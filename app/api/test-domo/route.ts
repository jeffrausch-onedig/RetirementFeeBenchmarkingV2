import { NextRequest, NextResponse } from 'next/server';
import { fetchBenchmarkData } from '@/lib/domoApi';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Force Node.js runtime for Buffer support

/**
 * Test endpoint to verify Domo API connection
 * GET /api/test-domo
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Testing Domo API connection...');
    console.log('DOMO_CLIENT_ID exists:', !!process.env.DOMO_CLIENT_ID);
    console.log('DOMO_CLIENT_SECRET exists:', !!process.env.DOMO_CLIENT_SECRET);
    console.log('DOMO_DATASET_ID:', process.env.DOMO_DATASET_ID);

    const startTime = Date.now();
    const data = await fetchBenchmarkData();
    const duration = Date.now() - startTime;

    console.log(`Successfully fetched ${data.length} rows in ${duration}ms`);

    // Return first 5 rows as a sample
    return NextResponse.json({
      success: true,
      message: 'Domo API connection successful',
      rowCount: data.length,
      duration: `${duration}ms`,
      sampleData: data.slice(0, 5),
      columns: data.length > 0 ? Object.keys(data[0]) : [],
    });
  } catch (error) {
    console.error('Domo API test failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        config: {
          hasClientId: !!process.env.DOMO_CLIENT_ID,
          hasClientSecret: !!process.env.DOMO_CLIENT_SECRET,
          datasetId: process.env.DOMO_DATASET_ID,
        },
      },
      { status: 500 }
    );
  }
}
