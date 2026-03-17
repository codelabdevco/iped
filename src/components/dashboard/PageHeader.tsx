"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { Trash2, Plus } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description: string;
  onClear?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

export default function PageHeader({ title, description, onClear, actionLabel, onAction }: PageHeaderProps) {
  const { isDark } = useTheme();
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";

  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 className={`text-2xl font-bold ${txt}`}>{title}</h1>
        <p className={`text-sm ${sub}`}>{description}</p>
      </div>
      <div className="flex gap-2">
        {onClear && (
          <button
            onClick={onClear}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              isDark
                ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                : "bg-red-50 text-red-600 hover:bg-red-100"
            }`}
          >
            <Trash2 size={16} />
            ล้างข้อมูลตัวอย่าง
          </button>
        )}
        {actionLabel && (
          <button
            onClick={onAction}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            <Plus size={16} />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
