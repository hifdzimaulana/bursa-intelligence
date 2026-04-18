import { createClient } from '@/lib/supabase/client';

export interface FetchShareholdersParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FetchShareholdersResult {
  data: any[];
  totalCount: number;
  pageCount: number;
}

const COLUMNS = [
  'id',
  'date',
  'share_code',
  'issuer_name',
  'investor_name',
  'investor_type',
  'local_foreign',
  'nationality',
  'domicile',
  'holdings_scripless',
  'holdings_scrip',
  'total_holding_shares',
  'percentage',
  'validation_status',
];

export async function fetchShareholders({
  page = 1,
  pageSize = 50,
  search,
  sortBy = 'date',
  sortOrder = 'desc',
}: FetchShareholdersParams): Promise<FetchShareholdersResult> {
  const supabase = createClient();

  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  let query = supabase
    .from('shareholders')
    .select(COLUMNS.join(','), { count: 'exact', head: false });

  if (search && search.trim()) {
    const searchTerm = search.trim().toLowerCase();
    query = query.or(`investor_name.ilike.%${searchTerm}%,share_code.ilike.%${searchTerm}%,issuer_name.ilike.%${searchTerm}%`);
  }

  if (sortBy && COLUMNS.includes(sortBy)) {
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
  }

  const { data, error, count } = await query.range(start, end);

  if (error) {
    throw new Error(error.message);
  }

  return {
    data: data || [],
    totalCount: count || 0,
    pageCount: Math.ceil((count || 0) / pageSize),
  };
}

export async function getShareholdersByInvestor(investorName: string): Promise<any[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('shareholders')
    .select('*')
    .ilike('investor_name', `%${investorName}%`)
    .order('total_holding_shares', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function getCompanyOwnership(shareCode: string): Promise<any[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('shareholders')
    .select('*')
    .eq('share_code', shareCode.toUpperCase())
    .order('total_holding_shares', { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function getInvalidRows(page = 1, pageSize = 50): Promise<FetchShareholdersResult> {
  const supabase = createClient();

  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  const { data, error, count } = await supabase
    .from('shareholders')
    .select('*', { count: 'exact' })
    .eq('validation_status', 'INVALID')
    .order('date', { ascending: false })
    .range(start, end);

  if (error) {
    throw new Error(error.message);
  }

  return {
    data: data || [],
    totalCount: count || 0,
    pageCount: Math.ceil((count || 0) / pageSize),
  };
}

export async function getTopHolders(limit = 50): Promise<any[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('shareholders')
    .select('investor_name, share_code, issuer_name, percentage, total_holding_shares, local_foreign')
    .order('percentage', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function getTopIssuers(limit = 50): Promise<any[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('shareholders')
    .select('share_code, issuer_name, total_holding_shares')
    .order('total_holding_shares', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export interface NetworkNode {
  id: string;
  name: string;
  type: 'investor' | 'company';
}

export interface NetworkLink {
  source: string;
  target: string;
  percentage: number;
}

export async function getInvestorNetwork(investorName: string): Promise<{ nodes: NetworkNode[]; links: NetworkLink[] }> {
  const supabase = createClient();

  const { data: shareholders, error } = await supabase
    .from('shareholders')
    .select('share_code, issuer_name, investor_name, percentage')
    .ilike('investor_name', `%${investorName}%`)
    .order('total_holding_shares', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const investorNode: NetworkNode = {
    id: `investor-${investorName}`,
    name: investorName,
    type: 'investor',
  };

  const companyNodes: NetworkNode[] = shareholders?.map((s) => ({
    id: `company-${s.share_code}`,
    name: s.issuer_name || s.share_code,
    type: 'company',
  })) || [];

  const links: NetworkLink[] = shareholders?.map((s) => ({
    source: investorNode.id,
    target: `company-${s.share_code}`,
    percentage: s.percentage || 0,
  })) || [];

  return {
    nodes: [investorNode, ...companyNodes],
    links,
  };
}

export async function getStats(): Promise<any> {
  const supabase = createClient();

  const { data: aumData } = await supabase
    .from('shareholders')
    .select('total_holding_shares');

  const totalAUM = aumData?.reduce((sum, row) => sum + (row.total_holding_shares || 0), 0) || 0;

  const { count: totalCount } = await supabase
    .from('shareholders')
    .select('*', { count: 'exact', head: true });

  const { count: validCount } = await supabase
    .from('shareholders')
    .select('*', { count: 'exact', head: true })
    .eq('validation_status', 'VALID');

  const dataIntegrity = totalCount ? ((validCount || 0) / totalCount) * 100 : 0;

  const { data: companyData } = await supabase.from('shareholders').select('share_code');
  const uniqueCompanies = companyData ? new Set(companyData.map(r => r.share_code)).size : 0;

  const { data: investorData } = await supabase.from('shareholders').select('investor_name');
  const uniqueInvestors = investorData ? new Set(investorData.map(r => r.investor_name)).size : 0;

  const { data: ownershipData } = await supabase
    .from('shareholders')
    .select('local_foreign, total_holding_shares');

  let foreignOwnership = 0;
  let localOwnership = 0;

  ownershipData?.forEach(row => {
    if (row.local_foreign === 'F') foreignOwnership += row.total_holding_shares || 0;
    else if (row.local_foreign === 'L') localOwnership += row.total_holding_shares || 0;
  });

  const totalOwnership = foreignOwnership + localOwnership;
  const foreignPercent = totalOwnership ? (foreignOwnership / totalOwnership) * 100 : 0;
  const localPercent = totalOwnership ? (localOwnership / totalOwnership) * 100 : 0;

  return {
    totalAUM,
    dataIntegrity,
    uniqueCompanies,
    uniqueInvestors,
    foreignPercent,
    localPercent,
  };
}