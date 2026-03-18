"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Upload,
  CheckCircle2,
  Loader2,
  XCircle,
  AlertTriangle,
  ImageIcon,
  ExternalLink,
  Copy,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";

interface OcrResult {
  merchant: string;
  date: string;
  amount: number;
  vat?: number;
  category: string;
  categoryIcon: string;
  type: string;
  paymentMethod?: string;
  ocrConfidence: number;
  imageUrl?: string;
  imageHash?: string;
}

interface ScanItem {
  id: string;
  merchant: string;
  amount: number;
  date: string;
  status: "success" | "processing" | "failed" | "duplicate";
  confidence: number;
  ocrResult?: OcrResult;
  receiptId?: string;
  duplicateInfo?: string;
}

export default function ScanPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  const [scans, setScans] = useState<ScanItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (file: File) => {
    const scanId = `SC-${Date.now()}`;
    setScans((prev) => [
      {
        id: scanId,
        merchant: file.name,
        amount: 0,
        date: new Date().toLocaleString("th-TH"),
        status: "processing",
        confidence: 0,
      },
      ...prev,
    ]);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ocr", { method: "POST", body: formData });
      const json = await res.json();

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (json.success && json.data) {
        const d = json.data;
        setScans((prev) =>
          prev.map((s) =>
            s.id === scanId
              ? {
                  ...s,
                  merchant: d.merchant,
                  amount: d.amount,
                  date: d.date,
                  status: json.duplicate ? "duplicate" : "success",
                  confidence: d.ocrConfidence,
                  ocrResult: d,
                  receiptId: json.receipt?._id,
                  duplicateInfo: json.duplicateInfo,
                }
              : s
          )
        );
      } else {
        setScans((prev) =>
          prev.map((s) =>
            s.id === scanId ? { ...s, status: "failed", merchant: json.error || "อ่านไม่สำเร็จ" } : s
          )
        );
      }
    } catch {
      setScans((prev) =>
        prev.map((s) => (s.id === scanId ? { ...s, status: "failed", merchant: "เกิดข้อผิดพลาด" } : s))
      );
    } finally {
      setUploading(false);
    }
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Support multiple files
      Array.from(files).forEach((file) => handleUpload(file));
    }
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files) {
      Array.from(files).forEach((file) => handleUpload(file));
    }
  };

  const statusConfig = {
    success: {
      label: "บันทึกแล้ว — รอตรวจสอบ",
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: isDark ? "bg-emerald-500/10" : "bg-emerald-50",
    },
    processing: {
      label: "กำลังประมวลผล...",
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
    duplicate: {
      label: "พบสลิปซ้ำ",
      icon: AlertTriangle,
      color: "text-orange-500",
      bg: isDark ? "bg-orange-500/10" : "bg-orange-50",
    },
  };

  const successCount = scans.filter((s) => s.status === "success").length;
  const dupCount = scans.filter((s) => s.status === "duplicate").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="สแกน AI OCR"
        description="อัปโหลดรูปใบเสร็จ → AI อ่านข้อมูลอัตโนมัติ → บันทึกเข้าระบบทันที"
      />

      {/* Upload Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`rounded-2xl border-2 border-dashed p-12 text-center transition-colors cursor-pointer ${
          isDark
            ? "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] hover:border-[#FA3633]/40"
            : "border-gray-300 bg-gray-50 hover:border-[#FA3633]/40"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFileChange}
          className="hidden"
          multiple
        />
        {uploading ? (
          <Loader2 className={`w-12 h-12 mx-auto mb-4 animate-spin ${isDark ? "text-[#FA3633]" : "text-[#FA3633]"}`} />
        ) : (
          <Upload className={`w-12 h-12 mx-auto mb-4 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
        )}
        <p className={`text-lg font-medium mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>
          {uploading ? "กำลังอ่านใบเสร็จ..." : "ลากรูปสลิปมาวาง หรือคลิกเพื่อเลือกไฟล์"}
        </p>
        <p className={isDark ? "text-gray-500" : "text-gray-400"}>
          รองรับ JPG, PNG, PDF ขนาดไม่เกิน 10MB — เลือกได้หลายไฟล์
        </p>
        {!uploading && (
          <button
            className="mt-4 px-6 py-2.5 bg-[#FA3633] text-white rounded-xl font-medium hover:bg-[#e0302d] transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            เลือกไฟล์
          </button>
        )}
      </div>

      {/* Summary bar */}
      {scans.length > 0 && (
        <div className={`flex items-center gap-4 px-5 py-3 rounded-xl ${isDark ? "bg-white/[0.04] border border-white/[0.06]" : "bg-white border border-gray-200"}`}>
          <span className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
            สแกนทั้งหมด {scans.length} รายการ
          </span>
          {successCount > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-medium">
              รอตรวจสอบ {successCount}
            </span>
          )}
          {dupCount > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-orange-500/10 text-orange-500 font-medium">
              สลิปซ้ำ {dupCount}
            </span>
          )}
          <button
            onClick={() => router.push("/dashboard/receipts")}
            className="ml-auto flex items-center gap-1.5 text-xs font-medium text-[#FA3633] hover:underline"
          >
            ดูในใบเสร็จ <ExternalLink size={12} />
          </button>
        </div>
      )}

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
            <p className={isDark ? "text-gray-500" : "text-gray-400"}>ยังไม่มีการสแกน — อัปโหลดใบเสร็จเพื่อเริ่มต้น</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scans.map((scan) => {
              const cfg = statusConfig[scan.status];
              const StatusIcon = cfg.icon;
              return (
                <div
                  key={scan.id}
                  className={`rounded-2xl border p-4 ${
                    isDark
                      ? "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden ${
                        isDark ? "bg-[rgba(255,255,255,0.06)]" : "bg-gray-100"
                      }`}
                    >
                      {scan.ocrResult?.imageUrl ? (
                        <img src={scan.ocrResult.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className={`w-6 h-6 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                        {scan.merchant}
                      </p>
                      <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>{scan.date}</p>
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
                    </div>

                    {/* Status */}
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium flex-shrink-0 ${cfg.bg} ${cfg.color}`}
                    >
                      <StatusIcon className={`w-4 h-4 ${scan.status === "processing" ? "animate-spin" : ""}`} />
                      {cfg.label}
                    </div>
                  </div>

                  {/* Duplicate warning */}
                  {scan.status === "duplicate" && scan.duplicateInfo && (
                    <div className={`mt-3 flex items-start gap-2 px-3 py-2.5 rounded-lg ${isDark ? "bg-orange-500/5" : "bg-orange-50"}`}>
                      <Copy size={14} className="text-orange-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-orange-500">{scan.duplicateInfo}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
