"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ResourceColumn<T> = {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
};

interface ResourceTableProps<T> {
  columns: Array<ResourceColumn<T>>;
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage: string;
  loading?: boolean;
  error?: string | null;
}

export function ResourceTable<T>({ columns, rows, rowKey, emptyMessage, loading = false, error }: ResourceTableProps<T>) {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="h-4 w-40 rounded bg-slate-100" />
        </div>
        <div className="space-y-3 p-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="h-10 flex-1 rounded-lg bg-slate-100" />
              <div className="h-10 flex-1 rounded-lg bg-slate-100" />
              <div className="h-10 w-24 rounded-lg bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column.header} className={cn("px-5 py-3", column.headerClassName)}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={rowKey(row)} className="transition-colors hover:bg-slate-50/80">
                  {columns.map((column) => (
                    <td key={column.header} className={cn("px-5 py-4 align-top", column.className)}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-5 py-12 text-center text-slate-500" colSpan={columns.length}>
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}