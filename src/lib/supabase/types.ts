export type Database = {
  public: {
    Tables: {
      shareholders: {
        Row: {
          id: number;
          date: string;
          share_code: string;
          issuer_name: string;
          investor_name: string;
          investor_type: string | null;
          local_foreign: string | null;
          nationality: string | null;
          domicile: string | null;
          holdings_scripless: number | null;
          holdings_scrip: number | null;
          total_holding_shares: number;
          percentage: number | null;
          validation_status: 'VALID' | 'INVALID';
        };
        Insert: {
          id?: number;
          date: string;
          share_code: string;
          issuer_name: string;
          investor_name: string;
          investor_type?: string | null;
          local_foreign?: string | null;
          nationality?: string | null;
          domicile?: string | null;
          holdings_scripless?: number | null;
          holdings_scrip?: number | null;
          total_holding_shares: number;
          percentage?: number | null;
          validation_status?: 'VALID' | 'INVALID';
        };
        Update: {
          id?: number;
          date?: string;
          share_code?: string;
          issuer_name?: string;
          investor_name?: string;
          investor_type?: string | null;
          local_foreign?: string | null;
          nationality?: string | null;
          domicile?: string | null;
          holdings_scripless?: number | null;
          holdings_scrip?: number | null;
          total_holding_shares?: number;
          percentage?: number | null;
          validation_status?: 'VALID' | 'INVALID';
        };
      };
    };
  };
};

export type Shareholder = Database['public']['Tables']['shareholders']['Row'];