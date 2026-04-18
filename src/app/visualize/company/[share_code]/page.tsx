'use client';

import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Loader2, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const NetworkGraph = dynamic(
  () => import('@/components/network-graph/network-graph'),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full bg-[#020617]"><Loader2 className="w-6 h-6 animate-spin text-terminal-amber" /></div> }
);

export default function CompanyVisualizePage() {
  const searchParams = useSearchParams();
  const shareCode = searchParams.get('share_code') || searchParams.get('code');

  return (
    <div className="w-full h-full">
      <NetworkGraph 
        companyCode={shareCode || ''} 
        enableUrlState={true}
        seedType="company"
      />
    </div>
  );
}