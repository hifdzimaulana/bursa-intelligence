import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  
  const rows: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    
    if (values.length >= headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });
      rows.push(row);
    }
  }
  
  return rows;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No valid rows found' }, { status: 400 });
    }

    const supabase = await createClient();
    const batchSize = 1000;
    let insertedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      
      const records = batch.map((row) => ({
        date: row.DATE,
        share_code: row.SHARE_CODE,
        issuer_name: row.ISSUER_NAME,
        investor_name: row.INVESTOR_NAME,
        investor_type: row.INVESTOR_TYPE || null,
        local_foreign: row.LOCAL_FOREIGN || null,
        nationality: row.NATIONALITY || null,
        domicile: row.DOMICILE || null,
        holdings_scripless: row.HOLDINGS_SCRIPLESS ? parseInt(row.HOLDINGS_SCRIPLESS) : null,
        holdings_scrip: row.HOLDINGS_SCRIP ? parseInt(row.HOLDINGS_SCRIP) : null,
        total_holding_shares: row.TOTAL_HOLDING_SHARES ? parseInt(row.TOTAL_HOLDING_SHARES) : 0,
        percentage: row.PERCENTAGE ? parseFloat(row.PERCENTAGE) : null,
        validation_status: (row.VALIDATION_STATUS === 'VALID' ? 'VALID' : 'INVALID') as 'VALID' | 'INVALID',
      }));

      const { error } = await supabase.from('shareholders').upsert(records, {
        onConflict: 'share_code,investor_name,date',
        ignoreDuplicates: true,
      });

      if (error) {
        console.error(`Batch ${i / batchSize + 1} error:`, error);
        errorCount += batch.length;
      } else {
        insertedCount += records.length;
      }
    }

    return NextResponse.json({
      success: true,
      inserted: insertedCount,
      errors: errorCount,
      total: rows.length,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}