"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { Mail, FileText, CheckCircle, Search, Loader2, Clock, ToggleLeft, ToggleRight, Plus, User } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import StatsCard from "@/components/dashboard/StatsCard";
import BrandIcon from "@/components/dashboard/BrandIcon";

interface EmailRow {
  _id: string;
  emailSubject: string;
  emailFrom: string;
  merchant: string;
  amount: number;
  category: string;
  date: string;
  rawDate: string;
  status: string;
  ocrConfidence: number;
  matchScore: number;
  matchStatus: string | null;
  matchedWith: string | null;
  matchedMerchant: string;
  matchedSource: string;
}

interface GoogleAccountInfo {
  _id: string;
  email: string;
  lastScanAt: string | null;
  autoScan: boolean;
}

interface Props {
  emails: EmailRow[];
  googleEmail: string | null;
  googleConnected: boolean;
  lastGmailScan: string | null;
  autoGmailScan: boolean;
  totalScanned: number;
  totalWithOcr: number;
  accounts?: GoogleAccountInfo[];
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

const stMap: Record<string, { label: string; cls: string }> = {
  pending: { label: "รอตรวจสอบ", cls: "bg-yellow-500/10 text-yellow-400" },
  confirmed: { label: "ยืนยันแล้ว", cls: "bg-green-500/10 text-green-400" },
  edited: { label: "แก้ไขแล้ว", cls: "bg-blue-500/10 text-blue-400" },
  paid: { label: "ชำระแล้ว", cls: "bg-green-500/10 text-green-400" },
  overdue: { label: "เกินกำหนด", cls: "bg-red-500/10 text-red-400" },
  matched: { label: "จับคู่แล้ว", cls: "bg-purple-500/10 text-purple-400" },
  cancelled: { label: "ยกเลิก", cls: "bg-gray-500/10 text-gray-400" },
  duplicate: { label: "ซ้ำ", cls: "bg-orange-500/10 text-orange-400" },
  no_attachment: { label: "ไม่มีไฟล์แนบ", cls: "bg-gray-500/10 text-gray-400" },
  ocr_failed: { label: "OCR ล้มเหลว", cls: "bg-red-500/10 text-red-400" },
};

export default function EmailScannerClient({
  emails, googleEmail, googleConnected, lastGmailScan: initialLastScan,
  autoGmailScan: initialAutoScan, totalScanned, totalWithOcr, accounts = [],
}: Props) {
  const { isDark } = useTheme();
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [autoScan, setAutoScan] = useState(initialAutoScan);
  const [lastScan, setLastScan] = useState(initialLastScan);

  const c = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const b = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const t = isDark ? "text-white" : "text-gray-900";
  const s = isDark ? "text-white/50" : "text-gray-500";
  const muted = isDark ? "text-white/30" : "text-gray-400";

  const handleGmail = async () => {
    setScanning(true);
    try {
      const res = await fetch("/api/gmail/scan", { method: "POST" });
      const json = await res.json();
      if (json.expired) { window.location.href = "/api/auth/google"; return; }
      if (json.error) { alert(json.error); return; }
      setLastScan(new Date().toISOString());
      router.refresh();
    } catch { alert("เกิดข้อผิดพลาด"); } finally { setScanning(false); }
  };

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

  const columns: Column<EmailRow>[] = [
    {
      key: "emailSubject",
      label: "หัวข้ออีเมล",
      render: (r, isDark) => (
        <div className="leading-tight min-w-0">
          <div className="flex items-center gap-2">
            <BrandIcon brand="gmail" size={14} />
            <span className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{r.emailSubject}</span>
          </div>
          {r.emailFrom && (
            <div className={`text-[11px] mt-0.5 ${isDark ? "text-white/30" : "text-gray-400"}`}>{r.emailFrom}</div>
          )}
        </div>
      ),
    },
    {
      key: "merchant",
      label: "OCR อ่านได้",
      render: (r) => (
        <div className="leading-tight">
          <span className={t}>{r.merchant}</span>
          {r.category && <div className={`text-[11px] mt-0.5 ${muted}`}>{r.category}</div>}
        </div>
      ),
    },
    {
      key: "amount",
      label: "จำนวนเงิน",
      align: "right",
      render: (r) => (
        <span className={`font-semibold ${t}`}>
          {r.amount > 0 ? `฿${r.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}` : "-"}
        </span>
      ),
    },
    { key: "date", label: "วันที่" },
    {
      key: "ocrConfidence",
      label: "ความแม่นยำ",
      align: "center",
      render: (r) => {
        if (!r.ocrConfidence) return <span className={muted}>-</span>;
        const pct = r.ocrConfidence > 1 ? Math.round(r.ocrConfidence) : Math.round(r.ocrConfidence * 100);
        return <span className={`text-sm font-medium ${pct >= 80 ? "text-green-400" : pct >= 50 ? "text-amber-400" : "text-red-400"}`}>{pct}%</span>;
      },
    },
    {
      key: "matchInfo" as any,
      label: "จับคู่กับสลิป",
      render: (r) => {
        if (r.matchStatus === "matched" && r.matchedMerchant) {
          return (
            <div className="leading-tight">
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-green-500/10 text-green-400">
                ตรงกัน {r.matchScore}%
              </span>
              <div className={`flex items-center gap-1 text-[10px] mt-0.5 ${muted}`}>
                <BrandIcon brand={r.matchedSource === "line" ? "line" : "web"} size={10} />
                <span>{r.matchedMerchant}</span>
              </div>
            </div>
          );
        }
        if (r.matchStatus === "pending") {
          return <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-amber-500/10 text-amber-400">รอยืนยัน</span>;
        }
        if (r.amount === 0) return <span className={`text-[10px] ${muted}`}>-</span>;
        return <span className={`px-2 py-0.5 rounded-lg text-[10px] font-medium bg-gray-500/10 ${muted}`}>ยังไม่จับคู่</span>;
      },
    },
    {
      key: "status",
      label: "สถานะ",
      render: (r) => {
        const st = stMap[r.status] || { label: r.status, cls: "bg-gray-500/10 text-gray-400" };
        return <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${st.cls}`}>{st.label}</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Email Scanner" description="สแกนเอกสารจากอีเมลอัตโนมัติ" />
        <button
          onClick={handleGmail}
          disabled={scanning || !googleConnected}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors shadow-sm shadow-[#FA3633]/25 disabled:opacity-50"
        >
          {scanning ? <Loader2 size={16} className="animate-spin" /> : <BrandIcon brand="gmail" size={16} />}
          {scanning ? "กำลังสแกน..." : "สแกน Gmail"}
        </button>
      </div>

      {/* Gmail connection + settings (multi-account) */}
      <div className={`${c} border ${b} rounded-2xl p-5`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${googleConnected ? "bg-green-500/10" : "bg-gray-500/10"}`}>
              <Mail size={20} className={googleConnected ? "text-green-500" : "text-gray-500"} />
            </div>
            <div>
              <p className={`font-semibold ${t}`}>
                {googleConnected
                  ? `บัญชี Gmail (${accounts.length > 0 ? accounts.length : 1} บัญชี)`
                  : "Gmail ยังไม่เชื่อมต่อ"}
              </p>
              {!googleConnected && (
                <p className={`text-xs mt-0.5 ${s}`}>เชื่อมต่อบัญชี Gmail เพื่อสแกนใบเสร็จจากอีเมล</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {googleConnected && (
              <button
                onClick={handleToggleAutoScan}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${
                  autoScan
                    ? "bg-green-500/10 text-green-400"
                    : isDark ? "bg-white/5 text-white/40" : "bg-gray-100 text-gray-400"
                }`}
              >
                {autoScan ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                <span className="font-medium">{autoScan ? "สแกนอัตโนมัติ" : "สแกนเอง"}</span>
              </button>
            )}
            <a
              href="/api/auth/google"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
            >
              {googleConnected ? <Plus size={14} /> : <Mail size={14} />}
              {googleConnected ? "เพิ่มบัญชี Gmail" : "เชื่อมต่อ Gmail"}
            </a>
          </div>
        </div>

        {/* Connected accounts list */}
        {accounts.length > 0 ? (
          <div className="space-y-2">
            {accounts.map((acc) => (
              <div key={acc._id} className={`flex items-center justify-between px-4 py-3 rounded-xl ${isDark ? "bg-white/[0.03]" : "bg-gray-50"}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-white/[0.06]" : "bg-gray-100"}`}>
                    <User size={14} className={s} />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${t}`}>{acc.email}</p>
                    {acc.lastScanAt && (
                      <div className={`flex items-center gap-1.5 text-[11px] ${muted}`}>
                        <Clock size={10} />
                        <span>สแกนล่าสุด: {formatTimeAgo(acc.lastScanAt)}</span>
                      </div>
                    )}
                    {!acc.lastScanAt && (
                      <p className={`text-[11px] ${muted}`}>ยังไม่เคยสแกน</p>
                    )}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-400">
                  เชื่อมต่อแล้ว
                </span>
              </div>
            ))}
          </div>
        ) : googleConnected && googleEmail ? (
          <div className={`flex items-center justify-between px-4 py-3 rounded-xl ${isDark ? "bg-white/[0.03]" : "bg-gray-50"}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-white/[0.06]" : "bg-gray-100"}`}>
                <User size={14} className={s} />
              </div>
              <div>
                <p className={`text-sm font-medium ${t}`}>{googleEmail}</p>
                {lastScan && (
                  <div className={`flex items-center gap-1.5 text-[11px] ${muted}`}>
                    <Clock size={10} />
                    <span>สแกนล่าสุด: {formatTimeAgo(lastScan)}</span>
                  </div>
                )}
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-400">
              เชื่อมต่อแล้ว
            </span>
          </div>
        ) : null}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard label="อีเมลที่สแกน" value={`${totalScanned}`} icon={<Search size={20} />} color="text-blue-500" />
        <StatsCard label="OCR สำเร็จ" value={`${totalWithOcr}`} icon={<FileText size={20} />} color="text-purple-500" />
        <StatsCard
          label="ยืนยันแล้ว"
          value={`${emails.filter((e) => e.status === "confirmed" || e.status === "matched" || e.status === "paid").length}`}
          icon={<CheckCircle size={20} />}
          color="text-green-500"
        />
      </div>

      {/* Table */}
      <DataTable
        dateField="rawDate"
        columns={columns}
        data={emails}
        rowKey={(r) => r._id}
        emptyText="ยังไม่มีเอกสารจากอีเมล — กดปุ่ม สแกน Gmail เพื่อดึงเอกสาร"
      />
    </div>
  );
}
