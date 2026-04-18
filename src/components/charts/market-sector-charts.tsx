'use client';

import { useMemo } from 'react';
import { Doughnut, PolarArea } from 'react-chartjs-2';
import {
  getChartDefaults,
  getPolarChartDefaults,
  BLOOMBERG_COLORS,
  INVESTOR_TYPE_LABELS,
  formatChartNumber,
  getInvestorTypeColor,
} from '@/lib/chart-config';

interface InvestorTypeData {
  type: string;
  count: number;
  totalShares: number;
}

interface MarketSectorChartsProps {
  localPercent: number;
  foreignPercent: number;
  investorTypes: InvestorTypeData[];
}

export default function MarketSectorCharts({
  localPercent,
  foreignPercent,
  investorTypes,
}: MarketSectorChartsProps) {
  const ownershipChartData = useMemo(() => {
    return {
      labels: ['Local (L)', 'Foreign (F)'],
      datasets: [
        {
          data: [localPercent || 0, foreignPercent || 0],
          backgroundColor: [BLOOMBERG_COLORS.local, BLOOMBERG_COLORS.foreign],
          borderColor: [BLOOMBERG_COLORS.local, BLOOMBERG_COLORS.foreign],
          borderWidth: 1,
          hoverOffset: 4,
        },
      ],
    };
  }, [localPercent, foreignPercent]);

  const investorTypeChartData = useMemo(() => {
    if (!investorTypes || investorTypes.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [
          {
            data: [1],
            backgroundColor: [BLOOMBERG_COLORS.slate[700]],
            borderColor: [BLOOMBERG_COLORS.slate[600]],
            borderWidth: 1,
          },
        ],
      };
    }

    const sortedTypes = [...investorTypes].sort((a, b) => b.totalShares - a.totalShares);
    
    return {
      labels: sortedTypes.map(t => INVESTOR_TYPE_LABELS[t.type] || t.type),
      datasets: [
        {
          data: sortedTypes.map(t => t.totalShares),
          backgroundColor: sortedTypes.map(t => getInvestorTypeColor(t.type) + '99'),
          borderColor: sortedTypes.map(t => getInvestorTypeColor(t.type)),
          borderWidth: 1,
        },
      ],
    };
  }, [investorTypes]);

  const ownershipOptions = useMemo(() => {
    const defaults = getChartDefaults();
    return {
      ...defaults,
      plugins: {
        ...defaults.plugins,
        tooltip: {
          ...defaults.plugins?.tooltip,
          callbacks: {
            label: (context: any) => {
              const value = context.parsed;
              return `${context.label}: ${value.toFixed(2)}%`;
            },
          },
        },
      },
    };
  }, []);

  const polarOptions = useMemo(() => {
    const defaults = getPolarChartDefaults();
    return {
      ...defaults,
      plugins: {
        ...defaults.plugins,
        tooltip: {
          ...defaults.plugins?.tooltip,
          callbacks: {
            label: (context: any) => {
              const value = context.parsed;
              return `${context.label}: ${formatChartNumber(value)} shares`;
            },
          },
        },
      },
    };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="glass-panel p-5 rounded-lg border border-slate-700/50">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2v10l7 4" />
          </svg>
          Ownership Mix
        </h3>
        <div className="h-48">
          <Doughnut data={ownershipChartData} options={ownershipOptions} />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-800/50">
          <div className="text-center">
            <div className="text-lg font-bold font-mono text-terminal-amber">
              {(localPercent || 0).toFixed(1)}%
            </div>
            <div className="text-xs text-slate-500">Local</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold font-mono text-terminal-link">
              {(foreignPercent || 0).toFixed(1)}%
            </div>
            <div className="text-xs text-slate-500">Foreign</div>
          </div>
        </div>
      </div>

      <div className="glass-panel p-5 rounded-lg border border-slate-700/50">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="12 2 2 12 7 21 17 21 22 12 12 2" />
          </svg>
          Investor Type Distribution
        </h3>
        <div className="h-48">
          <PolarArea data={investorTypeChartData} options={polarOptions} />
        </div>
        <div className="mt-4 pt-4 border-t border-slate-800/50">
          <div className="flex flex-wrap gap-2 justify-center">
            {investorTypes?.slice(0, 5).map((item) => (
              <div
                key={item.type}
                className="flex items-center gap-1.5 px-2 py-1 bg-slate-900/50 border border-slate-800/50"
              >
                <div
                  className="w-2 h-2"
                  style={{ backgroundColor: getInvestorTypeColor(item.type) }}
                />
                <span className="text-xs font-mono text-slate-400">
                  {INVESTOR_TYPE_LABELS[item.type] || item.type}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  {formatChartNumber(item.totalShares)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}