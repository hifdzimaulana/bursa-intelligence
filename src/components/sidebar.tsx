'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Table2, 
  Network, 
  BarChart3,
  Search,
  AlertTriangle
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const navItems = [
  { href: '/', label: 'Market Pulse', icon: LayoutDashboard },
  { href: '/table', label: 'Master Table', icon: Table2 },
  { href: '/visualize', label: 'Relationship Map', icon: Network },
];

const quickActions = [
  { href: '/audit', label: 'System Alerts', icon: AlertTriangle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/table?search=${encodeURIComponent(searchQuery.trim())}`, { scroll: false });
      setSearchQuery('');
      setShowSearch(false);
    }
  };

  const handleQuickSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowSearch(false);
    }
  };

  return (
    <aside 
      className="w-16 hover:w-60 group border-r border-slate-800 bg-[#020617] flex flex-col transition-all duration-200 overflow-hidden relative z-50 flex-shrink-0"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="p-3 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-terminal-amber/10 border border-terminal-amber/30 flex items-center justify-center flex-shrink-0">
          <BarChart3 className="w-4 h-4 text-terminal-amber" />
        </div>
        <span className="text-sm font-bold text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200">
          Bursa Intel
        </span>
      </div>

      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 mb-1 text-sm transition-all duration-200 relative ${
              isActive(item.href) 
                ? 'text-terminal-amber bg-terminal-amber/5' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {isActive(item.href) && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-terminal-amber rounded-r" />
            )}
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 text-sm">
              {item.label}
            </span>
          </Link>
        ))}

        <div className="mt-6 pt-4 border-t border-slate-800">
          <p className="px-3 text-xs text-slate-600 uppercase tracking-wider mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
            System
          </p>
          {quickActions.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 mb-1 text-sm transition-all duration-200 relative ${
                isActive(item.href) 
                  ? 'text-red-400 bg-red-900/10' 
                  : 'text-slate-500 hover:text-red-400 hover:bg-slate-800/50'
              }`}
            >
              {isActive(item.href) && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-red-400 rounded-r" />
              )}
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 text-sm">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </nav>

      <div className="p-3 border-t border-slate-800">
        {showSearch ? (
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleQuickSearch}
              onBlur={() => {
                if (!searchQuery) setShowSearch(false);
              }}
              className="bg-slate-900 border border-slate-700 text-sm text-slate-300 placeholder:text-slate-600 w-full px-2 py-1 outline-none focus:border-terminal-amber"
              autoFocus
            />
          </form>
        ) : (
          <button
            onClick={() => {
              setShowSearch(true);
              setTimeout(() => searchInputRef.current?.focus(), 50);
            }}
            className="flex items-center gap-2 w-full text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Search className="w-4 h-4 flex-shrink-0" />
            <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 text-sm">
              Search
            </span>
          </button>
        )}
      </div>
    </aside>
  );
}