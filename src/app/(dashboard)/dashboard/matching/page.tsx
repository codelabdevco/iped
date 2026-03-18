"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { Upload, ScanLine, CheckCircle2, Loader2, XCircle, ImageIcon, ExternalLink, Copy, ArrowLeftRight, Check, X } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import BrandIcon from "@/components/dashboard/BrandIcon";

interface ScanItem {
  id: string; fileName: string; merchant: string; amount: number;
  date: string; status: "processing" | "matched" | "failed" | "duplicate";
  confidence: number; duplicateInfo?: string; imageUrl?: string;
}

interface MatchPair {
  _id: string;
  receiptA: { _id: string; merchant: string; amount: number; date: string; source: string };
  receiptB: { _id: string; merchant: string; amount: number; date: string; source: string };
  matchScore: number; matchType: string; matchReason: string; status: string;
}

export default function MatchingPage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [scans, setScans] = useState<ScanItem[]>([]);
  const [matches, setMatches] = useState<MatchPair[]>([]);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const muted = isDark ? "text-white/30" : "text-gray-400";

  // Load existing matches
  useEffect(() => {
    fetch("/api/matches").then((r) => r.json()).then((d) => setMatches(d.matches || [])).catch(() => {}).finally(() => setLoadingMatches(false));
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    const scanId = `SC-${Date.now()}`;
    setScans((prev) => [{ id: scanId, fileName: file.name, merchant: file.name, amount: 0, date: "", status: "processing", confidence: 0 }, ...prev]);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/ocr", { method: "POST", body: formData });
      const json = await res.json();
      if (json.success && json.data) {
        setScans((prev) => prev.map((s) => s.id === scanId ? { ...s, merchant: json.data.merchant, amount: json.data.amount, date: json.data.date, confidence: json.data.ocrConfidence, imageUrl: json.data.imageUrl, status: json.duplicate ? "duplicate" : "matched", duplicateInfo: json.duplicateInfo } : s));
        // Reload matches
        setTimeout(() => { fetch("/api/matches").then((r) => r.json()).then((d) => setMatches(d.matches || [])); }, 1000);
      } else {
        setScans((prev) => prev.map((s) => s.id === scanId ? { ...s, status: "failed", merchant: json.error || "ล้มเหลว" } : s));
      }
    } catch {
      setScans((prev) => prev.map((s) => s.id === scanId ? { ...s, status: "failed" } : s));
    } finally { setUploading(false); }
  }, []);

  const handleGmailScan = async () => {
    setScanning(true);
    try {
      const res = await fetch("/api/gmail/scan", { method: "POST" });
      const json = await res.json();
      if (json.expired) { window.location.href = "/api/auth/google"; return; }
      if (json.error) { alert(json.error); return; }
      if (json.results) {
        json.results.forEach((r: any) => {
          setScans((prev) => [{ id: `GM-${Date.now()}-${Math.random()}`, fileName: r.subject, merchant: r.subject, amount: 0, date: r.date, status: r.status === "saved" ? "matched" : r.status === "duplicate" ? "duplicate" : "failed", confidence: 0, duplicateInfo: r.status === "duplicate" ? "พบสลิปซ้ำในระบบ" : undefined }, ...prev]);
        });
        setTimeout(() => { fetch("/api/matches").then((r) => r.json()).then((d) => setMatches(d.matches || [])); }, 1000);
      }
    } catch { alert("เกิดข้อผิดพลาด"); } finally { setScanning(false); }
  };

  const handleMatchAction = async (matchId: string, status: "matched" | "rejected") => {
    await fetch("/api/matches", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: matchId, status }) });
    setMatches((prev) => prev.map((m) => m._id === matchId ? { ...m, status } : m));
  };

  const statusCfg: Record<string, { label: string; cls: string }> = {
    processing: { label: "กำลังสแกน...", cls: "bg-amber-500/10 text-amber-500" },
    matched: { label: "บันทึกแล้ว", cls: "bg-green-500/10 text-green-500" },
    duplicate: { label: "สลิปซ้ำ", cls: "bg-orange-500/10 text-orange-400" },
    failed: { label: "ล้มเหลว", cls: "bg-red-500/10 text-red-400" },
  };

  const pendingMatches = matches.filter((m) => m.status === "pending");
  const confirmedMatches = matches.filter((m) => m.status === "matched");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="สแกน & จับคู่เอกสาร" description="AI อ่านเอกสาร + จับคู่ใบแจ้งหนี้กับใบเสร็จอัตโนมัติ" />
        <button onClick={() => router.push("/dashboard/receipts")} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${isDark ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          ดูใบเสร็จ <ExternalLink size={12} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="สแกนวันนี้" value={`${scans.length} รายการ`} icon={<ScanLine size={20} />} color="text-blue-500" />
        <StatsCard label="จับคู่แล้ว" value={`${confirmedMatches.length} คู่`} icon={<CheckCircle2 size={20} />} color="text-green-500" />
        <StatsCard label="รอยืนยัน" value={`${pendingMatches.length} คู่`} icon={<ArrowLeftRight size={20} />} color="text-amber-500" />
        <StatsCard label="สลิปซ้ำ" value={`${scans.filter((s) => s.status === "duplicate").length}`} icon={<Copy size={20} />} color="text-orange-500" />
      </div>

      {/* Upload + Gmail */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files) Array.from(e.dataTransfer.files).forEach(handleUpload); }}
          onClick={() => fileInputRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${isDark ? "border-white/10 hover:border-[#FA3633]/40 bg-white/[0.02]" : "border-gray-300 hover:border-[#FA3633]/40 bg-gray-50"}`}
        >
          <input ref={fileInputRef} type="file" accept="image/*,application/pdf" multiple onChange={(e) => { if (e.target.files) Array.from(e.target.files).forEach(handleUpload); e.target.value = ""; }} className="hidden" />
          {uploading ? <Loader2 className="w-10 h-10 mx-auto mb-3 animate-spin text-[#FA3633]" /> : <Upload className={`w-10 h-10 mx-auto mb-3 ${muted}`} />}
          <p className={`text-sm font-medium ${txt} mb-1`}>{uploading ? "กำลังสแกน..." : "อัปโหลด & สแกน"}</p>
          <p className={`text-xs ${muted}`}>ลากไฟล์มาวาง — AI อ่าน + จับคู่อัตโนมัติ</p>
        </div>

        <div className={`rounded-2xl border p-8 text-center ${card} ${border}`}>
          <div className="flex justify-center mb-3"><BrandIcon brand="gmail" size={40} className="rounded-xl" /></div>
          <p className={`text-sm font-medium ${txt} mb-1`}>สแกนจาก Gmail</p>
          <p className={`text-xs ${muted} mb-4`}>ค้นหาใบเสร็จ/ใบแจ้งหนี้ในอีเมล 30 วันล่าสุด</p>
          <button onClick={handleGmailScan} disabled={scanning} className="px-4 py-2 rounded-xl text-xs font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto">
            {scanning ? <Loader2 size={14} className="animate-spin" /> : <BrandIcon brand="gmail" size={14} />}
            {scanning ? "กำลังสแกน..." : "สแกน Gmail"}
          </button>
        </div>
      </div>

      {/* Pending matches — need approval */}
      {pendingMatches.length > 0 && (
        <div>
          <h3 className={`text-sm font-semibold ${txt} mb-3`}>🔄 รอยืนยัน — AI พบคู่เอกสาร</h3>
          <div className="space-y-2">
            {pendingMatches.map((m) => (
              <div key={m._id} className={`${card} border ${border} rounded-xl px-4 py-3 flex items-center gap-3`}>
                <div className="flex-1 flex items-center gap-2">
                  <div>
                    <p className={`text-xs font-medium ${txt}`}>{m.receiptA?.merchant || "?"}</p>
                    <p className={`text-[10px] ${muted}`}>฿{(m.receiptA?.amount || 0).toLocaleString()}</p>
                  </div>
                  <ArrowLeftRight size={14} className={muted} />
                  <div>
                    <p className={`text-xs font-medium ${txt}`}>{m.receiptB?.merchant || "?"}</p>
                    <p className={`text-[10px] ${muted}`}>฿{(m.receiptB?.amount || 0).toLocaleString()}</p>
                  </div>
                </div>
                <span className={`text-[10px] ${sub}`}>{m.matchReason}</span>
                <span className="text-[10px] font-bold text-amber-500">{m.matchScore}%</span>
                <button onClick={() => handleMatchAction(m._id, "matched")} className="p-1.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20"><Check size={14} /></button>
                <button onClick={() => handleMatchAction(m._id, "rejected")} className={`p-1.5 rounded-lg ${isDark ? "hover:bg-white/5 text-white/30" : "hover:bg-gray-100 text-gray-400"}`}><X size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmed matches */}
      {confirmedMatches.length > 0 && (
        <div>
          <h3 className={`text-sm font-semibold ${txt} mb-3`}>✅ จับคู่แล้ว ({confirmedMatches.length})</h3>
          <div className="space-y-1.5">
            {confirmedMatches.slice(0, 10).map((m) => (
              <div key={m._id} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isDark ? "bg-white/[0.02]" : "bg-gray-50"}`}>
                <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                <span className={`text-xs ${txt} flex-1`}>{m.receiptA?.merchant}</span>
                <ArrowLeftRight size={10} className={muted} />
                <span className={`text-xs ${txt} flex-1`}>{m.receiptB?.merchant}</span>
                <span className={`text-[10px] ${muted}`}>{m.matchScore}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scan results */}
      {scans.length > 0 && (
        <div>
          <h3 className={`text-sm font-semibold ${txt} mb-3`}>ผลการสแกน</h3>
          <div className="space-y-2">
            {scans.map((scan) => {
              const cfg = statusCfg[scan.status];
              return (
                <div key={scan.id} className={`${card} border ${border} rounded-xl px-4 py-3 flex items-center gap-3`}>
                  <div className={`w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center ${isDark ? "bg-white/5" : "bg-gray-100"}`}>
                    {scan.imageUrl ? <img src={scan.imageUrl} alt="" className="w-full h-full object-cover" /> : scan.status === "processing" ? <Loader2 size={16} className="animate-spin text-amber-500" /> : <ImageIcon size={16} className={muted} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${txt} truncate`}>{scan.merchant}</p>
                    <div className={`flex items-center gap-2 text-[11px] ${muted} mt-0.5`}>
                      {scan.date && <span>{scan.date}</span>}
                      {scan.confidence > 0 && <><span>·</span><span>OCR {scan.confidence}%</span></>}
                      {scan.duplicateInfo && <span className="text-orange-400">{scan.duplicateInfo}</span>}
                    </div>
                  </div>
                  {scan.amount > 0 && <span className={`text-sm font-semibold ${txt} shrink-0`}>฿{scan.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>}
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-medium shrink-0 ${cfg.cls}`}>{cfg.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty */}
      {scans.length === 0 && matches.length === 0 && !loadingMatches && (
        <div className={`${card} border ${border} rounded-2xl p-8 text-center`}>
          <ScanLine size={40} className={`mx-auto mb-3 ${muted}`} />
          <p className={`text-sm ${sub}`}>อัปโหลดเอกสาร หรือเชื่อมต่อ Gmail</p>
          <p className={`text-xs ${muted} mt-1`}>AI จะอ่าน → บันทึก → จับคู่อัตโนมัติ</p>
        </div>
      )}
    </div>
  );
}
