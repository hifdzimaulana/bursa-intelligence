'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, ArrowRight, Building2, Network, PieChart } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import InvestorTypeBadge from '@/components/investor-type-badge';
import { getInvestorTypeLabel, getInvestorTypeColor } from '@/lib/constants/mappings';

interface Holding {
  share_code: string;
  issuer_name: string;
  total_holding_shares: number;
  percentage: number;
}

async function fetchInvestorHoldings(investorName: string): Promise<{ holdings: Holding[]; investor_type: string | null; total_investments: number }> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('shareholders')
    .select('share_code, issuer_name, total_holding_shares, percentage, investor_type')
    .ilike('investor_name', `%${investorName}%`)
    .order('percentage', { ascending: false });

  if (error) throw new Error(error.message);

  const holdings: Holding[] = data.map(row => ({
    share_code: row.share_code,
    issuer_name: row.issuer_name,
    total_holding_shares: row.total_holding_shares,
    percentage: row.percentage,
  }));

  const uniqueInvestorType = data[0]?.investor_type || null;

  return {
    holdings,
    investor_type: uniqueInvestorType,
    total_investments: holdings.length,
  };
}

function InvestorDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const investorName = params.id ? decodeURIComponent(params.id as string) : searchParams.get('name') || '';

  const { data, isLoading, error } = useQuery({
    queryKey: ['investor-detail', investorName],
    queryFn: () => fetchInvestorHoldings(investorName),
    enabled: !!investorName,
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-terminal-amber" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <p>Failed to load investor data</p>
      </div>
    );
  }

  const { holdings, investor_type, total_investments } = data;

  const totalShares = holdings.reduce((sum, h) => sum + h.total_holding_shares, 0);
  const avgPercentage = holdings.length > 0 ? holdings.reduce((sum, h) => sum + h.percentage, 0) / holdings.length : 0;

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/table?view=investors"
            className="text-slate-400 hover:text-slate-200 text-sm flex items-center gap-1"
          >
            ← Back to Investors
          </Link>
        </div>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-200 mb-2">{investorName}</h1>
            <InvestorTypeBadge code={investor_type} size="lg" showDescription />
          </div>
          <Link
            href={`/visualize?query=${encodeURIComponent(investorName)}`}
            className="flex items-center gap-2 px-4 py-2 bg-terminal-amber text-slate-950 font-medium hover:bg-terminal-amber/90 transition-colors"
          >
            <Network className="w-4 h-4" />
            View Relationship Map
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#020617] border border-slate-800 p-4">
          <div className="text-slate-400 text-sm mb-1">Total Investments</div>
          <div className="text-2xl font-bold text-slate-200 font-mono">{total_investments}</div>
          <div className="text-xs text-slate-500">companies in portfolio</div>
        </div>
        <div className="bg-[#020617] border border-slate-800 p-4">
          <div className="text-slate-400 text-sm mb-1">Total Shares Held</div>
          <div className="text-2xl font-bold text-slate-200 font-mono">{totalShares.toLocaleString('id-ID')}</div>
          <div className="text-xs text-slate-500">across all companies</div>
        </div>
        <div className="bg-[#020617] border border-slate-800 p-4">
          <div className="text-slate-400 text-sm mb-1">Average Ownership</div>
          <div className="text-2xl font-bold text-slate-200 font-mono">{avgPercentage.toFixed(2)}%</div>
          <div className="text-xs text-slate-500">average per company</div>
        </div>
      </div>

      <div className="bg-[#020617] border border-slate-800">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-terminal-amber" />
            Portfolio Holdings
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">Ticker</th>
                <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">Company</th>
                <th className="text-right text-slate-400 text-xs font-medium px-4 py-3">Shares</th>
                <th className="text-right text-slate-400 text-xs font-medium px-4 py-3">Ownership %</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding, idx) => (
                <tr key={holding.share_code} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <Link 
                      href={`/table/entity/${holding.share_code}`}
                      className="text-terminal-amber font-mono hover:underline"
                    >
                      {holding.share_code}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{holding.issuer_name}</td>
                  <td className="px-4 py-3 text-slate-300 font-mono text-right">
                    {holding.total_holding_shares.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-mono ${
                      holding.percentage >= 5 ? 'text-terminal-amber' :
                      holding.percentage >= 1 ? 'text-terminal-link' : 'text-slate-400'
                    }`}>
                      {holding.percentage.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function InvestorDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-terminal-amber" />
      </div>
    }>
      <InvestorDetailContent />
    </Suspense>
  );
}