export const INVESTOR_TYPE_MAPPING: Record<string, { label: string; color: string; description?: string }> = {
  ID: { label: 'Individual', color: '#22c55e', description: 'Individual retail investors' },
  CP: { label: 'Corporate', color: '#3b82f6', description: 'Domestic corporate entities' },
  IB: { label: 'Investment Bank', color: '#8b5cf6', description: 'Investment banks and securities firms' },
  IS: { label: 'Insurance', color: '#f59e0b', description: 'Insurance companies' },
  MF: { label: 'Mutual Fund', color: '#ec4899', description: 'Mutual funds and collective investment schemes' },
  SC: { label: 'Securities Company', color: '#06b6d4', description: 'Securities companies and brokers' },
  OT: { label: 'Others', color: '#64748b', description: 'Other entity types' },
  FI: { label: 'Financial Institution', color: '#14b8a6', description: 'Banks and other financial institutions' },
  FD: { label: 'Foreign Individual', color: '#f97316', description: 'Foreign individual investors' },
  FC: { label: 'Foreign Corporate', color: '#a855f7', description: 'Foreign corporate investors' },
  PF: { label: 'Pension Fund', color: '#84cc16', description: 'Pension and retirement funds' },
  RS: { label: 'Restricted', color: '#ef4444', description: 'Restricted or limited ownership' },
  SA: { label: 'Securities Account', color: '#eab308', description: 'Securities account holders' },
  UK: { label: 'Unknown', color: '#475569', description: 'Unclassified or unknown investor type' },
};

export function getInvestorTypeLabel(code: string | null | undefined): string {
  if (!code) return 'Unknown';
  return INVESTOR_TYPE_MAPPING[code]?.label || code;
}

export function getInvestorTypeColor(code: string | null | undefined): string {
  if (!code) return INVESTOR_TYPE_MAPPING.UK.color;
  return INVESTOR_TYPE_MAPPING[code]?.color || INVESTOR_TYPE_MAPPING.UK.color;
}

export function getInvestorTypeInfo(code: string | null | undefined): { label: string; color: string; description?: string } {
  if (!code) return INVESTOR_TYPE_MAPPING.UK;
  return INVESTOR_TYPE_MAPPING[code] || INVESTOR_TYPE_MAPPING.UK;
}

export const INVESTOR_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'ID', label: 'Individual' },
  { value: 'CP', label: 'Corporate' },
  { value: 'IB', label: 'Investment Bank' },
  { value: 'IS', label: 'Insurance' },
  { value: 'MF', label: 'Mutual Fund' },
  { value: 'SC', label: 'Securities Company' },
  { value: 'OT', label: 'Others' },
  { value: 'FI', label: 'Financial Institution' },
  { value: 'FD', label: 'Foreign Individual' },
  { value: 'FC', label: 'Foreign Corporate' },
  { value: 'PF', label: 'Pension Fund' },
  { value: 'RS', label: 'Restricted' },
  { value: 'SA', label: 'Securities Account' },
];

export const GRAPH_CONFIG = {
  DEFAULT_DEGREES: 3,
  FORCE_MANY_BODY_STRENGTH: -300,
  LINK_DISTANCE: 120,
  NODE_LIMIT: 600,
  COOLDOWN_TICKS: 50,
  VELOCITY_DECAY: 0.15,
  ALPHA_DECAY: 0.02,
} as const;

export const NODE_COLORS = {
  investor: '#ffb020',
  company: '#4da6ff',
  root: '#22c55e',
  dimmed: '#1e293b',
};

export const LINK_COLORS = {
  direct: 'rgba(77, 166, 255, 0.8)',
  degree2: 'rgba(255, 176, 32, 0.5)',
  degree3: 'rgba(148, 163, 184, 0.3)',
  dimmed: 'rgba(30, 41, 59, 0.2)',
};