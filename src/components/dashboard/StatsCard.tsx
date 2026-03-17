"use client";

import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  change?: number;
  icon: LucideIcon;
  color?: string;
}

export default function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  color = "#FA3633",
}: StatsCardProps) {
  return (
    <div className="bg-[#111111] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={20} style={{ color }} />
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs font-medium ${
              change >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-white/40 mt-1">{title}</p>
    </div>
  );
}
