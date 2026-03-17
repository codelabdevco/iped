"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

export default function Select({ value, onChange, options, placeholder = "เลือก...", className = "" }: SelectProps) {
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = options.find((o) => o.value === value);

  const bg = isDark ? "bg-[rgba(255,255,255,0.05)]" : "bg-gray-50";
  const border = isDark ? "border-white/10" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/40" : "text-gray-400";
  const dropBg = isDark ? "bg-[#1a1a1a]" : "bg-white";
  const dropBorder = isDark ? "border-white/10" : "border-gray-200";
  const hoverBg = isDark ? "hover:bg-white/5" : "hover:bg-gray-50";
  const activeBg = isDark ? "bg-[#FA3633]/10 text-[#FA3633]" : "bg-[#FA3633]/5 text-[#FA3633]";

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full h-10 px-3 ${bg} border ${border} rounded-lg text-sm text-left flex items-center justify-between transition-colors focus:outline-none focus:border-[#FA3633]/50 ${txt}`}
      >
        <span className={selected ? txt : sub}>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={14} className={`transition-transform ${sub} ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className={`absolute z-50 top-full left-0 right-0 mt-1 ${dropBg} border ${dropBorder} rounded-xl shadow-xl overflow-hidden`}>
          <div className="max-h-60 overflow-y-auto py-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full px-3 py-2 text-sm text-left transition-colors ${
                  opt.value === value ? activeBg : `${txt} ${hoverBg}`
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
