"use client";

import { useTheme } from "@/contexts/ThemeContext";

export default function Loading() {
  const { isDark } = useTheme();
  const sk = isDark ? "bg-white/[0.06]" : "bg-gray-200/70";
  const skLight = isDark ? "bg-white/[0.04]" : "bg-gray-100";

  return (
    <div className="space-y-6 animate-pulse">
      <div><div className={`h-7 w-40 rounded-lg ${sk}`} /><div className={`h-4 w-64 rounded-md mt-2 ${skLight}`} /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className={`h-24 rounded-xl ${skLight}`} />)}
      </div>
      <div className={`h-64 rounded-2xl ${skLight}`} />
    </div>
  );
}
