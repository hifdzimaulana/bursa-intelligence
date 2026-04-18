'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ForceGraph2D, { ForceGraphMethods, NodeObject, LinkObject } from 'react-force-graph-2d';
import { Loader2, ZoomIn, ZoomOut, Maximize2, Focus, Eye, EyeOff, X, ChevronRight } from 'lucide-react';
import { GRAPH_CONFIG, NODE_COLORS, LINK_COLORS } from '@/lib/constants/mappings';

interface GraphNode {
  id: string;
  name: string;
  type: 'investor' | 'company';
  total_holding_shares?: number;
  percentage?: number;
  degree?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  percentage: number;
}

interface NetworkGraphProps {
  investorName?: string;
  companyCode?: string;
  onClose?: () => void;
  enableUrlState?: boolean;
  seedType?: 'investor' | 'company';
}

export default function NetworkGraph({
  investorName,
  companyCode,
  onClose,
  enableUrlState = true,
  seedType,
}: NetworkGraphProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const graphRef = useRef<ForceGraphMethods<NodeObject<GraphNode>, LinkObject<GraphNode, GraphLink>>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [data, setData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodeLimit] = useState(GRAPH_CONFIG.NODE_LIMIT);
  const [focusMode, setFocusMode] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  
  const fetchNetwork = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('degree', '3');
      params.set('limit', nodeLimit.toString());
      
      if (investorName) {
        params.set('investor', investorName);
      } else if (companyCode) {
        params.set('company', companyCode);
      }

      const response = await fetch(`/api/graph/degree3?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch network data');
      const result = await response.json();
      
      let nodes = result.nodes || [];
      let links = result.links || [];
      
      if (nodes.length > nodeLimit) {
        const sampledNodes = nodes.slice(0, nodeLimit);
        const nodeIds = new Set(sampledNodes.map((n: GraphNode) => n.id));
        links = links.filter((l: GraphLink) => {
          const sourceId = typeof l.source === 'string' ? l.source : l.source?.id;
          const targetId = typeof l.target === 'string' ? l.target : l.target?.id;
          return nodeIds.has(sourceId) && nodeIds.has(targetId);
        });
        nodes = sampledNodes;
      }
      
      setData({ nodes, links });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [investorName, companyCode, nodeLimit]);

  useEffect(() => {
    if (investorName || companyCode) {
      fetchNetwork();
    }
  }, [investorName, companyCode, fetchNetwork]);

  const handleZoomIn = useCallback(() => {
    graphRef.current?.zoom(graphRef.current.zoom() * 1.3, 300);
  }, []);

  const handleZoomOut = useCallback(() => {
    graphRef.current?.zoom(graphRef.current.zoom() / 1.3, 300);
  }, []);

  const handleFit = useCallback(() => {
    graphRef.current?.zoomToFit(400, 100);
  }, []);

  const handleNodeClick = useCallback((node: NodeObject<GraphNode>) => {
    if (!node || !node.id) return;
    
    const graphNode = node as unknown as GraphNode;
    setSelectedNode(graphNode);
    
    if (graphNode.type === 'investor') {
      const slug = graphNode.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      router.push(`/visualize/investor/${slug}?name=${encodeURIComponent(graphNode.name)}`, { scroll: false });
    } else if (graphNode.type === 'company') {
      const shareCode = graphNode.id.replace('company-', '');
      router.push(`/visualize/company/${shareCode}`, { scroll: false });
    }
  }, [router]);

  const nodeCanvasObject = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isSelected = selectedNode?.id === node.id;
    const nodeDegree = node.degree || 0;
    const isDimmed = focusMode && isSelected && nodeDegree > 1;
    
    if (focusMode && isSelected) {
      if (nodeDegree === 0) {
        return;
      }
    }
    
    const baseRadius = 4;
    const sizeMultiplier = Math.max(1, Math.log((node.total_holding_shares || 1000000) + 1) / 9);
    const nodeR = Math.max(baseRadius, baseRadius + sizeMultiplier * 2);
    
    let fillColor = NODE_COLORS.company;
    if (nodeDegree === 0) {
      fillColor = NODE_COLORS.root;
    } else if (node.type === 'investor') {
      fillColor = NODE_COLORS.investor;
    }
    
    if (isDimmed) {
      fillColor = NODE_COLORS.dimmed;
    }
    
    ctx.beginPath();
    ctx.arc(node.x || 0, node.y || 0, nodeR, 0, 2 * Math.PI);
    ctx.fillStyle = fillColor;
    ctx.fill();
    
    if (isSelected) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      const strokeColor = nodeDegree === 0 ? '#22c55e' : nodeDegree === 1 ? '#4da6ff' : nodeDegree === 2 ? '#ffb020' : '#64748b';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    const fontSize = Math.max(10 / globalScale, 4);
    ctx.font = `600 ${fontSize}px "JetBrains Mono", "SF Mono", "Consolas", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    if (isDimmed) {
      ctx.fillStyle = '#475569';
    } else {
      ctx.fillStyle = '#e2e8f0';
    }
    
    const labelY = (node.y || 0) + nodeR + 4;
    const maxWidth = 120;
    const name = node.name.length > maxWidth / fontSize * 1.2 ? node.name.substring(0, 15) + '...' : node.name;
    ctx.fillText(name, node.x || 0, labelY);
    
    if (node.percentage && node.percentage > 0 && !isDimmed) {
      const percentText = `${node.percentage.toFixed(2)}%`;
      ctx.font = `500 ${fontSize * 0.8}px "JetBrains Mono", "SF Mono", "Consolas", monospace`;
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(percentText, node.x || 0, labelY + fontSize + 2);
    }
  }, [focusMode, selectedNode]);

  const getLinkColor = useCallback((link: GraphLink) => {
    const sourceNode = typeof link.source === 'object' ? link.source : data.nodes.find(n => n.id === link.source);
    const targetNode = typeof link.target === 'object' ? link.target : data.nodes.find(n => n.id === link.target);
    const sourceDegree = (sourceNode as GraphNode)?.degree || 0;
    const targetDegree = (targetNode as GraphNode)?.degree || 0;
    const maxDegree = Math.max(sourceDegree, targetDegree);
    
    if (focusMode && selectedNode) {
      const isDirectPath = 
        ((sourceNode as GraphNode)?.id === selectedNode.id) || 
        ((targetNode as GraphNode)?.id === selectedNode.id) ||
        (sourceDegree <= 1 || targetDegree <= 1);
      
      if (isDirectPath) {
        return maxDegree === 1 ? LINK_COLORS.direct : LINK_COLORS.degree2;
      }
      return LINK_COLORS.dimmed;
    }
    
    if (maxDegree === 1) return LINK_COLORS.direct;
    if (maxDegree === 2) return LINK_COLORS.degree2;
    return LINK_COLORS.degree3;
  }, [focusMode, selectedNode, data.nodes]);

  const getLinkWidth = useCallback((link: GraphLink) => {
    if (focusMode && selectedNode) {
      const sourceNode = typeof link.source === 'object' ? link.source : data.nodes.find(n => n.id === link.source);
      const targetNode = typeof link.target === 'object' ? link.target : data.nodes.find(n => n.id === link.target);
      const sourceDegree = (sourceNode as GraphNode)?.degree || 0;
      const targetDegree = (targetNode as GraphNode)?.degree || 0;
      const maxDegree = Math.max(sourceDegree, targetDegree);
      
      if (maxDegree <= 1) return 2;
      return 0.5;
    }
    return Math.max(0.5, (link.percentage || 0) / 12);
  }, [focusMode, selectedNode, data.nodes]);

  const linkCanvasObject = useCallback((link: GraphLink, ctx: CanvasRenderingContext2D, globalScale: number) => {
    if (!link.source || !link.target) return;
    
    const sourceNode = typeof link.source === 'object' ? link.source : data.nodes.find(n => n.id === link.source);
    const targetNode = typeof link.target === 'object' ? link.target : data.nodes.find(n => n.id === link.target);
    
    if (!sourceNode || !targetNode || sourceNode.x === undefined || targetNode.x === undefined) return;
    
    const sourceX = sourceNode.x || 0;
    const sourceY = sourceNode.y || 0;
    const targetX = targetNode.x || 0;
    const targetY = targetNode.y || 0;
    
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;
    
    if (link.percentage && link.percentage > 0.5) {
      const fontSize = Math.max(10 / globalScale, 3);
      const percentText = `${link.percentage.toFixed(1)}%`;
      
      ctx.font = `600 ${fontSize}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.fillStyle = '#020617';
      const padding = 2;
      const textWidth = ctx.measureText(percentText).width;
      ctx.fillRect(midX - textWidth / 2 - padding, midY - fontSize / 2 - padding, textWidth + padding * 2, fontSize + padding * 2);
      
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(percentText, midX, midY);
    }
  }, [data.nodes]);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      router.push('/', { scroll: false });
    }
  }, [onClose, router]);

  const toggleFocusMode = useCallback(() => {
    setFocusMode(prev => !prev);
    if (!focusMode) {
      setTimeout(() => graphRef.current?.zoomToFit(400, 100), 100);
    }
  }, [focusMode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#020617]">
        <Loader2 className="w-8 h-8 animate-spin text-terminal-amber" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#020617] text-red-400">
        <p>Error: {error}</p>
        <button onClick={fetchNetwork} className="mt-4 px-4 py-2 border border-slate-700">Retry</button>
      </div>
    );
  }

  if (data.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#020617] text-slate-500">
        <p>No connections found</p>
      </div>
    );
  }

  const nodeCount = data.nodes.length;
  const linkCount = data.links.length;
  const investorCount = data.nodes.filter(n => n.type === 'investor').length;
  const companyCount = data.nodes.filter(n => n.type === 'company').length;

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#020617]">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <button
          onClick={handleClose}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back
        </button>
        <div className="px-3 py-2 text-sm text-slate-400 border border-slate-700">
          <span className="text-terminal-amber font-mono">{nodeCount}</span> nodes / 
          <span className="text-terminal-link font-mono">{linkCount}</span> links
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button 
          onClick={handleZoomIn} 
          className="p-2 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button 
          onClick={handleZoomOut} 
          className="p-2 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button 
          onClick={handleFit} 
          className="p-2 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
          title="Fit to View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-10">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 border border-slate-700">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: NODE_COLORS.root }} />
            <span className="text-xs text-slate-500">Root</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 border border-slate-700">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: NODE_COLORS.company }} />
            <span className="text-xs text-slate-500">Issuer</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 border border-slate-700">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: NODE_COLORS.investor }} />
            <span className="text-xs text-slate-500">Investor</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-10">
        <button
          onClick={toggleFocusMode}
          className={`flex items-center gap-2 px-3 py-2 border transition-colors ${
            focusMode 
              ? 'border-terminal-amber text-terminal-amber bg-terminal-amber/10' 
              : 'border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500'
          }`}
        >
          {focusMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          <span className="text-sm font-mono">Focus Mode</span>
        </button>
      </div>

      <ForceGraph2D
        ref={graphRef}
        graphData={data}
        width={containerRef.current?.clientWidth || 800}
        height={containerRef.current?.clientHeight || 600}
        nodeLabel={(node: GraphNode) => `${node.name}\n${node.percentage?.toFixed(2)}%\n${node.total_holding_shares?.toLocaleString() || 0} shares\nDegree: ${node.degree || 0}`}
        nodeCanvasObject={nodeCanvasObject}
        nodeRelSize={1}
        linkColor={getLinkColor}
        linkWidth={getLinkWidth}
        linkCanvasObject={linkCanvasObject}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={0.9}
        cooldownTicks={GRAPH_CONFIG.COOLDOWN_TICKS}
        onEngineStop={() => graphRef.current?.zoomToFit(400, 50)}
        d3VelocityDecay={GRAPH_CONFIG.VELOCITY_DECAY}
        d3AlphaDecay={GRAPH_CONFIG.ALPHA_DECAY}
        onNodeClick={handleNodeClick}
      />
    </div>
  );
}