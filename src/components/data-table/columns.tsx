import { ColumnDef } from '@tanstack/react-table';
import { Shareholder } from '@/lib/supabase/types';
import { formatIndonesianNumber, formatPercentage } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

export const shareholderColumns: ColumnDef<Shareholder>[] = [
  {
    accessorKey: 'date',
    header: 'DATE',
    cell: ({ getValue }) => (
      <span className="font-mono text-slate-400">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: 'share_code',
    header: 'CODE',
    cell: ({ getValue }) => (
      <span className="font-mono font-semibold text-terminal-link">
        {getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: 'issuer_name',
    header: 'ISSUER',
    cell: ({ getValue }) => (
      <span className="text-slate-300 truncate max-w-[200px] block">
        {getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: 'investor_name',
    header: 'INVESTOR',
    cell: ({ getValue }) => {
      const investorName = getValue<string>();
      return (
        <button
          onClick={() => {
            const event = new CustomEvent('investorClick', { detail: investorName });
            window.dispatchEvent(event);
          }}
          className="text-left text-slate-200 truncate max-w-[250px] block hover:text-terminal-link hover:underline cursor-pointer"
        >
          {investorName}
        </button>
      );
    },
  },
  {
    accessorKey: 'investor_type',
    header: 'TYPE',
    cell: ({ getValue }) => (
      <span className="font-mono text-slate-500 text-xs">
        {getValue<string>() || '-'}
      </span>
    ),
  },
  {
    accessorKey: 'local_foreign',
    header: 'LOC/FOREIGN',
    cell: ({ getValue }) => {
      const value = getValue<string>();
      return (
        <span
          className={`font-mono text-xs ${
            value === 'L'
              ? 'text-terminal-green'
              : value === 'F'
              ? 'text-terminal-amber'
              : 'text-slate-500'
          }`}
        >
          {value || '-'}
        </span>
      );
    },
  },
  {
    accessorKey: 'nationality',
    header: 'NATIONALITY',
    cell: ({ getValue }) => (
      <span className="text-slate-400 text-xs">
        {getValue<string>() || '-'}
      </span>
    ),
  },
  {
    accessorKey: 'total_holding_shares',
    header: 'SHARES',
    cell: ({ getValue, row }) => {
      const isInvalid = row.original.validation_status === 'INVALID';
      return (
        <div className="flex items-center gap-1">
          {isInvalid && (
            <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />
          )}
          <span className="font-mono tabular-nums text-right w-full">
            {formatIndonesianNumber(getValue<number>())}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'percentage',
    header: '%',
    cell: ({ getValue }) => (
      <span className="font-mono tabular-nums text-terminal-green text-right block w-16">
        {formatPercentage(getValue<number | null>())}
      </span>
    ),
  },
  {
    accessorKey: 'validation_status',
    header: 'STATUS',
    cell: ({ getValue }) => {
      const status = getValue<string>();
      return (
        <span
          className={`font-mono text-xs ${
            status === 'VALID' ? 'text-terminal-green' : 'text-red-500'
          }`}
        >
          {status}
        </span>
      );
    },
  },
];