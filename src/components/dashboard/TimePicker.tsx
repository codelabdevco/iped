"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Clock } from "lucide-react";

interface TimePickerProps {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}

export default function TimePicker({ value, onChange, className = "" }: TimePickerProps) {
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  const minutes = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

  const [h, m] = (value || "00:00").split(":");
  const currentH = h || "00";
  const currentM = m || "00";

  const selectTime = (hour: string, minute: string) => {
    onChange(`${hour}:${minute}`);
    setOpen(false);
  };

  const bg = isDark ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900";
  const dropBg = isDark ? "bg-[#1a1a1a] border-white/10" : "bg-white border-gray-200";
  const hoverBg = isDark ? "hover:bg-white/5" : "hover:bg-gray-50";
  const activeBg = isDark ? "bg-[#FA3633] text-white" : "bg-[#FA3633] text-white";
  const sub = isDark ? "text-white/40" : "text-gray-400";

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full h-9 px-3 border rounded-lg text-sm text-left flex items-center gap-2 ${bg} focus:outline-none focus:border-[#FA3633]/50`}
      >
        <Clock size={14} className={sub} />
        <span>{value || "--:--"}</span>
      </button>
      {open && (
        <div className={`absolute top-full left-0 mt-1 w-56 rounded-xl border shadow-xl z-50 ${dropBg}`}>
          <div className="flex">
            {/* Hours */}
            <div className="flex-1 max-h-48 overflow-y-auto border-r border-inherit p-1">
              <div className={`text-[10px] font-semibold px-2 py-1 ${sub}`}>ชั่วโมง</div>
              {hours.map((hour) => (
                <button
                  key={hour}
                  onClick={() => selectTime(hour, currentM)}
                  className={`w-full px-2 py-1.5 rounded-md text-xs text-center transition-colors ${hour === currentH ? activeBg : hoverBg}`}
                >
                  {hour}
                </button>
              ))}
            </div>
            {/* Minutes */}
            <div className="flex-1 max-h-48 overflow-y-auto p-1">
              <div className={`text-[10px] font-semibold px-2 py-1 ${sub}`}>นาที</div>
              {minutes.map((minute) => (
                <button
                  key={minute}
                  onClick={() => selectTime(currentH, minute)}
                  className={`w-full px-2 py-1.5 rounded-md text-xs text-center transition-colors ${minute === currentM ? activeBg : hoverBg}`}
                >
                  {minute}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
