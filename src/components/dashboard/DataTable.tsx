"use client";

import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export interface Column<T> {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  render?: (row: T, isDark: boolean) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  emptyText?: string;
}

export default function DataTable<T>({ columns, data, rowKey, emptyText = "ไม่มีข้อมูล" }: DataTableProps<T>) {
  const { isDark } = useTheme();
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / perPage));
  const safePage = Math.min(page, totalPages);
  const sliced = data.slice((safePage - 1) * perPage, safePage * perPage);
  const from = (safePage - 1) * perPage + 1;
  const to = Math.min(safePage * perPage, data.length);

  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const headBg = isDark ? "bg-[rgba(255,255,255,0.03)]" : "bg-gray-50";
  const rowHover = isDark ? "hover:bg-[rgba(255,255,255,0.03)]" : "hover:bg-gray-50";

  const alignCls = (a?: string) => a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left";

  // Pagination helpers
  const maxVisible = 5;
  const pages: number[] = [];
  let startP = Math.max(1, safePage - Math.floor(maxVisible / 2));
  let endP = Math.min(totalPages, startP + maxVisible - 1);
  if (endP - startP + 1 < maxVisible) startP = Math.max(1, endP - maxVisible + 1);
  for (let i = startP; i <= endP; i++) pages.push(i);

  return (
    <div className={`${card} border ${border} rounded-2xl overflow-hidden`}>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={headBg}>
              {columns.map((col) => (
                <th key={col.key} className={`px-5 py-3 text-xs font-semibold ${sub} ${alignCls(col.align)}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sliced.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={`px-5 py-12 text-center text-sm ${sub}`}>
                  {emptyText}
                </td>
              </tr>
            ) : (
              sliced.map((row) => (
                <tr key={rowKey(row)} className={`border-t ${border} ${rowHover} transition-colors`}>
                  {columns.map((col) => (
                    <td key={col.key} className={`px-5 py-3 text-sm ${alignCls(col.align)} ${txt}`}>
                      {col.render ? col.render(row, isDark) : (row as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data.length > 0 && (
        <div className={`px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t ${border}`}>
          <div className={`text-xs ${sub}`}>
            แสดงรายการที่ {from}-{to} จากทั้งหมด {data.length} รายการ
          </div>

          <div className="flex items-center gap-2">
            {/* Per page selector */}
            <div className={`flex items-center rounded-lg overflow-hidden border ${border}`}>
              {[5, 10, 20, 50].map((n) => (
                <button
                  key={n}
                  onClick={() => { setPerPage(n); setPage(1); }}
                  className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                    perPage === n
                      ? "bg-[#FA3633] text-white"
                      : isDark
                        ? "text-white/50 hover:bg-white/5"
                        : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            {/* Page navigation */}
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={safePage === 1} className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${isDark ? "hover:bg-white/5 text-white/50" : "hover:bg-gray-100 text-gray-500"}`}>
                <ChevronsLeft size={14} />
              </button>
              <button onClick={() => setPage(Math.max(1, safePage - 1))} disabled={safePage === 1} className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${isDark ? "hover:bg-white/5 text-white/50" : "hover:bg-gray-100 text-gray-500"}`}>
                <ChevronLeft size={14} />
              </button>

              {pages.map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                    p === safePage
                      ? "bg-[#FA3633] text-white shadow-sm shadow-[#FA3633]/25"
                      : isDark
                        ? "text-white/50 hover:bg-white/5"
                        : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              ))}

              <button onClick={() => setPage(Math.min(totalPages, safePage + 1))} disabled={safePage === totalPages} className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${isDark ? "hover:bg-white/5 text-white/50" : "hover:bg-gray-100 text-gray-500"}`}>
                <ChevronRight size={14} />
              </button>
              <button onClick={() => setPage(totalPages)} disabled={safePage === totalPages} className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${isDark ? "hover:bg-white/5 text-white/50" : "hover:bg-gray-100 text-gray-500"}`}>
                <ChevronsRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
