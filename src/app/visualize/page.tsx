'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Network, Search, Loader2 } from 'lucide-react';

export default function VisualizePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'investor' | 'company'>('investor');
  const [loading, setLoading] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    if (searchType === 'investor') {
      const slug = searchQuery.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      router.push(`/visualize/investor/${slug}?name=${encodeURIComponent(searchQuery)}`, { scroll: false });
    } else {
      router.push(`/visualize/company/${searchQuery.toUpperCase()}?code=${searchQuery.toUpperCase()}`, { scroll: false });
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#020617]">
      <div className="max-w-xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-terminal-amber/10 border border-terminal-amber/30 mb-4">
            <Network className="w-8 h-8 text-terminal-amber" />
          </div>
          <h1 className="text-2xl font-bold text-slate-200 mb-2">Relationship Map</h1>
          <p className="text-slate-500">Explore 3rd-degree ownership networks</p>
        </div>

        <div className="border border-slate-800 p-6">
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

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchType === 'investor' ? 'Enter investor name...' : 'Enter stock code (e.g., AADI)...'}
                className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-terminal-amber"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchQuery.trim()}
              className="px-6 py-3 bg-terminal-amber text-slate-950 font-medium hover:bg-terminal-amber/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Explore'}
            </button>
          </form>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 text-center text-sm">
          <div className="p-4 border border-slate-800">
            <div className="text-slate-400 mb-1">3rd DegreeDepth</div>
            <div className="text-terminal-amber font-semibold">Full Network Analysis</div>
          </div>
          <div className="p-4 border border-slate-800">
            <div className="text-slate-400 mb-1">Interactive</div>
            <div className="text-terminal-link font-semibold">Click & Explore</div>
          </div>
        </div>
      </div>
    </div>
  );
}