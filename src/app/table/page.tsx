'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, Loader2, ChevronDown, Building2, Users, X } from 'lucide-react';
import { useInfiniteInvestors, useInfiniteEntities } from '@/lib/queries/market-pulse';
import { INVESTOR_TYPE_OPTIONS, getInvestorTypeLabel, getInvestorTypeColor } from '@/lib/constants/mappings';
import InvestorTypeBadge from '@/components/investor-type-badge';

function TableContent() {
  const searchParams = useSearchParams();
  const initialView = searchParams.get('view') || 'investors';
  const initialFilter = searchParams.get('filter') || '';
  
  const [activeTab, setActiveTab] = useState<'investors' | 'entities'>(initialView as 'investors' | 'entities');
  const [searchQuery, setSearchQuery] = useState('');
  const [investorTypeFilter, setInvestorTypeFilter] = useState(initialFilter || 'all');
  
  const investorTypeRef = useRef<HTMLDivElement>(null);
  const [showInvestorTypeDropdown, setShowInvestorTypeDropdown] = useState(false);

  const {
    data: investorData,
    fetchNextPage: fetchMoreInvestors,
    hasNextPage: hasMoreInvestors,
    isFetchingNextPage: isLoadingMoreInvestors,
    isLoading: isLoadingInvestors,
  } = useInfiniteInvestors({ search: searchQuery, investorType: investorTypeFilter });

  const {
    data: entityData,
    fetchNextPage: fetchMoreEntities,
    hasNextPage: hasMoreEntities,
    isFetchingNextPage: isLoadingMoreEntities,
    isLoading: isLoadingEntities,
  } = useInfiniteEntities({ search: searchQuery });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (investorTypeRef.current && !investorTypeRef.current.contains(event.target as Node)) {
        setShowInvestorTypeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleScroll = useCallback(() => {
    if (activeTab === 'investors' && hasMoreInvestors && !isLoadingMoreInvestors) {
      fetchMoreInvestors();
    } else if (activeTab === 'entities' && hasMoreEntities && !isLoadingMoreEntities) {
      fetchMoreEntities();
    }
  }, [activeTab, hasMoreInvestors, isLoadingMoreInvestors, fetchMoreInvestors, hasMoreEntities, isLoadingMoreEntities, fetchMoreEntities]);

  useEffect(() => {
    const handleScrollEvent = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (window.scrollY >= scrollable - 200) {
        handleScroll();
      }
    };
    window.addEventListener('scroll', handleScrollEvent);
    return () => window.removeEventListener('scroll', handleScrollEvent);
  }, [handleScroll]);

  const investors = investorData?.pages.flatMap(page => page.investors) || [];
  const entities = entityData?.pages.flatMap(page => page.entities) || [];

  const renderInvestorCard = (investor: {
    investor_name: string;
    investor_type: string | null;
    local_foreign: string | null;
    holdings_count: number;
    top_holding: { share_code: string; percentage: number } | null;
    nationality: string | null;
    domicile: string | null;
  }) => {
    const displayName = investor.investor_name.length > 31 
      ? investor.investor_name.slice(0, 31) + '...' 
      : investor.investor_name;
    
    const locationLabel = investor.local_foreign === 'F' ? 'Foreign' : investor.local_foreign === 'L' ? 'Local' : null;
    
    return (
    <Link
      key={investor.investor_name}
      href={`/table/investor/${encodeURIComponent(investor.investor_name)}`}
      className="block bg-[#020617] border border-slate-800 p-4 hover:border-slate-600 transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <h3 className="text-slate-200 font-medium truncate group-hover:text-terminal-amber transition-colors">
                {displayName}
              </h3>
              <div className="flex items-center gap-2">
                <InvestorTypeBadge code={investor.investor_type} size="sm" />
                {locationLabel && (
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    investor.local_foreign === 'F' 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {locationLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            <span className="text-slate-500">Holdings</span>
            <p className="text-slate-300 font-mono">{investor.holdings_count}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {investor.top_holding && (
            <div className="text-right">
              <span className="text-xs text-slate-500">Top Holding</span>
              <p className="text-terminal-amber font-mono text-sm">{investor.top_holding.share_code}</p>
              <p className="text-slate-400 text-xs">{(investor.top_holding.percentage || 0).toFixed(2)}%</p>
            </div>
          )}
        </div>
      </div>
    </Link>
  )};

  const renderEntityCard = (entity: {
    share_code: string;
    issuer_name: string;
    major_holders_count: number;
    concentration_percent: number;
    public_ownership_percent: number;
  }) => (
    <Link
      key={entity.share_code}
      href={`/table/entity/${encodeURIComponent(entity.share_code)}`}
      className="block bg-[#020617] border border-slate-800 p-4 hover:border-slate-600 transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h3 className="text-terminal-amber font-mono font-medium group-hover:text-terminal-amber/80 transition-colors">
              {entity.share_code}
            </h3>
            <p className="text-slate-400 text-sm truncate max-w-[200px]">{entity.issuer_name}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500">Public Ownership</span>
          <p className="text-slate-300 font-mono text-lg">{(entity.public_ownership_percent || 0).toFixed(1)}%</p>
          <span className="text-xs text-slate-500">{entity.major_holders_count} holders</span>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-slate-200 mb-4">Data Explorer</h1>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'investors' ? 'Search investors...' : 'Search entities (ticker or name)...'}
              className="w-full pl-11 pr-4 py-2.5 bg-[#020617] border border-slate-700 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-terminal-amber"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {activeTab === 'investors' && (
            <div className="relative" ref={investorTypeRef}>
              <button
                onClick={() => setShowInvestorTypeDropdown(!showInvestorTypeDropdown)}
                className="flex items-center justify-between gap-2 px-4 py-2.5 bg-[#020617] border border-slate-700 text-slate-300 min-w-[160px]"
              >
                <span>{INVESTOR_TYPE_OPTIONS.find(o => o.value === investorTypeFilter)?.label || 'All Types'}</span>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>
              {showInvestorTypeDropdown && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-[#020617] border border-slate-700 z-50 max-h-64 overflow-auto">
                  {INVESTOR_TYPE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setInvestorTypeFilter(option.value);
                        setShowInvestorTypeDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-slate-800 ${
                        investorTypeFilter === option.value ? 'text-terminal-amber bg-slate-800' : 'text-slate-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveTab('investors')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'investors'
                ? 'bg-terminal-amber text-slate-950'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-700'
            }`}
          >
            Investors
          </button>
          <button
            onClick={() => setActiveTab('entities')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'entities'
                ? 'bg-terminal-amber text-slate-950'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-700'
            }`}
          >
            Entities (Emiten)
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'investors' ? (
          isLoadingInvestors ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-terminal-amber" />
            </div>
          ) : investors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Users className="w-12 h-12 mb-4 opacity-50" />
              <p>No investors found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {investors.map(renderInvestorCard)}
              {hasMoreInvestors && (
                <div className="col-span-full flex justify-center py-4">
                  {isLoadingMoreInvestors ? (
                    <Loader2 className="w-5 h-5 animate-spin text-terminal-amber" />
                  ) : (
                    <button
                      onClick={() => fetchMoreInvestors()}
                      className="text-slate-400 hover:text-slate-200 text-sm"
                    >
                      Load more
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        ) : (
          isLoadingEntities ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-terminal-amber" />
            </div>
          ) : entities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Building2 className="w-12 h-12 mb-4 opacity-50" />
              <p>No entities found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {entities.map(renderEntityCard)}
              {hasMoreEntities && (
                <div className="col-span-full flex justify-center py-4">
                  {isLoadingMoreEntities ? (
                    <Loader2 className="w-5 h-5 animate-spin text-terminal-amber" />
                  ) : (
                    <button
                      onClick={() => fetchMoreEntities()}
                      className="text-slate-400 hover:text-slate-200 text-sm"
                    >
                      Load more
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default function TablePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-terminal-amber" />
      </div>
    }>
      <TableContent />
    </Suspense>
  );
}