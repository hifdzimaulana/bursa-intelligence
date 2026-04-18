'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface InvestorTypeData {
  type: string;
  count: number;
  totalShares: number;
}

interface DashboardStats {
  totalAUM: number;
  dataIntegrity: number;
  invalidCount: number;
  uniqueCompanies: number;
  uniqueInvestors: number;
  foreignPercent: number;
  localPercent: number;
  investorTypes: InvestorTypeData[];
  topHolders: Array<{
    investor_name: string;
    share_code: string;
    issuer_name: string;
    percentage: number;
    total_holding_shares: number;
  }>;
  topIssuers: Array<{
    share_code: string;
    issuer_name: string;
    concentration: number;
    totalShares: number;
  }>;
  invalidRows: Array<{
    id: number;
    date: string;
    share_code: string;
    investor_name: string;
    investor_type?: string;
    percentage?: number;
    validation_status: string;
  }>;
}

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
  investorTypes: {
    CP: '#4da6ff',
    ID: '#22c55e',
    PF: '#ffb020',
    FI: '#a855f7',
    RS: '#ef4444',
    SA: '#06b6d4',
    UK: '#f97316',
  },
};

const INVESTOR_TYPE_LABELS: Record<string, string> = {
  CP: 'Corporate',
  ID: 'Individual',
  PF: 'Pension',
  FI: 'Financial',
  RS: 'Restricted',
  SA: 'Savings',
  UK: 'Unknown',
};

