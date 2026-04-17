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
  const safeRows = Array.isArray(rows) ? rows : [];

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <div className="h-4 w-40 rounded bg-muted" />
        </div>
        <div className="space-y-3 p-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-4">
              <div className="h-10 flex-1 rounded-lg bg-muted" />
              <div className="h-10 flex-1 rounded-lg bg-muted" />
              <div className="h-10 w-24 rounded-lg bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-5 py-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-left text-sm">
          <thead className="bg-muted/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th key={column.header} className={cn("px-5 py-3", column.headerClassName)}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card text-foreground">
            {safeRows.length > 0 ? (
              safeRows.map((row) => (
                <tr key={rowKey(row)} className="transition-colors hover:bg-muted/60">
                  {columns.map((column) => (
                    <td key={column.header} className={cn("px-5 py-4 align-top", column.className)}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-5 py-12 text-center text-muted-foreground" colSpan={columns.length}>
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