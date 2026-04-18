'use client';

import { getInvestorTypeLabel, getInvestorTypeColor, getInvestorTypeInfo } from '@/lib/constants/mappings';

interface InvestorTypeBadgeProps {
  code: string | null | undefined;
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function InvestorTypeBadge({ code, showDescription = false, size = 'md' }: InvestorTypeBadgeProps) {
  const info = getInvestorTypeInfo(code);
  const label = getInvestorTypeLabel(code);
  const color = getInvestorTypeColor(code);

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center rounded font-medium ${sizeClasses[size]}`}
      style={{
        backgroundColor: `${color}20`,
        color: color,
      }}
      title={showDescription ? info.description : undefined}
    >
      {label}
    </span>
  );
}