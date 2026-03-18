"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import {
  ScanLine, CheckCircle2, Copy, Upload, Loader2, ArrowRight, Check, X,
  Mail, Clock, ToggleLeft, ToggleRight, RefreshCw,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import BrandIcon from "@/components/dashboard/BrandIcon";

interface ReceiptRow {
  _id: string; storeName: string; amount: number; category: string;
  date: string; rawDate?: string; time?: string; status: string;
  type: string; source: string; paymentMethod?: string; note?: string;
  hasImage?: boolean; direction?: string; createdAt?: string;
  emailSubject?: string; emailFrom?: string; ocrConfidence?: number;
}

interface MatchRow {
  _id: string;
  receiptA: ReceiptRow;
  receiptB: ReceiptRow;
  matchScore: number; matchType: string; matchReason: string; status: string; createdAt?: string;
}

interface GoogleAccountInfo {
  _id: string;
  email: string;
  lastScanAt: string | null;
  autoScan: boolean;
}

interface GmailSettings {
  connected: boolean;
  email: string | null;
  lastGmailScan: string | null;
  autoGmailScan: boolean;
  accounts?: GoogleAccountInfo[];
}

function Baht({ value, className = "" }: { value: number; className?: string }) {
  const whole = Math.floor(Math.abs(value)).toLocaleString();
  const dec = (Math.abs(value) % 1).toFixed(2).slice(1);
  return <span className={className}>฿{whole}<span className="text-[0.75em] opacity-50">{dec}</span></span>;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "เมื่อสักครู่";
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hrs / 24);
  return `${days} วันที่แล้ว`;
}

const DIR_CLR: Record<string, string> = { expense: "#FA3633", income: "#22c55e", savings: "#ec4899" };
const DIR_LABEL: Record<string, string> = { expense: "รายจ่าย", income: "รายรับ", savings: "เงินออม" };

