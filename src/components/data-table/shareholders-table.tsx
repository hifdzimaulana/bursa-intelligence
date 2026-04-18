'use client';

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { Shareholder } from '@/lib/supabase/types';
import { shareholderColumns } from './columns';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from 'lucide-react';

interface ShareholdersTableProps {
  data: Shareholder[];
  totalCount: number;
  pageCount: number;
  page: number;
  pageSize: number;
  search: string;
  onPageChange: (page: number) => void;
  onSearchChange: (search: string) => void;
  isLoading?: boolean;
}

export default function ShareholdersTable({
  data,
  totalCount,
  pageCount,
  page,
  pageSize,
  search,
  onPageChange,
  onSearchChange,
  isLoading,
}: ShareholdersTableProps) {
  const columns: ColumnDef<Shareholder>[] = shareholderColumns;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
    state: {
      pagination: { pageIndex: page - 1, pageSize },
    },
  });

  return (
    <div className="flex flex-col h-full border border-slate-800 bg-slate-900/50">
      <div className="flex items-center justify-between p-2 border-b border-slate-800 bg-slate-900">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search investor or code..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-[300px] bg-slate-950 border border-slate-700 text-slate-200 pl-9 pr-3 py-1.5 text-sm font-mono focus:outline-none focus:border-terminal-amber placeholder:text-slate-600"
          />
        </div>
        <div className="text-xs text-slate-500 font-mono">
          {totalCount.toLocaleString('id-ID')} rows
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-950">
            <tr>
              {table.getHeaderGroups().map((headerGroup) =>
                headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 py-1.5 border-b border-slate-700 bg-slate-950"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-terminal-amber" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-slate-500">
                  No data found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`hover:bg-slate-800/50 transition-colors ${
                    row.original.validation_status === 'INVALID'
                      ? 'border-l-2 border-l-red-900/70'
                      : ''
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-2 py-1.5 border-b border-slate-800/50 text-slate-300 high-density-row"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-2 border-t border-slate-800 bg-slate-900">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={page === 1}
            className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
        <div className="text-xs font-mono text-slate-400">
          Page {page} of {pageCount}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pageCount}
            className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(pageCount)}
            disabled={page >= pageCount}
            className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}