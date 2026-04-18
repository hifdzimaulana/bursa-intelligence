'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, ArrowRight, Building2, Network, PieChart, Globe, MapPin, FileText, File } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import InvestorTypeBadge from '@/components/investor-type-badge';
import { getInvestorTypeLabel, getInvestorTypeColor } from '@/lib/constants/mappings';

interface Holding {
  share_code: string;
  issuer_name: string;
  total_holding_shares: number;
  percentage: number;
}

interface InvestorProfile {
  investor_type: string | null;
  local_foreign: string | null;
  nationality: string | null;
  domicile: string | null;
  holdings_scrip: number;
  holdings_scripless: number;
  total_holdings_count: number;
  latest_date: string | null;
}

async function fetchInvestorHoldings(investorName: string): Promise<{ holdings: Holding[]; profile: InvestorProfile }> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('shareholders')
    .select('share_code, issuer_name, total_holding_shares, percentage, investor_type, local_foreign, nationality, domicile, holdings_scrip, holdings_scripless, date')
    .ilike('investor_name', `%${investorName}%`)
    .order('percentage', { ascending: false });

  if (error) throw new Error(error.message);

  const holdings: Holding[] = [];
  const shareCodes = new Set<string>();
  let holdingsScrip = 0;
  let holdingsScripless = 0;
  let nationality: string | null = null;
  let domicile: string | null = null;
  let localForeign: string | null = null;
  let investorType: string | null = null;
  let latestDate: string | null = null;

  data?.forEach(row => {
    if (!shareCodes.has(row.share_code)) {
      shareCodes.add(row.share_code);
      holdings.push({
        share_code: row.share_code,
        issuer_name: row.issuer_name,
        total_holding_shares: row.total_holding_shares,
        percentage: row.percentage,
      });
    }
    holdingsScrip += row.holdings_scrip || 0;
    holdingsScripless += row.holdings_scripless || 0;
    if (!nationality && row.nationality) nationality = row.nationality;
    if (!domicile && row.domicile) domicile = row.domicile;
    if (!localForeign && row.local_foreign) localForeign = row.local_foreign;
    if (!investorType && row.investor_type) investorType = row.investor_type;
    if (!latestDate || (row.date && row.date > latestDate)) latestDate = row.date;
  });

  const profile: InvestorProfile = {
    investor_type: investorType,
    local_foreign: localForeign,
    nationality: nationality,
    domicile: domicile,
    holdings_scrip: holdingsScrip,
    holdings_scripless: holdingsScripless,
    total_holdings_count: shareCodes.size,
    latest_date: latestDate,
  };

  return {
    holdings,
    profile,
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

  const { holdings, profile } = data;

  const totalShares = holdings.reduce((sum, h) => sum + h.total_holding_shares, 0);
  const avgPercentage = holdings.length > 0 ? holdings.reduce((sum, h) => sum + h.percentage, 0) / holdings.length : 0;
  const totalScrip = profile.holdings_scrip;
  const totalScripless = profile.holdings_scripless;
  const scripTotal = totalScrip + totalScripless;
  const scripPercent = scripTotal > 0 ? (totalScrip / scripTotal) * 100 : 0;
  const scriplessPercent = scripTotal > 0 ? (totalScripless / scripTotal) * 100 : 0;
  const locationLabel = profile.local_foreign === 'F' ? 'Foreign' : profile.local_foreign === 'L' ? 'Local' : null;

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
            <div className="flex items-center gap-3">
              <InvestorTypeBadge code={profile.investor_type} size="lg" showDescription />
              {locationLabel && (
                <span className={`text-sm px-2.5 py-1 rounded font-medium ${
                  profile.local_foreign === 'F' 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {locationLabel}
                </span>
              )}
            </div>
          </div>
          <Link
            href={`/visualize?id=${encodeURIComponent(investorName)}&type=investor&direct=true`}
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
            <Globe className="w-4 h-4" />
            Nationality
          </div>
          <div className="text-xl font-bold text-slate-200">{profile.nationality || '-'}</div>
        </div>
        <div className="bg-[#020617] border border-slate-800 p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <MapPin className="w-4 h-4" />
            Domicile
          </div>
          <div className="text-xl font-bold text-slate-200">{profile.domicile || '-'}</div>
        </div>
        <div className="bg-[#020617] border border-slate-800 p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <FileText className="w-4 h-4" />
            Scripless
          </div>
          <div className="text-xl font-bold text-slate-200 font-mono">{totalScripless.toLocaleString('id-ID')}</div>
        </div>
        <div className="bg-[#020617] border border-slate-800 p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <File className="w-4 h-4" />
            Scrip
          </div>
          <div className="text-xl font-bold text-slate-200 font-mono">{totalScrip.toLocaleString('id-ID')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#020617] border border-slate-800 p-4">
          <div className="text-slate-400 text-sm mb-1">Total Investments</div>
          <div className="text-2xl font-bold text-slate-200 font-mono">{profile.total_holdings_count}</div>
          <div className="text-xs text-slate-500">companies in portfolio</div>
        </div>
        <div className="bg-[#020617] border border-slate-800 p-4">
          <div className="text-slate-400 text-sm mb-1">Total Shares Held</div>
          <div className="text-2xl font-bold text-slate-200 font-mono">{totalShares.toLocaleString('id-ID')}</div>
          <div className="text-xs text-slate-500">across all companies</div>
        </div>
        <div className="bg-[#020617] border border-slate-800 p-4">
          <div className="text-slate-400 text-sm mb-1">Avg Ownership</div>
          <div className="text-2xl font-bold text-slate-200 font-mono">{avgPercentage.toFixed(2)}%</div>
          <div className="text-xs text-slate-500">average per company</div>
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