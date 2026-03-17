"use client";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  from: Date;
  to: Date;
  onChange: (from: Date, to: Date) => void;
}

const PRESETS = [
  { label: "เดือนนี้", key: "month" },
  { label: "3 เดือน", key: "3m" },
  { label: "6 เดือน", key: "6m" },
  { label: "ปีนี้", key: "year" },
  { label: "กำหนดเอง", key: "custom" },
];

const TH_MONTHS = [
  "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
  "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
];
const TH_DAYS = ["อา","จ","อ","พ","พฤ","ศ","ส"];

function getPresetDates(key: string): { from: Date; to: Date } {
  const now = new Date();
  switch (key) {
    case "month":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
    case "3m":
      return { from: new Date(now.getFullYear(), now.getMonth() - 2, 1), to: now };
    case "6m":
      return { from: new Date(now.getFullYear(), now.getMonth() - 5, 1), to: now };
    case "year":
      return { from: new Date(now.getFullYear(), 0, 1), to: now };
    default:
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
  }
}

function formatDateTH(d: Date): string {
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isBetween(d: Date, from: Date, to: Date): boolean {
  const t = d.getTime();
  return t >= from.getTime() && t <= to.getTime();
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/* ─── Mini Calendar Component ─── */
function MiniCalendar({
  selecting,
  rangeFrom,
  rangeTo,
  onSelect,
  isDark,
}: {
  selecting: "from" | "to";
  rangeFrom: Date | null;
  rangeTo: Date | null;
  onSelect: (d: Date) => void;
  isDark: boolean;
}) {
  const init = selecting === "from" ? (rangeFrom || new Date()) : (rangeTo || new Date());
  const [viewYear, setViewYear] = useState(init.getFullYear());
  const [viewMonth, setViewMonth] = useState(init.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const today = new Date();

  const prev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const next = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const headerBg = isDark ? "text-white" : "text-gray-800";
  const dayHeader = isDark ? "text-white/40" : "text-gray-400";

  return (
    <div className="w-[260px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={prev} className={`p-1 rounded-lg hover:bg-white/10 transition-colors ${isDark ? "text-white/60" : "text-gray-500"}`}>
          <ChevronLeft size={16} />
        </button>
        <span className={`text-sm font-semibold ${headerBg}`}>
          {TH_MONTHS[viewMonth]} {viewYear + 543}
        </span>
        <button onClick={next} className={`p-1 rounded-lg hover:bg-white/10 transition-colors ${isDark ? "text-white/60" : "text-gray-500"}`}>
          <ChevronRight size={16} />
        </button>
      </div>
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {TH_DAYS.map((d) => (
          <div key={d} className={`text-center text-[10px] font-medium py-1 ${dayHeader}`}>{d}</div>
        ))}
      </div>
      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />;
          const date = new Date(viewYear, viewMonth, day);
          const isToday = isSameDay(date, today);
          const isFrom = rangeFrom && isSameDay(date, rangeFrom);
          const isTo = rangeTo && isSameDay(date, rangeTo);
          const inRange = rangeFrom && rangeTo && isBetween(date, rangeFrom, rangeTo);
          const isSelected = isFrom || isTo;

          let cls = "relative flex items-center justify-center w-full aspect-square rounded-lg text-xs transition-all cursor-pointer ";
          if (isSelected) {
            cls += "bg-[#FA3633] text-white font-bold ";
          } else if (inRange) {
            cls += isDark ? "bg-[#FA3633]/15 text-[#FA3633] " : "bg-[#FA3633]/10 text-[#FA3633] ";
          } else if (isToday) {
            cls += isDark ? "ring-1 ring-white/20 text-white " : "ring-1 ring-gray-300 text-gray-800 ";
          } else {
            cls += isDark ? "text-white/70 hover:bg-white/8 " : "text-gray-700 hover:bg-gray-100 ";
          }

          return (
            <button key={day} onClick={() => onSelect(date)} className={cls}>
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main DateRangePicker ─── */
export default function DateRangePicker({ from, to, onChange }: Props) {
  const { isDark } = useTheme();
  const [activePreset, setActivePreset] = useState("year");
  const [showCustom, setShowCustom] = useState(false);
  const [selecting, setSelecting] = useState<"from" | "to">("from");
  const [tempFrom, setTempFrom] = useState<Date | null>(from);
  const [tempTo, setTempTo] = useState<Date | null>(to);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowCustom(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handlePreset = (key: string) => {
    setActivePreset(key);
    if (key === "custom") {
      setTempFrom(from);
      setTempTo(to);
      setSelecting("from");
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    const { from: f, to: t } = getPresetDates(key);
    onChange(f, t);
  };

  const handleDaySelect = (d: Date) => {
    if (selecting === "from") {
      setTempFrom(d);
      if (tempTo && d > tempTo) setTempTo(null);
      setSelecting("to");
    } else {
      if (tempFrom && d < tempFrom) {
        setTempFrom(d);
        setSelecting("to");
      } else {
        setTempTo(d);
      }
    }
  };

  const handleApply = () => {
    if (tempFrom && tempTo) {
      onChange(tempFrom, tempTo);
      setShowCustom(false);
      setActivePreset("custom");
    }
  };

  const pill = (active: boolean) =>
    active
      ? "bg-[#FA3633] text-white shadow-sm shadow-[#FA3633]/25"
      : isDark ? "bg-white/8 text-white/60 hover:bg-white/12" : "bg-gray-100 text-gray-500 hover:bg-gray-200";

  const tabCls = (active: boolean) =>
    active
      ? "text-[#FA3633] border-b-2 border-[#FA3633] font-semibold"
      : isDark ? "text-white/40 hover:text-white/60" : "text-gray-400 hover:text-gray-600";

  return (
    <div ref={ref} className="relative flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1.5">
        <Calendar size={16} className={isDark ? "text-white/40" : "text-gray-400"} />
        <span className={`text-sm ${isDark ? "text-white/50" : "text-gray-500"}`}>
          {formatDateTH(from)} – {formatDateTH(to)}
        </span>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => handlePreset(p.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${pill(activePreset === p.key)}`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {showCustom && (
        <div className={`absolute top-full left-0 mt-2 z-50 rounded-xl border shadow-xl ${isDark ? "bg-[#1a1a1a] border-white/10" : "bg-white border-gray-200"}`}>
          {/* Tabs: From / To */}
          <div className="flex border-b px-4 pt-3 gap-4" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb" }}>
            <button onClick={() => setSelecting("from")} className={`pb-2 text-xs transition-all ${tabCls(selecting === "from")}`}>
              จาก {tempFrom ? formatDateTH(tempFrom) : "—"}
            </button>
            <button onClick={() => setSelecting("to")} className={`pb-2 text-xs transition-all ${tabCls(selecting === "to")}`}>
              ถึง {tempTo ? formatDateTH(tempTo) : "—"}
            </button>
          </div>
          {/* Calendar */}
          <div className="p-4">
            <MiniCalendar
              selecting={selecting}
              rangeFrom={tempFrom}
              rangeTo={tempTo}
              onSelect={handleDaySelect}
              isDark={isDark}
            />
          </div>
          {/* Apply button */}
          <div className="px-4 pb-4">
            <button
              onClick={handleApply}
              disabled={!tempFrom || !tempTo}
              className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                tempFrom && tempTo
                  ? "bg-[#FA3633] text-white hover:bg-[#e02e2b]"
                  : isDark ? "bg-white/5 text-white/20 cursor-not-allowed" : "bg-gray-100 text-gray-300 cursor-not-allowed"
              }`}
            >
              ใช้ช่วงเวลานี้
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
