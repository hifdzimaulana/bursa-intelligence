'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { Loader2, ArrowRight, Network, PieChart, Users, Globe, Building2, Percent } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import InvestorTypeBadge from '@/components/investor-type-badge';
import { getInvestorTypeLabel, getInvestorTypeColor } from '@/lib/constants/mappings';

interface Owner {
  investor_name: string;
  investor_type: string | null;
  local_foreign: string | null;
  total_holding_shares: number;
  percentage: number;
}

interface EntityProfile {
  issuer_name: string;
  holdings_scrip: number;
  holdings_scripless: number;
  total_holders: number;
  majority_type: string | null;
  local_ownership_percent: number;
  foreign_ownership_percent: number;
}

async function fetchEntityOwners(shareCode: string): Promise<{ owners: Owner[]; profile: EntityProfile }> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('shareholders')
    .select('investor_name, investor_type, local_foreign, total_holding_shares, percentage, issuer_name, holdings_scrip, holdings_scripless')
    .eq('share_code', shareCode.toUpperCase())
    .order('percentage', { ascending: false });

  if (error) throw new Error(error.message);

  const owners: Owner[] = [];
  const investorTypes: Record<string, number> = {};
  let holdingsScrip = 0;
  let holdingsScripless = 0;
  let localOwnership = 0;
  let foreignOwnership = 0;
  let issuerName = shareCode;
  const uniqueInvestors = new Set<string>();

  data?.forEach(row => {
    if (!uniqueInvestors.has(row.investor_name)) {
      uniqueInvestors.add(row.investor_name);
      owners.push({
        investor_name: row.investor_name,
        investor_type: row.investor_type,
        local_foreign: row.local_foreign,
        total_holding_shares: row.total_holding_shares,
        percentage: row.percentage,
      });
      
      if (row.investor_type) {
        investorTypes[row.investor_type] = (investorTypes[row.investor_type] || 0) + 1;
      }
      
      if (row.local_foreign === 'F') {
        foreignOwnership += row.percentage || 0;
      } else if (row.local_foreign === 'L') {
        localOwnership += row.percentage || 0;
      }
    }
    
    holdingsScrip += row.holdings_scrip || 0;
    holdingsScripless += row.holdings_scripless || 0;
    if (row.issuer_name) issuerName = row.issuer_name;
  });

  let majorityType: string | null = null;
  let maxCount = 0;
  for (const [type, count] of Object.entries(investorTypes)) {
    if (count > maxCount) {
      maxCount = count;
      majorityType = type;
    }
  }

  const totalOwnership = localOwnership + foreignOwnership;
  const localPercent = totalOwnership > 0 ? (localOwnership / totalOwnership) * 100 : 0;
  const foreignPercent = totalOwnership > 0 ? (foreignOwnership / totalOwnership) * 100 : 0;

  const profile: EntityProfile = {
    issuer_name: issuerName,
    holdings_scrip: holdingsScrip,
    holdings_scripless: holdingsScripless,
    total_holders: uniqueInvestors.size,
    majority_type: majorityType,
    local_ownership_percent: localPercent,
    foreign_ownership_percent: foreignPercent,
  };

  return {
    owners,
    profile,
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

  const { owners, profile } = data;

  const trackedOwnership = owners.reduce((sum, o) => sum + o.percentage, 0);
  const totalShares = owners.reduce((sum, o) => sum + o.total_holding_shares, 0);
  const avgOwnership = owners.length > 0 ? trackedOwnership / owners.length : 0;
  const publicOwnership = Math.max(0, 100 - trackedOwnership);
  const totalScrip = profile.holdings_scrip;
  const totalScripless = profile.holdings_scripless;
  const scripTotal = totalScrip + totalScripless;
  const scripPercent = scripTotal > 0 ? (totalScrip / scripTotal) * 100 : 0;
  const scriplessPercent = scripTotal > 0 ? (totalScripless / scripTotal) * 100 : 0;

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
            <p className="text-slate-400">{profile.issuer_name}</p>
          </div>
          <Link
            href={`/visualize?id=${encodeURIComponent(shareCode)}&type=entity&direct=true`}
            className="flex items-center gap-2 px-4 py-2 bg-terminal-amber text-slate-950 font-medium hover:bg-terminal-amber/90 transition-colors"
          >
            <Network className="w-4 h-4" />
            View Relationship Map
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#020617] border border-slate-800 p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Percent className="w-4 h-4" />
            Public Ownership
          </div>
          <div className="text-xl font-bold text-slate-200 font-mono">{publicOwnership.toFixed(1)}%</div>
          <div className="text-xs text-slate-500">float available</div>
        </div>
        <div className="bg-[#020617] border border-slate-800 p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Users className="w-4 h-4" />
            Tracked Holders
          </div>
          <div className="text-xl font-bold text-slate-200 font-mono">{profile.total_holders}</div>
          <div className="text-xs text-slate-500">investors</div>
        </div>
        <div className="bg-[#020617] border border-slate-800 p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Globe className="w-4 h-4" />
            Local
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono">{profile.local_ownership_percent.toFixed(1)}%</div>
          <div className="text-xs text-slate-500">ownership</div>
        </div>
        <div className="bg-[#020617] border border-slate-800 p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Building2 className="w-4 h-4" />
            Foreign
          </div>
          <div className="text-xl font-bold text-blue-400 font-mono">{profile.foreign_ownership_percent.toFixed(1)}%</div>
          <div className="text-xs text-slate-500">ownership</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#020617] border border-slate-800 p-4">
          <div className="text-slate-400 text-sm mb-1">Majority Type</div>
          <div className="text-2xl font-bold text-slate-200">
            {profile.majority_type || '-'}
          </div>
          <div className="text-xs text-slate-500">most common holder type</div>
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

      {scripTotal > 0 && (
        <div className="bg-[#020617] border border-slate-800 p-4 mb-6">
          <div className="text-slate-400 text-sm mb-3">Scrip vs Scripless Distribution</div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Scripless</span>
                <span className="text-slate-400">{scriplessPercent.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-terminal-amber"
                  style={{ width: `${scriplessPercent}%` }}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Scrip</span>
                <span className="text-slate-400">{scripPercent.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-terminal-link"
                  style={{ width: `${scripPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

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