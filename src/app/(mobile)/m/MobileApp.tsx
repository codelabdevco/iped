"use client";

import { useState, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Home, Receipt, ScanLine, BarChart3, User, Camera, Image as ImageIcon, Loader2, Check, X, Bell, Pencil, Moon, Sun, ChevronRight, TrendingUp, Calculator, FolderOpen, ArrowUpRight, ArrowDownLeft, Wallet, AlertTriangle } from "lucide-react";
import BrandIcon from "@/components/dashboard/BrandIcon";
import StatsCard from "@/components/dashboard/StatsCard";
import GoalCard from "@/components/dashboard/GoalCard";
import Baht from "@/components/dashboard/Baht";
import { formatNumber as fmt } from "@/lib/utils";

type Tab = "home" | "receipts" | "scan" | "reports" | "profile";

interface MobileData {
  profile: any;
  todayExpense: number;
  todayIncome: number;
  todayCount: number;
  monthExpense: number;
  monthIncome: number;
  receipts: any[];
  categories: any[];
  monthlyData: { month: string; expense: number; income: number }[];
  totalExpense: number;
  topMerchants: { name: string; total: number; count: number }[];
  paymentMethods: { method: string; total: number; count: number }[];
  daysInMonth: number;
  stats: any;
}
const PAY_LABELS: Record<string, string> = {
  "bank-scb": "ไทยพาณิชย์", "bank-kbank": "กสิกร", "bank-bbl": "กรุงเทพ", "bank-ktb": "กรุงไทย",
  "bank-bay": "กรุงศรี", "bank-tmb": "ทีทีบี", "bank-gsb": "ออมสิน", promptpay: "พร้อมเพย์",
  cash: "เงินสด", transfer: "โอนเงิน", credit: "บัตรเครดิต", debit: "บัตรเดบิต",
  "ewallet-truemoney": "TrueMoney", "ewallet-rabbit": "Rabbit LINE Pay", "ewallet-shopee": "ShopeePay",
};

function useS(isDark: boolean) {
  return {
    card: isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white",
    border: isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200",
    txt: isDark ? "text-white" : "text-gray-900",
    sub: isDark ? "text-white/50" : "text-gray-500",
    muted: isDark ? "text-white/30" : "text-gray-400",
    inp: `w-full h-10 px-3 ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900"} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`,
  };
}

