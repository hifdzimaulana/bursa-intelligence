import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const investor = searchParams.get('investor');

  if (!investor) {
    return NextResponse.json({ error: 'Investor name required' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: shareholders, error } = await supabase
    .from('shareholders')
    .select('share_code, issuer_name, investor_name, percentage, total_holding_shares')
    .ilike('investor_name', `%${investor}%`)
    .order('total_holding_shares', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const investorNode = {
    id: `investor-${investor}`,
    name: investor,
    type: 'investor' as const,
  };

  const companyNodes = shareholders?.map((s) => ({
    id: `company-${s.share_code}`,
    name: s.issuer_name || s.share_code,
    type: 'company' as const,
  })) || [];

  const links = shareholders?.map((s) => ({
    source: investorNode.id,
    target: `company-${s.share_code}`,
    percentage: s.percentage || 0,
  })) || [];

  return NextResponse.json({
    nodes: [investorNode, ...companyNodes],
    links,
  });
}