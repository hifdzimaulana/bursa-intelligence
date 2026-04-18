import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { getInvestorTypeLabel, getInvestorTypeColor, GRAPH_CONFIG } from '@/lib/constants/mappings';

export { getInvestorTypeLabel, getInvestorTypeColor };

export const DEFAULT_DEGREES = GRAPH_CONFIG.DEFAULT_DEGREES;

export interface InvestorTypeDistribution {
  type: string;
  count: number;
  total_shares: number;
}

export interface TopConcentratedIssuer {
  share_code: string;
  issuer_name: string;
  concentration: number;
  total_shares: number;
  holder_count: number;
}

export interface TopHolder {
  investor_name: string;
  share_code: string;
  issuer_name: string;
  percentage: number;
  total_holding_shares: number;
}

export interface InvalidRow {
  id: number;
  date: string;
  share_code: string;
  investor_name: string;
  investor_type: string | null;
  percentage: number | null;
  validation_status: string;
}

export interface DataQuality {
  total_count: number;
  valid_count: number;
  invalid_count: number;
  integrity_percent: number;
}

export interface MarketPulseStats {
  total_entities: number;
  total_investors: number;
  investor_type_distribution: InvestorTypeDistribution[];
  top_concentrated_issuers: TopConcentratedIssuer[];
  data_quality: DataQuality;
  top_holders: TopHolder[];
  invalid_rows: InvalidRow[];
}

const MARKET_PULSE_KEY = ['market-pulse-stats'];

async function fetchMarketPulseStats(): Promise<MarketPulseStats> {
  const supabase = createClient();
  
  const { data, error } = await supabase.rpc('get_market_pulse_stats');
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data as MarketPulseStats;
}

