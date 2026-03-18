"use client";

import { useState, useMemo, useRef, useEffect, Fragment } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Calendar, ChevronDown, Settings2, Check, RotateCcw } from "lucide-react";
import DatePicker from "@/components/dashboard/DatePicker";

export interface Column<T> {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  render?: (row: T, isDark: boolean) => React.ReactNode;
  /** default true — set false to hide by default */
  defaultVisible?: boolean;
  /** set false to prevent hiding (e.g. actions column) */
  configurable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  emptyText?: string;
  dateField?: string;
  /** Render expandable content below a row when clicked */
  expandRender?: (row: T, isDark: boolean) => React.ReactNode;
  /** localStorage key for persisting column visibility */
  columnConfigKey?: string;
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
  const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    let year = parseInt(slashMatch[3]);
    if (year > 2500) year -= 543;
    return new Date(year, parseInt(slashMatch[2]) - 1, parseInt(slashMatch[1]));
  }
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function getPresetRange(key: string): { from: Date; to: Date } | null {
  if (key === "all") return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (key) {
    case "today": return { from: today, to: now };
    case "week": { const day = today.getDay(); const diff = day === 0 ? 6 : day - 1; const mon = new Date(today); mon.setDate(today.getDate() - diff); return { from: mon, to: now }; }
    case "month": return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
    case "3m": return { from: new Date(now.getFullYear(), now.getMonth() - 2, 1), to: now };
    case "6m": return { from: new Date(now.getFullYear(), now.getMonth() - 5, 1), to: now };
    case "year": return { from: new Date(now.getFullYear(), 0, 1), to: now };
    default: return null;
  }
}

