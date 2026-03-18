"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { Search, ScanLine, CheckCircle2, Copy, Upload, Loader2, ArrowRight, Check, X, MessageCircle, Globe, ImageIcon } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import BrandIcon from "@/components/dashboard/BrandIcon";

interface ReceiptRow {
  _id: string; storeName: string; amount: number; category: string;
  date: string; rawDate?: string; time?: string; status: string;
  type: string; source: string; paymentMethod?: string; note?: string;
  hasImage?: boolean; direction?: string; createdAt?: string;
}

interface MatchRow {
  _id: string;
  receiptA: ReceiptRow;
  receiptB: ReceiptRow;
  matchScore: number; matchType: string; matchReason: string; status: string; createdAt?: string;
}

function Baht({ value, className = "" }: { value: number; className?: string }) {
  const whole = Math.floor(Math.abs(value)).toLocaleString();
  const dec = (Math.abs(value) % 1).toFixed(2).slice(1);
  return <span className={className}>฿{whole}<span className="text-[0.75em] opacity-50">{dec}</span></span>;
}

const DIR_CLR: Record<string, string> = { expense: "#FA3633", income: "#22c55e", savings: "#ec4899" };
const DIR_LABEL: Record<string, string> = { expense: "รายจ่าย", income: "รายรับ", savings: "เงินออม" };

export default function MatchingClient({ receipts, matches: initialMatches }: { receipts: ReceiptRow[]; matches: MatchRow[] }) {
  const { isDark } = useTheme();
  const router = useRouter();
  const [matches, setMatches] = useState(initialMatches);
  const [tab, setTab] = useState<"scan" | "matches">("scan");
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scans, setScans] = useState<{ id: string; name: string; amount: number; status: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const muted = isDark ? "text-white/30" : "text-gray-400";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const txt = isDark ? "text-white" : "text-gray-900";
  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";

  const totalAmount = receipts.filter((r) => r.status === "confirmed").reduce((s, r) => s + r.amount, 0);
  const confirmed = matches.filter((m) => m.status === "matched").length;
  const pending = matches.filter((m) => m.status === "pending").length;

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
      json.results?.forEach((r: any) => setScans((prev) => [{ id: `GM-${Date.now()}`, name: r.subject, amount: 0, status: r.status === "saved" ? "matched" : "failed" }, ...prev]));
      router.refresh();
    } catch { alert("เกิดข้อผิดพลาด"); } finally { setScanning(false); }
  };

  // Match actions
  const handleAction = async (id: string, status: "matched" | "rejected") => {
    await fetch("/api/matches", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    setMatches((prev) => prev.map((m) => m._id === id ? { ...m, status } : m));
  };

  // Receipt columns (same as receipts page)
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
        return (
          <div className="leading-tight">
            <div className="text-sm whitespace-nowrap">{day} {mon} {yr}{r.time ? <span className={`text-[11px] ml-1 ${muted}`}>{r.time}</span> : ""}</div>
            <div className="flex items-center gap-1 mt-0.5 text-[11px]">
              <BrandIcon brand={isLine ? "line" : "web"} size={11} />
              <span className={isLine ? "text-green-500" : "text-blue-400"}>{isLine ? "LINE" : "เว็บ"}</span>
            </div>
          </div>
        );
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
        };
        const st = cfg[r.status] || cfg.pending;
        return <span className={`px-2 py-1 rounded-lg text-[10px] font-medium ${st.c}`}>{st.l}</span>;
      },
    },
  ], [muted]);

  // Match columns
  const matchColumns: Column<MatchRow>[] = useMemo(() => [
    {
      key: "docA",
      label: "เอกสาร A",
      render: (m) => (
        <div className="leading-tight">
          <div className={`text-sm font-medium ${txt}`}>{m.receiptA?.storeName || "?"}</div>
          <div className={`text-[11px] ${muted}`}><Baht value={m.receiptA?.amount || 0} className="" /></div>
        </div>
      ),
    },
    { key: "arrow", label: "", render: () => <ArrowRight size={12} className={muted} /> },
    {
      key: "docB",
      label: "เอกสาร B",
      render: (m) => (
        <div className="leading-tight">
          <div className={`text-sm font-medium ${txt}`}>{m.receiptB?.storeName || "?"}</div>
          <div className={`text-[11px] ${muted}`}><Baht value={m.receiptB?.amount || 0} className="" /></div>
        </div>
      ),
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
        if (m.status === "matched") return <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-green-500/10 text-green-400">ยืนยัน</span>;
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
  ], [txt, sub, muted]);

  const scanStatusCls: Record<string, string> = { processing: "bg-amber-500/10 text-amber-500", matched: "bg-green-500/10 text-green-500", duplicate: "bg-orange-500/10 text-orange-400", failed: "bg-red-500/10 text-red-400" };

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" accept="image/*,application/pdf" multiple onChange={(e) => { if (e.target.files) Array.from(e.target.files).forEach(handleUpload); e.target.value = ""; }} className="hidden" />

      <div className="flex items-center justify-between">
        <PageHeader title="สแกน & จับคู่เอกสาร" description={`${receipts.length} รายการ — รวม ฿${totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`} />
        <div className="flex gap-2">
          <button onClick={handleGmail} disabled={scanning} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${isDark ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {scanning ? <Loader2 size={14} className="animate-spin" /> : <BrandIcon brand="gmail" size={16} />}
            {scanning ? "สแกน..." : "สแกน Gmail"}
          </button>
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors shadow-sm shadow-[#FA3633]/25 disabled:opacity-50">
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploading ? "สแกน..." : "อัปโหลด & สแกน"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="เอกสารทั้งหมด" value={`${receipts.length} รายการ`} icon={<ScanLine size={20} />} color="text-blue-500" />
        <StatsCard label="จับคู่แล้ว" value={`${confirmed} คู่`} icon={<CheckCircle2 size={20} />} color="text-green-500" />
        <StatsCard label="รอยืนยัน" value={`${pending} คู่`} icon={<Copy size={20} />} color="text-amber-500" />
        <StatsCard label="สแกนวันนี้" value={`${scans.length} รายการ`} icon={<Upload size={20} />} color="text-purple-500" />
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

      {/* Tab switcher */}
      <div className={`${card} border ${border} rounded-xl p-1 flex`}>
        <button onClick={() => setTab("scan")} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === "scan" ? "bg-[#FA3633] text-white shadow-sm" : `${sub} hover:text-white/70`}`}>
          เอกสารทั้งหมด ({receipts.length})
        </button>
        <button onClick={() => setTab("matches")} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === "matches" ? "bg-[#FA3633] text-white shadow-sm" : `${sub} hover:text-white/70`}`}>
          คู่เอกสาร ({matches.length})
        </button>
      </div>

      {/* Content */}
      {tab === "scan" ? (
        <DataTable columns={receiptColumns} data={receipts} rowKey={(r) => r._id} dateField="rawDate" columnConfigKey="matching-receipts" />
      ) : (
        <DataTable columns={matchColumns} data={matches} rowKey={(m) => m._id} columnConfigKey="matching-pairs" emptyText="ยังไม่มีคู่เอกสาร — อัปโหลดหรือสแกน Gmail เพื่อเริ่มจับคู่" />
      )}
    </div>
  );
}
