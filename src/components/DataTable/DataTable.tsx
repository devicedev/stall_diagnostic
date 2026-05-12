import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type ColumnDef,
  type PaginationState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import styles from './DataTable.module.css';

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  emptyMessage?: string;
  pageSize?: number;
}

export default function DataTable<TData>({
  columns,
  data,
  emptyMessage = 'Нет данных',
  pageSize,
}: DataTableProps<TData>) {
  const tableScrollerRef = useRef<HTMLDivElement>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSize ?? Math.max(data.length, 1),
  });

  const enablePagination = typeof pageSize === 'number';
  const stableData = useMemo(() => data, [data]);

  useEffect(() => {
    setPagination({
      pageIndex: 0,
      pageSize: pageSize ?? Math.max(data.length, 1),
    });
  }, [data, pageSize]);

  const table = useReactTable({
    data: stableData,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
  });

  const rows = table.getRowModel().rows;
  const firstVisible =
    data.length === 0 ? 0 : table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1;
  const lastVisible = Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, data.length);
  const scrollToTableTop = () => {
    if (tableScrollerRef.current) tableScrollerRef.current.scrollTop = 0;
  };

  return (
    <div className={styles.tableWrap}>
      <div ref={tableScrollerRef} className={styles.tableScroller}>
        <table className={styles.table}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : (
                      <button
                        className={styles.headerButton}
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        disabled={!header.column.getCanSort()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ?? ''}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={table.getAllLeafColumns().length} className={styles.emptyCell}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {enablePagination && pageSize && data.length > pageSize && (
        <div className={styles.pagination}>
          <span>
            {firstVisible}-{lastVisible} из {data.length}
          </span>
          <button
            type="button"
            aria-label="Предыдущая страница"
            onClick={() => {
              table.previousPage();
              scrollToTableTop();
            }}
            disabled={!table.getCanPreviousPage()}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Следующая страница"
            onClick={() => {
              table.nextPage();
              scrollToTableTop();
            }}
            disabled={!table.getCanNextPage()}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