export default function MatchingClient({
  receipts, matches: initialMatches, gmailSettings: initialGmail,
}: {
  receipts: ReceiptRow[];
  matches: MatchRow[];
  gmailSettings: GmailSettings;
}) {
  const { isDark } = useTheme();
  const router = useRouter();
  const [matches, setMatches] = useState(initialMatches);
  const [tab, setTab] = useState<"email" | "all" | "matches">("email");
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [autoScan, setAutoScan] = useState(initialGmail.autoGmailScan);
  const [lastScan, setLastScan] = useState(initialGmail.lastGmailScan);
  const [scans, setScans] = useState<{ id: string; name: string; amount: number; status: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const muted = isDark ? "text-white/30" : "text-gray-400";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const txt = isDark ? "text-white" : "text-gray-900";
  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";

  // Split receipts by source
  const emailReceipts = useMemo(() => receipts.filter((r) => r.source === "email"), [receipts]);
  const lineReceipts = useMemo(() => receipts.filter((r) => r.source === "line"), [receipts]);

  const lineTotal = lineReceipts.reduce((s, r) => s + r.amount, 0);
  const confirmed = matches.filter((m) => m.status === "matched").length;
  const pending = matches.filter((m) => m.status === "pending").length;

  // Toggle auto-scan
  const handleToggleAutoScan = async () => {
    const newVal = !autoScan;
    setAutoScan(newVal);
    try {
      await fetch("/api/gmail/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoGmailScan: newVal }),
      });
    } catch { setAutoScan(!newVal); }
  };

  // Upload
  const handleUpload = useCallback(async (file: File) => {
    const id = `SC-${Date.now()}`;
    setScans((prev) => [{ id, name: file.name, amount: 0, status: "processing" }, ...prev]);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/ocr", { method: "POST", body: formData });
      const json = await res.json();
      if (json.success) {
        setScans((prev) => prev.map((s) => s.id === id ? { ...s, name: json.data.merchant, amount: json.data.amount, status: json.duplicate ? "duplicate" : "matched" } : s));
        router.refresh();
      } else {
        setScans((prev) => prev.map((s) => s.id === id ? { ...s, status: "failed" } : s));
      }
    } catch { setScans((prev) => prev.map((s) => s.id === id ? { ...s, status: "failed" } : s)); }
    finally { setUploading(false); }
  }, [router]);

  // Gmail scan
  const handleGmail = async () => {
    setScanning(true);
    try {
      const res = await fetch("/api/gmail/scan", { method: "POST" });
      const json = await res.json();
      if (json.expired) { window.location.href = "/api/auth/google"; return; }
      if (json.error) { alert(json.error); return; }
      json.results?.forEach((r: any) => setScans((prev) => [{ id: `GM-${Date.now()}-${Math.random()}`, name: r.subject, amount: 0, status: r.status === "saved" ? "matched" : r.status === "duplicate" ? "duplicate" : "failed" }, ...prev]));
      setLastScan(new Date().toISOString());
      router.refresh();
    } catch { alert("เกิดข้อผิดพลาด"); } finally { setScanning(false); }
  };

  // Match actions
  const handleAction = async (id: string, status: "matched" | "rejected") => {
    await fetch("/api/matches", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    setMatches((prev) => prev.map((m) => m._id === id ? { ...m, status } : m));
  };

  // Receipt columns
  const receiptColumns: Column<ReceiptRow>[] = useMemo(() => [
    {
      key: "storeName",
      label: "รายละเอียด",
      render: (r) => {
        const dir = r.direction || "expense";
        const dirLabel = DIR_LABEL[dir] || "รายจ่าย";
        const dirCls = dir === "income" ? "bg-green-500/10 text-green-500" : dir === "savings" ? "bg-pink-500/10 text-pink-400" : "bg-red-500/10 text-red-400";
        return (
          <div className="leading-tight min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{r.storeName}</span>
              <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-semibold leading-none ${dirCls}`}>{dirLabel}</span>
            </div>
            <div className={`flex items-center gap-2 mt-0.5 text-[11px] ${muted}`}>
              <span>{r.category}</span>
              <span>·</span>
              <span>{r.type === "receipt" ? "ใบเสร็จ" : r.type === "invoice" ? "ใบแจ้งหนี้" : r.type}</span>
            </div>
          </div>
        );
      },
    },
    { key: "amount", label: "จำนวนเงิน", align: "right", render: (r) => <Baht value={r.amount} className="font-semibold" /> },
    {
      key: "paidAt",
      label: "เวลาในสลิป",
      render: (r) => {
        if (!r.rawDate) return <span className={muted}>-</span>;
        const d = new Date(r.rawDate);
        const day = d.getDate();
        const mon = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."][d.getMonth()];
        const yr = d.getFullYear() + 543;
        const isLine = r.source === "line";
        const isEmail = r.source === "email";
        return (
          <div className="leading-tight">
            <div className="text-sm whitespace-nowrap">{day} {mon} {yr}{r.time ? <span className={`text-[11px] ml-1 ${muted}`}>{r.time}</span> : ""}</div>
            <div className="flex items-center gap-1 mt-0.5 text-[11px]">
              <BrandIcon brand={isLine ? "line" : isEmail ? "gmail" : "web"} size={11} />
              <span className={isLine ? "text-green-500" : isEmail ? "text-red-400" : "text-blue-400"}>{isLine ? "LINE" : isEmail ? "Gmail" : "เว็บ"}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: "matchStatus",
      label: "จับคู่",
      render: (r) => {
        const match = matches.find((m) => (m.receiptA._id === r._id || m.receiptB._id === r._id) && m.status === "matched");
        if (match) {
          const other = match.receiptA._id === r._id ? match.receiptB : match.receiptA;
          return (
            <div className="leading-tight">
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-green-500/10 text-green-400">ตรงกัน {match.matchScore}%</span>
              <div className={`text-[10px] mt-0.5 ${muted}`}>{other.storeName}</div>
            </div>
          );
        }
        const pendingMatch = matches.find((m) => (m.receiptA._id === r._id || m.receiptB._id === r._id) && m.status === "pending");
        if (pendingMatch) return <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-amber-500/10 text-amber-400">รอยืนยัน</span>;
        return <span className={`text-[10px] ${muted}`}>-</span>;
      },
    },
    {
      key: "status",
      label: "สถานะ",
      render: (r) => {
        const cfg: Record<string, { l: string; c: string }> = {
          confirmed: { l: "ยืนยัน", c: "bg-green-500/10 text-green-400" },
          pending: { l: "รอตรวจ", c: "bg-yellow-500/10 text-yellow-400" },
          duplicate: { l: "สลิปซ้ำ", c: "bg-orange-500/10 text-orange-400" },
          cancelled: { l: "ยกเลิก", c: "bg-gray-500/10 text-gray-400" },
          edited: { l: "แก้ไข", c: "bg-blue-500/10 text-blue-400" },
          matched: { l: "จับคู่แล้ว", c: "bg-green-500/10 text-green-400" },
        };
        const st = cfg[r.status] || cfg.pending;
        return <span className={`px-2 py-1 rounded-lg text-[10px] font-medium ${st.c}`}>{st.l}</span>;
      },
    },
  ], [muted, matches]);

  // Email-specific columns — shows subject, sender, OCR result, match status
  const emailColumns: Column<ReceiptRow>[] = useMemo(() => [
    {
      key: "emailSubject",
      label: "หัวข้ออีเมล",
      render: (r) => (
        <div className="leading-tight min-w-0">
          <div className="flex items-center gap-2">
            <BrandIcon brand="gmail" size={14} />
            <span className={`font-medium ${txt}`}>{r.emailSubject || r.note?.replace("จาก email: ", "") || r.storeName}</span>
          </div>
          {r.emailFrom && (
            <div className={`text-[11px] mt-0.5 ${muted}`}>{r.emailFrom}</div>
          )}
        </div>
      ),
    },
    {
      key: "storeName",
      label: "OCR อ่านได้",
      render: (r) => (
        <div className="leading-tight min-w-0">
          <span className={`font-medium ${txt}`}>{r.storeName}</span>
          <div className={`flex items-center gap-2 mt-0.5 text-[11px] ${muted}`}>
            <span>{r.category}</span>
            {r.ocrConfidence ? (
              <>
                <span>·</span>
                <span className={r.ocrConfidence >= 80 ? "text-green-400" : "text-amber-400"}>
                  แม่นยำ {Math.round(r.ocrConfidence > 1 ? r.ocrConfidence : r.ocrConfidence * 100)}%
                </span>
              </>
            ) : null}
          </div>
        </div>
      ),
    },
    { key: "amount", label: "จำนวนเงิน", align: "right", render: (r) => <Baht value={r.amount} className="font-semibold" /> },
    {
      key: "date",
      label: "วันที่",
      render: (r) => {
        if (!r.rawDate) return <span className={muted}>-</span>;
        const d = new Date(r.rawDate);
        const day = d.getDate();
        const mon = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."][d.getMonth()];
        const yr = d.getFullYear() + 543;
        return <span className="text-sm whitespace-nowrap">{day} {mon} {yr}</span>;
      },
    },
    {
      key: "matchStatus",
      label: "จับคู่กับสลิป",
      render: (r) => {
        const match = matches.find((m) => (m.receiptA._id === r._id || m.receiptB._id === r._id) && m.status === "matched");
        if (match) {
          const other = match.receiptA._id === r._id ? match.receiptB : match.receiptA;
          const otherSrc = receipts.find((rr) => rr._id === other._id)?.source;
          return (
            <div className="leading-tight">
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-green-500/10 text-green-400">ตรงกัน {match.matchScore}%</span>
              <div className={`flex items-center gap-1 text-[10px] mt-0.5 ${muted}`}>
                <BrandIcon brand={otherSrc === "line" ? "line" : "web"} size={10} />
                <span>{other.storeName}</span>
              </div>
            </div>
          );
        }
        const pendingMatch = matches.find((m) => (m.receiptA._id === r._id || m.receiptB._id === r._id) && m.status === "pending");
        if (pendingMatch) {
          const other = pendingMatch.receiptA._id === r._id ? pendingMatch.receiptB : pendingMatch.receiptA;
          return (
            <div className="leading-tight">
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-amber-500/10 text-amber-400">รอยืนยัน</span>
              <div className={`text-[10px] mt-0.5 ${muted}`}>{other.storeName}</div>
            </div>
          );
        }
        return <span className={`px-2 py-0.5 rounded-lg text-[10px] font-medium bg-gray-500/10 ${muted}`}>ยังไม่จับคู่</span>;
      },
    },
    {
      key: "status",
      label: "สถานะ",
      render: (r) => {
        const cfg: Record<string, { l: string; c: string }> = {
          confirmed: { l: "ยืนยัน", c: "bg-green-500/10 text-green-400" },
          pending: { l: "รอตรวจ", c: "bg-yellow-500/10 text-yellow-400" },
          duplicate: { l: "ซ้ำ", c: "bg-orange-500/10 text-orange-400" },
          matched: { l: "จับคู่แล้ว", c: "bg-green-500/10 text-green-400" },
        };
        const st = cfg[r.status] || cfg.pending;
        return <span className={`px-2 py-1 rounded-lg text-[10px] font-medium ${st.c}`}>{st.l}</span>;
      },
    },
  ], [txt, muted, matches, receipts]);

  // Match columns
  const matchColumns: Column<MatchRow>[] = useMemo(() => [
    {
      key: "docA",
      label: "เอกสารจาก Email",
      render: (m) => {
        const isEmailA = receipts.find((r) => r._id === m.receiptA._id)?.source === "email";
        const emailDoc = isEmailA ? m.receiptA : m.receiptB;
        return (
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <BrandIcon brand="gmail" size={12} />
              <span className={`text-sm font-medium ${txt}`}>{emailDoc?.storeName || "?"}</span>
            </div>
            <div className={`text-[11px] ${muted}`}><Baht value={emailDoc?.amount || 0} className="" /></div>
          </div>
        );
      },
    },
    { key: "arrow", label: "", render: () => <ArrowRight size={12} className={muted} /> },
    {
      key: "docB",
      label: "สลิปบนระบบ",
      render: (m) => {
        const isEmailA = receipts.find((r) => r._id === m.receiptA._id)?.source === "email";
        const sysDoc = isEmailA ? m.receiptB : m.receiptA;
        const src = receipts.find((r) => r._id === sysDoc._id)?.source;
        return (
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <BrandIcon brand={src === "line" ? "line" : "web"} size={12} />
              <span className={`text-sm font-medium ${txt}`}>{sysDoc?.storeName || "?"}</span>
            </div>
            <div className={`text-[11px] ${muted}`}><Baht value={sysDoc?.amount || 0} className="" /></div>
          </div>
        );
      },
    },
    {
      key: "score",
      label: "คะแนน",
      align: "center",
      render: (m) => <span className={`text-sm font-bold ${m.matchScore >= 80 ? "text-green-500" : "text-amber-500"}`}>{m.matchScore}%</span>,
    },
    { key: "reason", label: "เหตุผล", render: (m) => <span className={`text-[11px] ${sub}`}>{m.matchReason}</span> },
    {
      key: "status",
      label: "สถานะ",
      render: (m) => {
        if (m.status === "matched") return <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-green-500/10 text-green-400">ตรงกัน</span>;
        if (m.status === "rejected") return <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-gray-500/10 text-gray-400">ปฏิเสธ</span>;
        return <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-amber-500/10 text-amber-400">รอยืนยัน</span>;
      },
    },
    {
      key: "actions", label: "", configurable: false,
      render: (m, dark) => m.status === "pending" ? (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => handleAction(m._id, "matched")} className="p-1.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20"><Check size={12} /></button>
          <button onClick={() => handleAction(m._id, "rejected")} className={`p-1.5 rounded-lg ${dark ? "hover:bg-white/5 text-white/30" : "hover:bg-gray-100 text-gray-400"}`}><X size={12} /></button>
        </div>
      ) : null,
    },
  ], [txt, sub, muted, receipts]);

  const scanStatusCls: Record<string, string> = { processing: "bg-amber-500/10 text-amber-500", matched: "bg-green-500/10 text-green-500", duplicate: "bg-orange-500/10 text-orange-400", failed: "bg-red-500/10 text-red-400" };

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" accept="image/*,application/pdf" multiple onChange={(e) => { if (e.target.files) Array.from(e.target.files).forEach(handleUpload); e.target.value = ""; }} className="hidden" />

      <div className="flex items-center justify-between">
        <PageHeader title="สแกน & จับคู่เอกสาร" description={`${lineReceipts.length} รายการจาก LINE — รวม ฿${lineTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} />
        <div className="flex gap-2">
          <button onClick={handleGmail} disabled={scanning || !initialGmail.connected} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${isDark ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {scanning ? <Loader2 size={14} className="animate-spin" /> : <BrandIcon brand="gmail" size={16} />}
            {scanning ? "สแกน..." : "สแกน Gmail"}
          </button>
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors shadow-sm shadow-[#FA3633]/25 disabled:opacity-50">
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploading ? "สแกน..." : "อัปโหลด & สแกน"}
          </button>
        </div>
      </div>

      {/* Gmail Settings Card — multi-account */}
      <div className={`${card} border ${border} rounded-2xl p-4`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${initialGmail.connected ? "bg-green-500/10" : "bg-gray-500/10"}`}>
              <BrandIcon brand="gmail" size={20} />
            </div>
            <div>
              <span className={`font-medium ${txt}`}>
                {initialGmail.connected
                  ? `บัญชี Gmail (${(initialGmail.accounts?.length || 0) > 0 ? initialGmail.accounts!.length : 1})`
                  : "ยังไม่ได้เชื่อมต่อ Gmail"}
              </span>
              {lastScan && (
                <div className={`flex items-center gap-1.5 mt-0.5 text-xs ${sub}`}>
                  <Clock size={11} />
                  <span>สแกนล่าสุด: {formatTimeAgo(lastScan)}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {initialGmail.connected && (
              <button onClick={handleToggleAutoScan} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${autoScan ? "bg-green-500/10 text-green-400" : isDark ? "bg-white/5 text-white/40" : "bg-gray-100 text-gray-400"}`}>
                {autoScan ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                <span className="font-medium">{autoScan ? "สแกนอัตโนมัติ" : "สแกนเอง"}</span>
              </button>
            )}
            <a href="/api/auth/google" className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">
              {initialGmail.connected ? "+" : <Mail size={14} />}
              {initialGmail.connected ? "เพิ่มบัญชี" : "เชื่อมต่อ Gmail"}
            </a>
          </div>
        </div>
        {/* Account list */}
        {(initialGmail.accounts && initialGmail.accounts.length > 0) ? (
          <div className="space-y-1.5">
            {initialGmail.accounts.map((acc) => (
              <div key={acc._id} className={`flex items-center justify-between px-3 py-2 rounded-lg ${isDark ? "bg-white/[0.03]" : "bg-gray-50"}`}>
                <div className="flex items-center gap-2">
                  <BrandIcon brand="gmail" size={12} />
                  <span className={`text-sm ${txt}`}>{acc.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  {acc.lastScanAt && <span className={`text-[10px] ${muted}`}>{formatTimeAgo(acc.lastScanAt)}</span>}
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-green-500/10 text-green-400">active</span>
                </div>
              </div>
            ))}
          </div>
        ) : initialGmail.connected && initialGmail.email ? (
          <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${isDark ? "bg-white/[0.03]" : "bg-gray-50"}`}>
            <div className="flex items-center gap-2">
              <BrandIcon brand="gmail" size={12} />
              <span className={`text-sm ${txt}`}>{initialGmail.email}</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-green-500/10 text-green-400">active</span>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="จาก LINE" value={`${lineReceipts.length} รายการ`} icon={<ScanLine size={20} />} color="text-green-500" />
        <StatsCard label="จากอีเมล" value={`${emailReceipts.length} รายการ`} icon={<Mail size={20} />} color="text-red-500" />
        <StatsCard label="จับคู่แล้ว" value={`${confirmed} คู่`} icon={<CheckCircle2 size={20} />} color="text-green-500" />
        <StatsCard label="รอยืนยัน" value={`${pending} คู่`} icon={<Copy size={20} />} color="text-amber-500" />
      </div>

      {/* Scan results chips */}
      {scans.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {scans.slice(0, 8).map((s) => (
            <span key={s.id} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${scanStatusCls[s.status] || scanStatusCls.failed}`}>
              {s.status === "processing" && <Loader2 size={10} className="animate-spin" />}
              {s.name.slice(0, 20)}{s.amount > 0 && ` ฿${s.amount.toLocaleString()}`}
            </span>
          ))}
        </div>
      )}

      {/* Tab switcher: Email-first */}
      <div className={`${card} border ${border} rounded-xl p-1 flex`}>
        <button onClick={() => setTab("email")} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === "email" ? "bg-[#FA3633] text-white shadow-sm" : `${sub} hover:text-white/70`}`}>
          เอกสารจากอีเมล ({emailReceipts.length})
        </button>
        <button onClick={() => setTab("all")} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === "all" ? "bg-[#FA3633] text-white shadow-sm" : `${sub} hover:text-white/70`}`}>
          ทั้งหมด ({receipts.length})
        </button>
        <button onClick={() => setTab("matches")} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === "matches" ? "bg-[#FA3633] text-white shadow-sm" : `${sub} hover:text-white/70`}`}>
          คู่เอกสาร ({matches.length})
        </button>
      </div>

      {/* Content */}
      {tab === "email" ? (
        <DataTable
          columns={emailColumns}
          data={emailReceipts}
          rowKey={(r) => r._id}
          dateField="rawDate"
          columnConfigKey="matching-email"
          emptyText="ยังไม่มีเอกสารจากอีเมล — กด สแกน Gmail เพื่อดึงเอกสาร"
        />
      ) : tab === "all" ? (
        <DataTable columns={receiptColumns} data={receipts} rowKey={(r) => r._id} dateField="rawDate" columnConfigKey="matching-receipts" />
      ) : (
        <DataTable
          columns={matchColumns}
          data={matches}
          rowKey={(m) => m._id}
          columnConfigKey="matching-pairs"
          emptyText="ยังไม่มีคู่เอกสาร — อัปโหลดหรือสแกน Gmail เพื่อเริ่มจับคู่"
        />
      )}
    </div>
  );
}