export default function DataTable<T>({ columns, data, rowKey, emptyText = "ไม่มีข้อมูล", dateField, expandRender, columnConfigKey }: DataTableProps<T>) {
  const { isDark } = useTheme();
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [datePreset, setDatePreset] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | number | null>(null);
  const [colOrder, setColOrder] = useState<number[]>(() => columns.map((_, i) => i));
  const dragFrom = useRef<number | null>(null);

  // Column visibility
  const defaultVisibility = useMemo(() => {
    const v: Record<string, boolean> = {};
    columns.forEach((c) => { v[c.key] = c.defaultVisible !== false; });
    return v;
  }, [columns]);

  const [colVisibility, setColVisibility] = useState<Record<string, boolean>>(() => {
    if (columnConfigKey && typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`dt-cols-${columnConfigKey}`);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return defaultVisibility;
  });
  const [showColConfig, setShowColConfig] = useState(false);
  const colConfigRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (columnConfigKey) {
      localStorage.setItem(`dt-cols-${columnConfigKey}`, JSON.stringify(colVisibility));
    }
  }, [colVisibility, columnConfigKey]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showColConfig) return;
    const handler = (e: MouseEvent) => {
      if (colConfigRef.current && !colConfigRef.current.contains(e.target as Node)) setShowColConfig(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showColConfig]);

  const toggleCol = (key: string) => {
    setColVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const resetCols = () => setColVisibility(defaultVisibility);

  const visibleColumns = colOrder.map((i) => columns[i]).filter((c) => c && colVisibility[c.key] !== false);
  const orderedColumns = visibleColumns;

  const onDragStart = (idx: number) => { dragFrom.current = idx; };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const onDrop = (idx: number) => {
    if (dragFrom.current === null || dragFrom.current === idx) return;
    const next = [...colOrder];
    const item = next.splice(dragFrom.current, 1)[0];
    next.splice(idx, 0, item);
    setColOrder(next);
    dragFrom.current = null;
  };

  const filteredData = useMemo(() => {
    if (!dateField || datePreset === "all") return data;
    let range: { from: Date; to: Date } | null = null;
    if (datePreset === "custom") {
      if (customFrom && customTo) {
        range = { from: new Date(customFrom), to: new Date(customTo + "T23:59:59") };
      } else {
        return data;
      }
    } else {
      range = getPresetRange(datePreset);
    }
    if (!range) return data;
    return data.filter((row) => {
      const d = parseDate((row as any)[dateField]);
      if (!d) return true;
      return d >= range!.from && d <= range!.to;
    });
  }, [data, dateField, datePreset, customFrom, customTo]);

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
  const expandBg = isDark ? "bg-[rgba(255,255,255,0.02)]" : "bg-gray-50/50";

  const alignCls = (a?: string) => a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left";

  const maxVisible = 5;
  const pages: number[] = [];
  let startP = Math.max(1, safePage - Math.floor(maxVisible / 2));
  let endP = Math.min(totalPages, startP + maxVisible - 1);
  if (endP - startP + 1 < maxVisible) startP = Math.max(1, endP - maxVisible + 1);
  for (let i = startP; i <= endP; i++) pages.push(i);

  const toggleExpand = (key: string | number) => {
    setExpandedRow((prev) => (prev === key ? null : key));
  };

  const configurableColumns = columns.filter((c) => c.configurable !== false && c.label);
  const visibleCount = configurableColumns.filter((c) => colVisibility[c.key] !== false).length;

  const columnConfigButton = columnConfigKey ? (
    <div className="relative" ref={colConfigRef}>
      <button
        onClick={() => setShowColConfig(!showColConfig)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${showColConfig ? "bg-[#FA3633] text-white shadow-sm shadow-[#FA3633]/25" : isDark ? "bg-white/5 text-white/50 hover:bg-white/10" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
      >
        <Settings2 size={13} />
        <span>คอลัมน์ ({visibleCount}/{configurableColumns.length})</span>
      </button>
      {showColConfig && (
        <div className={`absolute top-full right-0 mt-2 w-56 rounded-xl border shadow-xl z-50 ${isDark ? "bg-[#1a1a1a] border-white/10" : "bg-white border-gray-200"}`}>
          <div className={`px-3 py-2.5 border-b ${border} flex items-center justify-between`}>
            <span className={`text-xs font-semibold ${isDark ? "text-white/70" : "text-gray-700"}`}>แสดงคอลัมน์</span>
            <button onClick={resetCols} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${isDark ? "text-white/40 hover:bg-white/5 hover:text-white/60" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"}`}>
              <RotateCcw size={10} />
              รีเซ็ต
            </button>
          </div>
          <div className="p-1.5 max-h-72 overflow-y-auto">
            {configurableColumns.map((col) => {
              const isOn = colVisibility[col.key] !== false;
              return (
                <button
                  key={col.key}
                  onClick={() => toggleCol(col.key)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors ${isOn ? "bg-[#FA3633] text-white" : isDark ? "bg-white/10 text-transparent" : "bg-gray-200 text-transparent"}`}>
                    <Check size={10} strokeWidth={3} />
                  </div>
                  <span className={isOn ? (isDark ? "text-white" : "text-gray-900") : sub}>{col.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  ) : null;

  return (
    <div className={`${card} border ${border} rounded-2xl overflow-hidden`}>
      {/* Date filter + column config */}
      {dateField && (
        <div className={`px-5 py-3 flex items-center gap-3 flex-wrap border-b ${border}`}>
          <Calendar size={16} className={sub} />
          <div className="flex gap-1.5 flex-wrap">
            {DATE_PRESETS.map((p) => (
              <button key={p.key} onClick={() => { setDatePreset(p.key); setPage(1); }} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${datePreset === p.key ? "bg-[#FA3633] text-white shadow-sm shadow-[#FA3633]/25" : isDark ? "bg-white/5 text-white/50 hover:bg-white/10" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>{p.label}</button>
            ))}
          </div>
          <button onClick={() => { setDatePreset("custom"); setPage(1); }} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${datePreset === "custom" ? "bg-[#FA3633] text-white shadow-sm shadow-[#FA3633]/25" : isDark ? "bg-white/5 text-white/50 hover:bg-white/10" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>กำหนดเอง</button>
          {datePreset !== "all" && <span className={`text-xs ${sub}`}>{filteredData.length} รายการ</span>}
          {datePreset === "custom" && (
            <div className="flex items-center gap-2 ml-2">
              <DatePicker value={customFrom} onChange={(v) => { setCustomFrom(v); setPage(1); }} className="w-40" />
              <span className={`text-xs ${sub}`}>—</span>
              <DatePicker value={customTo} onChange={(v) => { setCustomTo(v); setPage(1); }} className="w-40" />
            </div>
          )}
          {/* Column config inside date bar */}
          {columnConfigKey && <>
            <div className={`w-px h-5 ml-auto ${isDark ? "bg-white/10" : "bg-gray-200"}`} />
            {columnConfigButton}
          </>}
        </div>
      )}
      {/* Column config standalone (no dateField) */}
      {!dateField && columnConfigKey && (
        <div className={`px-5 py-3 flex items-center border-b ${border}`}>
          {columnConfigButton}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={headBg}>
              {expandRender && <th className="w-10" />}
              {orderedColumns.map((col, idx) => (
                <th key={col.key} draggable onDragStart={() => onDragStart(idx)} onDragOver={onDragOver} onDrop={() => onDrop(idx)} className={`px-4 py-3 text-xs font-semibold whitespace-nowrap ${sub} ${alignCls(col.align)} cursor-grab active:cursor-grabbing select-none`}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sliced.length === 0 ? (
              <tr><td colSpan={columns.length + (expandRender ? 1 : 0)} className={`px-5 py-12 text-center text-sm ${sub}`}>{emptyText}</td></tr>
            ) : (
              sliced.map((row) => {
                const key = rowKey(row);
                const isExpanded = expandedRow === key;
                return (
                  <Fragment key={key}>
                    <tr
                      className={`border-t ${border} ${rowHover} transition-colors ${expandRender ? "cursor-pointer" : ""} ${isExpanded ? expandBg : ""}`}
                      onClick={expandRender ? () => toggleExpand(key) : undefined}
                    >
                      {expandRender && (
                        <td className="pl-4 pr-0 py-3">
                          <ChevronDown size={14} className={`transition-transform ${sub} ${isExpanded ? "rotate-180" : ""}`} />
                        </td>
                      )}
                      {orderedColumns.map((col) => (
                        <td key={col.key} className={`px-4 py-3 text-sm whitespace-nowrap ${alignCls(col.align)} ${txt}`}>
                          {col.render ? col.render(row, isDark) : (row as any)[col.key]}
                        </td>
                      ))}
                    </tr>
                    {expandRender && isExpanded && (
                      <tr>
                        <td colSpan={orderedColumns.length + 1} className={`px-5 py-4 ${expandBg} border-t ${border}`}>
                          {expandRender(row, isDark)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredData.length > 0 && (
        <div className={`px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t ${border}`}>
          <div className={`text-xs ${sub}`}>แสดงรายการที่ {from}-{to} จากทั้งหมด {filteredData.length} รายการ</div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center rounded-lg overflow-hidden border ${border}`}>
              {[5, 10, 20, 50].map((n) => (
                <button key={n} onClick={() => { setPerPage(n); setPage(1); }} className={`px-2.5 py-1 text-xs font-medium transition-colors ${perPage === n ? "bg-[#FA3633] text-white" : isDark ? "text-white/50 hover:bg-white/5" : "text-gray-500 hover:bg-gray-100"}`}>{n}</button>
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
