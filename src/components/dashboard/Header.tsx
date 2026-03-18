"use client";

import { Search, Bell, User, Menu } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface HeaderProps {
  displayName: string;
  pictureUrl?: string;
  onMenuToggle?: () => void;
}

export default function Header({ displayName, pictureUrl, onMenuToggle }: HeaderProps) {
  const { isDark } = useTheme();
  const bg = isDark ? "bg-[#111111] border-white/10" : "bg-white border-gray-200";
  const inputBg = isDark ? "bg-white/5 text-white placeholder-white/40 border-white/10" : "bg-gray-100 text-gray-900 placeholder-gray-400 border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const txtSub = isDark ? "text-white/50" : "text-gray-500";
  const iconBg = isDark ? "bg-white/5 text-white/70 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200";

  return (
    <header className={`h-16 ${bg} border-b flex items-center justify-between px-4 md:px-6`}>
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} className={`md:hidden w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center transition-colors`}>
          <Menu size={18} />
        </button>
        <div>
          <h2 className={`text-sm font-medium ${txt}`}>สวัสดี, {displayName}</h2>
          <p className={`text-xs ${txtSub} hidden sm:block`}>วัน{new Date().toLocaleDateString("th-TH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-3">
        <div className="relative hidden sm:block">
          <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${txtSub}`} />
          <input type="text" placeholder="ค้นหา..." className={`pl-9 pr-4 py-2 ${inputBg} border rounded-lg text-sm w-[160px] md:w-[200px] focus:outline-none focus:ring-1 focus:ring-[#FA3633]/50`} />
        </div>
        <button className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center transition-colors relative`}>
          <Bell size={18} />
        </button>
        <a href="/dashboard/profile" className={`w-9 h-9 rounded-full ${isDark ? "bg-[#FA3633]/20" : "bg-[#FA3633]/10"} flex items-center justify-center hover:ring-2 hover:ring-[#FA3633]/50 transition-all cursor-pointer`}>
          {pictureUrl ? <img src={pictureUrl} alt="" className="w-full h-full rounded-full object-cover" /> : <User size={18} className="text-[#FA3633]" />}
        </a>
      </div>
    </header>
  );
}
