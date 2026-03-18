"use client";

import { useTheme } from "@/contexts/ThemeContext";

export default function ReceiptsLoading() {
  const { isDark } = useTheme();
  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const sk = isDark ? "bg-white/[0.06]" : "bg-gray-200/70";
  const skLight = isDark ? "bg-white/[0.04]" : "bg-gray-100";

  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className={`h-7 w-40 rounded-lg animate-pulse ${sk}`} />
          <div className={`h-4 w-56 rounded-md animate-pulse mt-2 ${skLight}`} />
        </div>
        <div className={`h-10 w-28 rounded-xl animate-pulse ${sk}`} />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0,1,2,3].map((i) => (
          <div key={i} className={`${card} border ${border} rounded-xl p-5`}>
            <div className={`w-9 h-9 rounded-lg animate-pulse mb-3 ${sk}`} />
            <div className={`h-7 w-24 rounded-md animate-pulse mb-2 ${sk}`} />
            <div className={`h-4 w-20 rounded-md animate-pulse ${skLight}`} />
          </div>
        ))}
      </div>

      {/* Filter bar skeleton */}
      <div className={`${card} border ${border} rounded-xl px-5 py-3`}>
        <div className="flex items-center gap-3">
          <div className={`h-10 flex-1 rounded-lg animate-pulse ${skLight}`} />
          <div className={`h-10 w-36 rounded-lg animate-pulse ${skLight}`} />
          <div className={`h-10 w-36 rounded-lg animate-pulse ${skLight}`} />
        </div>
      </div>

      {/* Table skeleton */}
      <div className={`${card} border ${border} rounded-2xl overflow-hidden`}>
        {/* Date filter bar */}
        <div className={`px-5 py-3 flex items-center gap-3 border-b ${border}`}>
          {[0,1,2,3,4,5,6].map((i) => (
            <div key={i} className={`h-7 rounded-full animate-pulse ${skLight}`} style={{ width: `${50 + (i * 7) % 20}px` }} />
          ))}
        </div>
        {/* Header row */}
        <div className={`flex items-center gap-4 px-4 py-3 ${isDark ? "bg-[rgba(255,255,255,0.03)]" : "bg-gray-50"}`}>
          {["w-10","flex-1","w-24","w-32","w-20","w-16","w-12"].map((w, i) => (
            <div key={i} className={`h-3 rounded animate-pulse ${skLight} ${w}`} />
          ))}
        </div>
        {/* Body rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`flex items-center gap-4 px-4 py-3 border-t ${border}`}>
            <div className={`w-10 h-10 rounded-lg animate-pulse ${sk}`} />
            <div className="flex-1 space-y-1.5">
              <div className={`h-4 rounded animate-pulse ${sk}`} style={{ width: `${50 + (i * 23) % 35}%` }} />
              <div className={`h-3 rounded animate-pulse ${skLight}`} style={{ width: `${30 + (i * 17) % 25}%` }} />
            </div>
            <div className={`h-4 w-20 rounded animate-pulse ${sk}`} />
            <div className="space-y-1.5">
              <div className={`h-4 w-24 rounded animate-pulse ${sk}`} />
              <div className={`h-3 w-16 rounded animate-pulse ${skLight}`} />
            </div>
            <div className={`h-6 w-16 rounded-lg animate-pulse ${sk}`} />
            <div className="flex gap-1">
              <div className={`w-7 h-7 rounded-lg animate-pulse ${skLight}`} />
              <div className={`w-7 h-7 rounded-lg animate-pulse ${skLight}`} />
            </div>
          </div>
        ))}
        {/* Pagination skeleton */}
        <div className={`px-5 py-3 flex items-center justify-between border-t ${border}`}>
          <div className={`h-3 w-40 rounded animate-pulse ${skLight}`} />
          <div className="flex gap-1">
            {[0,1,2,3].map((i) => <div key={i} className={`w-8 h-7 rounded-lg animate-pulse ${skLight}`} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
