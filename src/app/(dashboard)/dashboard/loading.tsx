"use client";

import { useTheme } from "@/contexts/ThemeContext";

export default function DashboardLoading() {
  const { isDark } = useTheme();
  const sk = isDark ? "bg-white/[0.06]" : "bg-gray-200/70";
  const skLight = isDark ? "bg-white/[0.04]" : "bg-gray-100";
  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <div className={`h-7 w-40 rounded-lg animate-pulse ${sk}`} />
        <div className={`h-4 w-64 rounded-md animate-pulse mt-2 ${skLight}`} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`${card} border ${border} rounded-xl p-5`}>
            <div className={`w-9 h-9 rounded-lg animate-pulse mb-3 ${sk}`} />
            <div className={`h-7 w-24 rounded-md animate-pulse mb-2 ${sk}`} />
            <div className={`h-4 w-20 rounded-md animate-pulse ${skLight}`} />
          </div>
        ))}
      </div>
      <div className={`${card} border ${border} rounded-2xl p-6`}>
        <div className="space-y-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className={`h-4 rounded animate-pulse ${sk}`} style={{ width: `${40 + (i * 19) % 40}%` }} />
              <div className={`h-4 w-20 rounded animate-pulse ${skLight} ml-auto`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