// ════════════════════════════════════════
//  MAIN APP SHELL
// ════════════════════════════════════════
export default function MobileApp({ data }: { data: MobileData }) {
  const { isDark, toggleTheme } = useTheme();
  const [tab, setTab] = useState<Tab>("home");
  const { txt } = useS(isDark);
  const activeColor = "#FA3633";
  const inactiveColor = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";

  return (
    <div className="min-h-screen shell-theme">
      {/* ── Status bar safe area ── */}
      <div className="h-[env(safe-area-inset-top)]" />

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 h-12 shell-theme backdrop-blur-xl border-b border-transparent" style={{ opacity: 0.98 }}>
        <div className="flex items-center gap-2">
          <img src="/logo-cropped.png" alt="" className="w-6 h-6 rounded-md object-cover" />
          <span className={`text-sm font-bold ${txt}`}>อาซิ่ม</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? "hover:bg-white/5" : "hover:bg-gray-100"}`}>
            {isDark ? <Moon size={16} className="text-white/40" /> : <Sun size={16} className="text-gray-400" />}
          </button>
          <button onClick={() => setTab("profile")} className="relative">
            {data.profile.lineProfilePic ? (
              <img src={data.profile.lineProfilePic} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-[#FA3633]/20" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#FA3633]/20 flex items-center justify-center text-xs font-bold text-[#FA3633]">
                {(data.profile.name || "U")[0]}
              </div>
            )}
          </button>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="px-4 pb-24 max-w-lg mx-auto">
        <div className="animate-in fade-in duration-200">
          {tab === "home" && <HomeTab data={data} isDark={isDark} onScan={() => setTab("scan")} onReceipts={() => setTab("receipts")} />}
          {tab === "receipts" && <ReceiptsTab receipts={data.receipts} isDark={isDark} />}
          {tab === "scan" && <ScanTab isDark={isDark} onDone={() => setTab("home")} />}
          {tab === "reports" && <ReportsTab data={data} isDark={isDark} />}
          {tab === "profile" && <ProfileTab data={data} isDark={isDark} toggleTheme={toggleTheme} />}
        </div>
      </main>

      {/* ── Bottom Tab Bar ── */}
      <nav className={`fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-xl ${isDark ? "bg-[#0a0a0a]/90 border-white/[0.06]" : "bg-white/90 border-gray-200"}`} style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
          {([
            { id: "home" as Tab, icon: Home, label: "หน้าหลัก" },
            { id: "receipts" as Tab, icon: Receipt, label: "ใบเสร็จ" },
            { id: "scan" as Tab, icon: ScanLine, label: "สแกน", fab: true },
            { id: "reports" as Tab, icon: BarChart3, label: "สรุป" },
            { id: "profile" as Tab, icon: User, label: "โปรไฟล์" },
          ]).map((t) => {
            const active = tab === t.id;
            const Icon = t.icon;
            if (t.fab) {
              return (
                <button key={t.id} onClick={() => setTab(t.id)} className="flex flex-col items-center -mt-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all ${active ? "bg-[#FA3633] scale-105" : isDark ? "bg-[#1a1a1a] border border-white/10" : "bg-white border border-gray-200 shadow-md"}`}>
                    <Icon size={24} className={active ? "text-white" : isDark ? "text-white/50" : "text-gray-400"} />
                  </div>
                  <span className="text-[9px] mt-1 font-semibold" style={{ color: active ? activeColor : inactiveColor }}>{t.label}</span>
                </button>
              );
            }
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className="flex flex-col items-center gap-0.5 py-1.5 px-2 min-w-[48px]">
                <Icon size={20} strokeWidth={active ? 2.5 : 1.5} style={{ color: active ? activeColor : inactiveColor }} />
                <span className="text-[9px] font-medium" style={{ color: active ? activeColor : inactiveColor }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

// ════════════════════════════════════════
//  HOME TAB
// ════════════════════════════════════════
function HomeTab({ data, isDark, onScan, onReceipts }: { data: MobileData; isDark: boolean; onScan: () => void; onReceipts: () => void }) {
  const { card, border, txt, sub, muted } = useS(isDark);
  const net = data.monthIncome - data.monthExpense;
  const budgetPct = data.profile.monthlyBudget > 0 ? Math.min(100, (data.monthExpense / data.profile.monthlyBudget) * 100) : 0;
  const avgPerDay = data.daysInMonth > 0 ? Math.round(data.totalExpense / Math.min(new Date().getDate(), data.daysInMonth)) : 0;
  const avgPerReceipt = data.stats.monthReceipts > 0 ? Math.round(data.totalExpense / data.stats.monthReceipts) : 0;

  return (
    <div className="space-y-4 pt-3">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-lg font-bold ${txt}`}>สวัสดี, {(data.profile.firstNameTh || data.profile.lineDisplayName || data.profile.name).split(" ")[0]} 👋</p>
          <p className={`text-[11px] ${sub}`}>{new Date().toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
      </div>

      {/* Hero card */}
      <div className="rounded-2xl bg-gradient-to-br from-[#FA3633] to-[#e62e2e] p-5 text-white shadow-lg shadow-[#FA3633]/20">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-white/60 font-medium">รายจ่ายวันนี้</p>
          <div className="flex items-center gap-1.5">
            {[
              { brand: "line", on: true },
              { brand: "gmail", on: !!data.profile.googleEmail },
            ].map((s) => (
              <div key={s.brand} className={`w-5 h-5 rounded-full flex items-center justify-center ${s.on ? "bg-white/20" : "bg-white/5"}`}>
                <BrandIcon brand={s.brand} size={10} />
              </div>
            ))}
          </div>
        </div>
        <p className="text-4xl font-extrabold tracking-tight">฿{fmt(data.todayExpense)}</p>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1">
            <ArrowUpRight size={12} className="text-white/60" />
            <span className="text-xs text-white/60">{data.todayCount} รายการ</span>
          </div>
          {data.todayIncome > 0 && (
            <div className="flex items-center gap-1">
              <ArrowDownLeft size={12} className="text-green-300" />
              <span className="text-xs text-green-200">รับ +฿{fmt(data.todayIncome)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={onScan} className="flex items-center gap-2.5 py-3.5 px-4 rounded-2xl bg-[#FA3633] text-white font-semibold text-sm shadow-md active:scale-[0.97] transition-all">
          <ScanLine size={18} /> สแกนสลิป
        </button>
        <button onClick={onReceipts} className={`flex items-center gap-2.5 py-3.5 px-4 rounded-2xl font-semibold text-sm active:scale-[0.97] transition-all ${card} border ${border} ${txt}`}>
          <Receipt size={18} className="text-[#FA3633]" /> ใบเสร็จ
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatsCard label="ยอดรวมเดือนนี้" value={`฿${fmt(data.totalExpense)}`} icon={<TrendingUp size={18} />} />
        <StatsCard label="จำนวนใบเสร็จ" value={`${data.stats.monthReceipts} ใบ`} icon={<Receipt size={18} />} />
        <StatsCard label="เฉลี่ย/วัน" value={`฿${fmt(avgPerDay)}`} icon={<Calculator size={18} />} />
        <StatsCard label="หมวดหมู่" value={`${data.categories.length} หมวด`} icon={<FolderOpen size={18} />} />
      </div>

      {/* Goals */}
      <div className="grid grid-cols-2 gap-3">
        <GoalCard storageKey="goal-expense" current={data.monthExpense} label="เป้ารายจ่าย" color="red" />
        <GoalCard storageKey="goal-income" current={data.monthIncome} label="เป้ารายรับ" color="green" />
      </div>

      {/* Month summary */}
      <div className={`${card} border ${border} rounded-2xl p-4`}>
        <p className={`text-xs font-semibold ${txt} mb-3`}>สรุปเดือนนี้</p>
        <div className="grid grid-cols-3 gap-2">
          <MiniCard label="รายจ่าย" value={`฿${fmt(data.monthExpense)}`} color="red" isDark={isDark} />
          <MiniCard label="รายรับ" value={`฿${fmt(data.monthIncome)}`} color="green" isDark={isDark} />
          <MiniCard label="คงเหลือ" value={`${net >= 0 ? "+" : ""}฿${fmt(Math.abs(net))}`} color={net >= 0 ? "blue" : "red"} isDark={isDark} />
        </div>
        {data.profile.monthlyBudget > 0 && (
          <div className="mt-3">
            <div className="flex justify-between mb-1">
              <span className={`text-[10px] ${sub}`}>งบ ฿{fmt(data.profile.monthlyBudget)}</span>
              <span className={`text-[10px] font-semibold ${budgetPct > 80 ? "text-red-500" : sub}`}>{Math.round(budgetPct)}%</span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
              <div className={`h-full rounded-full transition-all ${budgetPct > 100 ? "bg-red-500" : budgetPct > 80 ? "bg-amber-500" : "bg-[#FA3633]"}`} style={{ width: `${Math.min(budgetPct, 100)}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Categories */}
      {data.categories.length > 0 && (
        <div className={`${card} border ${border} rounded-2xl p-4`}>
          <p className={`text-xs font-semibold ${txt} mb-3`}>หมวดหมู่</p>
          {data.categories.slice(0, 5).map((c: any) => {
            const pct = data.totalExpense > 0 ? Math.round((c.total / data.totalExpense) * 100) : 0;
            return (
              <div key={c.name} className="flex items-center gap-3 py-1.5">
                <span className="text-sm w-6 text-center">{c.icon}</span>
                <span className={`text-xs flex-1 ${txt}`}>{c.name}</span>
                <div className={`w-16 h-1.5 rounded-full ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
                  <div className="h-full rounded-full bg-[#FA3633]" style={{ width: `${pct}%` }} />
                </div>
                <span className={`text-[10px] w-8 text-right ${muted}`}>{pct}%</span>
                <span className={`text-xs font-semibold w-16 text-right ${txt}`}>฿{fmt(c.total)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment methods */}
      {data.paymentMethods?.length > 0 && (
        <div className={`${card} border ${border} rounded-2xl p-4`}>
          <p className={`text-xs font-semibold ${txt} mb-3`}>วิธีชำระ</p>
          {data.paymentMethods.slice(0, 4).map((p: any) => (
            <div key={p.method} className="flex items-center gap-3 py-1.5">
              <BrandIcon brand={p.method} size={28} className="rounded-lg" />
              <span className={`text-xs flex-1 ${txt}`}>{PAY_LABELS[p.method] || p.method}</span>
              <span className={`text-[10px] ${muted}`}>{p.count}x</span>
              <span className={`text-xs font-semibold ${txt}`}>฿{fmt(p.total)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recent receipts */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className={`text-xs font-semibold ${txt}`}>ใบเสร็จล่าสุด</p>
          <button onClick={onReceipts} className="text-[10px] text-[#FA3633] font-medium">ดูทั้งหมด ({data.stats.totalReceipts})</button>
        </div>
        <div className="space-y-1.5">
          {data.receipts.slice(0, 8).map((r: any) => <ReceiptRow key={r._id} r={r} isDark={isDark} />)}
          {data.receipts.length === 0 && <EmptyState isDark={isDark} />}
        </div>
      </div>
    </div>
  );
}

function MiniCard({ label, value, color, isDark }: { label: string; value: string; color: string; isDark: boolean }) {
  const bg = { red: isDark ? "bg-red-500/10" : "bg-red-50", green: isDark ? "bg-green-500/10" : "bg-green-50", blue: isDark ? "bg-blue-500/10" : "bg-blue-50" }[color] || "";
  const tc = { red: "text-red-500", green: "text-green-500", blue: "text-blue-500" }[color] || "";
  return (
    <div className={`rounded-xl p-2.5 ${bg}`}>
      <p className={`text-[10px] ${tc}`}>{label}</p>
      <p className={`text-sm font-bold ${tc} mt-0.5`}>{value}</p>
    </div>
  );
}

function EmptyState({ isDark }: { isDark: boolean }) {
  return (
    <div className={`text-center py-10 ${isDark ? "text-white/30" : "text-gray-400"}`}>
      <Receipt size={32} className="mx-auto mb-2 opacity-30" />
      <p className="text-sm font-medium">ยังไม่มีรายการ</p>
      <p className="text-xs mt-1">ส่งสลิปผ่าน LINE หรือกดสแกน</p>
    </div>
  );
}

// ════════════════════════════════════════
//  RECEIPTS TAB
// ════════════════════════════════════════
function ReceiptsTab({ receipts, isDark }: { receipts: any[]; isDark: boolean }) {
  const { txt, sub, card, border } = useS(isDark);
  const [filter, setFilter] = useState<"all" | "expense" | "income">("all");
  const filtered = filter === "all" ? receipts : receipts.filter((r) => r.direction === filter);

  const statusLabel: Record<string, { text: string; cls: string }> = {
    pending: { text: "รอยืนยัน", cls: "bg-amber-500/10 text-amber-500" },
    confirmed: { text: "ยืนยันแล้ว", cls: "bg-green-500/10 text-green-500" },
    duplicate: { text: "ซ้ำ", cls: "bg-blue-500/10 text-blue-500" },
  };

  return (
    <div className="space-y-3 pt-3">
      <p className={`text-lg font-bold ${txt}`}>ใบเสร็จ</p>
      <div className={`flex p-1 rounded-xl ${isDark ? "bg-white/5" : "bg-gray-100"}`}>
        {([["all", `ทั้งหมด (${receipts.length})`], ["expense", "รายจ่าย"], ["income", "รายรับ"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${filter === key ? "bg-[#FA3633] text-white shadow-sm" : isDark ? "text-white/40" : "text-gray-500"}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        {filtered.map((r) => {
          const st = statusLabel[r.status] || statusLabel.pending;
          return (
            <div key={r._id} className={`${card} border ${border} rounded-xl px-3.5 py-3 flex items-center gap-3`}>
              {r.paymentMethod && (r.paymentMethod.startsWith("bank-") || r.paymentMethod === "promptpay") ? (
                <BrandIcon brand={r.paymentMethod} size={36} className="rounded-lg" />
              ) : (
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-base ${isDark ? "bg-white/5" : "bg-gray-50"}`}>{r.categoryIcon}</div>
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${txt} truncate`}>{r.merchant}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] ${isDark ? "text-white/30" : "text-gray-400"}`}>{r.date}</span>
                  {r.source === "line" && <BrandIcon brand="line" size={10} />}
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-semibold ${st.cls}`}>{st.text}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <Baht value={r.amount} direction={r.direction} className="text-sm font-bold" />
                <p className={`text-[10px] ${isDark ? "text-white/25" : "text-gray-400"}`}>{r.category}</p>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <EmptyState isDark={isDark} />}
      </div>
    </div>
  );
}

// ════════════════════════════════════════
//  SCAN TAB
// ════════════════════════════════════════
function ScanTab({ isDark, onDone }: { isDark: boolean; onDone: () => void }) {
  const { card, border, txt, sub, muted } = useS(isDark);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setUploading(true); setError(""); setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/ocr", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.receipt) setResult(data.receipt);
      else setError(data.error || "ไม่สามารถอ่านใบเสร็จได้");
    } catch { setError("เกิดข้อผิดพลาด"); } finally { setUploading(false); }
  };
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; };
  const reset = () => { setPreview(null); setResult(null); setError(""); };

  return (
    <div className="space-y-4 pt-3">
      <p className={`text-lg font-bold ${txt}`}>สแกนใบเสร็จ</p>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleInput} className="hidden" />
      <input ref={galleryRef} type="file" accept="image/*" onChange={handleInput} className="hidden" />

      {result ? (
        <div className={`${card} border border-green-500/20 rounded-2xl p-5 space-y-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center"><Check size={20} className="text-green-500" /></div>
            <div><p className={`text-base font-bold ${txt}`}>บันทึกสำเร็จ!</p><p className={`text-xs ${sub}`}>{result.merchant}</p></div>
          </div>
          <div className={`rounded-xl p-3 ${isDark ? "bg-white/[0.03]" : "bg-gray-50"}`}>
            <div className="flex justify-between mb-1"><span className={`text-xs ${sub}`}>จำนวนเงิน</span><Baht value={result.amount} direction={result.direction} className="text-lg font-bold" /></div>
            <div className="flex justify-between"><span className={`text-xs ${sub}`}>หมวดหมู่</span><span className={`text-sm ${txt}`}>{result.categoryIcon} {result.category}</span></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={reset} className="py-3 rounded-xl bg-[#FA3633] text-white text-sm font-semibold active:scale-[0.97]">สแกนอีก</button>
            <button onClick={onDone} className={`py-3 rounded-xl text-sm font-semibold ${card} border ${border} ${txt}`}>กลับหน้าหลัก</button>
          </div>
        </div>
      ) : error ? (
        <div className={`${card} border border-red-500/20 rounded-2xl p-6 text-center`}>
          <X size={32} className="text-red-500 mx-auto mb-2" />
          <p className="text-red-500 font-semibold text-sm">{error}</p>
          <button onClick={reset} className="mt-4 px-8 py-2.5 rounded-xl bg-[#FA3633] text-white text-sm font-semibold">ลองใหม่</button>
        </div>
      ) : uploading ? (
        <div className={`${card} border ${border} rounded-2xl p-10 flex flex-col items-center gap-4`}>
          <div className="w-16 h-16 rounded-2xl bg-[#FA3633]/10 flex items-center justify-center">
            <Loader2 size={28} className="text-[#FA3633] animate-spin" />
          </div>
          <div className="text-center">
            <p className={`text-sm font-semibold ${txt}`}>AI กำลังวิเคราะห์...</p>
            <p className={`text-xs ${muted} mt-1`}>อ่านข้อมูลจากใบเสร็จ</p>
          </div>
        </div>
      ) : (
        <>
          {preview && (
            <div className={`${card} border ${border} rounded-2xl overflow-hidden`}>
              <img src={preview} alt="" className="w-full max-h-60 object-contain" />
            </div>
          )}
          <button onClick={() => cameraRef.current?.click()} className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-[#FA3633] text-white font-bold text-base shadow-lg shadow-[#FA3633]/20 active:scale-[0.97] transition-all">
            <Camera size={22} /> ถ่ายรูปใบเสร็จ
          </button>
          <button onClick={() => galleryRef.current?.click()} className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold text-sm active:scale-[0.97] transition-all ${card} border ${border} ${txt}`}>
            <ImageIcon size={18} className="text-[#FA3633]" /> เลือกจากอัลบั้ม
          </button>
          <div className={`${card} border ${border} rounded-2xl p-4`}>
            <p className={`text-xs font-semibold ${sub} mb-2`}>รองรับเอกสาร</p>
            <div className="grid grid-cols-2 gap-1.5">
              {["🧾 ใบเสร็จ", "📄 ใบกำกับภาษี", "🏦 สลิปโอน", "💳 บิล/ใบแจ้งหนี้"].map((t) => (
                <span key={t} className={`text-[11px] ${muted}`}>{t}</span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════
//  REPORTS TAB
// ════════════════════════════════════════
function ReportsTab({ data, isDark }: { data: MobileData; isDark: boolean }) {
  const { card, border, txt, sub, muted } = useS(isDark);
  const maxMonthly = Math.max(...data.monthlyData.map((m) => Math.max(m.expense, m.income)), 1);
  const maxCat = Math.max(...data.categories.map((c: any) => c.total), 1);
  const net = data.monthIncome - data.monthExpense;
  const dailyAvg = data.daysInMonth > 0 ? Math.round(data.totalExpense / Math.min(new Date().getDate(), data.daysInMonth)) : 0;
  const avgPerReceipt = data.stats.monthReceipts > 0 ? Math.round(data.totalExpense / data.stats.monthReceipts) : 0;
  const budgetPct = data.profile.monthlyBudget > 0 ? Math.min(100, (data.totalExpense / data.profile.monthlyBudget) * 100) : 0;

  // Budget alerts from localStorage
  const [budgetAlerts] = useState<{ cat: string; spent: number; budget: number; pct: number }[]>(() => {
    try {
      const s = typeof window !== "undefined" ? localStorage.getItem("iped-budgets") : null;
      if (s) {
        const parsed = JSON.parse(s);
        const alerts: { cat: string; spent: number; budget: number; pct: number }[] = [];
        parsed.forEach((b: any) => {
          if (b.category && b.budget) {
            const catData = data.categories.find((c: any) => c.name === b.category);
            const spent = catData?.total || 0;
            const pct = (spent / b.budget) * 100;
            if (pct >= 80) alerts.push({ cat: b.category, spent, budget: b.budget, pct });
          }
        });
        return alerts.sort((a, b) => b.pct - a.pct);
      }
    } catch {}
    return [];
  });
  const [alertsDismissed, setAlertsDismissed] = useState(false);

  // Recurring items from localStorage
  const [recurring] = useState<{ name: string; type: string; amount: number; cycle: string; active: boolean }[]>(() => {
    try {
      const s = typeof window !== "undefined" ? localStorage.getItem("iped-recurring") : null;
      if (s) return JSON.parse(s);
    } catch {}
    return [
      { name: "ค่าเช่าคอนโด", type: "expense", amount: 12000, cycle: "รายเดือน", active: true },
      { name: "ค่าอินเทอร์เน็ต", type: "expense", amount: 599, cycle: "รายเดือน", active: true },
      { name: "Netflix", type: "expense", amount: 419, cycle: "รายเดือน", active: true },
    ];
  });

  // Budget limits from localStorage
  const [budgetLimits] = useState<Record<string, number>>(() => {
    try {
      const s = typeof window !== "undefined" ? localStorage.getItem("iped-budgets") : null;
      if (s) {
        const parsed = JSON.parse(s);
        const limits: Record<string, number> = {};
        parsed.forEach((b: any) => { if (b.category && b.budget) limits[b.category] = b.budget; });
        return limits;
      }
    } catch {}
    return {};
  });

  const recurringTotal = recurring.filter((i) => i.type === "expense" && i.active).reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-4 pt-3">
      {/* Title */}
      <div>
        <p className={`text-lg font-bold ${txt}`}>ภาพรวม</p>
        <p className={`text-[11px] ${sub}`}>สรุปข้อมูลรายจ่ายและใบเสร็จของคุณ</p>
      </div>

      {/* Connection status */}
      <div className={`flex items-center gap-3 ${card} border ${border} rounded-xl px-3 py-2`}>
        {[
          { name: "LINE", brand: "line", on: true },
          { name: "Gmail", brand: "gmail", on: !!data.profile.googleEmail },
          { name: "Drive", brand: "google-drive", on: !!data.profile.googleEmail },
        ].map((s) => (
          <div key={s.name} className={`flex items-center gap-1 text-[10px] ${sub}`}>
            <BrandIcon brand={s.brand} size={12} />
            <span className={s.on ? txt : ""}>{s.name}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${s.on ? "bg-green-500" : isDark ? "bg-white/15" : "bg-gray-300"}`} />
          </div>
        ))}
      </div>

      {/* Budget Alerts */}
      {!alertsDismissed && budgetAlerts.length > 0 && (
        <div className={`rounded-xl border p-3 ${isDark ? "bg-amber-500/5 border-amber-500/20" : "bg-amber-50 border-amber-200"}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-500" />
              <span className={`text-xs font-semibold ${isDark ? "text-amber-400" : "text-amber-700"}`}>แจ้งเตือนงบประมาณ</span>
            </div>
            <button onClick={() => setAlertsDismissed(true)} className={muted}><X size={14} /></button>
          </div>
          {budgetAlerts.map((a) => (
            <div key={a.cat} className={`flex items-center gap-2 py-0.5 text-xs ${isDark ? "text-white/70" : "text-gray-700"}`}>
              <span className="font-medium">{a.cat}</span>
              <span className={a.pct >= 100 ? "text-red-500" : "text-amber-500"}>
                ฿{fmt(a.spent)} / ฿{fmt(a.budget)} ({Math.round(a.pct)}%)
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatsCard label="ยอดรวมเดือนนี้" value={`฿${fmt(data.totalExpense)}`} icon={<TrendingUp size={18} />} />
        <StatsCard label="จำนวนใบเสร็จ" value={`${data.stats.monthReceipts} ใบ`} icon={<Receipt size={18} />} />
        <StatsCard label="เฉลี่ยต่อใบ" value={`฿${fmt(avgPerReceipt)}`} icon={<Calculator size={18} />} />
        <StatsCard label="หมวดหมู่" value={`${data.categories.length} หมวด`} icon={<FolderOpen size={18} />} />
      </div>

      {/* Chart */}
      <div className={`${card} border ${border} rounded-2xl p-4`}>
        <p className={`text-xs font-semibold ${txt} mb-4`}>ภาพรวมค่าใช้จ่ายรายเดือน</p>
        <div className="flex items-end justify-between gap-1.5 h-36 mb-2">
          {data.monthlyData.map((m, i) => {
            const isLast = i === data.monthlyData.length - 1;
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                {m.expense > 0 && <span className={`text-[7px] ${muted}`}>{m.expense >= 1000 ? `${Math.round(m.expense / 1000)}k` : fmt(m.expense)}</span>}
                <div className="w-full flex items-end justify-center gap-px h-24">
                  <div className={`w-3 rounded-t transition-all ${isLast ? "bg-red-500" : "bg-red-500/40"}`} style={{ height: `${Math.max(3, (m.expense / maxMonthly) * 100)}%` }} />
                  {m.income > 0 && <div className={`w-3 rounded-t transition-all ${isLast ? "bg-green-500" : "bg-green-500/40"}`} style={{ height: `${Math.max(3, (m.income / maxMonthly) * 100)}%` }} />}
                </div>
                <span className={`text-[10px] font-medium ${isLast ? txt : muted}`}>{m.month}</span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center gap-4">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-red-500" /><span className={`text-[10px] ${sub}`}>จ่าย</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-green-500" /><span className={`text-[10px] ${sub}`}>รับ</span></div>
        </div>
      </div>

      {/* Goals */}
      <div className={`${card} border ${border} rounded-2xl p-4`}>
        <p className={`text-xs font-semibold ${txt} mb-3`}>เป้าหมาย</p>
        <div className="grid grid-cols-2 gap-3">
          <GoalCard storageKey="goal-expense" current={data.monthExpense} label="เป้ารายจ่าย" color="red" />
          <GoalCard storageKey="goal-income" current={data.monthIncome} label="เป้ารายรับ" color="green" />
        </div>
      </div>

      {/* Month summary */}
      <div className={`${card} border ${border} rounded-2xl p-4`}>
        <p className={`text-xs font-semibold ${txt} mb-3`}>สรุปเดือนนี้</p>
        <div className="grid grid-cols-3 gap-2">
          <MiniCard label="รายจ่าย" value={`฿${fmt(data.monthExpense)}`} color="red" isDark={isDark} />
          <MiniCard label="รายรับ" value={`฿${fmt(data.monthIncome)}`} color="green" isDark={isDark} />
          <MiniCard label="คงเหลือ" value={`${net >= 0 ? "+" : ""}฿${fmt(Math.abs(net))}`} color={net >= 0 ? "blue" : "red"} isDark={isDark} />
        </div>
        <div className="flex gap-4 mt-3 pt-3 border-t" style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
          <div><p className={`text-[10px] ${muted}`}>เฉลี่ย/วัน</p><p className={`text-xs font-semibold ${txt}`}>฿{fmt(dailyAvg)}</p></div>
          <div><p className={`text-[10px] ${muted}`}>รายการ</p><p className={`text-xs font-semibold ${txt}`}>{data.stats.monthReceipts}</p></div>
          {data.profile.monthlyBudget > 0 && <div><p className={`text-[10px] ${muted}`}>งบ</p><p className={`text-xs font-semibold ${budgetPct > 80 ? "text-red-500" : txt}`}>{Math.round(budgetPct)}%</p></div>}
        </div>
        {data.profile.monthlyBudget > 0 && (
          <div className="mt-3">
            <div className="flex justify-between mb-1">
              <span className={`text-[10px] ${sub}`}>งบ ฿{fmt(data.profile.monthlyBudget)}</span>
              <span className={`text-[10px] font-semibold ${budgetPct > 80 ? "text-red-500" : sub}`}>{Math.round(budgetPct)}%</span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
              <div className={`h-full rounded-full transition-all ${budgetPct > 100 ? "bg-red-500" : budgetPct > 80 ? "bg-amber-500" : "bg-[#FA3633]"}`} style={{ width: `${Math.min(budgetPct, 100)}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Budget summary */}
      {data.categories.length > 0 && (
        <div className={`${card} border ${border} rounded-2xl p-4`}>
          <div className="flex items-center justify-between mb-3">
            <p className={`text-xs font-semibold ${txt}`}>งบประมาณ</p>
            <a href="/dashboard/budget" className="text-[10px] text-[#FA3633] font-medium">จัดการ →</a>
          </div>
          {data.categories.slice(0, 5).map((c: any) => {
            const budget = budgetLimits[c.name];
            const pct = budget ? Math.min((c.total / budget) * 100, 100) : 0;
            const isOver = budget ? c.total > budget : false;
            return (
              <div key={c.name} className="mb-2.5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{c.icon}</span>
                    <span className={`text-xs ${txt}`}>{c.name}</span>
                  </div>
                  <span className={`text-xs font-medium ${isOver ? "text-red-500" : txt}`}>
                    ฿{fmt(c.total)}
                    {budget ? <span className={sub}> / ฿{fmt(budget)}</span> : ""}
                  </span>
                </div>
                <div className={`h-1.5 rounded-full ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
                  {budget ? (
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: isOver ? "#EF4444" : "#FA3633", opacity: 0.7 }} />
                  ) : (
                    <div className="h-full rounded-full bg-[#FA3633] opacity-30" style={{ width: "100%" }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recurring items */}
      {recurring.filter((i) => i.active).length > 0 && (
        <div className={`${card} border ${border} rounded-2xl p-4`}>
          <div className="flex items-center justify-between mb-3">
            <p className={`text-xs font-semibold ${txt}`}>รายการประจำ</p>
            <a href="/dashboard/recurring" className="text-[10px] text-[#FA3633] font-medium">จัดการ →</a>
          </div>
          {recurring.filter((i) => i.active).slice(0, 5).map((item, i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold leading-none ${item.type === "income" ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500"}`}>{item.type === "income" ? "รับ" : "จ่าย"}</span>
                <span className={`text-xs ${txt}`}>{item.name}</span>
              </div>
              <span className={`text-xs font-medium ${txt}`}>฿{fmt(item.amount)}<span className={`text-[9px] ${muted} ml-0.5`}>/{item.cycle.replace("ราย", "")}</span></span>
            </div>
          ))}
          {recurringTotal > 0 && (
            <div className={`mt-2 pt-2 flex justify-between`} style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
              <span className={`text-[10px] ${sub}`}>รายจ่ายประจำ/เดือน</span>
              <span className="text-[10px] font-semibold text-red-500">฿{fmt(recurringTotal)}</span>
            </div>
          )}
        </div>
      )}

      {/* Categories */}
      {data.categories.length > 0 && (
        <div className={`${card} border ${border} rounded-2xl p-4`}>
          <p className={`text-xs font-semibold ${txt} mb-3`}>สัดส่วนหมวดหมู่</p>
          {data.categories.map((c: any, i: number) => {
            const pct = data.totalExpense > 0 ? Math.round((c.total / data.totalExpense) * 100) : 0;
            return (
              <div key={c.name} className="flex items-center gap-3 py-1.5">
                <span className="text-sm w-6 text-center">{c.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-0.5">
                    <span className={`text-xs ${txt}`}>{c.name}</span>
                    <span className={`text-xs font-bold ${txt}`}>฿{fmt(c.total)} <span className={`font-normal ${muted}`}>{pct}%</span></span>
                  </div>
                  <div className={`h-1.5 rounded-full ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
                    <div className="h-full rounded-full bg-[#FA3633]" style={{ width: `${(c.total / maxCat) * 100}%`, opacity: 1 - i * 0.08 }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment methods */}
      {data.paymentMethods?.length > 0 && (
        <div className={`${card} border ${border} rounded-2xl p-4`}>
          <div className="flex items-center justify-between mb-3">
            <p className={`text-xs font-semibold ${txt}`}>วิธีจ่าย</p>
            <a href="/dashboard/payments" className="text-[10px] text-[#FA3633] font-medium">ดูทั้งหมด →</a>
          </div>
          {data.paymentMethods.map((p) => {
            const pmMax = Math.max(...data.paymentMethods.map((pm) => pm.total), 1);
            const pct = (p.total / pmMax) * 100;
            return (
              <div key={p.method} className="flex items-center gap-3 py-1.5">
                <BrandIcon brand={p.method} size={28} className="rounded-lg" />
                <span className={`text-xs w-16 truncate ${sub}`}>{PAY_LABELS[p.method] || p.method}</span>
                <div className={`flex-1 h-1.5 rounded-full ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
                  <div className="h-full rounded-full bg-[#FA3633] opacity-70" style={{ width: `${pct}%` }} />
                </div>
                <span className={`text-xs font-bold ${txt}`}>฿{fmt(p.total)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Top merchants */}
      {data.topMerchants?.length > 0 && (
        <div className={`${card} border ${border} rounded-2xl p-4`}>
          <p className={`text-xs font-semibold ${txt} mb-3`}>จ่ายบ่อย</p>
          {data.topMerchants.map((m, i) => (
            <div key={m.name} className="flex items-center gap-3 py-1.5">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? "bg-[#FA3633] text-white" : isDark ? "bg-white/10 text-white/40" : "bg-gray-100 text-gray-400"}`}>{i + 1}</span>
              <span className={`text-xs flex-1 truncate ${txt}`}>{m.name}</span>
              <span className={`text-[10px] ${muted}`}>{m.count}x</span>
              <span className={`text-xs font-bold ${txt}`}>฿{fmt(m.total)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recent receipts */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className={`text-xs font-semibold ${txt}`}>ใบเสร็จล่าสุด</p>
          <a href="/dashboard/receipts" className="text-[10px] text-[#FA3633] font-medium">ดูทั้งหมด ({data.stats.totalReceipts}) →</a>
        </div>
        <div className="space-y-1.5">
          {data.receipts.slice(0, 8).map((r: any) => <ReceiptRow key={r._id} r={r} isDark={isDark} />)}
          {data.receipts.length === 0 && <EmptyState isDark={isDark} />}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════
//  PROFILE TAB
// ════════════════════════════════════════
function ProfileTab({ data, isDark, toggleTheme }: { data: MobileData; isDark: boolean; toggleTheme: () => void }) {
  const { card, border, txt, sub, muted, inp } = useS(isDark);
  const p = data.profile;
  const s = data.stats;
  const [editSection, setEditSection] = useState<string | null>(null);
  const [form, setForm] = useState({ ...p });
  const [saving, setSaving] = useState(false);
  const lbl = `block text-xs ${isDark ? "text-white/40" : "text-gray-500"} mb-1`;

  const streakEmoji = s.streak >= 30 ? "🔥" : s.streak >= 7 ? "⚡" : s.streak >= 1 ? "👍" : "👋";
  const nextLevel = s.streak >= 30 ? 60 : s.streak >= 7 ? 30 : s.streak >= 1 ? 7 : 1;
  const streakPct = Math.min(100, (s.streak / nextLevel) * 100);
  const budgetPct = p.monthlyBudget > 0 ? Math.min(100, (s.monthExpense / p.monthlyBudget) * 100) : 0;

  const saveField = async (fields: Record<string, unknown>) => {
    setSaving(true);
    try { const res = await fetch("/api/user", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fields) }); if (res.ok) { Object.assign(p, fields); setEditSection(null); } } catch {} finally { setSaving(false); }
  };

  const saveSettings = async (fields: Record<string, unknown>) => {
    setSaving(true);
    try { await fetch("/api/user", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fields) }); } catch {} finally { setSaving(false); }
  };

  return (
    <div className="space-y-4 pt-3">
      {/* Avatar */}
      <div className={`${card} border ${border} rounded-2xl p-5`}>
        <div className="flex items-center gap-4">
          <div className="relative">
            {p.lineProfilePic ? <img src={p.lineProfilePic} alt="" className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#FA3633]/20" /> :
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FA3633] to-[#ff6b6b] flex items-center justify-center text-white text-xl font-bold">{(p.name || "U")[0]}</div>}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-white dark:border-[#0a0a0a] flex items-center justify-center"><Check size={10} className="text-white" /></div>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className={`text-base font-bold ${txt} truncate`}>{p.lineDisplayName || p.name}</h1>
            <p className={`text-xs ${sub}`}>{p.occupation || "บัญชีส่วนตัว"}</p>
            <div className="flex gap-1.5 mt-1.5">
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/10"><BrandIcon brand="line" size={10} /><span className="text-[8px] text-green-500 font-semibold">LINE</span></div>
              {p.googleEmail && <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/10"><BrandIcon brand="gmail" size={10} /><span className="text-[8px] text-blue-500 font-semibold">Google</span></div>}
            </div>
          </div>
        </div>
      </div>

      {/* Streak */}
      <div className={`${card} border ${border} rounded-2xl p-4`}>
        <div className="flex items-end gap-2 mb-2">
          <span className={`text-3xl font-bold ${txt}`}>{s.streak}</span>
          <span className={`text-sm ${sub} mb-0.5`}>วัน {streakEmoji}</span>
        </div>
        <div className={`h-2 rounded-full ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
          <div className="h-full rounded-full bg-gradient-to-r from-[#FA3633] to-[#ff6b6b]" style={{ width: `${streakPct}%` }} />
        </div>
      </div>

      {/* Personal info */}
      <div className={`${card} border ${border} rounded-2xl p-4`}>
        <div className="flex items-center justify-between mb-3">
          <p className={`text-xs font-semibold ${txt}`}>ข้อมูลส่วนตัว</p>
          {editSection === "personal" ? (
            <div className="flex gap-2">
              <button onClick={() => setEditSection(null)} className={muted}><X size={14} /></button>
              <button onClick={() => saveField({ firstNameTh: form.firstNameTh, lastNameTh: form.lastNameTh, firstNameEn: form.firstNameEn, lastNameEn: form.lastNameEn, phone: form.phone, occupation: form.occupation })} disabled={saving}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FA3633] text-white text-[11px] font-semibold">
                {saving ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />} บันทึก
              </button>
            </div>
          ) : (
            <button onClick={() => { setForm({ ...p }); setEditSection("personal"); }} className={`text-[11px] ${muted}`}><Pencil size={10} className="inline mr-1" />แก้ไข</button>
          )}
        </div>
        {editSection === "personal" ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div><label className={lbl}>ชื่อ (ไทย)</label><input value={form.firstNameTh} onChange={(e) => setForm({ ...form, firstNameTh: e.target.value })} className={inp} /></div>
              <div><label className={lbl}>นามสกุล</label><input value={form.lastNameTh} onChange={(e) => setForm({ ...form, lastNameTh: e.target.value })} className={inp} /></div>
              <div><label className={lbl}>First</label><input value={form.firstNameEn} onChange={(e) => setForm({ ...form, firstNameEn: e.target.value })} className={inp} /></div>
              <div><label className={lbl}>Last</label><input value={form.lastNameEn} onChange={(e) => setForm({ ...form, lastNameEn: e.target.value })} className={inp} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={lbl}>เบอร์โทร</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inp} /></div>
              <div><label className={lbl}>อาชีพ</label><input value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} className={inp} /></div>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {p.firstNameTh ? <InfoRow l="ชื่อ (ไทย)" v={`${p.firstNameTh} ${p.lastNameTh}`.trim()} d={isDark} /> : <InfoRow l="ชื่อ" v={p.name} d={isDark} />}
            {p.firstNameEn && <InfoRow l="Name" v={`${p.firstNameEn} ${p.lastNameEn}`.trim()} d={isDark} />}
            {p.phone && <InfoRow l="เบอร์โทร" v={p.phone} d={isDark} />}
            {p.occupation && <InfoRow l="อาชีพ" v={p.occupation} d={isDark} />}
          </div>
        )}
      </div>

      {/* Budget */}
      <div className={`${card} border ${border} rounded-2xl p-4`}>
        <div className="flex items-center justify-between mb-2">
          <p className={`text-xs font-semibold ${txt}`}>งบประมาณ</p>
          {editSection === "budget" ? (
            <div className="flex gap-2">
              <button onClick={() => setEditSection(null)} className={muted}><X size={14} /></button>
              <button onClick={() => saveField({ monthlyBudget: form.monthlyBudget })} className="px-2.5 py-1 rounded-lg bg-[#FA3633] text-white text-[11px] font-semibold">บันทึก</button>
            </div>
          ) : (
            <button onClick={() => { setForm({ ...p }); setEditSection("budget"); }} className={`text-[11px] ${muted}`}><Pencil size={10} className="inline mr-1" />แก้ไข</button>
          )}
        </div>
        {editSection === "budget" ? (
          <div><label className={lbl}>งบ/เดือน (฿)</label><input type="number" value={form.monthlyBudget || ""} onChange={(e) => setForm({ ...form, monthlyBudget: Number(e.target.value) || 0 })} className={inp} /></div>
        ) : (
          <>
            <InfoRow l="งบ/เดือน" v={p.monthlyBudget > 0 ? `฿${fmt(p.monthlyBudget)}` : "ยังไม่ตั้ง"} d={isDark} />
            {p.monthlyBudget > 0 && <div className={`h-2 rounded-full mt-2 ${isDark ? "bg-white/10" : "bg-gray-100"}`}><div className={`h-full rounded-full ${budgetPct > 80 ? "bg-red-500" : "bg-[#FA3633]"}`} style={{ width: `${budgetPct}%` }} /></div>}
          </>
        )}
      </div>

      {/* Settings toggles */}
      <div className={`${card} border ${border} rounded-2xl overflow-hidden divide-y ${isDark ? "divide-white/[0.04]" : "divide-gray-100"}`}>
        <ToggleItem icon={<Bell size={16} />} label="สรุปรายวัน" value={p.settings.dailySummary} onChange={(v) => saveSettings({ "settings.notifications.dailySummary": v })} isDark={isDark} />
        <button onClick={toggleTheme} className={`w-full flex items-center gap-3 px-4 py-3 ${isDark ? "active:bg-white/5" : "active:bg-gray-50"}`}>
          <span className={muted}>{isDark ? <Moon size={16} /> : <Sun size={16} />}</span>
          <span className={`text-sm flex-1 text-left ${txt}`}>ธีม</span>
          <span className={`text-xs ${muted}`}>{isDark ? "มืด" : "สว่าง"}</span>
        </button>
        {!p.googleEmail && (
          <a href="/api/auth/google" className={`flex items-center gap-3 px-4 py-3 ${isDark ? "active:bg-white/5" : "active:bg-gray-50"}`}>
            <BrandIcon brand="gmail" size={16} />
            <span className={`text-sm flex-1 ${txt}`}>เชื่อมต่อ Google</span>
            <ChevronRight size={14} className={muted} />
          </a>
        )}
      </div>

      {/* Account */}
      <div className={`${card} border ${border} rounded-2xl p-4`}>
        <p className={`text-[10px] font-semibold ${sub} mb-2`}>บัญชี</p>
        <InfoRow l="สมาชิกตั้งแต่" v={s.memberSince} d={isDark} />
        <InfoRow l="ใบเสร็จ" v={`${s.totalReceipts} รายการ`} d={isDark} />
        <InfoRow l="สถานะ" v="✅ ใช้งานอยู่" d={isDark} />
      </div>

      <p className={`text-center text-[10px] ${muted} py-2`}>อาซิ่ม v1.0 — Powered by codelabs tech</p>
    </div>
  );
}

// ════════════════════════════════════════
//  SHARED SUB-COMPONENTS
// ════════════════════════════════════════
function ReceiptRow({ r, isDark }: { r: any; isDark: boolean }) {
  const { card, border, txt, muted } = useS(isDark);
  return (
    <div className={`${card} border ${border} rounded-xl px-3.5 py-2.5 flex items-center gap-3`}>
      {r.paymentMethod && (r.paymentMethod.startsWith("bank-") || r.paymentMethod === "promptpay") ? (
        <BrandIcon brand={r.paymentMethod} size={32} className="rounded-lg" />
      ) : (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${isDark ? "bg-white/5" : "bg-gray-50"}`}>{r.categoryIcon}</div>
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-medium ${txt} truncate`}>{r.merchant}</p>
        <p className={`text-[10px] ${muted}`}>{r.date}{r.time ? ` · ${r.time}` : ""}</p>
      </div>
      <Baht value={r.amount} direction={r.direction} className="text-[13px] font-bold" />
    </div>
  );
}

function InfoRow({ l, v, d }: { l: string; v: string; d: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className={`text-[11px] ${d ? "text-white/35" : "text-gray-500"}`}>{l}</span>
      <span className={`text-[13px] font-medium ${d ? "text-white" : "text-gray-900"}`}>{v}</span>
    </div>
  );
}

function ToggleItem({ icon, label, value, onChange, isDark }: { icon: React.ReactNode; label: string; value: boolean; onChange: (v: boolean) => void; isDark: boolean }) {
  const [on, setOn] = useState(value);
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className={isDark ? "text-white/35" : "text-gray-400"}>{icon}</span>
      <span className={`text-sm flex-1 ${isDark ? "text-white" : "text-gray-900"}`}>{label}</span>
      <button onClick={() => { setOn(!on); onChange(!on); }} className={`w-10 h-[22px] rounded-full transition-colors relative ${on ? "bg-[#FA3633]" : isDark ? "bg-white/10" : "bg-gray-300"}`}>
        <div className={`w-[18px] h-[18px] rounded-full bg-white absolute top-[2px] transition-transform shadow-sm ${on ? "translate-x-[20px]" : "translate-x-[2px]"}`} />
      </button>
    </div>
  );
}
