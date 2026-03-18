"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  className?: string;
}

const TH_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const TH_MONTHS_FULL = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const TH_DAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstDayOfWeek(y: number, m: number) { return new Date(y, m, 1).getDay(); }

export default function DatePicker({ value, onChange, className = "" }: DatePickerProps) {
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [showMonthYear, setShowMonthYear] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const parsed = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(parsed.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed.getMonth());

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setShowMonthYear(false); }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const bg = isDark ? "bg-[rgba(255,255,255,0.05)]" : "bg-gray-50";
  const border = isDark ? "border-white/10" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/40" : "text-gray-400";
  const dropBg = isDark ? "bg-[#1a1a1a]" : "bg-white";
  const dropBorder = isDark ? "border-white/10" : "border-gray-200";
  const hoverCls = isDark ? "hover:bg-white/5" : "hover:bg-gray-100";
  const activeCls = "bg-[#FA3633] text-white";

  const days = daysInMonth(viewYear, viewMonth);
  const first = firstDayOfWeek(viewYear, viewMonth);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const cells: (number | null)[] = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  const prev = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); };
  const next = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); };

  const select = (day: number) => {
    const str = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(str);
    setOpen(false);
  };

  const displayValue = value
    ? (() => {
        const d = new Date(value);
        return `${d.getDate()} ${TH_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
      })()
    : "";

  // Year range for picker
  const currentCE = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentCE - 3 + i);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => { setOpen(!open); setShowMonthYear(false); }}
        className={`w-full h-9 px-3 ${bg} border ${border} rounded-lg text-sm text-left flex items-center gap-2 transition-colors focus:outline-none focus:border-[#FA3633]/50 ${txt}`}
      >
        <Calendar size={14} className={sub} />
        <span className={value ? txt : sub}>{displayValue || "เลือกวันที่"}</span>
      </button>

      {open && (
        <div className={`absolute z-50 top-full left-0 mt-1 ${dropBg} border ${dropBorder} rounded-xl shadow-xl p-3 w-[280px]`}>
          {showMonthYear ? (
            /* Month + Year picker grid */
            <div>
              <div className="flex items-center justify-between mb-2">
                <button type="button" onClick={() => setViewYear(viewYear - 1)} className={`p-1.5 rounded-lg ${hoverCls} ${sub}`}><ChevronLeft size={16} /></button>
                <span className={`text-sm font-semibold ${txt}`}>{viewYear + 543}</span>
                <button type="button" onClick={() => setViewYear(viewYear + 1)} className={`p-1.5 rounded-lg ${hoverCls} ${sub}`}><ChevronRight size={16} /></button>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {TH_MONTHS.map((m, i) => (
                  <button key={i} type="button" onClick={() => { setViewMonth(i); setShowMonthYear(false); }} className={`py-2 rounded-lg text-xs font-medium transition-colors ${i === viewMonth ? activeCls : `${txt} ${hoverCls}`}`}>{m}</button>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb" }}>
                <div className="flex gap-1 flex-wrap">
                  {years.map((y) => (
                    <button key={y} type="button" onClick={() => { setViewYear(y); }} className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${y === viewYear ? activeCls : `${sub} ${hoverCls}`}`}>{y + 543}</button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Month nav — click center to open month/year picker */}
              <div className="flex items-center justify-between mb-2">
                <button type="button" onClick={prev} className={`p-1.5 rounded-lg transition-colors ${hoverCls} ${sub}`}><ChevronLeft size={16} /></button>
                <button type="button" onClick={() => setShowMonthYear(true)} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-semibold ${txt} ${hoverCls}`}>
                  {TH_MONTHS_FULL[viewMonth]} {viewYear + 543}
                  <ChevronDown size={12} className={sub} />
                </button>
                <button type="button" onClick={next} className={`p-1.5 rounded-lg transition-colors ${hoverCls} ${sub}`}><ChevronRight size={16} /></button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {TH_DAYS.map((d) => <div key={d} className={`text-center text-[10px] font-medium py-1 ${sub}`}>{d}</div>)}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-0.5">
                {cells.map((day, i) => {
                  if (day === null) return <div key={`e${i}`} />;
                  const str = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const isSelected = str === value;
                  const isToday = str === todayStr;
                  return (
                    <button key={day} type="button" onClick={() => select(day)} className={`w-full aspect-square rounded-lg text-xs flex items-center justify-center transition-all ${isSelected ? activeCls + " font-bold" : isToday ? (isDark ? "ring-1 ring-white/20 text-white" : "ring-1 ring-gray-300 text-gray-800") : `${isDark ? "text-white/70" : "text-gray-700"} ${hoverCls}`}`}>
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Quick actions */}
              <div className="flex gap-1 mt-2 pt-2 border-t" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb" }}>
                <button type="button" onClick={() => { onChange(todayStr); setOpen(false); }} className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${isDark ? "bg-white/5 text-white/50 hover:bg-white/10" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>วันนี้</button>
                <button type="button" onClick={() => { onChange(""); setOpen(false); }} className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${isDark ? "bg-white/5 text-white/50 hover:bg-white/10" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>ล้าง</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
