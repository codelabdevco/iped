"use client";

import { useTheme } from "@/contexts/ThemeContext";

interface StatsCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  change?: string;
  color?: string;
  loading?: boolean;
}

export default function StatsCard({ label, value, icon, change, color = "text-[#FA3633]", loading }: StatsCardProps) {
  const { isDark } = useTheme();
  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const iconBg = isDark ? "bg-[rgba(255,255,255,0.03)]" : "bg-gray-100";
  const skBg = isDark ? "bg-white/[0.06]" : "bg-gray-200/70";

  return (
    <div className={`${card} border ${border} rounded-xl p-5`}>
      <div className="flex items-center justify-between mb-3">
        {icon && <span className={`p-2 rounded-lg ${loading ? skBg : color} ${iconBg}`}>{loading ? <div className="w-5 h-5" /> : icon}</span>}
        {!loading && change && (
          <span className={`text-xs ${change.includes("↘") || change.startsWith("-") ? "text-red-400" : "text-green-400"}`}>
            {change}
          </span>
        )}
      </div>
      {loading ? (
        <>
          <div className={`h-7 w-28 rounded-md animate-pulse ${skBg} mb-2`} />
          <div className={`h-4 w-20 rounded-md animate-pulse ${isDark ? "bg-white/[0.04]" : "bg-gray-100"}`} />
        </>
      ) : (
        <>
          <div className={`text-2xl font-bold ${txt}`}>{value}</div>
          <div className={`text-sm ${sub}`}>{label}</div>
        </>
      )}
    </div>
  );
}
