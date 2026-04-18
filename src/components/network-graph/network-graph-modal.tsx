'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { X } from 'lucide-react';

const NetworkGraph = dynamic(
  () => import('@/components/network-graph/network-graph'),
  { ssr: false }
);

interface NetworkGraphModalProps {
  type: 'investor' | 'company';
  id: string;
  name?: string;
  onClose: () => void;
}

export default function NetworkGraphModal({ type, id, name, onClose }: NetworkGraphModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entityName, setEntityName] = useState<string>(name || '');

  useEffect(() => {
    if (!name && type === 'investor') {
      const nameParam = searchParams.get('name');
      if (nameParam) setEntityName(decodeURIComponent(nameParam));
    } else if (!name && type === 'company') {
      setEntityName(id);
    } else if (name) {
      setEntityName(name);
    }
  }, [name, type, id, searchParams]);

  const handleClose = () => {
    if (type === 'investor') {
      router.push('/table');
    } else {
      router.push('/table');
    }
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!entityName) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="relative w-[90vw] h-[85vh] max-w-[1400px] bg-slate-950 border border-slate-700 rounded-lg shadow-2xl overflow-hidden">
        <div className="absolute top-3 left-4 right-4 flex items-center justify-between z-10">
          <div className="glass-panel px-4 py-2 rounded-md border border-slate-600/50">
            <span className="text-sm font-mono text-slate-300">
              {type === 'investor' ? 'Investor' : 'Company'}: <span className="text-terminal-amber">{entityName}</span>
            </span>
          </div>
          <button
            onClick={handleClose}
            className="glass-panel p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-md border border-slate-600/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="absolute bottom-3 left-4 flex gap-4 z-10">
          <div className="glass-panel px-3 py-1.5 rounded-md border border-slate-600/50 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-terminal-amber" />
            <span className="text-xs font-mono text-slate-400">Investor</span>
          </div>
          <div className="glass-panel px-3 py-1.5 rounded-md border border-slate-600/50 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-terminal-link" />
            <span className="text-xs font-mono text-slate-400">Company</span>
          </div>
        </div>

        {type === 'investor' ? (
          <NetworkGraph investorName={entityName} onClose={handleClose} />
        ) : (
          <NetworkGraph companyCode={entityName} onClose={handleClose} />
        )}
      </div>
    </div>
  );
}