export function useMarketPulseStats() {
  return useQuery({
    queryKey: MARKET_PULSE_KEY,
    queryFn: fetchMarketPulseStats,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export interface FetchInvestorsParams {
  pageParam?: number;
  search?: string;
  investorType?: string;
  limit?: number;
}

export interface InvestorsFetchResult {
  investors: InvestorRecord[];
  nextPage: number | undefined;
  totalCount: number;
}

export interface InvestorRecord {
  id: number;
  investor_name: string;
  investor_type: string | null;
  local_foreign: string | null;
  holdings_count: number;
  top_sector: string | null;
  total_shares: number;
  holdings_scrip: number;
  holdings_scripless: number;
  nationality: string | null;
  domicile: string | null;
  top_holding: { share_code: string; percentage: number } | null;
}

export async function fetchInvestors({ pageParam = 0, search, investorType, limit = 20 }: FetchInvestorsParams): Promise<InvestorsFetchResult> {
  const supabase = createClient();
  
  let query = supabase
    .from('shareholders')
    .select(`
      investor_name,
      investor_type,
      local_foreign,
      share_code,
      issuer_name,
      total_holding_shares,
      percentage,
      holdings_scrip,
      holdings_scripless,
      nationality,
      domicile,
      date
    `, { count: 'exact' });

  if (search && search.trim()) {
    const searchTerm = search.trim().toLowerCase();
    query = query.ilike('investor_name', `%${searchTerm}%`);
  }

  if (investorType && investorType !== 'all') {
    query = query.eq('investor_type', investorType);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const investorMap = new Map<string, InvestorRecord>();
  const shareCodeSet = new Set<string>();
  
  data?.forEach((row) => {
    const name = row.investor_name;
    const existing = investorMap.get(name);
    
    if (!existing) {
      shareCodeSet.clear();
      shareCodeSet.add(row.share_code);
      investorMap.set(name, {
        id: Math.random(),
        investor_name: name,
        investor_type: row.investor_type,
        local_foreign: row.local_foreign,
        holdings_count: 1,
        top_sector: row.issuer_name || null,
        total_shares: row.total_holding_shares || 0,
        holdings_scrip: row.holdings_scrip || 0,
        holdings_scripless: row.holdings_scripless || 0,
        nationality: row.nationality || null,
        domicile: row.domicile || null,
        top_holding: row.share_code ? { share_code: row.share_code, percentage: row.percentage || 0 } : null,
      });
    } else {
      if (!shareCodeSet.has(row.share_code)) {
        existing.holdings_count += 1;
        shareCodeSet.add(row.share_code);
      }
      existing.total_shares += row.total_holding_shares || 0;
      existing.holdings_scrip += row.holdings_scrip || 0;
      existing.holdings_scripless += row.holdings_scripless || 0;
      if ((row.percentage || 0) > (existing.top_holding?.percentage || 0)) {
        existing.top_holding = { share_code: row.share_code, percentage: row.percentage || 0 };
      }
      if (!existing.nationality && row.nationality) {
        existing.nationality = row.nationality;
      }
      if (!existing.domicile && row.domicile) {
        existing.domicile = row.domicile;
      }
    }
  });

  const investors = Array.from(investorMap.values()).slice(pageParam * limit, (pageParam + 1) * limit);
  const totalCount = investorMap.size;

  return {
    investors,
    nextPage: investors.length === limit ? pageParam + 1 : undefined,
    totalCount,
  };
}

export function useInfiniteInvestors(params: Omit<FetchInvestorsParams, 'pageParam'>) {
  return useInfiniteQuery({
    queryKey: ['investors', params.search, params.investorType],
    queryFn: ({ pageParam = 0 }) => fetchInvestors({ ...params, pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export interface FetchEntitiesParams {
  pageParam?: number;
  search?: string;
  limit?: number;
}

export interface EntitiesFetchResult {
  entities: EntityRecord[];
  nextPage: number | undefined;
  totalCount: number;
}

export interface EntityRecord {
  share_code: string;
  issuer_name: string;
  major_holders_count: number;
  concentration_percent: number;
  public_ownership_percent: number;
  total_major_shares: number;
  holdings_scrip: number;
  holdings_scripless: number;
}

export async function fetchEntities({ pageParam = 0, search, limit = 20 }: FetchEntitiesParams): Promise<EntitiesFetchResult> {
  const supabase = createClient();
  
  let query = supabase
    .from('shareholders')
    .select(`
      share_code,
      issuer_name,
      investor_name,
      total_holding_shares,
      percentage,
      holdings_scrip,
      holdings_scripless
    `, { count: 'exact' });

  if (search && search.trim()) {
    const searchTerm = search.trim().toLowerCase();
    query = query.or(`share_code.ilike.%${searchTerm}%,issuer_name.ilike.%${searchTerm}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const entityMap = new Map<string, EntityRecord>();
  
  data?.forEach((row) => {
    const code = row.share_code;
    const existing = entityMap.get(code);
    
    if (!existing) {
      entityMap.set(code, {
        share_code: code,
        issuer_name: row.issuer_name || code,
        major_holders_count: 1,
        concentration_percent: row.percentage || 0,
        public_ownership_percent: Math.max(0, 100 - (row.percentage || 0)),
        total_major_shares: row.total_holding_shares || 0,
        holdings_scrip: row.holdings_scrip || 0,
        holdings_scripless: row.holdings_scripless || 0,
      });
    } else {
      existing.major_holders_count += 1;
      existing.concentration_percent += row.percentage || 0;
      existing.public_ownership_percent = Math.max(0, 100 - existing.concentration_percent);
      existing.total_major_shares += row.total_holding_shares || 0;
      existing.holdings_scrip += row.holdings_scrip || 0;
      existing.holdings_scripless += row.holdings_scripless || 0;
    }
  });

  const entities = Array.from(entityMap.values()).slice(pageParam * limit, (pageParam + 1) * limit);
  const totalCount = entityMap.size;

  return {
    entities,
    nextPage: entities.length === limit ? pageParam + 1 : undefined,
    totalCount,
  };
}

export function useInfiniteEntities(params: Omit<FetchEntitiesParams, 'pageParam'>) {
  return useInfiniteQuery({
    queryKey: ['entities', params.search],
    queryFn: ({ pageParam = 0 }) => fetchEntities({ ...params, pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export interface SearchResult {
  id: string;
  name: string;
  type: 'investor' | 'company';
  metadata?: Record<string, unknown>;
}

export async function searchEntities(query: string, type: 'investor' | 'company'): Promise<SearchResult[]> {
  const supabase = createClient();
  
  let queryBuilder;
  
  if (type === 'investor') {
    queryBuilder = supabase
      .from('shareholders')
      .select('investor_name, investor_type')
      .ilike('investor_name', `%${query}%`)
      .limit(20);
  } else {
    queryBuilder = supabase
      .from('shareholders')
      .select('share_code, issuer_name')
      .or(`share_code.ilike.%${query}%,issuer_name.ilike.%${query}%`)
      .limit(20);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    throw new Error(error.message);
  }

  const seen = new Set<string>();
  const results: SearchResult[] = [];

  if (type === 'investor') {
    (data as Array<{ investor_name: string; investor_type: string | null }>)?.forEach((row) => {
      const key = row.investor_name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          id: `investor-${row.investor_name}`,
          name: row.investor_name,
          type: 'investor',
          metadata: { investor_type: row.investor_type },
        });
      }
    });
  } else {
    (data as Array<{ share_code: string; issuer_name: string | null }>)?.forEach((row) => {
      const key = row.share_code.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          id: `company-${row.share_code}`,
          name: row.issuer_name || row.share_code,
          type: 'company',
          metadata: { share_code: row.share_code },
        });
      }
    });
  }

  return results;
}

export function useSearchEntities(query: string, type: 'investor' | 'company') {
  return useQuery({
    queryKey: ['search', query, type],
    queryFn: () => searchEntities(query, type),
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}

export interface NetworkNode {
  id: string;
  name: string;
  type: 'investor' | 'company';
  val?: number;
}

export interface NetworkLink {
  source: string;
  target: string;
  percentage: number;
}

export async function fetchInvestorNetwork(investorName: string, degrees: 1 | 2 | 3 = 3): Promise<{ nodes: NetworkNode[]; links: NetworkLink[] }> {
  const supabase = createClient();
  
  const nodes: NetworkNode[] = [];
  const links: NetworkLink[] = [];
  const nodeIds = new Set<string>();

  const investorNode: NetworkNode = {
    id: `investor-${investorName}`,
    name: investorName,
    type: 'investor',
    val: 30,
  };
  nodes.push(investorNode);
  nodeIds.add(investorNode.id);

  const { data: directHoldings, error: directError } = await supabase
    .from('shareholders')
    .select('share_code, issuer_name, percentage, total_holding_shares')
    .ilike('investor_name', `%${investorName}%`)
    .order('percentage', { ascending: false })
    .limit(50);

  if (directError) throw new Error(directError.message);

  directHoldings?.forEach((holding) => {
    const companyId = `company-${holding.share_code}`;
    if (!nodeIds.has(companyId)) {
      nodes.push({
        id: companyId,
        name: holding.issuer_name || holding.share_code,
        type: 'company',
        val: 15,
      });
      nodeIds.add(companyId);
    }

    links.push({
      source: investorNode.id,
      target: companyId,
      percentage: holding.percentage || 0,
    });
  });

  if (degrees >= 2) {
    const companyCodes = directHoldings?.map((h) => h.share_code) || [];
    
    if (companyCodes.length > 0) {
      const { data: secondDegreeData, error: secondError } = await supabase
        .from('shareholders')
        .select('share_code, issuer_name, investor_name, percentage')
        .in('share_code', companyCodes)
        .not('investor_name', 'ilike', `%${investorName}%`)
        .order('percentage', { ascending: false })
        .limit(100);

      if (secondError) throw new Error(secondError.message);

      const seenSecondDegree = new Set<string>();
      
      secondDegreeData?.forEach((row) => {
        const investorId = `investor-${row.investor_name}`;
        
        if (!nodeIds.has(investorId) && !seenSecondDegree.has(investorId) && nodes.length < 150) {
          nodes.push({
            id: investorId,
            name: row.investor_name,
            type: 'investor',
            val: 8,
          });
          nodeIds.add(investorId);
          seenSecondDegree.add(investorId);
        }

        if (nodeIds.has(investorId)) {
          links.push({
            source: investorId,
            target: `company-${row.share_code}`,
            percentage: row.percentage || 0,
          });
        }
      });

      if (degrees >= 3) {
        const secondDegreeInvestorNames = Array.from(seenSecondDegree).map(id => id.replace('investor-', ''));
        
        if (secondDegreeInvestorNames.length > 0) {
          const { data: thirdDegreeData, error: thirdError } = await supabase
            .from('shareholders')
            .select('share_code, issuer_name, investor_name, percentage')
            .in('investor_name', secondDegreeInvestorNames)
            .not('share_code', 'in', companyCodes)
            .order('percentage', { ascending: false })
            .limit(100);

          if (!thirdError && thirdDegreeData) {
            const seenThirdDegree = new Set<string>();
            
            thirdDegreeData?.forEach((row) => {
              const companyId3 = `company-${row.share_code}`;
              
              if (!nodeIds.has(companyId3) && nodes.length < 200) {
                nodes.push({
                  id: companyId3,
                  name: row.issuer_name || row.share_code,
                  type: 'company',
                  val: 5,
                });
                nodeIds.add(companyId3);
              }

              if (nodeIds.has(companyId3)) {
                const secondInvestorId = `investor-${row.investor_name}`;
                if (nodeIds.has(secondInvestorId)) {
                  links.push({
                    source: secondInvestorId,
                    target: companyId3,
                    percentage: row.percentage || 0,
                  });
                }
              }
            });
          }
        }
      }
    }
  }

  return { nodes, links };
}

export function useInvestorNetwork(investorName: string, degrees: 1 | 2 | 3 = 3) {
  return useQuery({
    queryKey: ['network', investorName, degrees],
    queryFn: () => fetchInvestorNetwork(investorName, degrees),
    enabled: !!investorName,
    staleTime: 10 * 60 * 1000,
  });
}