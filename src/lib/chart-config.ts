'use client';

import {
  Chart,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';

Chart.register(
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler
);

export const BLOOMBERG_COLORS = {
  foreign: '#4da6ff',
  local: '#ffb020',
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

export const INVESTOR_TYPE_LABELS: Record<string, string> = {
  CP: 'Corporate',
  ID: 'Individual',
  PF: ' Pension Fund',
  FI: 'Financial Institution',
  RS: ' Restricted',
  SA: ' Savings/Provident',
  UK: 'Unknown',
};

export function getChartDefaults(): any {
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: BLOOMBERG_COLORS.slate[400],
          font: {
            family: '"JetBrains Mono", "SF Mono", "Consolas", monospace',
            size: 11,
          },
          padding: 12,
          usePointStyle: true,
          pointStyle: 'rect',
        },
      },
      tooltip: {
        backgroundColor: BLOOMBERG_COLORS.slate[900],
        titleColor: BLOOMBERG_COLORS.slate[200],
        bodyColor: BLOOMBERG_COLORS.slate[300],
        borderColor: BLOOMBERG_COLORS.slate[700],
        borderWidth: 1,
        titleFont: {
          family: '"JetBrains Mono", "SF Mono", "Consolas", monospace',
          size: 12,
          weight: 'bold',
        },
        bodyFont: {
          family: '"JetBrains Mono", "SF Mono", "Consolas", monospace',
          size: 11,
        },
        padding: 10,
        cornerRadius: 0,
        displayColors: true,
      },
    },
  };
}

export function getPolarChartDefaults(): any {
  return {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        ticks: {
          color: BLOOMBERG_COLORS.slate[500],
          font: {
            family: '"JetBrains Mono", "SF Mono", "Consolas", monospace',
            size: 10,
          },
          backdropColor: 'transparent',
        },
        grid: {
          color: BLOOMBERG_COLORS.slate[800],
        },
        angleLines: {
          color: BLOOMBERG_COLORS.slate[800],
        },
        pointLabels: {
          color: BLOOMBERG_COLORS.slate[400],
          font: {
            family: '"JetBrains Mono", "SF Mono", "Consolas", monospace',
            size: 11,
          },
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: BLOOMBERG_COLORS.slate[400],
          font: {
            family: '"JetBrains Mono", "SF Mono", "Consolas", monospace',
            size: 11,
          },
          padding: 12,
          usePointStyle: true,
          pointStyle: 'rect',
        },
      },
      tooltip: {
        backgroundColor: BLOOMBERG_COLORS.slate[900],
        titleColor: BLOOMBERG_COLORS.slate[200],
        bodyColor: BLOOMBERG_COLORS.slate[300],
        borderColor: BLOOMBERG_COLORS.slate[700],
        borderWidth: 1,
        titleFont: {
          family: '"JetBrains Mono", "SF Mono", "Consolas", monospace',
          size: 12,
          weight: 'bold',
        },
        bodyFont: {
          family: '"JetBrains Mono", "SF Mono", "Consolas", monospace',
          size: 11,
        },
        padding: 10,
        cornerRadius: 0,
        displayColors: true,
      },
    },
  };
}

export function formatChartNumber(value: number): string {
  if (value >= 1e12) return (value / 1e12).toFixed(2) + 'T';
  if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
  if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
  if (value >= 1e3) return (value / 1e3).toFixed(2) + 'K';
  return value.toLocaleString('id-ID');
}

export function getInvestorTypeColor(type: string): string {
  return BLOOMBERG_COLORS.investorTypes[type as keyof typeof BLOOMBERG_COLORS.investorTypes] || BLOOMBERG_COLORS.slate[400];
}