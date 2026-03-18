"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { Upload, ScanLine, CheckCircle2, Loader2, XCircle, ImageIcon, ExternalLink, Copy, ArrowRight, Check, X } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import BrandIcon from "@/components/dashboard/BrandIcon";

interface MatchPair {
  _id: string;
  receiptA: { _id: string; merchant: string; amount: number; date: string; source: string };
  receiptB: { _id: string; merchant: string; amount: number; date: string; source: string };
  matchScore: number; matchType: string; matchReason: string; status: string; createdAt: string;
}

interface ScanItem {
  id: string; merchant: string; amount: number; status: string; duplicateInfo?: string;
}

export default function MatchingPage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [matches, setMatches] = useState<MatchPair[]>([]);
  const [scans, setScans] = useState<ScanItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const muted = isDark ? "text-white/30" : "text-gray-400";

  const loadMatches = () => { fetch("/api/matches").then((r) => r.json()).then((d) => setMatches(d.matches || [])).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(loadMatches, []);

  // Upload & OCR
  const handleUpload = useCallback(async (file: File) => {
    const id = `SC-${Date.now()}`;
    setScans((prev) => [{ id, merchant: file.name, amount: 0, status: "processing" }, ...prev]);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/ocr", { method: "POST", body: formData });
      const json = await res.json();
      if (json.success) {
        setScans((prev) => prev.map((s) => s.id === id ? { ...s, merchant: json.data.merchant, amount: json.data.amount, status: json.duplicate ? "duplicate" : "matched", duplicateInfo: json.duplicateInfo } : s));
        setTimeout(loadMatches, 1500);
      } else {
        setScans((prev) => prev.map((s) => s.id === id ? { ...s, status: "failed", merchant: json.error || "ล้มเหลว" } : s));
      }
    } catch { setScans((prev) => prev.map((s) => s.id === id ? { ...s, status: "failed" } : s)); }
    finally { setUploading(false); }
  }, []);

  // Gmail scan
  const handleGmail = async () => {
    setScanning(true);
    try {
      const res = await fetch("/api/gmail/scan", { method: "POST" });
      const json = await res.json();
      if (json.expired) { window.location.href = "/api/auth/google"; return; }
      if (json.error) { alert(json.error); return; }
      json.results?.forEach((r: any) => setScans((prev) => [{ id: `GM-${Date.now()}`, merchant: r.subject, amount: 0, status: r.status === "saved" ? "matched" : r.status === "duplicate" ? "duplicate" : "failed", duplicateInfo: r.status === "duplicate" ? "ซ้ำ" : undefined }, ...prev]));
      setTimeout(loadMatches, 1500);
    } catch { alert("เกิดข้อผิดพลาด"); } finally { setScanning(false); }
  };

  // Match actions
  const handleAction = async (id: string, status: "matched" | "rejected") => {
    await fetch("/api/matches", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    setMatches((prev) => prev.map((m) => m._id === id ? { ...m, status } : m));
  };

  const confirmed = matches.filter((m) => m.status === "matched").length;
  const pending = matches.filter((m) => m.status === "pending").length;

  // Table columns
  const columns: Column<MatchPair>[] = useMemo(() => [
    {
      key: "docA",
      label: "เอกสาร A",
      render: (m) => (
        <div className="leading-tight">
          <div className={`text-sm font-medium ${txt}`}>{m.receiptA?.merchant || "?"}</div>
          <div className={`text-[11px] ${muted}`}>฿{(m.receiptA?.amount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</div>
        </div>
      ),
    },
    {
      key: "arrow",
      label: "",
      render: () => <ArrowRight size={14} className={muted} />,
    },
    {
      key: "docB",
      label: "เอกสาร B",
      render: (m) => (
        <div className="leading-tight">
          <div className={`text-sm font-medium ${txt}`}>{m.receiptB?.merchant || "?"}</div>
          <div className={`text-[11px] ${muted}`}>฿{(m.receiptB?.amount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</div>
        </div>
      ),
    },
    {
      key: "score",
      label: "คะแนน",
      align: "center",
      render: (m) => {
        const color = m.matchScore >= 80 ? "text-green-500" : m.matchScore >= 50 ? "text-amber-500" : "text-red-400";
        return <span className={`text-sm font-bold ${color}`}>{m.matchScore}%</span>;
      },
    },
    {
      key: "reason",
      label: "เหตุผล",
      render: (m) => <span className={`text-[11px] ${sub}`}>{m.matchReason}</span>,
    },
    {
      key: "type",
      label: "ประเภท",
      render: (m) => {
        const cfg: Record<string, { l: string; c: string }> = { auto: { l: "อัตโนมัติ", c: "bg-blue-500/10 text-blue-400" }, manual: { l: "ด้วยมือ", c: "bg-purple-500/10 text-purple-400" }, email: { l: "จาก Email", c: "bg-red-500/10 text-red-400" } };
        const c = cfg[m.matchType] || cfg.auto;
        return <span className={`px-2 py-0.5 rounded-lg text-[10px] font-medium ${c.c}`}>{c.l}</span>;
      },
    },
    {
      key: "status",
      label: "สถานะ",
      render: (m) => {
        if (m.status === "matched") return <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-green-500/10 text-green-400">ยืนยัน</span>;
        if (m.status === "rejected") return <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-gray-500/10 text-gray-400">ปฏิเสธ</span>;
        return <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-amber-500/10 text-amber-400">รอยืนยัน</span>;
      },
    },
    {
      key: "actions",
      label: "",
      configurable: false,
      render: (m, dark) => m.status === "pending" ? (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => handleAction(m._id, "matched")} className="p-1.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20"><Check size={13} /></button>
          <button onClick={() => handleAction(m._id, "rejected")} className={`p-1.5 rounded-lg ${dark ? "hover:bg-white/5 text-white/30" : "hover:bg-gray-100 text-gray-400"}`}><X size={13} /></button>
        </div>
      ) : null,
    },
  ], [txt, sub, muted]);

  const scanStatusCls: Record<string, string> = {
    processing: "bg-amber-500/10 text-amber-500",
    matched: "bg-green-500/10 text-green-500",
    duplicate: "bg-orange-500/10 text-orange-400",
    failed: "bg-red-500/10 text-red-400",
  };
  const scanStatusLabel: Record<string, string> = { processing: "กำลังสแกน...", matched: "บันทึกแล้ว", duplicate: "สลิปซ้ำ", failed: "ล้มเหลว" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="สแกน & จับคู่เอกสาร" description="AI อ่าน + จับคู่ใบแจ้งหนี้กับใบเสร็จอัตโนมัติ" />
        <button onClick={() => router.push("/dashboard/receipts")} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${isDark ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          ดูใบเสร็จ <ExternalLink size={12} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="คู่เอกสารทั้งหมด" value={`${matches.length} คู่`} icon={<ScanLine size={20} />} color="text-blue-500" />
        <StatsCard label="ยืนยันแล้ว" value={`${confirmed} คู่`} icon={<CheckCircle2 size={20} />} color="text-green-500" />
        <StatsCard label="รอยืนยัน" value={`${pending} คู่`} icon={<Copy size={20} />} color="text-amber-500" />
        <StatsCard label="สแกนวันนี้" value={`${scans.length} รายการ`} icon={<Upload size={20} />} color="text-purple-500" />
      </div>

      {/* Upload + Gmail — compact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files) Array.from(e.dataTransfer.files).forEach(handleUpload); }}
          onClick={() => fileInputRef.current?.click()}
          className={`rounded-xl border-2 border-dashed px-5 py-4 flex items-center gap-4 cursor-pointer transition-colors ${isDark ? "border-white/10 hover:border-[#FA3633]/30" : "border-gray-300 hover:border-[#FA3633]/30"}`}
        >
          <input ref={fileInputRef} type="file" accept="image/*,application/pdf" multiple onChange={(e) => { if (e.target.files) Array.from(e.target.files).forEach(handleUpload); e.target.value = ""; }} className="hidden" />
          {uploading ? <Loader2 size={20} className="animate-spin text-[#FA3633] shrink-0" /> : <Upload size={20} className={`${muted} shrink-0`} />}
          <div>
            <p className={`text-sm font-medium ${txt}`}>{uploading ? "กำลังสแกน..." : "อัปโหลด & สแกน"}</p>
            <p className={`text-[11px] ${muted}`}>ลากไฟล์มาวาง — AI อ่าน + จับคู่ให้</p>
          </div>
        </div>
        <div className={`rounded-xl border px-5 py-4 flex items-center gap-4 ${card} ${border}`}>
          <BrandIcon brand="gmail" size={28} className="rounded-lg shrink-0" />
          <div className="flex-1">
            <p className={`text-sm font-medium ${txt}`}>สแกนจาก Gmail</p>
            <p className={`text-[11px] ${muted}`}>ค้นหาใบเสร็จในอีเมล 30 วันล่าสุด</p>
          </div>
          <button onClick={handleGmail} disabled={scanning} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] disabled:opacity-50 shrink-0 flex items-center gap-1.5">
            {scanning && <Loader2 size={12} className="animate-spin" />}
            {scanning ? "สแกน..." : "สแกน"}
          </button>
        </div>
      </div>

      {/* Recent scan results — compact */}
      {scans.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {scans.slice(0, 8).map((s) => (
            <span key={s.id} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${scanStatusCls[s.status] || scanStatusCls.failed}`}>
              {s.status === "processing" && <Loader2 size={10} className="animate-spin" />}
              {s.merchant.slice(0, 20)}{s.amount > 0 && ` ฿${s.amount.toLocaleString()}`}
              <span className="font-medium">{scanStatusLabel[s.status]}</span>
            </span>
          ))}
        </div>
      )}

      {/* Match table */}
      <DataTable
        columns={columns}
        data={matches}
        rowKey={(m) => m._id}
        loading={loading}
        emptyText="ยังไม่มีคู่เอกสาร — อัปโหลดหรือสแกนเพื่อเริ่มจับคู่"
        columnConfigKey="matching"
      />
    </div>
  );
}
