"use client";

import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  ScanLine,
  Upload,
  CheckCircle2,
  Loader2,
  XCircle,
  Trash2,
  ImageIcon,
} from "lucide-react";

interface ScanItem {
  id: string;
  shop: string;
  amount: number;
  date: string;
  status: "success" | "processing" | "failed";
  confidence: number;
}

const initialScans: ScanItem[] = [
  {
    id: "SC001",
    shop: "เซเว่นอีเลฟเว่น สาขาสีลม",
    amount: 245.0,
    date: "2026-03-17 10:32",
    status: "success",
    confidence: 97,
  },
  {
    id: "SC002",
    shop: "แม็คโคร สาขาจรัญฯ",
    amount: 3820.5,
    date: "2026-03-17 09:15",
    status: "success",
    confidence: 94,
  },
  {
    id: "SC003",
    shop: "โลตัส สาขาพระราม 2",
    amount: 1560.0,
    date: "2026-03-16 18:45",
    status: "processing",
    confidence: 0,
  },
  {
    id: "SC004",
    shop: "ร้านก๋วยเตี๋ยวป้าแดง",
    amount: 85.0,
    date: "2026-03-16 12:20",
    status: "success",
    confidence: 88,
  },
  {
    id: "SC005",
    shop: "ไม่สามารถอ่านได้",
    amount: 0,
    date: "2026-03-15 16:00",
    status: "failed",
    confidence: 12,
  },
];

export default function ScanPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [scans, setScans] = useState<ScanItem[]>(initialScans);

  const clearDemo = () => setScans([]);

  const statusConfig = {
    success: {
      label: "สแกนสำเร็จ",
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: isDark ? "bg-emerald-500/10" : "bg-emerald-50",
    },
    processing: {
      label: "กำลังประมวลผล",
      icon: Loader2,
      color: "text-amber-500",
      bg: isDark ? "bg-amber-500/10" : "bg-amber-50",
    },
    failed: {
      label: "ล้มเหลว",
      icon: XCircle,
      color: "text-red-500",
      bg: isDark ? "bg-red-500/10" : "bg-red-50",
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>สแกน AI OCR</h1>
          <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>สแกนใบเสร็จและเอกสารด้วย AI</p>
        </div>
        <button onClick={clearDemo} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${isDark ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-red-50 text-red-600 hover:bg-red-100"} transition-colors`}><Trash2 size={16} />ล้างข้อมูลตัวอย่าง</button>
      </div>

      {/* Upload Zone */}
      <div
        className={`rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${
          isDark
            ? "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] hover:border-blue-500/40"
            : "border-gray-300 bg-gray-50 hover:border-blue-400"
        }`}
      >
        <Upload className={`w-12 h-12 mx-auto mb-4 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
        <p className={`text-lg font-medium mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>
          ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
        </p>
        <p className={isDark ? "text-gray-500" : "text-gray-400"}>
          รองรับ JPG, PNG, PDF ขนาดไม่เกิน 10MB
        </p>
        <button className="mt-4 px-6 py-2.5 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors">
          เลือกไฟล์
        </button>
      </div>

      {/* Recent Scans */}
      <div>
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
          การสแกนล่าสุด
        </h2>
        {scans.length === 0 ? (
          <div
            className={`rounded-2xl border p-12 text-center ${
              isDark
                ? "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]"
                : "bg-white border-gray-200"
            }`}
          >
            <p className={isDark ? "text-gray-500" : "text-gray-400"}>ไม่มีข้อมูลตัวอย่าง</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scans.map((scan) => {
              const cfg = statusConfig[scan.status];
              const StatusIcon = cfg.icon;
              return (
                <div
                  key={scan.id}
                  className={`rounded-2xl border p-4 flex items-center gap-4 ${
                    isDark
                      ? "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]"
                      : "bg-white border-gray-200"
                  }`}
                >
                  {/* Thumbnail Placeholder */}
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isDark ? "bg-[rgba(255,255,255,0.06)]" : "bg-gray-100"
                    }`}
                  >
                    <ImageIcon className={`w-6 h-6 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                      {scan.shop}
                    </p>
                    <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      {scan.date}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="text-right flex-shrink-0">
                    <p className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                      {scan.amount > 0
                        ? `฿${scan.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`
                        : "-"}
                    </p>
                    {scan.status === "success" && (
                      <p className="text-xs text-emerald-500">ความแม่นยำ {scan.confidence}%</p>
                    )}
                    {scan.status === "failed" && (
                      <p className="text-xs text-red-500">ความแม่นยำ {scan.confidence}%</p>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium flex-shrink-0 ${cfg.bg} ${cfg.color}`}
                  >
                    <StatusIcon className={`w-4 h-4 ${scan.status === "processing" ? "animate-spin" : ""}`} />
                    {cfg.label}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
