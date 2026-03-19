"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { ChevronDown, Search, Check } from "lucide-react";

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
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const showSearch = searchable ?? true;

  const updatePos = useCallback(() => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        // Also check if click is inside the portal dropdown
        const portal = document.getElementById("select-portal");
        if (portal && portal.contains(e.target as Node)) return;
        setOpen(false); setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open) {
      updatePos();
      if (showSearch) setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, showSearch, updatePos]);

  const selected = options.find((o) => o.value === value);
  const filtered = query ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()) || o.value.toLowerCase().includes(query.toLowerCase())) : options;

  const bg = isDark ? "bg-[rgba(255,255,255,0.05)]" : "bg-gray-50";
  const border = isDark ? "border-white/10" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/40" : "text-gray-400";
  const dropBg = isDark ? "bg-[#1a1a1a]" : "bg-white";
  const dropBorder = isDark ? "border-white/10" : "border-gray-200";
  const hoverBg = isDark ? "hover:bg-white/5" : "hover:bg-gray-50";
  const activeBg = isDark ? "bg-[#FA3633]/10" : "bg-[#FA3633]/5";
  const searchBg = isDark ? "bg-white/5 text-white placeholder-white/30" : "bg-gray-50 text-gray-900 placeholder-gray-400";

  const dropdown = open && typeof window !== "undefined" && createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[200]" onClick={() => { setOpen(false); setQuery(""); }} />
      {/* Dropdown */}
      <div
        id="select-portal"
        className={`fixed z-[201] ${dropBg} border ${dropBorder} rounded-xl shadow-2xl overflow-hidden`}
        style={{ top: pos.top, left: pos.left, width: pos.width, maxHeight: "50vh" }}
      >
        {showSearch && (
          <div className="px-2.5 pt-2.5 pb-1.5">
            <div className="relative">
              <Search size={14} className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${sub}`} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหา..."
                className={`w-full h-9 pl-8 pr-3 ${searchBg} border ${isDark ? "border-white/10" : "border-gray-200"} rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`}
              />
            </div>
          </div>
        )}
        <div className="overflow-y-auto py-1" style={{ maxHeight: showSearch ? "calc(50vh - 52px)" : "50vh" }}>
          {filtered.length === 0 ? (
            <div className={`px-3 py-4 text-center text-sm ${sub}`}>ไม่พบรายการ</div>
          ) : (
            filtered.map((opt) => {
              const isActive = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); setQuery(""); }}
                  className={`w-full px-3.5 py-2.5 text-sm text-left transition-colors flex items-center justify-between ${isActive ? `${activeBg} text-[#FA3633] font-medium` : `${txt} ${hoverBg}`}`}
                >
                  <span className="flex items-center gap-2">
                    {opt.dot && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: opt.dot }} />}
                    {opt.label}
                  </span>
                  {isActive && <Check size={16} className="text-[#FA3633] shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </>,
    document.body,
  );

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        ref={btnRef}
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
      {dropdown}
    </div>
  );
}
