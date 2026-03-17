"use client";

import { useState, useMemo } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Calendar } from "lucide-react";

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
  /** Field name containing a date string for date filtering. If set, shows date range presets above the table. */
  dateField?: string;
}

const DATE_PRESETS = [
  { label: "ทั้งหมด", key: "all" },
  { label: "วันนี้", key: "today" },
  { label: "สัปดาห์นี้", key: "week" },
  { label: "เดือนนี้", key: "month" },
  { label: "3 เดือน", key: "3m" },
  { label: "6 เดือน", key: "6m" },
  { label: "ปีนี้", key: "year" },
];

function parseDate(val: any): Date | null {
  if (!val) return null;
  const s = String(val);
  // Try DD/MM/YYYY (Thai BE or CE)
  const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    let year = parseInt(slashMatch[3]);
    if (year > 2500) year -= 543; // Convert BE to CE
    return new Date(year, parseInt(slashMatch[2]) - 1, parseInt(slashMatch[1]));
  }
  // Try ISO YYYY-MM-DD
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
  }
  // Fallback
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function getPresetRange(key: string): { from: Date; to: Date } | null {
  if (key === "all") return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (key) {
    case "today":
      return { from: today, to: now };
    case "week": {
      const day = today.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const monday = new Date(today);
      monday.setDate(today.getDate() - diff);
      return { from: monday, to: now };
    }
    case "month":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
    case "3m":
      return { from: new Date(now.getFullYear(), now.getMonth() - 2, 1), to: now };
    case "6m":
      return { from: new Date(now.getFullYear(), now.getMonth() - 5, 1), to: now };
    case "year":
      return { from: new Date(now.getFullYear(), 0, 1), to: now };
    default:
      return null;
  }
}

export default function DataTable<T>({ columns, data, rowKey, emptyText = "ไม่มีข้อมูล", dateField }: DataTableProps<T>) {
  const { isDark } = useTheme();
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [datePreset, setDatePreset] = useState("all");

  // Filter by date
  const filteredData = useMemo(() => {
    if (!dateField || datePreset === "all") return data;
    const range = getPresetRange(datePreset);
    if (!range) return data;
    return data.filter((row) => {
      const d = parseDate((row as any)[dateField]);
      if (!d) return true;
      return d >= range.from && d <= range.to;
    });
  }, [data, dateField, datePreset]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / perPage));
  const safePage = Math.min(page, totalPages);
  const sliced = filteredData.slice((safePage - 1) * perPage, safePage * perPage);
  const from = (safePage - 1) * perPage + 1;
  const to = Math.min(safePage * perPage, filteredData.length);

  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const headBg = isDark ? "bg-[rgba(255,255,255,0.03)]" : "bg-gray-50";
  const rowHover = isDark ? "hover:bg-[rgba(255,255,255,0.03)]" : "hover:bg-gray-50";

  const alignCls = (a?: string) => a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left";

  const maxVisible = 5;
  const pages: number[] = [];
  let startP = Math.max(1, safePage - Math.floor(maxVisible / 2));
  let endP = Math.min(totalPages, startP + maxVisible - 1);
  if (endP - startP + 1 < maxVisible) startP = Math.max(1, endP - maxVisible + 1);
  for (let i = startP; i <= endP; i++) pages.push(i);

  return (
    <div className={`${card} border ${border} rounded-2xl overflow-hidden`}>
      {/* Date filter */}
      {dateField && (
        <div className={`px-5 py-3 flex items-center gap-3 flex-wrap border-b ${border}`}>
          <Calendar size={16} className={sub} />
          <div className="flex gap-1.5 flex-wrap">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => { setDatePreset(p.key); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  datePreset === p.key
                    ? "bg-[#FA3633] text-white shadow-sm shadow-[#FA3633]/25"
                    : isDark
                      ? "bg-white/5 text-white/50 hover:bg-white/10"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {datePreset !== "all" && (
            <span className={`text-xs ${sub}`}>
              {filteredData.length} รายการ
            </span>
          )}
        </div>
      )}

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
      {filteredData.length > 0 && (
        <div className={`px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t ${border}`}>
          <div className={`text-xs ${sub}`}>
            แสดงรายการที่ {from}-{to} จากทั้งหมด {filteredData.length} รายการ
          </div>

          <div className="flex items-center gap-2">
            <div className={`flex items-center rounded-lg overflow-hidden border ${border}`}>
              {[5, 10, 20, 50].map((n) => (
                <button key={n} onClick={() => { setPerPage(n); setPage(1); }} className={`px-2.5 py-1 text-xs font-medium transition-colors ${perPage === n ? "bg-[#FA3633] text-white" : isDark ? "text-white/50 hover:bg-white/5" : "text-gray-500 hover:bg-gray-100"}`}>
                  {n}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={safePage === 1} className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${isDark ? "hover:bg-white/5 text-white/50" : "hover:bg-gray-100 text-gray-500"}`}><ChevronsLeft size={14} /></button>
              <button onClick={() => setPage(Math.max(1, safePage - 1))} disabled={safePage === 1} className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${isDark ? "hover:bg-white/5 text-white/50" : "hover:bg-gray-100 text-gray-500"}`}><ChevronLeft size={14} /></button>
              {pages.map((p) => (
                <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${p === safePage ? "bg-[#FA3633] text-white shadow-sm shadow-[#FA3633]/25" : isDark ? "text-white/50 hover:bg-white/5" : "text-gray-500 hover:bg-gray-100"}`}>{p}</button>
              ))}
              <button onClick={() => setPage(Math.min(totalPages, safePage + 1))} disabled={safePage === totalPages} className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${isDark ? "hover:bg-white/5 text-white/50" : "hover:bg-gray-100 text-gray-500"}`}><ChevronRight size={14} /></button>
              <button onClick={() => setPage(totalPages)} disabled={safePage === totalPages} className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${isDark ? "hover:bg-white/5 text-white/50" : "hover:bg-gray-100 text-gray-500"}`}><ChevronsRight size={14} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
