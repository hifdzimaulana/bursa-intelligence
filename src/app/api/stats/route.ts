import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'DEPRECATED',
      message: 'This endpoint is deprecated. Use the RPC function get_market_pulse_stats() via Supabase client instead.',
      migration_guide: 'Replace fetch("/api/stats") with supabase.rpc("get_market_pulse_stats")',
      replaced_by: 'src/lib/queries/market-pulse.ts - useMarketPulseStats() hook',
    },
    {
      status: 410,
      headers: {
        'X-Deprecation': 'This endpoint has been replaced by the RPC function get_market_pulse_stats()',
      },
    }
  );
}