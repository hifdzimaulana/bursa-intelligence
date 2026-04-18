'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrendingUp, Shield, Building2, Users, AlertTriangle, Loader2, Globe, ArrowRight, ExternalLink } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useMarketPulseStats } from '@/lib/queries/market-pulse';
import { getInvestorTypeColor, getInvestorTypeLabel } from '@/lib/constants/mappings';
import InvestorTypeBadge from '@/components/investor-type-badge';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const BLOOMBERG_COLORS = {
  amber: '#ffb020',
  blue: '#4da6ff',
  green: '#22c55e',
  red: '#ef4444',
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
};

function formatNumber(num: number): string {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  return num.toLocaleString('id-ID');
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: stats, isLoading, error } = useMarketPulseStats();

  const handleInvestorTypeClick = (type: string) => {
    router.push(`/table?view=investors&filter=${type}`, { scroll: false });
  };

  const handleIssuerClick = (shareCode: string) => {
    router.push(`/visualize/company/${shareCode}`, { scroll: false });
  };

  const goToTable = (tab?: string) => {
    if (tab) {
      router.push(`/table?view=${tab}`, { scroll: false });
    } else {
      router.push('/table', { scroll: false });
    }
  };

  const investorTypeChartData = useMemo(() => {
    if (!stats?.investor_type_distribution?.length) return null;
    const sorted = [...stats.investor_type_distribution].sort((a, b) => b.total_shares - a.total_shares).slice(0, 8);
    return {
      labels: sorted.map(t => getInvestorTypeLabel(t.type)),
      datasets: [
        {
          data: sorted.map(t => t.total_shares),
          backgroundColor: sorted.map(t => getInvestorTypeColor(t.type)),
          borderColor: sorted.map(t => getInvestorTypeColor(t.type)),
          borderWidth: 1,
        },
      ],
    };
  }, [stats]);

  const issuerChartData = useMemo(() => {
    if (!stats?.top_concentrated_issuers?.length) return null;
    return {
      labels: stats.top_concentrated_issuers.map(i => i.share_code),
      datasets: [
        {
          label: 'Concentration %',
          data: stats.top_concentrated_issuers.map(i => i.concentration || 0),
          backgroundColor: BLOOMBERG_COLORS.blue + '99',
          borderColor: BLOOMBERG_COLORS.blue,
          borderWidth: 1,
        },
      ],
    };
  }, [stats]);

  const issuerChartOptions: any = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: BLOOMBERG_COLORS.slate[900],
        titleColor: BLOOMBERG_COLORS.slate[200],
        bodyColor: BLOOMBERG_COLORS.slate[300],
        borderColor: BLOOMBERG_COLORS.slate[700],
        borderWidth: 1,
        cornerRadius: 0,
      },
    },
    scales: {
      x: {
        grid: { color: BLOOMBERG_COLORS.slate[800] },
        ticks: {
          color: BLOOMBERG_COLORS.slate[500],
          font: { family: '"JetBrains Mono", monospace', size: 10 },
        },
      },
      y: {
        grid: { display: false },
        ticks: {
          color: BLOOMBERG_COLORS.slate[400],
          font: { family: '"JetBrains Mono", monospace', size: 11 },
        },
      },
    },
    onClick: (_: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const issuer = stats?.top_concentrated_issuers?.[index];
        if (issuer) {
          handleIssuerClick(issuer.share_code);
        }
      }
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-terminal-amber" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-400">Failed to load market data</div>
      </div>
    );
  }

  const dataQuality = stats?.data_quality;

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-200 flex items-center gap-3">
            <TrendingUp className="w-7 h-7 text-terminal-amber" />
            Market Pulse
          </h1>
          <p className="text-slate-500 text-sm mt-1">Indonesian equity market overview</p>
        </div>
        <button
          onClick={() => goToTable()}
          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 transition-colors"
        >
          View Full Data
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Link
          href="/table?view=entities"
          className="block bg-[#020617] border border-slate-800 p-5 hover:border-slate-600 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm font-medium">Entities Tracked</span>
            <Globe className="w-5 h-5 text-terminal-amber/70" />
          </div>
          <div className="text-2xl font-bold text-slate-200 font-mono">
            {stats?.total_entities?.toLocaleString() || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">Listed companies</div>
        </Link>

        <Link
          href="/table?view=investors"
          className="block bg-[#020617] border border-slate-800 p-5 hover:border-slate-600 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm font-medium">Major Investors</span>
            <Users className="w-5 h-5 text-terminal-link/70" />
          </div>
          <div className="text-2xl font-bold text-slate-200 font-mono">
            {stats?.total_investors?.toLocaleString() || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">Unique holders</div>
        </Link>

        <Link
          href="/table?view=investors&filter=invalid"
          className="block bg-[#020617] border border-slate-800 p-5 hover:border-slate-600 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm font-medium">Data Quality</span>
            <Shield className="w-5 h-5 text-terminal-green/70" />
          </div>
          <div className="text-2xl font-bold text-slate-200 font-mono">
            {(dataQuality?.integrity_percent || 0).toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            <span className="text-terminal-green">{dataQuality?.valid_count?.toLocaleString() || 0} valid</span>
            {' / '}
            <span className="text-red-400">{dataQuality?.invalid_count?.toLocaleString() || 0} invalid</span>
          </div>
        </Link>

        <Link
          href="/visualize"
          className="block bg-[#020617] border border-slate-800 p-5 hover:border-slate-600 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm font-medium">Network Map</span>
            <Building2 className="w-5 h-5 text-terminal-amber/70" />
          </div>
          <div className="text-lg font-bold text-slate-200">
            Explore
          </div>
          <div className="text-xs text-slate-500 mt-1">Ownership relationships</div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-[#020617] border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Investor Type Distribution
            </h2>
            <button
              onClick={() => goToTable('investors')}
              className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"
            >
              View All
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <div className="h-48">
            {investorTypeChartData && (
              <Doughnut data={investorTypeChartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '55%',
                plugins: {
                  legend: {
                    position: 'right',
                    labels: {
                      color: BLOOMBERG_COLORS.slate[400],
                      font: { family: '"JetBrains Mono", monospace', size: 10 },
                      padding: 8,
                      usePointStyle: true,
                    },
                  },
                  tooltip: {
                    backgroundColor: BLOOMBERG_COLORS.slate[900],
                    titleColor: BLOOMBERG_COLORS.slate[200],
                    bodyColor: BLOOMBERG_COLORS.slate[300],
                    borderColor: BLOOMBERG_COLORS.slate[700],
                    borderWidth: 1,
                    cornerRadius: 0,
                  },
                },
                onClick: (_: any, elements: any[]) => {
                  if (elements.length > 0) {
                    const index = elements[0].index;
                    const type = stats?.investor_type_distribution?.[index];
                    if (type) {
                      handleInvestorTypeClick(type.type);
                    }
                  }
                },
              }} />
            )}
          </div>
        </div>

        <div className="bg-[#020617] border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Top Concentrated Issuers
            </h2>
            <button
              onClick={() => goToTable('entities')}
              className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"
            >
              View All
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <div className="h-48">
            {issuerChartData && (
              <Bar data={issuerChartData} options={issuerChartOptions} />
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#020617] border border-slate-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            System Alerts
          </h2>
          {(dataQuality?.invalid_count ?? 0) > 0 && (
            <button
              onClick={() => goToTable('investors&filter=invalid')}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 border border-red-900 px-2 py-1"
            >
              View {dataQuality?.invalid_count} Issues
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
        {(stats?.invalid_rows?.length ?? 0) > 0 ? (
          <div className="font-mono text-xs">
            <div className="grid grid-cols-12 gap-2 px-3 py-2 border-b border-slate-800 text-slate-500">
              <div className="col-span-2">Date</div>
              <div className="col-span-2">Code</div>
              <div className="col-span-5">Investor</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-1 text-right">%</div>
            </div>
            {stats?.invalid_rows.slice(0, 8).map((row, idx) => (
              <div 
                key={row.id || idx} 
                className="grid grid-cols-12 gap-2 px-3 py-2 border-b border-slate-800/50 hover:bg-red-950/10"
              >
                <div className="col-span-2 text-slate-400">{row.date}</div>
                <div className="col-span-2 text-terminal-link">{row.share_code}</div>
                <div className="col-span-5 text-slate-300 truncate">{row.investor_name}</div>
                <div className="col-span-2 text-slate-500">{row.investor_type || 'UK'}</div>
                <div className="col-span-1 text-right text-red-400">{(row.percentage || 0).toFixed(2)}%</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-slate-500">
            <Shield className="w-5 h-5 mr-2 text-terminal-green" />
            All data validated - no anomalies detected
          </div>
        )}
      </div>
    </div>
  );
}