'use client';

import { useState, useMemo, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Network, Search, Loader2, X, ChevronRight, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { useSearchEntities, useInvestorNetwork } from '@/lib/queries/market-pulse';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

const BLOOMBERG_COLORS = {
  amber: '#ffb020',
  blue: '#4da6ff',
  green: '#22c55e',
  slate: {
    900: '#0f172a',
    800: '#1e293b',
    700: '#334155',
    600: '#475569',
    500: '#64748b',
    400: '#94a3b8',
    300: '#cbd5e1',
    200: '#e2e8f0',
  },
};

interface SearchResultItem {
  id: string;
  name: string;
  type: 'investor' | 'company';
  metadata?: Record<string, unknown>;
}

function VisualizeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('query') || '';
  
  const [searchType, setSearchType] = useState<'investor' | 'company'>('investor');
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [selectedResult, setSelectedResult] = useState<SearchResultItem | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [degrees, setDegrees] = useState<1 | 2>(2);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [graphZoom, setGraphZoom] = useState(1);

  const { data: searchData, isLoading: isSearching } = useSearchEntities(searchInput, searchType);
  
  const { data: networkData, isLoading: isLoadingNetwork, refetch: refetchNetwork } = useInvestorNetwork(
    selectedResult?.name || '',
    degrees
  );

  useEffect(() => {
    if (searchData && searchInput.length >= 2) {
      setSearchResults(searchData);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchData, searchInput]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleSelectResult = (result: SearchResultItem) => {
    setSelectedResult(result);
    setSearchInput(result.name);
    setShowResults(false);
  };

  const handleVisualize = () => {
    if (selectedResult) {
      if (selectedResult.type === 'investor') {
        router.push(`/visualize?query=${encodeURIComponent(selectedResult.name)}`, { scroll: false });
      } else {
        const shareCode = selectedResult.metadata?.share_code as string || selectedResult.name;
        router.push(`/visualize/company/${encodeURIComponent(shareCode)}?code=${encodeURIComponent(shareCode)}`, { scroll: false });
      }
    }
  };

  const handleClear = () => {
    setSelectedResult(null);
    setSearchInput('');
    router.push('/visualize', { scroll: false });
  };

  const graphData = useMemo(() => {
    if (!networkData) return null;
    return {
      nodes: networkData.nodes.map((node) => ({
        ...node,
        color: node.type === 'investor' ? BLOOMBERG_COLORS.amber : BLOOMBERG_COLORS.blue,
      })),
      links: networkData.links.map((link) => ({
        ...link,
        color: BLOOMBERG_COLORS.slate[600],
      })),
    };
  }, [networkData]);

  const nodeCanvasObject = useMemo(() => {
    return (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const label = node.name;
      const fontSize = 12 / globalScale;
      
      if (globalScale < 0.5) return;

      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.fillStyle = node.color || BLOOMBERG_COLORS.slate[400];
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.val || 5, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = BLOOMBERG_COLORS.slate[300];
      ctx.fillText(label, node.x, node.y + (node.val || 5) + fontSize);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-200 flex items-center gap-3">
              <Network className="w-7 h-7 text-terminal-amber" />
              Relationship Map
            </h1>
            <p className="text-slate-500 text-sm mt-1">Explore ownership networks</p>
          </div>
          
          {selectedResult && (
            <div className="flex items-center gap-2">
              <select
                value={degrees}
                onChange={(e) => setDegrees(Number(e.target.value) as 1 | 2)}
                className="px-3 py-1.5 bg-[#020617] border border-slate-700 text-slate-300 text-sm"
              >
                <option value={1}>1st Degree</option>
                <option value={2}>1st + 2nd Degree</option>
              </select>
              <button
                onClick={() => refetchNetwork()}
                className="p-2 text-slate-400 hover:text-slate-200 border border-slate-700"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {!selectedResult && (
          <div className="border border-slate-800 p-6 bg-[#020617]">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSearchType('investor')}
                className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                  searchType === 'investor'
                    ? 'bg-terminal-amber text-slate-950'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-700'
                }`}
              >
                By Investor
              </button>
              <button
                onClick={() => setSearchType('company')}
                className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                  searchType === 'company'
                    ? 'bg-terminal-amber text-slate-950'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-700'
                }`}
              >
                By Company
              </button>
            </div>

            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowResults(true)}
                  placeholder={searchType === 'investor' ? 'Enter investor name...' : 'Enter stock code or company name...'}
                  className="w-full pl-11 pr-10 py-3 bg-slate-900 border border-slate-700 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-terminal-amber"
                />
                {searchInput && (
                  <button
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {showResults && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-[#020617] border border-slate-700 z-50 max-h-64 overflow-auto">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-terminal-amber" />
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="py-4 text-center text-slate-500">
                      No results found
                    </div>
                  ) : (
                    searchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleSelectResult(result)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800 text-left"
                      >
                        <div>
                          <span className="text-slate-200">{result.name}</span>
                          {result.metadata?.investor_type !== undefined && (
                            <span className="ml-2 text-xs text-slate-500">
                              {String(result.metadata.investor_type)}
                            </span>
                          )}
                          {result.metadata?.share_code !== undefined && (
                            <span className="ml-2 text-xs text-terminal-amber font-mono">
                              {String(result.metadata.share_code)}
                            </span>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {selectedResult && (
              <button
                onClick={handleVisualize}
                className="mt-4 w-full py-3 bg-terminal-amber text-slate-950 font-medium hover:bg-terminal-amber/90 flex items-center justify-center gap-2"
              >
                Visualize Network
                <Network className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 relative" ref={containerRef}>
        {!selectedResult ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Network className="w-16 h-16 mb-4 opacity-30" />
            <p>Search and select an entity to visualize</p>
          </div>
        ) : isLoadingNetwork ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-terminal-amber" />
          </div>
        ) : graphData && graphData.nodes.length > 0 ? (
          <div className="absolute inset-0">
            <ForceGraph2D
              graphData={graphData}
              width={dimensions.width}
              height={dimensions.height}
              nodeId="id"
              nodeLabel="name"
              nodeColor="color"
              nodeVal="val"
              linkColor={() => BLOOMBERG_COLORS.slate[600]}
              linkWidth={(link: any) => Math.max(1, (link.percentage || 0) / 10)}
              linkDirectionalArrowLength={4}
              linkDirectionalArrowRelPos={0.9}
              backgroundColor="#020617"
              cooldownTicks={100}
              onEngineStop={() => {}}
              d3AlphaDecay={0.02}
              d3VelocityDecay={0.3}
              nodeCanvasObject={nodeCanvasObject}
            />
            <div className="absolute bottom-4 left-4 flex gap-2">
              <button
                onClick={() => setGraphZoom(Math.max(0.1, graphZoom - 0.1))}
                className="p-2 bg-[#020617] border border-slate-700 text-slate-400 hover:text-slate-200"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setGraphZoom(Math.min(3, graphZoom + 0.1))}
                className="p-2 bg-[#020617] border border-slate-700 text-slate-400 hover:text-slate-200"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute bottom-4 right-4 text-xs text-slate-500">
              {graphData.nodes.length} nodes · {graphData.links.length} connections
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Network className="w-16 h-16 mb-4 opacity-30" />
            <p>No network data available</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VisualizePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-terminal-amber" />
      </div>
    }>
      <VisualizeContent />
    </Suspense>
  );
}