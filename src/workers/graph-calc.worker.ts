/// <reference lib="webworker" />

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

interface WorkerMessage {
  type: 'CALCULATE_DEGREE';
  payload: {
    rootNode: GraphNode;
    relations: Array<{
      investor_name: string;
      share_code: string;
      issuer_name: string;
      total_holding_shares: number;
      percentage: number;
    }>;
    currentDegree: number;
    maxDegree: number;
  };
}

interface WorkerResponse {
  type: 'DEGREE_CALCULATED';
  payload: {
    nodes: GraphNode[];
    links: GraphLink[];
    newDegree: number;
  };
}

const MAX_NODES_PER_DEGREE = 50;

function calculateDegreeRelations(
  rootNode: GraphNode,
  relations: WorkerMessage['payload']['relations'],
  targetDegree: number,
  existingNodes: GraphNode[]
): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  
  const existingNodeIds = new Set(existingNodes.map(n => n.id));

  if (rootNode.type === 'investor') {
    const uniqueCompanies = new Map<string, typeof relations[0]>();
    
    relations.forEach(r => {
      if (!uniqueCompanies.has(r.share_code)) {
        uniqueCompanies.set(r.share_code, r);
      }
    });

    Array.from(uniqueCompanies.values()).slice(0, MAX_NODES_PER_DEGREE).forEach(r => {
      const nodeId = `company-${r.share_code}`;
      
      if (!existingNodeIds.has(nodeId)) {
        nodes.push({
          id: nodeId,
          name: r.issuer_name || r.share_code,
          type: 'company',
          total_holding_shares: r.total_holding_shares,
          percentage: r.percentage,
          degree: targetDegree,
        });
      }
      
      links.push({
        source: rootNode.id,
        target: nodeId,
        percentage: r.percentage || 0,
      });
    });
  } else {
    const uniqueInvestors = new Map<string, typeof relations[0]>();
    
    relations.forEach(r => {
      const key = r.investor_name;
      if (!uniqueInvestors.has(key)) {
        uniqueInvestors.set(key, r);
      }
    });

    Array.from(uniqueInvestors.values()).slice(0, MAX_NODES_PER_DEGREE).forEach(r => {
      const nodeId = `investor-${r.investor_name}`;
      
      if (!existingNodeIds.has(nodeId)) {
        nodes.push({
          id: nodeId,
          name: r.investor_name,
          type: 'investor',
          total_holding_shares: r.total_holding_shares,
          percentage: r.percentage,
          degree: targetDegree,
        });
      }
      
      links.push({
        source: nodeId,
        target: rootNode.id,
        percentage: r.percentage || 0,
      });
    });
  }

  return { nodes, links };
}

function expandToNextDegree(
  degree1Nodes: GraphNode[],
  degree: number,
  existingNodes: GraphNode[],
  existingLinks: GraphLink[]
): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes: GraphNode[] = [...existingNodes];
  const links: GraphLink[] = [...existingLinks];
  
  const companyNodes = degree1Nodes.filter(n => n.type === 'company');
  
  companyNodes.slice(0, 20).forEach(company => {
    const existingInvestorNodes = nodes.filter(n => n.type === 'investor' && n.degree === degree);
    existingInvestorNodes.forEach(investor => {
      links.push({
        source: investor.id,
        target: company.id,
        percentage: investor.percentage || 0,
      });
    });
  });

  return { nodes, links };
}

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  if (type === 'CALCULATE_DEGREE') {
    const { rootNode, relations, currentDegree, maxDegree } = payload;
    
    if (currentDegree > maxDegree) {
      const response: WorkerResponse = {
        type: 'DEGREE_CALCULATED',
        payload: {
          nodes: [],
          links: [],
          newDegree: currentDegree,
        },
      };
      self.postMessage(response);
      return;
    }

    const newNodes: GraphNode[] = [];
    const newLinks: GraphLink[] = [];

    if (currentDegree === 1) {
      const result = calculateDegreeRelations(rootNode, relations, 1, []);
      newNodes.push(...result.nodes);
      newLinks.push(...result.links);
    } else {
      const result = expandToNextDegree(
        relations.map(r => ({
          id: rootNode.type === 'company' ? `investor-${r.investor_name}` : `company-${r.share_code}`,
          name: rootNode.type === 'company' ? r.investor_name : r.issuer_name || r.share_code,
          type: rootNode.type === 'company' ? 'investor' : 'company',
          total_holding_shares: r.total_holding_shares,
          percentage: r.percentage,
        })),
        currentDegree,
        [],
        []
      );
      newNodes.push(...result.nodes);
      newLinks.push(...result.links);
    }

    const response: WorkerResponse = {
      type: 'DEGREE_CALCULATED',
      payload: {
        nodes: newNodes,
        links: newLinks,
        newDegree: currentDegree + 1,
      },
    };

    self.postMessage(response);
  }
};

export {};