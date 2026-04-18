'use client';

export function normalizeIssuerName(name: string): string {
  if (!name || typeof name !== 'string') return '';
  
  let normalized = name.trim();
  
  normalized = normalized.replace(/\s+/g, ' ');
  
  const tbkPatterns = [
    { pattern: /\bTBK\b\.?$/i, replacement: 'TBK.' },
    { pattern: /\bTbk\b\.?$/i, replacement: 'Tbk.' },
    { pattern: /\btbk\b\.?$/i, replacement: 'Tbk.' },
    { pattern: /^TBK\s+/i, replacement: 'TBK ' },
  ];
  
  for (const { pattern, replacement } of tbkPatterns) {
    normalized = normalized.replace(pattern, replacement);
  }
  
  const ptPatterns = [
    { pattern: /\bPT\b\.?$/i, replacement: 'PT.' },
    { pattern: /\bPt\b\.?$/i, replacement: 'PT.' },
    { pattern: /\bpt\b\.?$/i, replacement: 'PT.' },
    { pattern: /^PT\s+/i, replacement: 'PT ' },
  ];
  
  for (const { pattern, replacement } of ptPatterns) {
    normalized = normalized.replace(pattern, replacement);
  }
  
  normalized = normalized.replace(/\bPT\s+TK\b\.?/gi, 'PT Tk');
  
  normalized = normalized.replace(/\s+PERSERO\b\.?$/gi, ' (PERSERO)');
  
  normalized = normalized.replace(/\s+\(Public Listed Company\)\.?\s*$/gi, ' (PLC)');
  
  normalized = normalized.replace(/\s+\(Listed\)\.?\s*$/gi, ' (Listed)');
  
  const removePatterns = [
    /\s*\( Incorporated\)\.?\s*$/gi,
    /\s*\( Inc\)\.?\s*$/gi,
    /\s*\( Limited\)\.?\s*$/gi,
    /\s*\( Ltd\)\.?\s*$/gi,
    /\s*\( Corp\)\.?\s*$/gi,
    /\s*\(Co\)\.?\s*$/gi,
  ];
  
  for (const pattern of removePatterns) {
    normalized = normalized.replace(pattern, '');
  }
  
  normalized = normalized.replace(/^[A-Z]{4,}\s+/, (match) => match.charAt(0) + match.slice(1).toLowerCase() + ' ');
  
  if (normalized.length > 100) {
    normalized = normalized.substring(0, 97) + '...';
  }
  
  return normalized;
}

export function normalizeShareCode(code: string): string {
  if (!code || typeof code !== 'string') return '';
  
  let normalized = code.trim().toUpperCase();
  
  normalized = normalized.replace(/[^A-Z0-9\.]/g, '');
  
  normalized = normalized.replace(/\./g, '');
  
  if (normalized.length < 2 || normalized.length > 12) {
    return '';
  }
  
  return normalized;
}

export function normalizeInvestorType(type: string): string {
  if (!type || typeof type !== 'string') return 'UK';
  
  const normalized = type.trim().toUpperCase();
  
  const validTypes = ['CP', 'ID', 'PF', 'FI', 'RS', 'SA', 'UK'];
  
  if (validTypes.includes(normalized)) {
    return normalized;
  }
  
  const typeMapping: Record<string, string> = {
    'CORPORATE': 'CP',
    'CORP': 'CP',
    'INDIVIDUAL': 'ID',
    'IND': 'ID',
    'PENSION': 'PF',
    'PENSION FUND': 'PF',
    'PF': 'PF',
    'FINANCIAL': 'FI',
    'FINANCIAL INSTITUTION': 'FI',
    'BANK': 'FI',
    'INSURANCE': 'FI',
    'RESTRICTED': 'RS',
    'RS': 'RS',
    'SAVINGS': 'SA',
    'PROVIDENT': 'SA',
    'SA': 'SA',
    'UNKNOWN': 'UK',
  };
  
  for (const [key, value] of Object.entries(typeMapping)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  
  return 'UK';
}

export function normalizeLocalForeign(value: string): string {
  if (!value || typeof value !== 'string') return 'L';
  
  const normalized = value.trim().toUpperCase();
  
  if (normalized === 'F' || normalized === 'FOREIGN' || normalized === 'FOREIGNER') {
    return 'F';
  }
  
  if (normalized === 'L' || normalized === 'LOCAL' || normalized === 'DOMESTIC') {
    return 'L';
  }
  
  if (normalized === 'N' || normalized === 'NATIONAL') {
    return 'L';
  }
  
  return 'L';
}

export function normalizePercentage(value: number | string | null): number {
  if (value === null || value === undefined) return 0;
  
  let num: number;
  
  if (typeof value === 'string') {
    const cleaned = value.replace(/[%,]/g, '').trim();
    num = parseFloat(cleaned);
  } else {
    num = Number(value);
  }
  
  if (isNaN(num) || num < 0) return 0;
  if (num > 100) return 100;
  
  return Math.round(num * 10000) / 10000;
}

export function normalizeTotalShares(value: number | string | null): number {
  if (value === null || value === undefined) return 0;
  
  let num: number;
  
  if (typeof value === 'string') {
    const cleaned = value.replace(/[,.\s]/g, '').trim();
    num = parseInt(cleaned, 10);
  } else {
    num = Math.floor(Number(value));
  }
  
  if (isNaN(num) || num < 0) return 0;
  
  return num;
}

export function formatSharesCompact(value: number): string {
  if (value >= 1e12) return (value / 1e12).toFixed(2) + 'T';
  if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
  if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
  if (value >= 1e3) return (value / 1e3).toFixed(2) + 'K';
  return value.toLocaleString('id-ID');
}

export function formatPercentage(value: number, decimals = 2): string {
  if (value === null || value === undefined) return '0.00';
  return value.toFixed(decimals) + '%';
}

export function validateShareholderRow(row: any): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (!row.share_code || row.share_code.trim() === '') {
    issues.push('Missing share_code');
  }
  
  if (!row.investor_name || row.investor_name.trim() === '') {
    issues.push('Missing investor_name');
  }
  
  if (row.total_holding_shares === null || row.total_holding_shares === undefined || row.total_holding_shares < 0) {
    issues.push('Invalid total_holding_shares');
  }
  
  if (row.percentage !== null && row.percentage !== undefined) {
    if (row.percentage < 0 || row.percentage > 100) {
      issues.push('Invalid percentage range');
    }
  }
  
  if (!row.local_foreign || (row.local_foreign !== 'L' && row.local_foreign !== 'F')) {
    issues.push('Invalid local_foreign value');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
  };
}