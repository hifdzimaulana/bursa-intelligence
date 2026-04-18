'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home, Building2, Users } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

export default function Breadcrumbs() {
  const pathname = usePathname();

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      { label: 'Market Pulse', href: '/', icon: <Home className="w-4 h-4" /> },
    ];

    if (pathname.startsWith('/company/')) {
      const shareCode = pathname.split('/company/')[1];
      items.push({
        label: `Issuer: ${shareCode}`,
        href: `/company/${shareCode}`,
        icon: <Building2 className="w-4 h-4" />,
      });
    } else if (pathname.startsWith('/investor/')) {
      const slug = pathname.split('/investor/')[1];
      items.push({
        label: `Investor: ${slug.replace(/-/g, ' ')}`,
        href: `/investor/${slug}`,
        icon: <Users className="w-4 h-4" />,
      });
    } else if (pathname.startsWith('/table')) {
      items.push({
        label: 'Master Table',
        href: '/table',
      });
    } else if (pathname.startsWith('/audit')) {
      items.push({
        label: 'Audit Log',
        href: '/audit',
      });
    } else if (pathname.startsWith('/visualize')) {
      if (pathname.includes('/company/')) {
        const shareCode = pathname.split('/company/')[1];
        items.push({
          label: 'Relationship Map',
          href: '/visualize',
        });
        items.push({
          label: shareCode,
          href: `/visualize/company/${shareCode}`,
          icon: <Building2 className="w-4 h-4" />,
        });
      } else if (pathname.includes('/investor/')) {
        const parts = pathname.split('/investor/');
        const slug = parts[1]?.split('?')[0] || '';
        const nameParam = new URLSearchParams(parts[1]?.split('?')[1] || '').get('name') || slug.replace(/-/g, ' ');
        items.push({
          label: 'Relationship Map',
          href: '/visualize',
        });
        items.push({
          label: nameParam,
          href: `/visualize/investor/${slug}`,
          icon: <Users className="w-4 h-4" />,
        });
      } else {
        items.push({
          label: 'Relationship Map',
          href: '/visualize',
        });
      }
    }

    return items;
  };

  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center gap-1 px-4 py-2 border-b border-slate-800 bg-slate-950/50 text-sm">
      {breadcrumbs.map((item, index) => (
        <div key={item.href} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="w-4 h-4 text-slate-600 mx-1" />
          )}
          {index === breadcrumbs.length - 1 ? (
            <div className="flex items-center gap-1.5 text-slate-200 font-medium">
              {item.icon}
              <span>{item.label}</span>
            </div>
          ) : (
            <Link
              href={item.href}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}