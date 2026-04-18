import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  try {
    // Total AUM
    const { data: aumData } = await supabase
      .from('shareholders')
      .select('total_holding_shares');

    const totalAUM = aumData?.reduce((sum, row) => sum + (row.total_holding_shares || 0), 0) || 0;

    // Data Integrity
    const { count: totalCount } = await supabase
      .from('shareholders')
      .select('*', { count: 'exact', head: true });

    const { count: validCount } = await supabase
      .from('shareholders')
      .select('*', { count: 'exact', head: true })
      .eq('validation_status', 'VALID');

    const { count: invalidCount } = await supabase
      .from('shareholders')
      .select('*', { count: 'exact', head: true })
      .eq('validation_status', 'INVALID');

    const dataIntegrity = totalCount ? ((validCount || 0) / totalCount) * 100 : 0;

    // Unique counts
    const { data: companyData } = await supabase
      .from('shareholders')
      .select('share_code, issuer_name, total_holding_shares');

    const uniqueCompanyCount = companyData 
      ? new Set(companyData.map(r => r.share_code)).size 
      : 0;

    const { data: investorData } = await supabase
      .from('shareholders')
      .select('investor_name');

    const uniqueInvestorCount = investorData 
      ? new Set(investorData.map(r => r.investor_name)).size 
      : 0;

    // Foreign vs Local
    const { data: ownershipData } = await supabase
      .from('shareholders')
      .select('local_foreign, total_holding_shares');

    let foreignOwnership = 0;
    let localOwnership = 0;

    ownershipData?.forEach(row => {
      if (row.local_foreign === 'F') {
        foreignOwnership += row.total_holding_shares || 0;
      } else if (row.local_foreign === 'L') {
        localOwnership += row.total_holding_shares || 0;
      }
    });

    const totalOwnership = foreignOwnership + localOwnership;
    const foreignPercent = totalOwnership ? (foreignOwnership / totalOwnership) * 100 : 0;
    const localPercent = totalOwnership ? (localOwnership / totalOwnership) * 100 : 0;

    // Investor Type Distribution
    const { data: investorTypeData } = await supabase
      .from('shareholders')
      .select('investor_type, total_holding_shares');

    const investorTypeMap = new Map<string, { count: number; totalShares: number }>();
    
    investorTypeData?.forEach(row => {
      const type = row.investor_type || 'UK';
      const existing = investorTypeMap.get(type) || { count: 0, totalShares: 0 };
      investorTypeMap.set(type, {
        count: existing.count + 1,
        totalShares: existing.totalShares + (row.total_holding_shares || 0),
      });
    });

    const investorTypes = Array.from(investorTypeMap.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      totalShares: data.totalShares,
    })).sort((a, b) => b.totalShares - a.totalShares);

    // Top 10 Holders by percentage
    const { data: topHolders } = await supabase
      .from('shareholders')
      .select('investor_name, share_code, issuer_name, percentage, total_holding_shares')
      .order('percentage', { ascending: false })
      .limit(10);

    // Top 10 Issuers by concentration (sum of percentages per issuer)
    const issuerConcMap = new Map<string, { share_code: string; issuer_name: string; concentration: number; totalShares: number }>();
    
    companyData?.forEach(row => {
      const code = row.share_code;
      const name = row.issuer_name || code;
      const existing = issuerConcMap.get(code);
      if (!existing || !existing.concentration) {
        issuerConcMap.set(code, {
          share_code: code,
          issuer_name: name,
          concentration: 0,
          totalShares: row.total_holding_shares || 0,
        });
      } else {
        existing.totalShares += row.total_holding_shares || 0;
      }
    });

    const { data: percentageData } = await supabase
      .from('shareholders')
      .select('share_code, percentage');

    percentageData?.forEach(row => {
      const existing = issuerConcMap.get(row.share_code);
      if (existing) {
        existing.concentration += row.percentage || 0;
      }
    });

    const topIssuers = Array.from(issuerConcMap.values())
      .sort((a, b) => b.concentration - a.concentration)
      .slice(0, 10);

    // Invalid rows (latest)
    const { data: invalidRows } = await supabase
      .from('shareholders')
      .select('id, date, share_code, investor_name, investor_type, percentage, validation_status')
      .eq('validation_status', 'INVALID')
      .order('date', { ascending: false })
      .limit(10);

    return NextResponse.json({
      totalAUM,
      dataIntegrity,
      invalidCount: invalidCount || 0,
      uniqueCompanies: uniqueCompanyCount,
      uniqueInvestors: uniqueInvestorCount,
      foreignPercent,
      localPercent,
      investorTypes: investorTypes || [],
      topHolders: topHolders || [],
      topIssuers: topIssuers || [],
      invalidRows: invalidRows || [],
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}