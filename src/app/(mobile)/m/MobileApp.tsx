"use client";

import { useState, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Home, Receipt, ScanLine, BarChart3, User, Camera, Image, Loader2, Check, X, Bell, Pencil, Moon, Sun, ChevronRight } from "lucide-react";
import BrandIcon from "@/components/dashboard/BrandIcon";

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
  stats: any;
}

export default function MobileApp({ data }: { data: MobileData }) {
  const { isDark, toggleTheme } = useTheme();
  const [tab, setTab] = useState<Tab>("home");
  const { txt, sub, muted } = useStyles(isDark);

  return (
    <div className="min-h-screen shell-theme">
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 h-14 shell-theme backdrop-blur-xl" style={{ opacity: 0.97 }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FA3633] flex items-center justify-center">
            <span className="text-white text-xs font-bold">i</span>
          </div>
          <span className={`text-sm font-bold ${txt}`}>iPED</span>
        </div>
        <button onClick={() => setTab("profile")}>
          {data.profile.lineProfilePic ? (
            <img src={data.profile.lineProfilePic} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#FA3633]/20 flex items-center justify-center text-xs font-bold text-[#FA3633]">
              {(data.profile.name || "U")[0]}
            </div>
          )}
        </button>
      </header>

      {/* Content */}
      <main className="px-4 pb-24">
        {tab === "home" && <HomeTab data={data} isDark={isDark} onScan={() => setTab("scan")} />}
        {tab === "receipts" && <ReceiptsTab receipts={data.receipts} isDark={isDark} />}
        {tab === "scan" && <ScanTab isDark={isDark} onDone={() => setTab("home")} />}
        {tab === "reports" && <ReportsTab data={data} isDark={isDark} />}
        {tab === "profile" && <ProfileTab data={data} isDark={isDark} toggleTheme={toggleTheme} />}
      </main>

      {/* Bottom Tab Bar */}
      <nav className={`fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-xl ${isDark ? "bg-[#111]/95 border-white/10" : "bg-white/95 border-gray-200"}`} style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {([
            { id: "home" as Tab, icon: Home, label: "หน้าหลัก" },
            { id: "receipts" as Tab, icon: Receipt, label: "ใบเสร็จ" },
            { id: "scan" as Tab, icon: ScanLine, label: "สแกน", center: true },
            { id: "reports" as Tab, icon: BarChart3, label: "สรุป" },
            { id: "profile" as Tab, icon: User, label: "โปรไฟล์" },
          ]).map((t) => {
            const isActive = tab === t.id;
            const Icon = t.icon;
            const activeColor = "#FA3633";
            const inactiveColor = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";

            if (t.center) {
              return (
                <button key={t.id} onClick={() => setTab(t.id)} className="flex flex-col items-center -mt-5">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${isActive ? "bg-[#FA3633]" : isDark ? "bg-white/10" : "bg-gray-100"}`}>
                    <Icon size={24} className={isActive ? "text-white" : isDark ? "text-white/60" : "text-gray-500"} />
                  </div>
                  <span className="text-[10px] mt-0.5 font-medium" style={{ color: isActive ? activeColor : inactiveColor }}>{t.label}</span>
                </button>
              );
            }
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className="flex flex-col items-center gap-0.5 py-2 px-3">
                <Icon size={22} style={{ color: isActive ? activeColor : inactiveColor }} />
                <span className="text-[10px] font-medium" style={{ color: isActive ? activeColor : inactiveColor }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

// ─── Shared helpers ───
const fmt = (n: number) => n.toLocaleString("th-TH", { minimumFractionDigits: 0 });

function useStyles(isDark: boolean) {
  return {
    card: isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white",
    border: isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200",
    txt: isDark ? "text-white" : "text-gray-900",
    sub: isDark ? "text-white/50" : "text-gray-500",
    muted: isDark ? "text-white/30" : "text-gray-400",
    inp: `w-full h-10 px-3 ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900"} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`,
  };
}

// ═══════════════════════════════
//  HOME TAB
// ═══════════════════════════════
function HomeTab({ data, isDark, onScan }: { data: MobileData; isDark: boolean; onScan: () => void }) {
  const { card, border, txt, sub, muted } = useStyles(isDark);
  const budgetPct = data.profile.monthlyBudget > 0 ? Math.min(100, (data.monthExpense / data.profile.monthlyBudget) * 100) : 0;

  return (
    <div className="space-y-4 pt-2">
      <div>
        <p className={`text-lg font-bold ${txt}`}>สวัสดี, {(data.profile.lineDisplayName || data.profile.name).split(" ")[0]} 👋</p>
        <p className={`text-xs ${sub}`}>{new Date().toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
      </div>

      {/* Today card */}
      <div className="rounded-2xl bg-gradient-to-br from-[#FA3633] to-[#ff6b6b] p-5 text-white">
        <p className="text-xs text-white/70">วันนี้</p>
        <div className="flex items-end justify-between mt-1">
          <div>
            <p className="text-3xl font-bold">฿{fmt(data.todayExpense)}</p>
            <p className="text-xs text-white/60 mt-1">{data.todayCount} รายการ</p>
          </div>
          {data.todayIncome > 0 && (
            <div className="text-right">
              <p className="text-xs text-white/60">รายรับ</p>
              <p className="text-lg font-bold">+฿{fmt(data.todayIncome)}</p>
            </div>
          )}
        </div>
      </div>

      <button onClick={onScan} className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-[#FA3633] text-white font-semibold text-sm shadow-lg active:scale-[0.98] transition-transform">
        <ScanLine size={20} /> สแกนใบเสร็จ
      </button>

      {/* Month summary */}
      <div className={`${card} border ${border} rounded-2xl p-4`}>
        <p className={`text-xs font-semibold ${sub} mb-3`}>เดือนนี้</p>
        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-xl p-3 ${isDark ? "bg-red-500/10" : "bg-red-50"}`}>
            <p className="text-[10px] text-red-500">รายจ่าย</p>
            <p className="text-base font-bold text-red-500">฿{fmt(data.monthExpense)}</p>
          </div>
          <div className={`rounded-xl p-3 ${isDark ? "bg-green-500/10" : "bg-green-50"}`}>
            <p className="text-[10px] text-green-500">รายรับ</p>
            <p className="text-base font-bold text-green-500">฿{fmt(data.monthIncome)}</p>
          </div>
        </div>
        {data.profile.monthlyBudget > 0 && (
          <div className="mt-3">
            <div className="flex justify-between mb-1">
              <span className={`text-[10px] ${muted}`}>งบประมาณ</span>
              <span className={`text-[10px] font-medium ${budgetPct > 80 ? "text-red-500" : sub}`}>{Math.round(budgetPct)}%</span>
            </div>
            <div className={`h-1.5 rounded-full ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
              <div className={`h-full rounded-full ${budgetPct > 80 ? "bg-red-500" : "bg-[#FA3633]"}`} style={{ width: `${budgetPct}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Recent */}
      <div>
        <p className={`text-sm font-semibold ${txt} mb-3`}>รายการล่าสุด</p>
        <div className="space-y-2">
          {data.receipts.slice(0, 8).map((r: any) => (
            <ReceiptRow key={r._id} r={r} isDark={isDark} />
          ))}
          {data.receipts.length === 0 && <p className={`text-center py-8 text-sm ${sub}`}>ยังไม่มีรายการ</p>}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════
//  RECEIPTS TAB
// ═══════════════════════════════
function ReceiptsTab({ receipts, isDark }: { receipts: any[]; isDark: boolean }) {
  const { txt, sub } = useStyles(isDark);
  const [filter, setFilter] = useState<"all" | "expense" | "income">("all");
  const filtered = filter === "all" ? receipts : receipts.filter((r) => r.direction === filter);

  return (
    <div className="space-y-4 pt-2">
      <p className={`text-lg font-bold ${txt}`}>ใบเสร็จ</p>
      <div className={`flex p-1 rounded-xl ${isDark ? "bg-white/5" : "bg-gray-100"}`}>
        {([["all", "ทั้งหมด"], ["expense", "รายจ่าย"], ["income", "รายรับ"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${filter === key ? "bg-[#FA3633] text-white shadow-sm" : isDark ? "text-white/50" : "text-gray-500"}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.map((r) => <ReceiptRow key={r._id} r={r} isDark={isDark} />)}
        {filtered.length === 0 && <p className={`text-center py-12 text-sm ${sub}`}>ไม่มีรายการ</p>}
      </div>
    </div>
  );
}

// ═══════════════════════════════
//  SCAN TAB
// ═══════════════════════════════
function ScanTab({ isDark, onDone }: { isDark: boolean; onDone: () => void }) {
  const { card, border, txt, sub } = useStyles(isDark);
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
    <div className="space-y-4 pt-2">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleInput} className="hidden" />
      <input ref={galleryRef} type="file" accept="image/*" onChange={handleInput} className="hidden" />

      {result && (
        <div className={`${card} border ${border} rounded-2xl p-5 space-y-3`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center"><Check size={16} className="text-green-500" /></div>
            <div><p className={`text-sm font-bold ${txt}`}>บันทึกสำเร็จ</p><p className={`text-xs ${sub}`}>{result.merchant}</p></div>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-xs ${sub}`}>จำนวนเงิน</span>
            <span className={`text-lg font-bold ${result.direction === "income" ? "text-green-500" : "text-red-500"}`}>{result.direction === "income" ? "+" : "-"}฿{fmt(result.amount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-xs ${sub}`}>หมวดหมู่</span>
            <span className={`text-sm ${txt}`}>{result.categoryIcon} {result.category}</span>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={reset} className="flex-1 py-3 rounded-xl bg-[#FA3633] text-white text-sm font-medium active:scale-[0.98]">สแกนอีก</button>
            <button onClick={onDone} className={`flex-1 py-3 rounded-xl text-sm font-medium ${isDark ? "bg-white/5 text-white" : "bg-gray-100 text-gray-700"}`}>กลับหน้าหลัก</button>
          </div>
        </div>
      )}

      {error && (
        <div className={`${card} border border-red-500/20 rounded-2xl p-5 text-center`}>
          <p className="text-red-500 font-medium text-sm">{error}</p>
          <button onClick={reset} className="mt-3 px-6 py-2 rounded-xl bg-[#FA3633] text-white text-sm font-medium">ลองใหม่</button>
        </div>
      )}

      {uploading && (
        <div className={`${card} border ${border} rounded-2xl p-8 flex flex-col items-center gap-3`}>
          <Loader2 size={32} className="text-[#FA3633] animate-spin" />
          <p className={`text-sm ${txt}`}>กำลังอ่านใบเสร็จ...</p>
        </div>
      )}

      {preview && !uploading && !result && !error && (
        <div className={`${card} border ${border} rounded-2xl overflow-hidden`}>
          <img src={preview} alt="" className="w-full max-h-64 object-contain" />
        </div>
      )}

      {!uploading && !result && (
        <>
          <button onClick={() => cameraRef.current?.click()} className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-[#FA3633] text-white font-semibold text-base shadow-lg active:scale-[0.98]">
            <Camera size={24} /> ถ่ายรูปใบเสร็จ
          </button>
          <button onClick={() => galleryRef.current?.click()} className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl ${isDark ? "bg-white/5 text-white/70" : "bg-gray-100 text-gray-600"} font-medium text-sm active:scale-[0.98]`}>
            <Image size={20} /> เลือกจากอัลบั้ม
          </button>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════
//  REPORTS TAB
// ═══════════════════════════════
function ReportsTab({ data, isDark }: { data: MobileData; isDark: boolean }) {
  const { card, border, txt, sub, muted } = useStyles(isDark);
  const maxMonthly = Math.max(...data.monthlyData.map((m) => Math.max(m.expense, m.income)), 1);
  const maxCat = Math.max(...data.categories.map((c: any) => c.total), 1);

  return (
    <div className="space-y-4 pt-2">
      <p className={`text-lg font-bold ${txt}`}>สรุป & Trend</p>
      <div className={`${card} border ${border} rounded-2xl p-4`}>
        <p className={`text-xs font-semibold ${sub} mb-4`}>รายจ่าย 6 เดือนล่าสุด</p>
        <div className="flex items-end justify-between gap-2 h-32">
          {data.monthlyData.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end justify-center gap-0.5 h-24">
                <div className="w-3 rounded-t bg-red-500/70" style={{ height: `${Math.max(2, (m.expense / maxMonthly) * 100)}%` }} />
                {m.income > 0 && <div className="w-3 rounded-t bg-green-500/70" style={{ height: `${Math.max(2, (m.income / maxMonthly) * 100)}%` }} />}
              </div>
              <span className={`text-[9px] ${muted}`}>{m.month}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 justify-center">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-red-500/70" /><span className={`text-[10px] ${muted}`}>รายจ่าย</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-green-500/70" /><span className={`text-[10px] ${muted}`}>รายรับ</span></div>
        </div>
      </div>
      <div className={`${card} border ${border} rounded-2xl p-4`}>
        <p className={`text-xs font-semibold ${sub} mb-3`}>หมวดหมู่ (เดือนนี้)</p>
        <div className="space-y-3">
          {data.categories.map((c: any) => (
            <div key={c.name}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs ${txt}`}>{c.icon} {c.name}</span>
                <span className={`text-xs font-bold ${txt}`}>฿{fmt(c.total)}</span>
              </div>
              <div className={`h-1.5 rounded-full ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
                <div className="h-full rounded-full bg-[#FA3633]" style={{ width: `${(c.total / maxCat) * 100}%` }} />
              </div>
            </div>
          ))}
          {data.categories.length === 0 && <p className={`text-center py-6 text-sm ${sub}`}>ยังไม่มีข้อมูล</p>}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════
//  PROFILE TAB
// ═══════════════════════════════
function ProfileTab({ data, isDark, toggleTheme }: { data: MobileData; isDark: boolean; toggleTheme: () => void }) {
  const { card, border, txt, sub, muted, inp } = useStyles(isDark);
  const p = data.profile;
  const s = data.stats;
  const [editSection, setEditSection] = useState<string | null>(null);
  const [form, setForm] = useState({ ...p });
  const [saving, setSaving] = useState(false);

  const streakEmoji = s.streak >= 30 ? "🔥" : s.streak >= 7 ? "⚡" : s.streak >= 1 ? "👍" : "👋";
  const nextLevel = s.streak >= 30 ? 60 : s.streak >= 7 ? 30 : s.streak >= 1 ? 7 : 1;
  const streakPct = Math.min(100, (s.streak / nextLevel) * 100);
  const budgetPct = p.monthlyBudget > 0 ? Math.min(100, (s.monthExpense / p.monthlyBudget) * 100) : 0;

  const saveField = async (fields: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/user", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fields) });
      if (res.ok) { Object.assign(p, fields); setEditSection(null); }
    } catch {} finally { setSaving(false); }
  };

  const lbl = `block text-xs ${isDark ? "text-white/40" : "text-gray-500"} mb-1`;

  return (
    <div className="space-y-4 pt-2">
      {/* Header */}
      <div className={`${card} border ${border} rounded-2xl p-5`}>
        <div className="flex items-center gap-4">
          <div className="relative">
            {p.lineProfilePic ? <img src={p.lineProfilePic} alt="" className="w-16 h-16 rounded-full object-cover border-3 border-[#FA3633]/20" /> :
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FA3633] to-[#ff6b6b] flex items-center justify-center text-white text-xl font-bold">{(p.name || "U")[0]}</div>}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className={`text-base font-bold ${txt} truncate`}>{p.lineDisplayName || p.name}</h1>
            <p className={`text-xs ${sub}`}>{p.occupation || "บัญชีส่วนตัว"}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10">
                <BrandIcon brand="line" size={10} /><span className="text-[9px] text-green-500 font-medium">LINE</span>
              </div>
              {p.googleEmail && <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10">
                <BrandIcon brand="gmail" size={10} /><span className="text-[9px] text-blue-500 font-medium">Google</span>
              </div>}
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

      {/* Personal Info */}
      <div className={`${card} border ${border} rounded-2xl p-4`}>
        <div className="flex items-center justify-between mb-3">
          <p className={`text-sm font-semibold ${txt}`}>ข้อมูลส่วนตัว</p>
          {editSection === "personal" ? (
            <div className="flex gap-2">
              <button onClick={() => setEditSection(null)} className={`p-1 rounded ${muted}`}><X size={14} /></button>
              <button onClick={() => saveField({ firstNameTh: form.firstNameTh, lastNameTh: form.lastNameTh, firstNameEn: form.firstNameEn, lastNameEn: form.lastNameEn, phone: form.phone, occupation: form.occupation, gender: form.gender })}
                disabled={saving} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FA3633] text-white text-xs font-medium">
                {saving ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />} บันทึก
              </button>
            </div>
          ) : (
            <button onClick={() => { setForm({ ...p }); setEditSection("personal"); }} className={`flex items-center gap-1 text-xs ${muted}`}><Pencil size={10} /> แก้ไข</button>
          )}
        </div>
        {editSection === "personal" ? (
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div><label className={lbl}>ชื่อ (ไทย)</label><input value={form.firstNameTh} onChange={(e) => setForm({ ...form, firstNameTh: e.target.value })} className={inp} /></div>
              <div><label className={lbl}>นามสกุล (ไทย)</label><input value={form.lastNameTh} onChange={(e) => setForm({ ...form, lastNameTh: e.target.value })} className={inp} /></div>
              <div><label className={lbl}>First Name</label><input value={form.firstNameEn} onChange={(e) => setForm({ ...form, firstNameEn: e.target.value })} className={inp} /></div>
              <div><label className={lbl}>Last Name</label><input value={form.lastNameEn} onChange={(e) => setForm({ ...form, lastNameEn: e.target.value })} className={inp} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={lbl}>เบอร์โทร</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inp} /></div>
              <div><label className={lbl}>อาชีพ</label><input value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} className={inp} /></div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {p.firstNameTh && <InfoRow label="ชื่อ (ไทย)" value={`${p.firstNameTh} ${p.lastNameTh}`.trim()} isDark={isDark} />}
            {p.firstNameEn && <InfoRow label="Name (EN)" value={`${p.firstNameEn} ${p.lastNameEn}`.trim()} isDark={isDark} />}
            {!p.firstNameTh && <InfoRow label="ชื่อ" value={p.name} isDark={isDark} />}
            {p.phone && <InfoRow label="เบอร์โทร" value={p.phone} isDark={isDark} />}
            {p.occupation && <InfoRow label="อาชีพ" value={p.occupation} isDark={isDark} />}
          </div>
        )}
      </div>

      {/* Budget */}
      <div className={`${card} border ${border} rounded-2xl p-4`}>
        <div className="flex items-center justify-between mb-2">
          <p className={`text-sm font-semibold ${txt}`}>งบประมาณ</p>
          {editSection === "budget" ? (
            <div className="flex gap-2">
              <button onClick={() => setEditSection(null)} className={`p-1 rounded ${muted}`}><X size={14} /></button>
              <button onClick={() => saveField({ monthlyBudget: form.monthlyBudget })} className="px-2.5 py-1 rounded-lg bg-[#FA3633] text-white text-xs font-medium">บันทึก</button>
            </div>
          ) : (
            <button onClick={() => { setForm({ ...p }); setEditSection("budget"); }} className={`flex items-center gap-1 text-xs ${muted}`}><Pencil size={10} /> แก้ไข</button>
          )}
        </div>
        {editSection === "budget" ? (
          <div><label className={lbl}>งบประมาณ/เดือน (฿)</label><input type="number" value={form.monthlyBudget || ""} onChange={(e) => setForm({ ...form, monthlyBudget: Number(e.target.value) || 0 })} className={inp} /></div>
        ) : (
          <>
            <InfoRow label="งบ/เดือน" value={p.monthlyBudget > 0 ? `฿${fmt(p.monthlyBudget)}` : "ยังไม่ตั้ง"} isDark={isDark} />
            {p.monthlyBudget > 0 && <div className={`h-2 rounded-full mt-2 ${isDark ? "bg-white/10" : "bg-gray-100"}`}><div className={`h-full rounded-full ${budgetPct > 80 ? "bg-red-500" : "bg-[#FA3633]"}`} style={{ width: `${budgetPct}%` }} /></div>}
          </>
        )}
      </div>

      {/* Toggles + Settings */}
      <div className={`${card} border ${border} rounded-2xl overflow-hidden divide-y ${isDark ? "divide-white/5" : "divide-gray-100"}`}>
        <ToggleRow icon={<Bell size={16} />} label="สรุปรายวัน" value={p.settings.dailySummary} onChange={(v) => saveField({ "settings.notifications.dailySummary": v })} isDark={isDark} />
        <button onClick={toggleTheme} className={`w-full flex items-center gap-3 px-4 py-3 ${isDark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}>
          <span className={muted}>{isDark ? <Moon size={16} /> : <Sun size={16} />}</span>
          <span className={`text-sm flex-1 text-left ${txt}`}>{isDark ? "โหมดมืด" : "โหมดสว่าง"}</span>
        </button>
        {!p.googleEmail && (
          <a href="/api/auth/google" className={`flex items-center gap-3 px-4 py-3 ${isDark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}>
            <BrandIcon brand="gmail" size={16} />
            <span className={`text-sm flex-1 ${txt}`}>เชื่อมต่อ Google</span>
            <ChevronRight size={14} className={muted} />
          </a>
        )}
      </div>

      {/* Account */}
      <div className={`${card} border ${border} rounded-2xl p-4`}>
        <p className={`text-xs font-semibold ${sub} mb-2`}>ข้อมูลบัญชี</p>
        <div className="space-y-1.5">
          <InfoRow label="สมาชิกตั้งแต่" value={s.memberSince} isDark={isDark} />
          <InfoRow label="ใบเสร็จทั้งหมด" value={`${s.totalReceipts} รายการ`} isDark={isDark} />
          <InfoRow label="สถานะ" value={p.status === "active" ? "✅ ใช้งานอยู่" : p.status} isDark={isDark} />
        </div>
      </div>

      <p className={`text-center text-[10px] ${muted} py-2`}>iPED v1.0 — codelabs tech</p>
    </div>
  );
}

// ─── Shared sub-components ───
function ReceiptRow({ r, isDark }: { r: any; isDark: boolean }) {
  const { card, border, txt, muted } = useStyles(isDark);
  const isIncome = r.direction === "income";
  return (
    <div className={`${card} border ${border} rounded-xl px-4 py-3 flex items-center gap-3`}>
      {r.paymentMethod && (r.paymentMethod.startsWith("bank-") || r.paymentMethod === "promptpay") ? (
        <BrandIcon brand={r.paymentMethod} size={36} className="rounded-lg" />
      ) : (
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-base ${isDark ? "bg-white/5" : "bg-gray-100"}`}>{r.categoryIcon}</div>
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${txt} truncate`}>{r.merchant}</p>
        <p className={`text-[10px] ${muted}`}>{r.date} {r.time && `· ${r.time}`}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-bold ${isIncome ? "text-green-500" : txt}`}>{isIncome ? "+" : "-"}฿{fmt(r.amount)}</p>
        <p className={`text-[10px] ${muted}`}>{r.category}</p>
      </div>
    </div>
  );
}

function InfoRow({ label, value, isDark }: { label: string; value: string; isDark: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs ${isDark ? "text-white/40" : "text-gray-500"}`}>{label}</span>
      <span className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{value}</span>
    </div>
  );
}

function ToggleRow({ icon, label, value, onChange, isDark }: { icon: React.ReactNode; label: string; value: boolean; onChange: (v: boolean) => void; isDark: boolean }) {
  const [on, setOn] = useState(value);
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className={isDark ? "text-white/40" : "text-gray-400"}>{icon}</span>
      <span className={`text-sm flex-1 ${isDark ? "text-white" : "text-gray-900"}`}>{label}</span>
      <button onClick={() => { setOn(!on); onChange(!on); }} className={`w-10 h-5.5 rounded-full transition-colors relative ${on ? "bg-[#FA3633]" : isDark ? "bg-white/10" : "bg-gray-300"}`}>
        <div className={`w-4.5 h-4.5 rounded-full bg-white absolute top-0.5 transition-transform ${on ? "translate-x-[18px]" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}
