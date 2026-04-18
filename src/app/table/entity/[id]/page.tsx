'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { Loader2, ArrowRight, Network, PieChart, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import InvestorTypeBadge from '@/components/investor-type-badge';
import { getInvestorTypeLabel, getInvestorTypeColor } from '@/lib/constants/mappings';

interface Owner {
  investor_name: string;
  investor_type: string | null;
  total_holding_shares: number;
  percentage: number;
}

async function fetchEntityOwners(shareCode: string): Promise<{ owners: Owner[]; issuer_name: string; total_holders: number }> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('shareholders')
    .select('investor_name, investor_type, total_holding_shares, percentage, issuer_name')
    .eq('share_code', shareCode.toUpperCase())
    .order('percentage', { ascending: false });

  if (error) throw new Error(error.message);

  const owners: Owner[] = data.map(row => ({
    investor_name: row.investor_name,
    investor_type: row.investor_type,
    total_holding_shares: row.total_holding_shares,
    percentage: row.percentage,
  }));

  const issuerName = data[0]?.issuer_name || shareCode;

  return {
    owners,
    issuer_name: issuerName,
    total_holders: owners.length,
  };
}

function EntityDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const shareCode = params.id ? decodeURIComponent(params.id as string).toUpperCase() : searchParams.get('code') || '';

  const { data, isLoading, error } = useQuery({
    queryKey: ['entity-detail', shareCode],
    queryFn: () => fetchEntityOwners(shareCode),
    enabled: !!shareCode,
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
        <p>Failed to load entity data</p>
      </div>
    );
  }

  const { owners, issuer_name, total_holders } = data;

  const trackedOwnership = owners.reduce((sum, o) => sum + o.percentage, 0);
  const totalShares = owners.reduce((sum, o) => sum + o.total_holding_shares, 0);
  const avgOwnership = owners.length > 0 ? trackedOwnership / owners.length : 0;

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/table?view=entities"
            className="text-slate-400 hover:text-slate-200 text-sm flex items-center gap-1"
          >
            ← Back to Entities
          </Link>
        </div>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-terminal-amber font-mono mb-2">{shareCode}</h1>
            <p className="text-slate-400">{issuer_name}</p>
          </div>
          <Link
            href={`/visualize?query=${encodeURIComponent(shareCode)}`}
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
          <div className="text-slate-400 text-sm mb-1">Major Holders</div>
          <div className="text-2xl font-bold text-slate-200 font-mono">{total_holders}</div>
          <div className="text-xs text-slate-500">investors tracked</div>
        </div>
        <div className="bg-[#020617] border border-slate-800 p-4">
          <div className="text-slate-400 text-sm mb-1">Tracked Ownership</div>
          <div className="text-2xl font-bold text-slate-200 font-mono">{trackedOwnership.toFixed(1)}%</div>
          <div className="text-xs text-slate-500">of company shares</div>
        </div>
        <div className="bg-[#020617] border border-slate-800 p-4">
          <div className="text-slate-400 text-sm mb-1">Total Shares Held</div>
          <div className="text-2xl font-bold text-slate-200 font-mono">{totalShares.toLocaleString('id-ID')}</div>
          <div className="text-xs text-slate-500">by tracked investors</div>
        </div>
      </div>

      <div className="bg-[#020617] border border-slate-800">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <Users className="w-5 h-5 text-terminal-amber" />
            Major Shareholders ({'>'}1%)
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">Investor</th>
                <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">Type</th>
                <th className="text-right text-slate-400 text-xs font-medium px-4 py-3">Shares</th>
                <th className="text-right text-slate-400 text-xs font-medium px-4 py-3">Ownership %</th>
              </tr>
            </thead>
            <tbody>
              {owners.filter(o => o.percentage > 1).map((owner, idx) => (
                <tr key={owner.investor_name} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <Link 
                      href={`/table/investor/${encodeURIComponent(owner.investor_name)}`}
                      className="text-slate-200 hover:text-terminal-amber transition-colors"
                    >
                      {owner.investor_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <InvestorTypeBadge code={owner.investor_type} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-mono text-right">
                    {owner.total_holding_shares.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-mono ${
                      owner.percentage >= 5 ? 'text-terminal-amber' :
                      owner.percentage >= 1 ? 'text-terminal-link' : 'text-slate-400'
                    }`}>
                      {owner.percentage.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {owners.filter(o => o.percentage <= 1).length > 0 && (
        <div className="mt-4 bg-[#020617] border border-slate-800 p-4">
          <h3 className="text-sm font-medium text-slate-400 mb-2">
            + {owners.filter(o => o.percentage <= 1).length} additional investors with {'<'}1% ownership
          </h3>
        </div>
      )}
    </div>
  );
}

export default function EntityDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-terminal-amber" />
      </div>
    }>
      <EntityDetailContent />
    </Suspense>
  );
}