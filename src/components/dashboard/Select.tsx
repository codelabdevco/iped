"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { ChevronDown, Search } from "lucide-react";

interface Option {
  value: string;
  label: string;
  dot?: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  searchable?: boolean;
}

export default function Select({ value, onChange, options, placeholder = "เลือก...", className = "", searchable }: SelectProps) {
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-enable search when > 6 options
  const showSearch = searchable ?? options.length > 6;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQuery(""); }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open && showSearch) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open, showSearch]);

  const selected = options.find((o) => o.value === value);
  const filtered = query ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()) || o.value.toLowerCase().includes(query.toLowerCase())) : options;

  const bg = isDark ? "bg-[rgba(255,255,255,0.05)]" : "bg-gray-50";
  const border = isDark ? "border-white/10" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/40" : "text-gray-400";
  const dropBg = isDark ? "bg-[#1a1a1a]" : "bg-white";
  const dropBorder = isDark ? "border-white/10" : "border-gray-200";
  const hoverBg = isDark ? "hover:bg-white/5" : "hover:bg-gray-50";
  const activeBg = isDark ? "bg-[#FA3633]/10 text-[#FA3633]" : "bg-[#FA3633]/5 text-[#FA3633]";
  const searchBg = isDark ? "bg-white/5 text-white placeholder-white/30" : "bg-gray-50 text-gray-900 placeholder-gray-400";

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => { setOpen(!open); setQuery(""); }}
        className={`w-full h-10 px-3 ${bg} border ${border} rounded-lg text-sm text-left flex items-center justify-between transition-colors focus:outline-none focus:border-[#FA3633]/50 ${txt}`}
      >
        <span className={`flex items-center gap-1.5 truncate ${selected ? txt : sub}`}>
          {selected?.dot && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selected.dot }} />}
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={14} className={`transition-transform shrink-0 ml-2 ${sub} ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className={`absolute z-50 top-full left-0 right-0 mt-1 ${dropBg} border ${dropBorder} rounded-xl shadow-xl overflow-hidden`}>
          {showSearch && (
            <div className={`px-2 pt-2 pb-1`}>
              <div className="relative">
                <Search size={14} className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${sub}`} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ค้นหา..."
                  className={`w-full h-8 pl-8 pr-3 ${searchBg} border ${isDark ? "border-white/10" : "border-gray-200"} rounded-lg text-xs focus:outline-none focus:border-[#FA3633]/50`}
                />
              </div>
            </div>
          )}
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className={`px-3 py-3 text-center text-xs ${sub}`}>ไม่พบรายการ</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); setQuery(""); }}
                  className={`w-full px-3 py-2 text-sm text-left transition-colors ${opt.value === value ? activeBg : `${txt} ${hoverBg}`}`}
                >
                  <span className="flex items-center gap-1.5">
                    {opt.dot && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: opt.dot }} />}
                    {opt.label}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