function formatNumber(num: number): string {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  return num.toLocaleString('id-ID');
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const handleOwnershipClick = useCallback((type: 'F' | 'L') => {
    router.push(`/table?search=&local_foreign=${type}`, { scroll: false });
  }, [router]);

  const handleInvestorTypeClick = useCallback((type: string) => {
    router.push(`/table?search=&investor_type=${type}`, { scroll: false });
  }, [router]);

  const handleViewInvalid = useCallback(() => {
    router.push('/audit', { scroll: false });
  }, [router]);

  const goToTable = useCallback((filter?: string) => {
    if (filter) {
      router.push(`/table?search=${encodeURIComponent(filter)}`, { scroll: false });
    } else {
      router.push('/table', { scroll: false });
    }
  }, [router]);

  const ownershipChartData = useMemo(() => {
    if (!stats) return null;
    return {
      labels: ['Local', 'Foreign'],
      datasets: [
        {
          data: [stats.localPercent || 0, stats.foreignPercent || 0],
          backgroundColor: [BLOOMBERG_COLORS.amber, BLOOMBERG_COLORS.blue],
          borderColor: [BLOOMBERG_COLORS.amber, BLOOMBERG_COLORS.blue],
          borderWidth: 1,
        },
      ],
    };
  }, [stats]);

  const ownershipChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        display: false,
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
        handleOwnershipClick(index === 0 ? 'L' : 'F');
      }
    },
  };

  const investorTypeChartData = useMemo(() => {
    if (!stats?.investorTypes?.length) return null;
    const sorted = [...stats.investorTypes].sort((a, b) => b.totalShares - a.totalShares).slice(0, 7);
    return {
      labels: sorted.map(t => INVESTOR_TYPE_LABELS[t.type] || t.type),
      datasets: [
        {
          data: sorted.map(t => t.totalShares),
          backgroundColor: sorted.map(t => BLOOMBERG_COLORS.investorTypes[t.type as keyof typeof BLOOMBERG_COLORS.investorTypes] || BLOOMBERG_COLORS.slate[400]),
          borderColor: sorted.map(t => BLOOMBERG_COLORS.investorTypes[t.type as keyof typeof BLOOMBERG_COLORS.investorTypes] || BLOOMBERG_COLORS.slate[400]),
          borderWidth: 1,
        },
      ],
    };
  }, [stats]);

  const issuerChartData = useMemo(() => {
    if (!stats?.topIssuers?.length) return null;
    return {
      labels: stats.topIssuers.map(i => i.share_code),
      datasets: [
        {
          label: 'Concentration %',
          data: stats.topIssuers.map(i => i.concentration || 0),
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
      legend: {
        display: false,
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
    scales: {
      x: {
        grid: {
          color: BLOOMBERG_COLORS.slate[800],
        },
        ticks: {
          color: BLOOMBERG_COLORS.slate[500],
          font: {
            family: '"JetBrains Mono", monospace',
            size: 10,
          },
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: BLOOMBERG_COLORS.slate[400],
          font: {
            family: '"JetBrains Mono", monospace',
            size: 11,
          },
        },
      },
    },
    onClick: (_: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const issuer = stats?.topIssuers?.[index];
        if (issuer) {
          router.push(`/visualize/company/${issuer.share_code}`, { scroll: false });
        }
      }
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-terminal-amber" />
      </div>
    );
  }

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
        <div 
          onClick={() => goToTable()}
          className="cursor-pointer bg-[#020617] border border-slate-800 p-5 hover:border-slate-600 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm font-medium">Market Cap</span>
            <Globe className="w-5 h-5 text-terminal-amber/70" />
          </div>
          <div className="text-2xl font-bold text-slate-200 font-mono">
            {formatNumber(stats?.totalAUM || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Total Shares</div>
        </div>

        <div 
          onClick={() => goToTable()}
          className="cursor-pointer bg-[#020617] border border-slate-800 p-5 hover:border-slate-600 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm font-medium">Entities</span>
            <Building2 className="w-5 h-5 text-terminal-link/70" />
          </div>
          <div className="text-2xl font-bold text-slate-200 font-mono">
            {stats?.uniqueCompanies || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">{stats?.uniqueInvestors || 0} investors</div>
        </div>

        <div 
          onClick={() => goToTable()}
          className="cursor-pointer bg-[#020617] border border-slate-800 p-5 hover:border-slate-600 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm font-medium">Data Quality</span>
            <Shield className="w-5 h-5 text-terminal-green/70" />
          </div>
          <div className="text-2xl font-bold text-slate-200 font-mono">
            {(stats?.dataIntegrity || 0).toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            <span className="text-terminal-green">{(stats?.dataIntegrity || 0).toFixed(0)}% valid</span>
            {' / '}
            <span className="text-red-400">{stats?.invalidCount || 0} invalid</span>
          </div>
        </div>

        <div 
          onClick={() => handleOwnershipClick(stats?.foreignPercent && stats.foreignPercent > 50 ? 'L' : 'F')}
          className="cursor-pointer bg-[#020617] border border-slate-800 p-5 hover:border-slate-600 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm font-medium">Ownership</span>
            <Users className="w-5 h-5 text-terminal-amber/70" />
          </div>
          <div className="h-16 relative">
            {ownershipChartData && (
              <Doughnut data={ownershipChartData} options={ownershipChartOptions} />
            )}
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-terminal-amber font-mono">L: {(stats?.localPercent || 0).toFixed(0)}%</span>
            <span className="text-terminal-link font-mono">F: {(stats?.foreignPercent || 0).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-[#020617] border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Investor Type Distribution
            </h2>
            <button
              onClick={() => goToTable()}
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
                      font: {
                        family: '"JetBrains Mono", monospace',
                        size: 10,
                      },
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
                    const type = stats?.investorTypes?.[index];
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
              Top Issuers by Concentration
            </h2>
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
          {(stats?.invalidCount ?? 0) > 0 && (
            <button
              onClick={handleViewInvalid}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 border border-red-900 px-2 py-1"
            >
              View {stats?.invalidCount} Issues
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
        {(stats?.invalidRows?.length ?? 0) > 0 ? (
          <div className="font-mono text-xs">
            <div className="grid grid-cols-12 gap-2 px-3 py-2 border-b border-slate-800 text-slate-500">
              <div className="col-span-2">Date</div>
              <div className="col-span-2">Code</div>
              <div className="col-span-5">Investor</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-1 text-right">%</div>
            </div>
            {stats?.invalidRows.slice(0, 8).map((row, idx) => (
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