import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface GraphNode {
  id: string;
  name: string;
  type: 'investor' | 'company';
  total_holding_shares?: number;
  percentage?: number;
  degree?: number;
}

interface GraphLink {
  source: string;
  target: string;
  percentage: number;
}

const MAX_NODES_PER_DEGREE = 50;

async function fetchDegree1(
  supabase: any, 
  type: 'investor' | 'company', 
  id: string
): Promise<{ nodes: GraphNode[]; links: GraphLink[] }> {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  if (type === 'investor') {
    const { data: shareholders } = await supabase
      .from('shareholders')
      .select('share_code, issuer_name, percentage, total_holding_shares')
      .ilike('investor_name', `%${id}%`)
      .order('total_holding_shares', { ascending: false })
      .limit(MAX_NODES_PER_DEGREE);

    if (shareholders) {
      shareholders.forEach((s: any) => {
        nodes.push({
          id: `company-${s.share_code}`,
          name: s.issuer_name || s.share_code,
          type: 'company',
          total_holding_shares: s.total_holding_shares,
          percentage: s.percentage,
          degree: 1,
        });
        links.push({
          source: `investor-${id}`,
          target: `company-${s.share_code}`,
          percentage: s.percentage || 0,
        });
      });
    }
  } else {
    const { data: shareholders } = await supabase
      .from('shareholders')
      .select('investor_name, percentage, total_holding_shares')
      .eq('share_code', id.toUpperCase())
      .order('total_holding_shares', { ascending: false })
      .limit(MAX_NODES_PER_DEGREE);

    if (shareholders) {
      shareholders.forEach((s: any) => {
        nodes.push({
          id: `investor-${s.investor_name}`,
          name: s.investor_name,
          type: 'investor',
          total_holding_shares: s.total_holding_shares,
          percentage: s.percentage,
          degree: 1,
        });
        links.push({
          source: `investor-${s.investor_name}`,
          target: `company-${id.toUpperCase()}`,
          percentage: s.percentage || 0,
        });
      });
    }
  }

  return { nodes, links };
}

async function fetchDegree2(
  supabase: any,
  degree1Nodes: GraphNode[]
): Promise<{ nodes: GraphNode[]; links: GraphLink[] }> {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  const investorNodes = degree1Nodes.filter(n => n.type === 'investor');
  
  for (const investor of investorNodes.slice(0, 20)) {
    const investorId = investor.id.replace('investor-', '');
    
    const { data: holdings } = await supabase
      .from('shareholders')
      .select('share_code, issuer_name, percentage, total_holding_shares')
      .ilike('investor_name', `%${investorId}%`)
      .order('total_holding_shares', { ascending: false })
      .limit(10);

    if (holdings) {
      holdings.forEach((h: any) => {
        const nodeId = `company-${h.share_code}`;
        if (!nodes.find(n => n.id === nodeId)) {
          nodes.push({
            id: nodeId,
            name: h.issuer_name || h.share_code,
            type: 'company',
            total_holding_shares: h.total_holding_shares,
            percentage: h.percentage,
            degree: 2,
          });
        }
        links.push({
          source: investor.id,
          target: nodeId,
          percentage: h.percentage || 0,
        });
      });
    }
  }

  return { nodes, links };
}

async function fetchDegree3(
  supabase: any,
  degree2Companies: GraphNode[]
): Promise<{ nodes: GraphNode[]; links: GraphLink[] }> {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  for (const company of degree2Companies.slice(0, 10)) {
    const shareCode = company.id.replace('company-', '');
    
    const { data: shareholders } = await supabase
      .from('shareholders')
      .select('investor_name, percentage, total_holding_shares')
      .eq('share_code', shareCode)
      .order('total_holding_shares', { ascending: false })
      .limit(10);

    if (shareholders) {
      shareholders.forEach((s: any) => {
        const nodeId = `investor-${s.investor_name}`;
        if (!nodes.find(n => n.id === nodeId)) {
          nodes.push({
            id: nodeId,
            name: s.investor_name,
            type: 'investor',
            total_holding_shares: s.total_holding_shares,
            percentage: s.percentage,
            degree: 3,
          });
        }
        links.push({
          source: nodeId,
          target: company.id,
          percentage: s.percentage || 0,
        });
      });
    }
  }

  return { nodes, links };
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  
  const investor = searchParams.get('investor');
  const company = searchParams.get('company');
  const depth = Math.min(parseInt(searchParams.get('degree') || '1'), 4);
  const limit = parseInt(searchParams.get('limit') || '500');

  const type = investor ? 'investor' : 'company';
  const id = investor || company;

  if (!id) {
    return NextResponse.json({ error: 'Missing investor or company parameter' }, { status: 400 });
  }

  try {
    let nodes: GraphNode[] = [];
    let links: GraphLink[] = [];

    const seedNode: GraphNode = {
      id: `${type}-${id}`,
      name: type === 'company' ? id.toUpperCase() : id,
      type: type,
      degree: 0,
    };
    nodes.push(seedNode);

    const degree1 = await fetchDegree1(supabase, type, id);
    nodes = [...nodes, ...degree1.nodes];
    links = [...links, ...degree1.links];

    if (depth >= 2) {
      const degree2 = await fetchDegree2(supabase, degree1.nodes.filter(n => n.type === 'company'));
      nodes = [...nodes, ...degree2.nodes];
      links = [...links, ...degree2.links];
    }

    if (depth >= 3) {
      const degree2Companies = nodes.filter(n => n.degree === 2 && n.type === 'company');
      const degree3 = await fetchDegree3(supabase, degree2Companies);
      nodes = [...nodes, ...degree3.nodes];
      links = [...links, ...degree3.links];
    }

    if (depth >= 4) {
      const degree3Investors = nodes.filter(n => n.degree === 3 && n.type === 'investor');
      for (const inv of degree3Investors.slice(0, 10)) {
        const invId = inv.id.replace('investor-', '');
        const { data: holdings } = await supabase
          .from('shareholders')
          .select('share_code, issuer_name, percentage, total_holding_shares')
          .ilike('investor_name', `%${invId}%`)
          .order('total_holding_shares', { ascending: false })
          .limit(5);

        if (holdings) {
          holdings.forEach((h: any) => {
            const nodeId = `company-${h.share_code}`;
            if (!nodes.find(n => n.id === nodeId)) {
              nodes.push({
                id: nodeId,
                name: h.issuer_name || h.share_code,
                type: 'company',
                total_holding_shares: h.total_holding_shares,
                percentage: h.percentage,
                degree: 4,
              });
            }
            links.push({
              source: inv.id,
              target: nodeId,
              percentage: h.percentage || 0,
            });
          });
        }
      }
    }

    return NextResponse.json({ nodes, links });
  } catch (error) {
    console.error('Graph API error:', error);
    return NextResponse.json({ error: 'Failed to fetch graph data' }, { status: 500 });
  }
}