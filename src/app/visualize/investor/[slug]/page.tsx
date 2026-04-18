'use client';

import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const NetworkGraph = dynamic(
  () => import('@/components/network-graph/network-graph'),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full bg-[#020617]"><Loader2 className="w-6 h-6 animate-spin text-terminal-amber" /></div> }
);

export default function InvestorVisualizePage() {
  const searchParams = useSearchParams();
  const investorName = searchParams.get('name') || searchParams.get('investor');
  const slug = searchParams.get('slug');

  return (
    <div className="w-full h-full">
      <NetworkGraph 
        investorName={investorName || slug?.replace(/-/g, ' ') || ''} 
        enableUrlState={true}
        seedType="investor"
      />
    </div>
  );
}