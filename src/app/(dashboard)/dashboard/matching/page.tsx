"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { Upload, ScanLine, CheckCircle2, Loader2, XCircle, AlertTriangle, ImageIcon, ExternalLink, Copy, Mail } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import BrandIcon from "@/components/dashboard/BrandIcon";

interface ScanItem {
  id: string;
  fileName: string;
  merchant: string;
  amount: number;
  date: string;
  status: "processing" | "matched" | "no_match" | "failed" | "duplicate";
  confidence: number;
  matchedWith?: string;
  duplicateInfo?: string;
  imageUrl?: string;
}

export default function MatchingPage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [scans, setScans] = useState<ScanItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const muted = isDark ? "text-white/30" : "text-gray-400";

  const handleUpload = useCallback(async (file: File) => {
    const scanId = `SC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setScans((prev) => [{ id: scanId, fileName: file.name, merchant: file.name, amount: 0, date: "", status: "processing", confidence: 0 }, ...prev]);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/ocr", { method: "POST", body: formData });
      const json = await res.json();

      if (json.success && json.data) {
        const d = json.data;
        setScans((prev) => prev.map((s) => s.id === scanId ? {
          ...s,
          merchant: d.merchant,
          amount: d.amount,
          date: d.date,
          confidence: d.ocrConfidence,
          imageUrl: d.imageUrl,
          status: json.duplicate ? "duplicate" : "matched",
          matchedWith: json.receipt?._id,
          duplicateInfo: json.duplicateInfo,
        } : s));
      } else {
        setScans((prev) => prev.map((s) => s.id === scanId ? { ...s, status: "failed", merchant: json.error || "อ่านไม่สำเร็จ" } : s));
      }
    } catch {
      setScans((prev) => prev.map((s) => s.id === scanId ? { ...s, status: "failed", merchant: "เกิดข้อผิดพลาด" } : s));
    } finally {
      setUploading(false);
    }
  }, []);

  const handleFiles = (files: FileList) => { Array.from(files).forEach((f) => handleUpload(f)); };

  const matched = scans.filter((s) => s.status === "matched").length;
  const dup = scans.filter((s) => s.status === "duplicate").length;
  const failed = scans.filter((s) => s.status === "failed").length;

  const statusCfg: Record<string, { label: string; cls: string }> = {
    processing: { label: "กำลังสแกน...", cls: "bg-amber-500/10 text-amber-500" },
    matched: { label: "บันทึกแล้ว", cls: "bg-green-500/10 text-green-500" },
    duplicate: { label: "สลิปซ้ำ", cls: "bg-orange-500/10 text-orange-400" },
    no_match: { label: "ไม่พบคู่", cls: "bg-yellow-500/10 text-yellow-400" },
    failed: { label: "ล้มเหลว", cls: "bg-red-500/10 text-red-400" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="สแกน & จับคู่เอกสาร" description="อัปโหลดใบเสร็จ/ใบแจ้งหนี้ → AI อ่าน + จับคู่อัตโนมัติ" />
        <button onClick={() => router.push("/dashboard/receipts")} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${isDark ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          ดูใบเสร็จ <ExternalLink size={12} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="สแกนทั้งหมด" value={`${scans.length} รายการ`} icon={<ScanLine size={20} />} color="text-blue-500" />
        <StatsCard label="บันทึกแล้ว" value={`${matched} รายการ`} icon={<CheckCircle2 size={20} />} color="text-green-500" />
        <StatsCard label="สลิปซ้ำ" value={`${dup} รายการ`} icon={<Copy size={20} />} color="text-orange-500" />
        <StatsCard label="ล้มเหลว" value={`${failed} รายการ`} icon={<XCircle size={20} />} color="text-red-500" />
      </div>

      {/* Upload methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* File upload */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files) handleFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${isDark ? "border-white/10 hover:border-[#FA3633]/40 bg-white/[0.02]" : "border-gray-300 hover:border-[#FA3633]/40 bg-gray-50"}`}
        >
          <input ref={fileInputRef} type="file" accept="image/*,application/pdf" multiple onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.target.value = ""; }} className="hidden" />
          {uploading ? (
            <Loader2 className="w-10 h-10 mx-auto mb-3 animate-spin text-[#FA3633]" />
          ) : (
            <Upload className={`w-10 h-10 mx-auto mb-3 ${muted}`} />
          )}
          <p className={`text-sm font-medium ${txt} mb-1`}>{uploading ? "กำลังสแกน..." : "อัปโหลดเอกสาร"}</p>
          <p className={`text-xs ${muted}`}>ลากไฟล์มาวาง หรือคลิก — รองรับ รูปภาพ, PDF (หลายไฟล์ได้)</p>
        </div>

        {/* Email scan */}
        <div className={`rounded-2xl border p-8 text-center ${card} ${border}`}>
          <div className="flex justify-center mb-3">
            <BrandIcon brand="gmail" size={40} className="rounded-xl" />
          </div>
          <p className={`text-sm font-medium ${txt} mb-1`}>สแกนจาก Gmail</p>
          <p className={`text-xs ${muted} mb-4`}>เชื่อมต่อ Gmail เพื่อดึงใบเสร็จ/ใบแจ้งหนี้จากอีเมลอัตโนมัติ</p>
          <button className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${isDark ? "bg-white/5 text-white/50 hover:bg-white/10" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
            เชื่อมต่อ Gmail
          </button>
        </div>
      </div>

      {/* Scan results */}
      {scans.length > 0 && (
        <div>
          <h3 className={`text-sm font-semibold ${txt} mb-3`}>ผลการสแกน</h3>
          <div className="space-y-2">
            {scans.map((scan) => {
              const cfg = statusCfg[scan.status];
              return (
                <div key={scan.id} className={`${card} border ${border} rounded-xl px-4 py-3 flex items-center gap-3`}>
                  {/* Thumbnail */}
                  <div className={`w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center ${isDark ? "bg-white/5" : "bg-gray-100"}`}>
                    {scan.imageUrl ? <img src={scan.imageUrl} alt="" className="w-full h-full object-cover" /> : scan.status === "processing" ? <Loader2 size={16} className="animate-spin text-amber-500" /> : <ImageIcon size={16} className={muted} />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${txt} truncate`}>{scan.merchant}</p>
                    <div className={`flex items-center gap-2 text-[11px] ${muted} mt-0.5`}>
                      {scan.date && <span>{scan.date}</span>}
                      {scan.confidence > 0 && <><span>·</span><span>OCR {scan.confidence}%</span></>}
                      {scan.duplicateInfo && <><span>·</span><span className="text-orange-400">{scan.duplicateInfo}</span></>}
                    </div>
                  </div>

                  {/* Amount */}
                  {scan.amount > 0 && (
                    <span className={`text-sm font-semibold ${txt} shrink-0`}>฿{scan.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                  )}

                  {/* Status */}
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-medium shrink-0 ${cfg.cls}`}>
                    {scan.status === "processing" && <Loader2 size={10} className="inline animate-spin mr-1" />}
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {scans.length === 0 && (
        <div className={`${card} border ${border} rounded-2xl p-8 text-center`}>
          <ScanLine size={40} className={`mx-auto mb-3 ${muted}`} />
          <p className={`text-sm ${sub}`}>อัปโหลดเอกสาร หรือเชื่อมต่อ Gmail</p>
          <p className={`text-xs ${muted} mt-1`}>AI จะอ่านข้อมูล → บันทึกใบเสร็จ → ตรวจสลิปซ้ำอัตโนมัติ</p>
        </div>
      )}
    </div>
  );
}
