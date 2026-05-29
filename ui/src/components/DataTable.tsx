import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';

interface Column {
  key: string;
  header: string;
  format?: (value: unknown) => string | React.ReactNode;
  formatRow?: (row: Record<string, unknown>, value: unknown) => string | React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  defaultPageSize?: number;
}

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

function pageNumbers(total: number, current: number): (number | 'ellipsis')[] {
  const pages: (number | 'ellipsis')[] = [];
  if (total <= 7) {
    for (let i = 0; i < total; i++) pages.push(i);
  } else {
    pages.push(0);
    if (current > 2) pages.push('ellipsis');
    for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 3) pages.push('ellipsis');
    pages.push(total - 1);
  }
  return pages;
}

export default function DataTable({ columns: columnConfig, data, defaultPageSize = 10 }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<Record<string, unknown>>[] = useMemo(
    () =>
      columnConfig.map((col) => ({
        accessorKey: col.key,
        header: col.header,
        enableSorting: col.sortable ?? true,
        cell: (info) => {
          const value = info.getValue();
          if (col.formatRow) return col.formatRow(info.row.original, value);
          return col.format ? col.format(value) : String(value ?? '');
        },
      })),
    [columnConfig],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: defaultPageSize } },
  });

  const { pageIndex } = table.getState().pagination;
  const totalPages = table.getPageCount();

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono" style={{ tableLayout: 'fixed' }}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-slate-200">
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const canSort = header.column.getCanSort();
                  return (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className={`text-slate-400 font-semibold uppercase tracking-wide py-1 px-2 select-none ${canSort ? 'cursor-pointer' : ''}`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sorted === 'asc' && <span className="text-slate-300 text-[10px]">&#9650;</span>}
                        {sorted === 'desc' && <span className="text-slate-300 text-[10px]">&#9660;</span>}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="py-1 px-2 text-slate-700">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>Rows:</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="border border-slate-200 rounded px-2 py-1 text-xs font-mono bg-white text-slate-700 cursor-pointer"
          >
            {PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span>
            Page {pageIndex + 1} of {totalPages}
          </span>

          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-2 py-1 rounded border border-slate-200 text-slate-500 disabled:text-slate-300 disabled:cursor-default hover:border-slate-400 transition cursor-pointer disabled:hover:border-slate-200"
          >
            &lsaquo; Prev
          </button>

          <div className="hidden sm:flex items-center gap-1">
            {pageNumbers(totalPages, pageIndex).map((p, i) =>
              p === 'ellipsis' ? (
                <span key={`e${i}`} className="px-1 text-slate-300">
                  &hellip;
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => table.setPageIndex(p as number)}
                  className={`px-2 py-0.5 rounded text-xs font-mono transition cursor-pointer ${
                    p === pageIndex
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {(p as number) + 1}
                </button>
              ),
            )}
          </div>

          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-2 py-1 rounded border border-slate-200 text-slate-500 disabled:text-slate-300 disabled:cursor-default hover:border-slate-400 transition cursor-pointer disabled:hover:border-slate-200"
          >
            Next &rsaquo;
          </button>
        </div>
      </div>
    </div>
  );
}
