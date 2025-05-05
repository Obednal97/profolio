

"use client";

import React from "react";
import clsx from "clsx";

interface Column<T> {
  header: string;
  accessor: keyof T;
  className?: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  rowKey,
  className = "",
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table
        className={clsx(
          "w-full text-sm text-left text-white/80 border-separate border-spacing-y-1",
          className
        )}
      >
        <thead className="text-xs uppercase bg-white/5 text-white/60">
          <tr>
            {columns.map((col) => (
              <th key={String(col.accessor)} className={clsx("px-4 py-3", col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={rowKey(row)}
              className="bg-[#2a2a2a] hover:bg-white/5 transition rounded-xl"
            >
              {columns.map((col) => (
                <td key={String(col.accessor)} className={clsx("px-4 py-3", col.className)}>
                  {col.render ? col.render(row[col.accessor], row) : String(row[col.accessor] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}