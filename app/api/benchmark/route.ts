import { NextRequest, NextResponse } from 'next/server';
import { fetchBenchmarkData } from '@/lib/domoApi';

export const dynamic = 'force-dynamic';

/**
 * API route to fetch benchmark data from Domo
 * GET /api/benchmark
 */
export async function GET(request: NextRequest) {
  try {
    const data = await fetchBenchmarkData();

    return NextResponse.json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    console.error('Error fetching benchmark data:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
