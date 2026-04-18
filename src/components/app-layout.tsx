'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Table2, 
  Network, 
  AlertTriangle,
  BarChart3,
  Search
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/data', label: 'Master Table', icon: Table2 },
  { href: '/visualize', label: 'Relationship Map', icon: Network },
  { href: '/audit', label: 'Audit Log', icon: AlertTriangle },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950">
      <aside className="w-16 hover:w-48 group border-r border-slate-800 bg-slate-950/50 flex flex-col transition-all duration-200 overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-terminal-amber flex-shrink-0" />
          <span className="text-sm font-semibold text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Bursa Intel
          </span>
        </div>

        <nav className="flex-1 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors relative ${
                  isActive 
                    ? 'text-terminal-amber bg-slate-800/50' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-terminal-amber" />
                )}
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-sm text-slate-300 placeholder:text-slate-600 w-0 group-hover:w-24 focus:w-24 outline-none transition-all"
            />
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}