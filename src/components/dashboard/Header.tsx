"use client";

import { Search, Bell } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

interface HeaderProps {
  displayName: string;
  pictureUrl?: string;
}

export default function Header({ displayName, pictureUrl }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "สวัสดีตอนเช้า";
    if (h < 17) return "สวัสดีตอนบ่าย";
    return "สวัสดีตอนเย็น";
  })();

  return (
    <header className="h-16 bg-[#111111] border-b border-white/5 flex items-center justify-between px-6">
      <div>
        <h2 className="text-base font-medium">
          {greeting}, {displayName}
        </h2>
        <p className="text-xs text-white/40">
          {new Date().toLocaleDateString("th-TH", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
          />
          <input
            type="text"
            placeholder="ค้นหา..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-56 h-9 pl-9 pr-4 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#FA3633]/50 transition-colors"
          />
        </div>

        <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
          <Bell size={20} className="text-white/60" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FA3633] rounded-full" />
        </button>

        <div className="flex items-center gap-3">
          {pictureUrl ? (
            <Image
              src={pictureUrl}
              alt={displayName}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#FA3633]/20 text-[#FA3633] flex items-center justify-center text-sm font-medium">
              {displayName.charAt(0)}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
