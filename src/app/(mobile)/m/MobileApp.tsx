"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Home, Receipt, ScanLine, BarChart3, User, Camera, Image as ImageIcon, Loader2, Check, X, Bell, Pencil, Moon, Sun, ChevronRight, TrendingUp, Calculator, FolderOpen, ArrowUpRight, ArrowDownLeft, AlertTriangle, PiggyBank, Search, Trash2, Save, ChevronDown, Plus, RefreshCw } from "lucide-react";
import BrandIcon from "@/components/dashboard/BrandIcon";
import StatsCard from "@/components/dashboard/StatsCard";
import GoalCard from "@/components/dashboard/GoalCard";
import Baht from "@/components/dashboard/Baht";
import Select from "@/components/dashboard/Select";
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
      <div className="h-[env(safe-area-inset-top)]" />

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

      <main className="px-4 pb-24 max-w-lg mx-auto">
        <div className="animate-in fade-in duration-200">
          {tab === "home" && <HomeTab data={data} isDark={isDark} onScan={() => setTab("scan")} onReceipts={() => setTab("receipts")} onReports={() => setTab("reports")} />}
          {tab === "receipts" && <ReceiptsTab receipts={data.receipts} isDark={isDark} />}
          {tab === "scan" && <ScanTab isDark={isDark} onDone={() => setTab("home")} />}
          {tab === "reports" && <ReportsTab data={data} isDark={isDark} />}
          {tab === "profile" && <ProfileTab data={data} isDark={isDark} toggleTheme={toggleTheme} />}
        </div>
      </main>

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
//  HOME TAB — quick glance + actions
//  (ไม่ซ้ำกับ สรุป: ไม่มี chart/donut/categories/stats cards)
// ════════════════════════════════════════
function HomeTab({ data, isDark, onScan, onReceipts, onReports }: { data: MobileData; isDark: boolean; onScan: () => void; onReceipts: () => void; onReports: () => void }) {
  const { card, border, txt, sub, muted } = useS(isDark);
  const net = data.monthIncome - data.monthExpense;
  const budgetPct = data.profile.monthlyBudget > 0 ? Math.min(100, (data.monthExpense / data.profile.monthlyBudget) * 100) : 0;

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const touchStartY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      const dy = e.touches[0].clientY - touchStartY.current;
      if (dy > 0) setPullY(Math.min(dy * 0.4, 80));
    }
  };
  const handleTouchEnd = async () => {
    if (pullY > 50 && !refreshing) {
      setRefreshing(true);
      try {
        const res = await fetch("/api/receipts?limit=100");
        if (res.ok) { /* data refresh handled at parent level */ }
      } catch {} finally { setRefreshing(false); }
    }
    setPullY(0);
  };

  return (
    <div ref={scrollRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} className="space-y-4 pt-3">
      {/* Pull-to-refresh indicator */}
      {(pullY > 0 || refreshing) && (
        <div className="flex items-center justify-center py-2 -mt-2" style={{ height: refreshing ? 40 : pullY * 0.5 }}>
          <RefreshCw size={18} className={`${refreshing ? "animate-spin" : ""} ${isDark ? "text-white/40" : "text-gray-400"}`} />
          {!refreshing && pullY > 50 && <span className={`text-[10px] ml-2 ${isDark ? "text-white/40" : "text-gray-400"}`}>ปล่อยเพื่อรีเฟรช</span>}
        </div>
      )}
      {/* Greeting + scan CTA */}
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-lg font-bold ${txt}`}>สวัสดี, {data.profile.firstNameTh || data.profile.lineDisplayName || data.profile.name}</p>
          <p className={`text-[11px] ${sub}`}>{new Date().toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
        <button onClick={onScan} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FA3633] text-white text-xs font-semibold shadow-lg shadow-[#FA3633]/25 active:scale-[0.95] transition-all">
          <ScanLine size={16} /> สแกนสลิป
        </button>
      </div>

      {/* Balance hero card */}
      <div className={`rounded-2xl p-5 ${isDark ? "bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-white/[0.08]" : "bg-gradient-to-br from-gray-900 to-gray-800"} text-white shadow-xl`}>
        <p className="text-[10px] text-white/50 font-medium mb-1">ยอดคงเหลือเดือนนี้</p>
        <p className={`text-3xl font-extrabold tracking-tight ${net < 0 ? "text-red-400" : ""}`}>
          {net >= 0 ? "+" : "-"}฿{fmt(Math.abs(net))}
        </p>
        <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-white/10">
          <div>
            <p className="text-[9px] text-red-400/70">รายจ่าย</p>
            <p className="text-sm font-bold text-red-400">-฿{fmt(data.monthExpense)}</p>
          </div>
          <div>
            <p className="text-[9px] text-green-400/70">รายรับ</p>
            <p className="text-sm font-bold text-green-400">+฿{fmt(data.monthIncome)}</p>
          </div>
          <div>
            <p className="text-[9px] text-white/40">ใบเสร็จ</p>
            <p className="text-sm font-bold">{data.stats.monthReceipts} ใบ</p>
          </div>
        </div>
        {data.profile.monthlyBudget > 0 && (
          <div className="mt-3">
            <div className="flex justify-between mb-1">
              <span className="text-[9px] text-white/40">งบประมาณ ฿{fmt(data.profile.monthlyBudget)}</span>
              <span className={`text-[9px] font-semibold ${budgetPct > 80 ? "text-red-400" : "text-white/60"}`}>{Math.round(budgetPct)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10">
              <div className={`h-full rounded-full transition-all ${budgetPct > 100 ? "bg-red-400" : budgetPct > 80 ? "bg-amber-400" : "bg-white/50"}`} style={{ width: `${Math.min(budgetPct, 100)}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Today — expense + income */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`${card} border ${border} rounded-2xl p-3.5`}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center"><ArrowUpRight size={14} className="text-red-500" /></div>
            <span className={`text-[10px] ${sub}`}>จ่ายวันนี้</span>
          </div>
          <p className="text-xl font-extrabold text-red-500">-฿{fmt(data.todayExpense)}</p>
          <p className={`text-[9px] ${muted} mt-0.5`}>{data.todayCount} รายการ</p>
        </div>
        <div className={`${card} border ${border} rounded-2xl p-3.5`}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center"><ArrowDownLeft size={14} className="text-green-500" /></div>
            <span className={`text-[10px] ${sub}`}>รับวันนี้</span>
          </div>
          <p className="text-xl font-extrabold text-green-500">+฿{fmt(data.todayIncome)}</p>
          <p className={`text-[9px] ${muted} mt-0.5`}>รายรับ</p>
        </div>
      </div>

      {/* Goals — set/track (unique to Home) */}
      <div className="grid grid-cols-2 gap-3">
        <GoalCard storageKey="goal-expense" current={data.monthExpense} label="เป้ารายจ่าย" color="red" />
        <GoalCard storageKey="goal-income" current={data.monthIncome} label="เป้ารายรับ" color="green" />
      </div>

      {/* Recent receipts */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className={`text-xs font-semibold ${txt}`}>ใบเสร็จล่าสุด</p>
          <button onClick={onReceipts} className="text-[10px] text-[#FA3633] font-medium">ดูทั้งหมด ({data.stats.totalReceipts}) →</button>
        </div>
        <div className="space-y-1.5">
          {data.receipts.slice(0, 5).map((r: any) => <ReceiptRow key={r._id} r={r} isDark={isDark} />)}
          {data.receipts.length === 0 && <EmptyState isDark={isDark} />}
        </div>
      </div>

      {/* Scan prompt — bottom CTA */}
      <button onClick={onScan} className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl ${isDark ? "bg-white/[0.03] border border-white/[0.06]" : "bg-gray-50 border border-gray-200"} active:scale-[0.98] transition-all`}>
        <Camera size={18} className="text-[#FA3633]" />
        <span className={`text-sm font-medium ${txt}`}>บันทึกสลิปเพิ่ม</span>
        <span className={`text-[10px] ${muted}`}>ถ่ายรูป / เลือกจากอัลบั้ม</span>
      </button>
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
//  RECEIPTS TAB — full-featured like desktop
// ════════════════════════════════════════
const STATUS_MAP: Record<string, { text: string; cls: string }> = {
  pending: { text: "รอยืนยัน", cls: "bg-amber-500/10 text-amber-500" },
  confirmed: { text: "ยืนยันแล้ว", cls: "bg-green-500/10 text-green-500" },
  edited: { text: "แก้ไขแล้ว", cls: "bg-blue-500/10 text-blue-500" },
  paid: { text: "จ่ายแล้ว", cls: "bg-emerald-500/10 text-emerald-500" },
  overdue: { text: "เกินกำหนด", cls: "bg-red-500/10 text-red-500" },
  matched: { text: "จับคู่แล้ว", cls: "bg-purple-500/10 text-purple-500" },
  duplicate: { text: "ซ้ำ", cls: "bg-orange-500/10 text-orange-500" },
  cancelled: { text: "ยกเลิก", cls: "bg-gray-500/10 text-gray-500" },
};
const ALL_STATUSES = Object.keys(STATUS_MAP);

function ReceiptsTab({ receipts: initialReceipts, isDark }: { receipts: any[]; isDark: boolean }) {
  const { txt, sub, card, border, muted, inp } = useS(isDark);
  const [receipts, setReceipts] = useState(initialReceipts);
  const [dirFilter, setDirFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [editItems, setEditItems] = useState<{ name: string; qty: number; price: number }[]>([]);
  const [vatEnabled, setVatEnabled] = useState(false);
  const [vatInclusive, setVatInclusive] = useState(false);
  const [whtEnabled, setWhtEnabled] = useState(false);
  const [whtInclusive, setWhtInclusive] = useState(false);

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const touchStartY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      const dy = e.touches[0].clientY - touchStartY.current;
      if (dy > 0) setPullY(Math.min(dy * 0.4, 80));
    }
  };
  const handleTouchEnd = async () => {
    if (pullY > 50 && !refreshing) {
      setRefreshing(true);
      try {
        const res = await fetch("/api/receipts?limit=100");
        if (res.ok) {
          const data = await res.json();
          setReceipts(data.receipts?.map((r: any) => ({
            _id: String(r._id), merchant: r.merchant || "ไม่ระบุ", amount: r.amount || 0,
            category: r.category || "", categoryIcon: r.categoryIcon || "📦",
            direction: r.direction || "expense", paymentMethod: r.paymentMethod || "",
            date: r.date ? new Date(r.date).toLocaleDateString("th-TH", { day: "numeric", month: "short" }) : "",
            rawDate: r.date || "", time: r.time || "", status: r.status || "pending",
            source: r.source || "web", hasImage: !!r.imageHash, note: r.note || "",
            type: r.type || "receipt", documentNumber: r.documentNumber || "",
          })) || []);
        }
      } catch {} finally { setRefreshing(false); }
    }
    setPullY(0);
  };

  // Polling every 5s
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch("/api/receipts/poll");
        if (res.ok) {
          const { count, latestId } = await res.json();
          if (count !== receipts.length || (latestId && latestId !== receipts[0]?._id)) {
            const full = await fetch("/api/receipts?limit=100");
            if (full.ok) {
              const data = await full.json();
              setReceipts(data.receipts?.map((r: any) => ({
                _id: String(r._id), merchant: r.merchant || "ไม่ระบุ", amount: r.amount || 0,
                category: r.category || "", categoryIcon: r.categoryIcon || "📦",
                direction: r.direction || "expense", paymentMethod: r.paymentMethod || "",
                date: r.date ? new Date(r.date).toLocaleDateString("th-TH", { day: "numeric", month: "short" }) : "",
                rawDate: r.date || "", time: r.time || "", status: r.status || "pending",
                source: r.source || "web", hasImage: !!r.imageHash, note: r.note || "",
                type: r.type || "receipt", documentNumber: r.documentNumber || "",
              })) || []);
            }
          }
        }
      } catch {}
    }, 5000);
    return () => clearInterval(poll);
  }, [receipts.length, receipts[0]?._id]);

  // Filters
  const filtered = receipts.filter((r) => {
    if (dirFilter !== "all" && r.direction !== dirFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.merchant.toLowerCase().includes(q) && !r.category.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const expenseCount = receipts.filter((r) => r.direction === "expense").length;
  const incomeCount = receipts.filter((r) => r.direction === "income").length;
  const pendingCount = receipts.filter((r) => r.status === "pending").length;
  const confirmedCount = receipts.filter((r) => r.status === "confirmed").length;
  const totalAmount = receipts.reduce((s, r) => s + (r.direction === "income" ? r.amount : -r.amount), 0);

  // Edit
  const openEdit = (r: any) => {
    setEditForm({ ...r });
    setEditItems([{ name: r.merchant || "", qty: 1, price: r.amount || 0 }]);
    setVatEnabled(false); setVatInclusive(false);
    setWhtEnabled(false); setWhtInclusive(false);
    setEditId(r._id);
  };
  // Add new receipt manually
  const openNew = () => {
    setEditForm({
      merchant: "", amount: 0, category: "", categoryIcon: "📦",
      direction: "expense", paymentMethod: "", date: "", rawDate: new Date().toISOString(),
      time: "", status: "pending", source: "manual", hasImage: false, note: "",
      type: "receipt", documentNumber: "",
    });
    setEditItems([{ name: "", qty: 1, price: 0 }]);
    setVatEnabled(false); setVatInclusive(false);
    setWhtEnabled(false); setWhtInclusive(false);
    setEditId("new");
  };
  const saveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    try {
      const itemsTotal = editItems.reduce((s, it) => s + it.qty * it.price, 0);
      const finalAmount = itemsTotal > 0 ? itemsTotal : Number(editForm.amount);
      const payload = {
        merchant: editForm.merchant, amount: finalAmount,
        category: editForm.category, categoryIcon: editForm.categoryIcon,
        status: editForm.status, direction: editForm.direction,
        paymentMethod: editForm.paymentMethod, time: editForm.time,
        date: editForm.rawDate || new Date().toISOString(),
        note: editForm.note, type: editForm.type,
        documentNumber: editForm.documentNumber, merchantTaxId: editForm.merchantTaxId,
        lineItems: editItems.length > 1 || editItems[0]?.name ? editItems : undefined,
        vat: vatEnabled ? (vatInclusive ? Math.round(itemsTotal * 7 / 107) : Math.round(itemsTotal * 0.07)) : undefined,
        wht: whtEnabled ? (whtInclusive ? Math.round(itemsTotal * 3 / 103) : Math.round(itemsTotal * 0.03)) : undefined,
      };
      if (editId === "new") {
        // Create new receipt
        const res = await fetch("/api/receipts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          const newR = {
            _id: String(created._id || created.id), merchant: editForm.merchant || "ไม่ระบุ", amount: finalAmount,
            category: editForm.category || "", categoryIcon: editForm.categoryIcon || "📦",
            direction: editForm.direction || "expense", paymentMethod: editForm.paymentMethod || "",
            date: editForm.rawDate ? new Date(editForm.rawDate).toLocaleDateString("th-TH", { day: "numeric", month: "short" }) : "",
            rawDate: editForm.rawDate || "", time: editForm.time || "", status: editForm.status || "pending",
            source: "manual", hasImage: false, note: editForm.note || "",
            type: editForm.type || "receipt", documentNumber: editForm.documentNumber || "",
          };
          setReceipts((prev) => [newR, ...prev]);
          setEditId(null);
        }
      } else {
        // Update existing receipt
        const res = await fetch(`/api/receipts/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setReceipts((prev) => prev.map((r) => r._id === editId ? { ...r, ...editForm, amount: finalAmount } : r));
          setEditId(null);
        }
      }
    } catch {} finally { setSaving(false); }
  };

  // Delete
  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/receipts/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setReceipts((prev) => prev.filter((r) => r._id !== deleteId));
        setDeleteId(null);
        if (editId === deleteId) setEditId(null);
      }
    } catch {}
  };

  const savingsCount = receipts.filter((r) => r.direction === "savings").length;
  const dirTabs: { key: string; label: string; activeClass: string }[] = [
    { key: "all", label: `ทั้งหมด (${receipts.length})`, activeClass: "bg-[#FA3633] text-white" },
    { key: "expense", label: `จ่าย (${expenseCount})`, activeClass: "bg-red-500 text-white" },
    { key: "income", label: `รับ (${incomeCount})`, activeClass: "bg-green-500 text-white" },
    { key: "savings", label: `ออม (${savingsCount})`, activeClass: "bg-pink-500 text-white" },
  ];

  return (
    <div ref={scrollRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} className="space-y-3 pt-3">
      {/* Pull-to-refresh indicator */}
      {(pullY > 0 || refreshing) && (
        <div className="flex items-center justify-center py-2 -mt-2" style={{ height: refreshing ? 40 : pullY * 0.5 }}>
          <RefreshCw size={18} className={`${refreshing ? "animate-spin" : ""} ${isDark ? "text-white/40" : "text-gray-400"}`} />
          {!refreshing && pullY > 50 && <span className={`text-[10px] ml-2 ${isDark ? "text-white/40" : "text-gray-400"}`}>ปล่อยเพื่อรีเฟรช</span>}
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xl font-bold ${txt}`}>ใบเสร็จ</p>
          <p className={`text-xs ${muted}`}>{receipts.length} รายการ · ยอดรวม <span className={totalAmount >= 0 ? "text-green-500" : "text-red-500"}>{totalAmount >= 0 ? "+" : ""}฿{fmt(Math.abs(totalAmount))}</span></p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${muted}`} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาร้านค้า, หมวดหมู่..."
          className={`w-full h-11 pl-10 pr-4 rounded-xl text-sm ${isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/30" : "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"} border focus:outline-none focus:border-[#FA3633]/50`} />
      </div>

      {/* Direction filter */}
      <div className={`flex p-1 rounded-xl ${isDark ? "bg-white/5" : "bg-gray-100"}`}>
        {dirTabs.map((t) => (
          <button key={t.key} onClick={() => setDirFilter(t.key)} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${dirFilter === t.key ? `${t.activeClass} shadow-sm` : isDark ? "text-white/40" : "text-gray-500"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Summary cards — ยอดเงินตาม tab */}
      {(() => {
        const expTotal = receipts.filter((r) => r.direction === "expense").reduce((s, r) => s + r.amount, 0);
        const incTotal = receipts.filter((r) => r.direction === "income").reduce((s, r) => s + r.amount, 0);
        const savTotal = receipts.filter((r) => r.direction === "savings").reduce((s, r) => s + r.amount, 0);
        const net = incTotal - expTotal;

        if (dirFilter === "all") return (
          <div className="grid grid-cols-3 gap-2">
            <div className={`${card} border ${border} rounded-xl p-3 text-center`}>
              <p className={`text-[10px] ${muted} mb-1`}>รายจ่าย</p>
              <p className="text-sm font-bold text-red-500">-฿{fmt(expTotal)}</p>
              <p className={`text-[10px] ${muted}`}>{expenseCount} รายการ</p>
            </div>
            <div className={`${card} border ${border} rounded-xl p-3 text-center`}>
              <p className={`text-[10px] ${muted} mb-1`}>รายรับ</p>
              <p className="text-sm font-bold text-green-500">+฿{fmt(incTotal)}</p>
              <p className={`text-[10px] ${muted}`}>{incomeCount} รายการ</p>
            </div>
            <div className={`${card} border ${border} rounded-xl p-3 text-center`}>
              <p className={`text-[10px] ${muted} mb-1`}>คงเหลือ</p>
              <p className={`text-sm font-bold ${net >= 0 ? "text-green-500" : "text-red-500"}`}>{net >= 0 ? "+" : "-"}฿{fmt(Math.abs(net))}</p>
              <p className={`text-[10px] ${muted}`}>{savingsCount > 0 ? `ออม ฿${fmt(savTotal)}` : ""}</p>
            </div>
          </div>
        );

        const dirData = dirFilter === "expense"
          ? { label: "รายจ่ายทั้งหมด", total: expTotal, count: expenseCount, color: "text-red-500", prefix: "-", bg: isDark ? "bg-red-500/5 border-red-500/10" : "bg-red-50 border-red-100" }
          : dirFilter === "income"
          ? { label: "รายรับทั้งหมด", total: incTotal, count: incomeCount, color: "text-green-500", prefix: "+", bg: isDark ? "bg-green-500/5 border-green-500/10" : "bg-green-50 border-green-100" }
          : { label: "เงินออมทั้งหมด", total: savTotal, count: savingsCount, color: "text-pink-500", prefix: "", bg: isDark ? "bg-pink-500/5 border-pink-500/10" : "bg-pink-50 border-pink-100" };

        return (
          <div className={`rounded-xl border p-4 flex items-center justify-between ${dirData.bg}`}>
            <div>
              <p className={`text-xs ${muted}`}>{dirData.label}</p>
              <p className={`text-xl font-extrabold ${dirData.color}`}>{dirData.prefix}฿{fmt(dirData.total)}</p>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${txt}`}>{dirData.count}</p>
              <p className={`text-xs ${muted}`}>รายการ</p>
            </div>
          </div>
        );
      })()}

      {/* Status pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[{ key: "all", text: "ทั้งหมด", count: receipts.length }, ...ALL_STATUSES.map((s) => ({ key: s, text: STATUS_MAP[s].text, count: receipts.filter((r) => r.status === s).length }))].filter((s) => s.count > 0).map((s) => (
          <button key={s.key} onClick={() => setStatusFilter(statusFilter === s.key ? "all" : s.key)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${statusFilter === s.key ? "bg-[#FA3633] text-white" : isDark ? "bg-white/5 text-white/50" : "bg-gray-100 text-gray-500"}`}>
            {s.text} {s.count}
          </button>
        ))}
      </div>

      {/* Receipt list */}
      <div className="space-y-2.5">
        {filtered.map((r) => {
          const st = STATUS_MAP[r.status] || STATUS_MAP.pending;
          return (
            <div key={r._id} className={`${card} border ${border} rounded-2xl active:scale-[0.98] transition-transform`} onClick={() => openEdit(r)}>
              <div className="px-4 py-3.5 flex items-center gap-3">
                {/* Icon */}
                {r.hasImage ? (
                  <button onClick={(e) => { e.stopPropagation(); setLightbox(`/api/receipts/image?id=${r._id}`); }} className="shrink-0">
                    <img src={`/api/receipts/image?id=${r._id}`} alt="" loading="lazy" className="w-12 h-12 rounded-xl object-cover" />
                  </button>
                ) : (
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${isDark ? "bg-white/5" : "bg-gray-50"}`}>{r.categoryIcon || "📦"}</div>
                )}
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${txt} truncate`}>{r.merchant}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-xs ${sub}`}>{r.date}{r.time ? ` · ${r.time}` : ""}</span>
                    {r.source === "line" && <BrandIcon brand="line" size={12} />}
                  </div>
                  <div className="mt-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${st.cls}`}>{st.text}</span>
                  </div>
                </div>
                {/* Amount */}
                <div className="text-right shrink-0">
                  <p className={`text-base font-bold ${r.direction === "income" ? "text-green-500" : r.direction === "savings" ? "text-pink-500" : "text-red-500"}`}>
                    {r.direction === "income" ? "+" : r.direction === "savings" ? "" : "-"}฿{fmt(r.amount)}
                  </p>
                  <p className={`text-[11px] ${muted} mt-0.5`}>{r.category}</p>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <EmptyState isDark={isDark} />}
      </div>

      {/* FAB — add new receipt manually */}
      <button onClick={openNew} className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-[#FA3633] text-white shadow-lg shadow-[#FA3633]/30 flex items-center justify-center active:scale-90 transition-transform" aria-label="เพิ่มใบเสร็จ">
        <Plus size={24} />
      </button>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white"><X size={20} /></button>
          <img src={lightbox} alt="ใบเสร็จ" className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Edit — fullscreen page (mirrors desktop panel) */}
      {editId && (() => {
        const CATS_EXP = [
          { icon: "🍜", name: "อาหาร" }, { icon: "🚗", name: "เดินทาง" }, { icon: "🛒", name: "ช็อปปิ้ง" },
          { icon: "💡", name: "สาธารณูปโภค" }, { icon: "🏠", name: "ของใช้ในบ้าน" }, { icon: "🏥", name: "สุขภาพ" },
          { icon: "📚", name: "การศึกษา" }, { icon: "🎬", name: "บันเทิง" }, { icon: "🏨", name: "ที่พัก" },
          { icon: "💼", name: "ธุรกิจ" }, { icon: "📦", name: "อื่นๆ" },
        ];
        const CATS_INC = [
          { icon: "💰", name: "เงินเดือน" }, { icon: "💻", name: "ฟรีแลนซ์" }, { icon: "🛍️", name: "ขายของ" },
          { icon: "📈", name: "ลงทุน" }, { icon: "🎁", name: "โบนัส" }, { icon: "↩️", name: "คืนเงิน" }, { icon: "📋", name: "อื่นๆ" },
        ];
        const CATS_SAV = [
          { icon: "✈️", name: "ท่องเที่ยว" }, { icon: "🛡️", name: "กองทุนฉุกเฉิน" }, { icon: "🏡", name: "บ้าน/รถ" },
          { icon: "🌴", name: "เกษียณ" }, { icon: "🐷", name: "เงินออม" }, { icon: "📋", name: "อื่นๆ" },
        ];
        const PM_OPTIONS = [
          { value: "promptpay", label: "พร้อมเพย์" }, { value: "cash", label: "เงินสด" }, { value: "transfer", label: "โอนเงิน" },
          { value: "credit", label: "บัตรเครดิต" }, { value: "debit", label: "บัตรเดบิต" },
          { value: "bank-scb", label: "SCB" }, { value: "bank-kbank", label: "KBank" }, { value: "bank-bbl", label: "BBL" },
          { value: "bank-ktb", label: "KTB" }, { value: "bank-bay", label: "BAY" }, { value: "bank-tmb", label: "TTB" },
          { value: "ewallet-truemoney", label: "TrueMoney" },
        ];
        const cats = editForm.direction === "income" ? CATS_INC : editForm.direction === "savings" ? CATS_SAV : CATS_EXP;
        const dirColor: Record<string, string> = { expense: "bg-red-500 text-white", income: "bg-green-500 text-white", savings: "bg-pink-500 text-white" };
        const dirInactive = isDark ? "text-white/50 hover:text-white/70" : "text-gray-400";
        const section = `rounded-xl ${isDark ? "bg-white/[0.03] border border-white/10" : "bg-white border border-gray-200"} p-4 space-y-3`;
        const lbl = `block text-xs ${isDark ? "text-white/40" : "text-gray-400"} mb-1`;
        const field = `w-full h-10 px-3 ${isDark ? "bg-white/5 border border-white/10 text-white" : "bg-gray-50 border border-gray-200 text-gray-900"} rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`;
        const itemsTotal = editItems.reduce((s, it) => s + it.qty * it.price, 0);
        const vatAmount = vatEnabled ? (vatInclusive ? Math.round(itemsTotal * 7 / 107) : Math.round(itemsTotal * 0.07)) : 0;
        const whtAmount = whtEnabled ? (whtInclusive ? Math.round(itemsTotal * 3 / 103) : Math.round(itemsTotal * 0.03)) : 0;
        const grandTotal = (() => { let t = itemsTotal; if (vatEnabled && !vatInclusive) t += vatAmount; if (whtEnabled && !whtInclusive) t -= whtAmount; return t; })();
        const displayTotal = grandTotal > 0 ? grandTotal : (Number(editForm.amount) || 0);
        const chipActive = (active: boolean, color = "bg-[#FA3633] text-white") => active ? color : isDark ? "bg-white/5 text-white/60" : "bg-gray-50 text-gray-600 border border-gray-200";
        const toggleCls = (on: boolean) => `w-11 h-6 rounded-full transition-colors relative ${on ? "bg-[#FA3633]" : isDark ? "bg-white/10" : "bg-gray-300"}`;
        const toggleDot = (on: boolean) => `w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${on ? "translate-x-[22px]" : "translate-x-0.5"}`;

        return (
          <div className={`fixed inset-0 z-[90] ${isDark ? "bg-[#0a0a0a]" : "bg-gray-50"} overflow-y-auto`}>
            {/* Header */}
            <div className={`sticky top-0 z-10 flex items-center justify-between px-4 h-12 backdrop-blur-xl ${isDark ? "bg-[#0a0a0a]/95 border-b border-white/[0.06]" : "bg-white/95 border-b border-gray-200"}`}>
              <button onClick={() => setEditId(null)} className={`flex items-center gap-1 text-sm font-medium ${txt}`}>
                <ChevronDown size={18} className="rotate-90" /> กลับ
              </button>
              <p className={`text-sm font-bold ${txt}`}>{editId === "new" ? "เพิ่มใบเสร็จ" : "แก้ไขใบเสร็จ"}</p>
              {editId !== "new" ? (
                <button onClick={() => setDeleteId(editId)} className="p-1.5 rounded-lg bg-red-500/10 text-red-500"><Trash2 size={16} /></button>
              ) : <div className="w-8" />}
            </div>

            <div className="px-4 py-4 space-y-4 pb-24">
              {/* Image */}
              {editForm.hasImage && (
                <div className={`relative rounded-xl overflow-hidden ${isDark ? "bg-white/5 border border-white/10" : "bg-white border border-gray-200"}`}>
                  <img src={`/api/receipts/image?id=${editId}`} alt="" className="w-full max-h-48 object-contain" />
                  <button onClick={() => setLightbox(`/api/receipts/image?id=${editId}`)} className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg text-[10px] font-medium bg-black/50 text-white backdrop-blur-sm">ดูเต็มจอ</button>
                </div>
              )}

              {/* Direction toggle */}
              <div className={`flex p-1 rounded-xl ${isDark ? "bg-white/5" : "bg-gray-100"}`}>
                {(["expense", "income", "savings"] as const).map((d) => (
                  <button key={d} onClick={() => setEditForm({ ...editForm, direction: d })}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${editForm.direction === d ? dirColor[d] + " shadow-sm" : dirInactive}`}>
                    {d === "expense" ? "รายจ่าย" : d === "income" ? "รายรับ" : "เงินออม"}
                  </button>
                ))}
              </div>

              {/* ═══ EXPENSE ═══ */}
              {editForm.direction === "expense" && (<>
                <div className={section}>
                  <p className={`text-xs font-semibold ${isDark ? "text-white/50" : "text-gray-400"}`}>ข้อมูลรายจ่าย</p>
                  <div><label className={lbl}>ร้านค้า</label><input value={editForm.merchant || ""} onChange={(e) => setEditForm({ ...editForm, merchant: e.target.value })} className={field} placeholder="ชื่อร้านค้า..." /></div>
                  <div><label className={lbl}>หมายเหตุ</label><textarea rows={2} value={editForm.note || ""} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} placeholder="รายละเอียดเพิ่มเติม..." className={`${field} h-auto py-2`} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={lbl}>วันที่</label><input type="date" value={editForm.rawDate ? new Date(editForm.rawDate).toISOString().slice(0, 10) : ""} onChange={(e) => setEditForm({ ...editForm, rawDate: e.target.value })} className={field} /></div>
                    <div><label className={lbl}>เวลา</label><input type="time" value={editForm.time || ""} onChange={(e) => setEditForm({ ...editForm, time: e.target.value })} className={field} /></div>
                  </div>
                  <div><label className={lbl}>ประเภทเอกสาร</label>
                    <Select value={editForm.type || "receipt"} onChange={(v) => setEditForm({ ...editForm, type: v })} searchable={false} options={[
                      { value: "receipt", label: "ใบเสร็จ" }, { value: "invoice", label: "ใบแจ้งหนี้" }, { value: "billing", label: "บิล" }, { value: "debit_note", label: "ใบลดหนี้" }, { value: "credit_note", label: "ใบเพิ่มหนี้" },
                    ]} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={lbl}>เลขที่เอกสาร</label><input value={editForm.documentNumber || ""} onChange={(e) => setEditForm({ ...editForm, documentNumber: e.target.value })} placeholder="RCP-2026-0001" className={field} /></div>
                    <div><label className={lbl}>เลขผู้เสียภาษี</label><input value={editForm.merchantTaxId || ""} onChange={(e) => setEditForm({ ...editForm, merchantTaxId: e.target.value })} placeholder="0107536000269" className={field} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={lbl}>หมวดหมู่</label>
                      <Select value={editForm.category || ""} onChange={(v) => { const c = cats.find((x) => x.name === v); setEditForm({ ...editForm, category: v, categoryIcon: c?.icon || "📦" }); }} placeholder="เลือกหมวดหมู่" options={cats.map((c) => ({ value: c.name, label: `${c.icon} ${c.name}` }))} />
                    </div>
                    <div><label className={lbl}>สถานะ</label>
                      <Select value={editForm.status || "pending"} onChange={(v) => setEditForm({ ...editForm, status: v })} searchable={false} options={ALL_STATUSES.map((s) => ({ value: s, label: STATUS_MAP[s].text }))} />
                    </div>
                  </div>
                  <div><label className={lbl}>วิธีจ่าย</label>
                    <Select value={editForm.paymentMethod || ""} onChange={(v) => setEditForm({ ...editForm, paymentMethod: v })} placeholder="เลือกวิธีจ่าย" options={PM_OPTIONS.map((pm) => ({ value: pm.value, label: pm.label }))} />
                  </div>
                </div>
                {/* Line items */}
                <div className={section}>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-semibold ${isDark ? "text-white/50" : "text-gray-400"}`}>รายการสินค้า/บริการ</p>
                    <button onClick={() => setEditItems([...editItems, { name: "", qty: 1, price: 0 }])} className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-green-500/10 text-green-400">+ เพิ่ม</button>
                  </div>
                  {editItems.map((item, i) => (
                    <div key={i} className={`rounded-lg ${isDark ? "bg-white/[0.03] border border-white/10" : "bg-gray-50 border border-gray-200"} p-3 space-y-2`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-medium ${muted}`}>#{i + 1}</span>
                        {editItems.length > 1 && <button onClick={() => setEditItems(editItems.filter((_, j) => j !== i))} className="text-red-400"><Trash2 size={12} /></button>}
                      </div>
                      <input value={item.name} onChange={(e) => { const n = [...editItems]; n[i] = { ...n[i], name: e.target.value }; setEditItems(n); }} placeholder="ชื่อรายการ" className={`${field} h-8 text-xs`} />
                      <div className="grid grid-cols-3 gap-2">
                        <div><label className={`block text-[10px] ${muted} mb-0.5`}>จำนวน</label><input type="number" value={item.qty} min={1} onChange={(e) => { const n = [...editItems]; n[i] = { ...n[i], qty: Math.max(1, Number(e.target.value)) }; setEditItems(n); }} className={`${field} h-8 text-xs text-center`} /></div>
                        <div><label className={`block text-[10px] ${muted} mb-0.5`}>ราคา</label><input type="number" value={item.price || ""} onChange={(e) => { const n = [...editItems]; n[i] = { ...n[i], price: Number(e.target.value) }; setEditItems(n); }} placeholder="0" className={`${field} h-8 text-xs text-right`} /></div>
                        <div className="flex items-end justify-end"><span className={`text-xs font-medium ${txt} pb-1.5`}>฿{(item.qty * item.price).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span></div>
                      </div>
                    </div>
                  ))}
                  <div className={`border-t pt-3 flex justify-between text-sm ${isDark ? "border-white/10" : "border-gray-200"}`}>
                    <span className={sub}>รวม ({editItems.length} รายการ)</span>
                    <span className={`font-medium ${txt}`}>฿{itemsTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </>)}

              {/* ═══ INCOME ═══ */}
              {editForm.direction === "income" && (<>
                <div className={section}>
                  <p className="text-xs font-semibold text-green-500/70">ข้อมูลรายรับ</p>
                  <div><label className={lbl}>แหล่งที่มา</label><input value={editForm.merchant || ""} onChange={(e) => setEditForm({ ...editForm, merchant: e.target.value })} placeholder="เช่น บริษัท ABC, ลูกค้า" className={field} /></div>
                  <div><label className={lbl}>จำนวนเงินที่ได้รับ (฿)</label><input type="number" inputMode="decimal" value={editForm.amount || ""} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} className={`${field} text-lg font-bold`} placeholder="0.00" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={lbl}>วันที่</label><input type="date" value={editForm.rawDate ? new Date(editForm.rawDate).toISOString().slice(0, 10) : ""} onChange={(e) => setEditForm({ ...editForm, rawDate: e.target.value })} className={field} /></div>
                    <div><label className={lbl}>เวลา</label><input type="time" value={editForm.time || ""} onChange={(e) => setEditForm({ ...editForm, time: e.target.value })} className={field} /></div>
                  </div>
                  <div><label className={lbl}>หมายเหตุ</label><textarea rows={2} value={editForm.note || ""} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} placeholder="รายละเอียดเพิ่มเติม..." className={`${field} h-auto py-2`} /></div>
                </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={lbl}>หมวดรายรับ</label>
                      <Select value={editForm.category || ""} onChange={(v) => { const c = cats.find((x) => x.name === v); setEditForm({ ...editForm, category: v, categoryIcon: c?.icon || "📋" }); }} placeholder="เลือกหมวด" options={cats.map((c) => ({ value: c.name, label: `${c.icon} ${c.name}` }))} />
                    </div>
                    <div><label className={lbl}>วิธีรับเงิน</label>
                      <Select value={editForm.paymentMethod || ""} onChange={(v) => setEditForm({ ...editForm, paymentMethod: v })} placeholder="เลือกวิธีรับ" options={PM_OPTIONS.map((pm) => ({ value: pm.value, label: pm.label }))} />
                    </div>
                  </div>
              </>)}

              {/* ═══ SAVINGS ═══ */}
              {editForm.direction === "savings" && (<>
                <div className={section}>
                  <p className="text-xs font-semibold text-pink-400/70">บันทึกเงินออม</p>
                  <div><label className={lbl}>เป้าหมาย</label><input value={editForm.merchant || ""} onChange={(e) => setEditForm({ ...editForm, merchant: e.target.value })} placeholder="เช่น ท่องเที่ยวญี่ปุ่น, MacBook Pro" className={field} /></div>
                  <div><label className={lbl}>จำนวนที่ออม (฿)</label><input type="number" inputMode="decimal" value={editForm.amount || ""} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} className={`${field} text-lg font-bold`} placeholder="0.00" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={lbl}>วันที่ออม</label><input type="date" value={editForm.rawDate ? new Date(editForm.rawDate).toISOString().slice(0, 10) : ""} onChange={(e) => setEditForm({ ...editForm, rawDate: e.target.value })} className={field} /></div>
                    <div><label className={lbl}>วิธีออม</label>
                      <Select value={editForm.paymentMethod || "transfer"} onChange={(v) => setEditForm({ ...editForm, paymentMethod: v })} searchable={false} options={[
                        { value: "transfer", label: "โอนเข้าบัญชีออม" }, { value: "cash", label: "หยอดกระปุก" }, { value: "debit", label: "ตัดบัตรอัตโนมัติ" }, { value: "other", label: "อื่นๆ" },
                      ]} />
                    </div>
                  </div>
                  <div><label className={lbl}>หมวดออม</label>
                    <Select value={editForm.category || ""} onChange={(v) => { const c = cats.find((x) => x.name === v); setEditForm({ ...editForm, category: v, categoryIcon: c?.icon || "📋" }); }} placeholder="เลือกหมวด" options={cats.map((c) => ({ value: c.name, label: `${c.icon} ${c.name}` }))} />
                  </div>
                  <div><label className={lbl}>หมายเหตุ</label><textarea rows={2} value={editForm.note || ""} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} placeholder="เช่น ออมจากเงินทอน, โบนัส..." className={`${field} h-auto py-2`} /></div>
                </div>
              </>)}

              {/* ═══ VAT / WHT ═══ */}
              {(editForm.direction === "expense" || editForm.direction === "income") && (
                <div className={section}>
                  <p className={`text-xs font-semibold ${isDark ? "text-white/50" : "text-gray-400"}`}>ภาษี</p>
                  {/* VAT */}
                  <div className="flex items-center justify-between py-1">
                    <div><p className={`text-sm ${txt}`}>VAT 7%</p><p className={`text-[10px] ${muted}`}>ภาษีมูลค่าเพิ่ม</p></div>
                    <button onClick={() => { setVatEnabled(!vatEnabled); if (vatEnabled) setVatInclusive(false); }} className={toggleCls(vatEnabled)}><div className={toggleDot(vatEnabled)} /></button>
                  </div>
                  {vatEnabled && (
                    <>
                      <div className="flex gap-2">
                        <button onClick={() => setVatInclusive(false)} className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${!vatInclusive ? "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30" : isDark ? "bg-white/5 text-white/40" : "bg-gray-100 text-gray-400"}`}>บวกเพิ่ม (+7%)</button>
                        <button onClick={() => setVatInclusive(true)} className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${vatInclusive ? "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30" : isDark ? "bg-white/5 text-white/40" : "bg-gray-100 text-gray-400"}`}>รวมในยอดแล้ว</button>
                      </div>
                      <div className="flex justify-between text-sm"><span className={sub}>VAT 7%{vatInclusive ? " (แยกจากยอด)" : ""}</span><span className="text-blue-400 font-medium">{vatInclusive ? "" : "+"}฿{vatAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span></div>
                    </>
                  )}
                  {/* WHT */}
                  <div className="flex items-center justify-between py-1">
                    <div><p className={`text-sm ${txt}`}>WHT 3%</p><p className={`text-[10px] ${muted}`}>ภาษีหัก ณ ที่จ่าย</p></div>
                    <button onClick={() => { setWhtEnabled(!whtEnabled); if (whtEnabled) setWhtInclusive(false); }} className={toggleCls(whtEnabled)}><div className={toggleDot(whtEnabled)} /></button>
                  </div>
                  {whtEnabled && (
                    <>
                      <div className="flex gap-2">
                        <button onClick={() => setWhtInclusive(false)} className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${!whtInclusive ? "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30" : isDark ? "bg-white/5 text-white/40" : "bg-gray-100 text-gray-400"}`}>หักเพิ่ม (-3%)</button>
                        <button onClick={() => setWhtInclusive(true)} className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${whtInclusive ? "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30" : isDark ? "bg-white/5 text-white/40" : "bg-gray-100 text-gray-400"}`}>รวมในยอดแล้ว</button>
                      </div>
                      <div className="flex justify-between text-sm"><span className={sub}>WHT 3%{whtInclusive ? " (แยกจากยอด)" : ""}</span><span className="text-orange-400 font-medium">{whtInclusive ? "" : "-"}฿{whtAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span></div>
                    </>
                  )}
                </div>
              )}

              {/* Grand total */}
              <div className={`rounded-xl p-4 ${editForm.direction === "income" ? "bg-green-500/10 border border-green-500/20" : editForm.direction === "savings" ? "bg-pink-500/10 border border-pink-500/20" : "bg-[#FA3633]/10 border border-[#FA3633]/20"}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${txt}`}>{editForm.direction === "income" ? "ยอดรับ" : editForm.direction === "savings" ? "ออมครั้งนี้" : "ยอดสุทธิ"}</span>
                  <span className={`text-2xl font-extrabold ${txt}`}>฿{displayTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
                </div>
                {(vatEnabled || whtEnabled) && (
                  <p className={`text-[11px] ${muted} mt-1`}>
                    สินค้า ฿{itemsTotal.toLocaleString()}
                    {vatEnabled && !vatInclusive ? ` + VAT ฿${vatAmount.toLocaleString()}` : ""}
                    {vatEnabled && vatInclusive ? ` (รวม VAT ฿${vatAmount.toLocaleString()})` : ""}
                    {whtEnabled ? ` - WHT ฿${whtAmount.toLocaleString()}` : ""}
                  </p>
                )}
              </div>
            </div>

            {/* Sticky save + cancel */}
            <div className={`fixed bottom-0 left-0 right-0 px-4 py-3 flex gap-3 ${isDark ? "bg-[#0a0a0a]/95 border-t border-white/[0.06]" : "bg-white/95 border-t border-gray-200"} backdrop-blur-xl`} style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}>
              <button onClick={saveEdit} disabled={saving} className="flex-1 py-3.5 rounded-xl bg-[#FA3633] text-white text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.97] disabled:opacity-50">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} บันทึก
              </button>
              <button onClick={() => setEditId(null)} className={`py-3.5 px-6 rounded-xl text-sm font-medium ${isDark ? "bg-white/5 text-white/60" : "bg-gray-100 text-gray-500"}`}>ยกเลิก</button>
            </div>
          </div>
        );
      })()}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setDeleteId(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className={`relative mx-6 p-5 rounded-2xl ${isDark ? "bg-[#1a1a1a]" : "bg-white"} shadow-2xl`} onClick={(e) => e.stopPropagation()}>
            <Trash2 size={28} className="text-red-500 mx-auto mb-3" />
            <p className={`text-base font-bold ${txt} text-center mb-1`}>ลบใบเสร็จ?</p>
            <p className={`text-xs ${sub} text-center mb-4`}>รายการนี้จะถูกลบถาวร ไม่สามารถกู้คืนได้</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setDeleteId(null)} className={`py-2.5 rounded-xl text-sm font-medium ${card} border ${border} ${txt}`}>ยกเลิก</button>
              <button onClick={confirmDelete} className="py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white">ลบเลย</button>
            </div>
          </div>
        </div>
      )}
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
      const json = await res.json();
      if (res.ok && json.receipt) {
        // Pass all info: receipt, data (OCR details), duplicate flag
        setResult({
          ...json.receipt,
          merchant: json.data?.merchant,
          amount: json.data?.amount || 0,
          category: json.data?.category,
          categoryIcon: json.data?.categoryIcon,
          direction: json.data?.direction || (json.data?.amount < 0 ? "income" : "expense"),
          date: json.data?.date,
          time: json.data?.time,
          paymentMethod: json.data?.paymentMethod,
          ocrConfidence: json.data?.ocrConfidence,
          duplicate: json.duplicate || false,
          duplicateInfo: json.duplicateInfo || "",
        });
      } else {
        setError(json.error || "ไม่สามารถอ่านใบเสร็จได้");
      }
    } catch { setError("เกิดข้อผิดพลาด"); } finally { setUploading(false); }
  };
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; };
  const reset = () => { setPreview(null); setResult(null); setError(""); };

  // Determine result type
  const isDuplicate = result?.duplicate;
  const isLowConfidence = result && (result.ocrConfidence <= 10 || result.amount === 0);

  return (
    <div className="space-y-4 pt-3">
      <p className={`text-lg font-bold ${txt}`}>สแกนใบเสร็จ</p>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleInput} className="hidden" />
      <input ref={galleryRef} type="file" accept="image/*" onChange={handleInput} className="hidden" />

      {result ? (
        <div className="space-y-3">
          {/* Duplicate warning */}
          {isDuplicate && (
            <div className={`rounded-xl border p-3 ${isDark ? "bg-amber-500/5 border-amber-500/20" : "bg-amber-50 border-amber-200"}`}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={16} className="text-amber-500" />
                <span className={`text-xs font-semibold ${isDark ? "text-amber-400" : "text-amber-700"}`}>พบสลิปซ้ำ!</span>
              </div>
              <p className={`text-[11px] ${isDark ? "text-amber-400/70" : "text-amber-600"}`}>{result.duplicateInfo}</p>
              <p className={`text-[10px] ${muted} mt-1`}>บันทึกแล้วเป็นสถานะ "ซ้ำ" — ตรวจสอบได้ที่หน้าใบเสร็จ</p>
            </div>
          )}

          {/* Low confidence / not a receipt warning */}
          {isLowConfidence && !isDuplicate && (
            <div className={`rounded-xl border p-3 ${isDark ? "bg-orange-500/5 border-orange-500/20" : "bg-orange-50 border-orange-200"}`}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={16} className="text-orange-500" />
                <span className={`text-xs font-semibold ${isDark ? "text-orange-400" : "text-orange-700"}`}>อาจไม่ใช่ใบเสร็จ</span>
              </div>
              <p className={`text-[10px] ${isDark ? "text-orange-400/70" : "text-orange-600"}`}>AI ไม่มั่นใจว่าเป็นใบเสร็จ/สลิป — บันทึกแล้วเป็น "รอตรวจสอบ" กรุณาตรวจสอบและแก้ไขข้อมูล</p>
            </div>
          )}

          {/* Success card */}
          <div className={`${card} border ${isDuplicate ? "border-amber-500/20" : isLowConfidence ? "border-orange-500/20" : "border-green-500/20"} rounded-2xl p-5 space-y-4`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDuplicate ? "bg-amber-500/10" : isLowConfidence ? "bg-orange-500/10" : "bg-green-500/10"}`}>
                {isDuplicate ? <AlertTriangle size={20} className="text-amber-500" /> : isLowConfidence ? <AlertTriangle size={20} className="text-orange-500" /> : <Check size={20} className="text-green-500" />}
              </div>
              <div>
                <p className={`text-base font-bold ${txt}`}>{isDuplicate ? "บันทึกแล้ว (ซ้ำ)" : isLowConfidence ? "บันทึกแล้ว (รอตรวจ)" : "บันทึกสำเร็จ!"}</p>
                <p className={`text-xs ${sub}`}>{result.merchant || "ไม่ระบุร้านค้า"}</p>
              </div>
            </div>

            {/* Receipt details */}
            <div className={`rounded-xl p-3 space-y-2 ${isDark ? "bg-white/[0.03]" : "bg-gray-50"}`}>
              <div className="flex justify-between">
                <span className={`text-xs ${sub}`}>จำนวนเงิน</span>
                <Baht value={result.amount} direction={result.direction} className="text-lg font-bold" />
              </div>
              <div className="flex justify-between">
                <span className={`text-xs ${sub}`}>หมวดหมู่</span>
                <span className={`text-sm ${txt}`}>{result.categoryIcon} {result.category}</span>
              </div>
              {result.date && (
                <div className="flex justify-between">
                  <span className={`text-xs ${sub}`}>วันที่</span>
                  <span className={`text-xs ${txt}`}>{new Date(result.date).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}{result.time ? ` · ${result.time}` : ""}</span>
                </div>
              )}
              {result.paymentMethod && (
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${sub}`}>ช่องทาง</span>
                  <div className="flex items-center gap-1.5">
                    <BrandIcon brand={result.paymentMethod} size={16} />
                    <span className={`text-xs ${txt}`}>{PAY_LABELS[result.paymentMethod] || result.paymentMethod}</span>
                  </div>
                </div>
              )}
              <div className="flex justify-between">
                <span className={`text-xs ${sub}`}>สถานะ</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  isDuplicate ? "bg-amber-500/10 text-amber-500" : isLowConfidence ? "bg-orange-500/10 text-orange-500" : "bg-green-500/10 text-green-500"
                }`}>{isDuplicate ? "ซ้ำ" : isLowConfidence ? "รอตรวจสอบ" : "รอยืนยัน"}</span>
              </div>
            </div>

            {/* Link to desktop receipts */}
            <a href="/dashboard/receipts" target="_blank" className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium ${isDark ? "bg-white/5 text-white/60" : "bg-gray-100 text-gray-600"}`}>
              <Receipt size={14} />
              ดู/แก้ไขในหน้าใบเสร็จ ↗
            </a>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={reset} className="py-3 rounded-xl bg-[#FA3633] text-white text-sm font-semibold active:scale-[0.97]">สแกนอีก</button>
              <button onClick={onDone} className={`py-3 rounded-xl text-sm font-semibold ${card} border ${border} ${txt}`}>กลับหน้าหลัก</button>
            </div>
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
            <p className={`text-xs ${muted} mt-1`}>ตรวจซ้ำ → อ่านข้อมูล → บันทึก</p>
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
//  REPORTS TAB — full dashboard view
// ════════════════════════════════════════
function ReportsTab({ data, isDark }: { data: MobileData; isDark: boolean }) {
  const { card, border, txt, sub, muted } = useS(isDark);
  const maxMonthly = Math.max(...data.monthlyData.map((m) => Math.max(m.expense, m.income)), 1);
  const maxCat = Math.max(...data.categories.map((c: any) => c.total), 1);
  const net = data.monthIncome - data.monthExpense;
  const dailyAvg = data.daysInMonth > 0 ? Math.round(data.totalExpense / Math.min(new Date().getDate(), data.daysInMonth)) : 0;
  const avgPerReceipt = data.stats.monthReceipts > 0 ? Math.round(data.totalExpense / data.stats.monthReceipts) : 0;
  const budgetPct = data.profile.monthlyBudget > 0 ? Math.min(100, (data.totalExpense / data.profile.monthlyBudget) * 100) : 0;

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

      {/* Stats cards — expense red, income green */}
      <div className="grid grid-cols-2 gap-3">
        <StatsCard label="รายจ่ายเดือนนี้" value={`-฿${fmt(data.totalExpense)}`} icon={<ArrowUpRight size={18} className="text-red-500" />} />
        <StatsCard label="รายรับเดือนนี้" value={`+฿${fmt(data.monthIncome)}`} icon={<ArrowDownLeft size={18} className="text-green-500" />} />
        <StatsCard label="เฉลี่ยต่อใบ" value={`฿${fmt(avgPerReceipt)}`} icon={<Calculator size={18} />} />
        <StatsCard label="คงเหลือ" value={`${net >= 0 ? "+" : "-"}฿${fmt(Math.abs(net))}`} icon={<PiggyBank size={18} className={net >= 0 ? "text-green-500" : "text-red-500"} />} />
      </div>

      {/* Chart — balanced with Y-axis */}
      <div className={`${card} border ${border} rounded-2xl p-4`}>
        <p className={`text-xs font-semibold ${txt} mb-4`}>ภาพรวมค่าใช้จ่ายรายเดือน</p>
        {(() => {
          const niceMax = Math.ceil(maxMonthly / 1000) * 1000 || 1000;
          const yTicks = [0, 0.25, 0.5, 0.75, 1].map((p) => Math.round(niceMax * p));
          const fmtY = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`;
          return (
            <div className="flex gap-0" style={{ height: 160 }}>
              <div className="flex flex-col justify-between pr-1.5 py-0" style={{ width: 32 }}>
                {[...yTicks].reverse().map((v, i) => (
                  <span key={i} className={`text-[8px] text-right leading-none ${muted}`}>{fmtY(v)}</span>
                ))}
              </div>
              <div className="flex-1 relative">
                {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                  <div key={i} className={`absolute left-0 right-0 border-t ${isDark ? "border-white/5" : "border-gray-100"}`} style={{ top: `${(1 - p) * 100}%` }} />
                ))}
                <div className="absolute inset-0 flex items-end justify-around px-0.5 pb-5">
                  {data.monthlyData.map((m, i) => {
                    const isLast = i === data.monthlyData.length - 1;
                    const expH = niceMax > 0 ? (m.expense / niceMax) * 100 : 0;
                    const incH = niceMax > 0 ? (m.income / niceMax) * 100 : 0;
                    return (
                      <div key={m.month} className="flex flex-col items-center h-full justify-end" style={{ width: `${100 / data.monthlyData.length - 1}%` }}>
                        <div className="flex items-end gap-0.5 w-full justify-center" style={{ height: `calc(100% - 18px)` }}>
                          <div className={`rounded-t transition-all ${isLast ? "bg-red-500" : "bg-red-500/40"}`} style={{ width: 10, height: `${Math.max(m.expense > 0 ? 3 : 0, expH)}%` }} />
                          <div className={`rounded-t transition-all ${isLast ? "bg-green-500" : "bg-green-500/40"}`} style={{ width: 10, height: `${Math.max(m.income > 0 ? 3 : 0, incH)}%` }} />
                        </div>
                        <span className={`text-[9px] mt-1 font-medium ${isLast ? txt : muted}`}>{m.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
        <div className="flex justify-center gap-4 mt-2">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-red-500" /><span className={`text-[10px] ${sub}`}>รายจ่าย</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-green-500" /><span className={`text-[10px] ${sub}`}>รายรับ</span></div>
        </div>
      </div>

      {/* Goals — donut charts */}
      <div className={`${card} border ${border} rounded-2xl p-4`}>
        <p className={`text-xs font-semibold ${txt} mb-4`}>เป้าหมาย</p>
        <div className="grid grid-cols-2 gap-4">
          <DonutGoal label="เป้ารายจ่าย" current={data.monthExpense} storageKey="goal-expense" color="#EF4444" isDark={isDark} />
          <DonutGoal label="เป้ารายรับ" current={data.monthIncome} storageKey="goal-income" color="#22C55E" isDark={isDark} />
        </div>
      </div>

      {/* Month summary */}
      <div className={`${card} border ${border} rounded-2xl p-4`}>
        <p className={`text-xs font-semibold ${txt} mb-3`}>สรุปเดือนนี้</p>
        <div className="grid grid-cols-3 gap-2">
          <MiniCard label="รายจ่าย" value={`-฿${fmt(data.monthExpense)}`} color="red" isDark={isDark} />
          <MiniCard label="รายรับ" value={`+฿${fmt(data.monthIncome)}`} color="green" isDark={isDark} />
          <MiniCard label="คงเหลือ" value={`${net >= 0 ? "+" : "-"}฿${fmt(Math.abs(net))}`} color={net >= 0 ? "green" : "red"} isDark={isDark} />
        </div>
        <div className="flex gap-4 mt-3 pt-3 border-t" style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
          <div><p className={`text-[10px] ${muted}`}>เฉลี่ย/วัน</p><p className={`text-xs font-semibold text-red-500`}>-฿{fmt(dailyAvg)}</p></div>
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
            <a href="/dashboard/budget" target="_blank" className="text-[10px] text-[#FA3633] font-medium">จัดการ ↗</a>
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
                    -฿{fmt(c.total)}
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
            <a href="/dashboard/recurring" target="_blank" className="text-[10px] text-[#FA3633] font-medium">จัดการ ↗</a>
          </div>
          {recurring.filter((i) => i.active).slice(0, 5).map((item, i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold leading-none ${item.type === "income" ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500"}`}>{item.type === "income" ? "รับ" : "จ่าย"}</span>
                <span className={`text-xs ${txt}`}>{item.name}</span>
              </div>
              <span className={`text-xs font-medium ${item.type === "income" ? "text-green-500" : "text-red-500"}`}>
                {item.type === "income" ? "+" : "-"}฿{fmt(item.amount)}
                <span className={`text-[9px] ${muted} ml-0.5`}>/{item.cycle.replace("ราย", "")}</span>
              </span>
            </div>
          ))}
          {recurringTotal > 0 && (
            <div className="mt-2 pt-2 flex justify-between" style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
              <span className={`text-[10px] ${sub}`}>รายจ่ายประจำ/เดือน</span>
              <span className="text-[10px] font-semibold text-red-500">-฿{fmt(recurringTotal)}</span>
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
                    <span className="text-xs font-bold text-red-500">-฿{fmt(c.total)} <span className={`font-normal ${muted}`}>{pct}%</span></span>
                  </div>
                  <div className={`h-1.5 rounded-full ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
                    <div className="h-full rounded-full bg-red-500" style={{ width: `${(c.total / maxCat) * 100}%`, opacity: 1 - i * 0.08 }} />
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
            <a href="/dashboard/payments" target="_blank" className="text-[10px] text-[#FA3633] font-medium">ดูทั้งหมด ↗</a>
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
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? "bg-red-500 text-white" : isDark ? "bg-white/10 text-white/40" : "bg-gray-100 text-gray-400"}`}>{i + 1}</span>
              <span className={`text-xs flex-1 truncate ${txt}`}>{m.name}</span>
              <span className={`text-[10px] ${muted}`}>{m.count}x</span>
              <span className="text-xs font-bold text-red-500">-฿{fmt(m.total)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recent receipts */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className={`text-xs font-semibold ${txt}`}>ใบเสร็จล่าสุด</p>
          <a href="/dashboard/receipts" target="_blank" className="text-[10px] text-[#FA3633] font-medium">ดูทั้งหมด ({data.stats.totalReceipts}) ↗</a>
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

      <div className={`${card} border ${border} rounded-2xl p-4`}>
        <div className="flex items-end gap-2 mb-2">
          <span className={`text-3xl font-bold ${txt}`}>{s.streak}</span>
          <span className={`text-sm ${sub} mb-0.5`}>วัน {streakEmoji}</span>
        </div>
        <div className={`h-2 rounded-full ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
          <div className="h-full rounded-full bg-gradient-to-r from-[#FA3633] to-[#ff6b6b]" style={{ width: `${streakPct}%` }} />
        </div>
      </div>

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
//  DONUT GOAL
// ════════════════════════════════════════
function DonutGoal({ label, current, storageKey, color, isDark }: { label: string; current: number; storageKey: string; color: string; isDark: boolean }) {
  const { txt, sub, muted } = useS(isDark);
  const [target] = useState<number>(() => {
    try {
      const s = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
      // GoalCard saves as plain number string e.g. "50000"
      return s ? Number(s) || 0 : 0;
    } catch { return 0; }
  });

  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const overBudget = target > 0 && current > target;
  const r = 40;
  const stroke = 8;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (circumference * Math.min(pct, 100)) / 100;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 100, height: 100 }}>
        <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} strokeWidth={stroke} />
          {target > 0 && (
            <circle cx="50" cy="50" r={r} fill="none" stroke={overBudget ? "#EF4444" : color} strokeWidth={stroke} strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={dashOffset}
              style={{ transition: "stroke-dashoffset 0.8s ease" }} />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {target > 0 ? (
            <>
              <span className={`text-base font-bold ${overBudget ? "text-red-500" : txt}`}>{Math.round(pct)}%</span>
              <span className={`text-[8px] ${muted}`}>ของเป้า</span>
            </>
          ) : (
            <span className={`text-[9px] ${muted}`}>ยังไม่ตั้ง</span>
          )}
        </div>
      </div>
      <p className={`text-[11px] font-semibold mt-2 ${txt}`}>{label}</p>
      <p className={`text-[10px] ${sub}`}>฿{fmt(current)}{target > 0 ? ` / ฿${fmt(target)}` : ""}</p>
    </div>
  );
}

// ════════════════════════════════════════
//  SHARED SUB-COMPONENTS
// ════════════════════════════════════════
function ReceiptRow({ r, isDark }: { r: any; isDark: boolean }) {
  const { card, border, txt, muted } = useS(isDark);
  const isIncome = r.direction === "income";
  return (
    <div className={`${card} border ${border} rounded-xl px-3.5 py-2.5 flex items-center gap-3`}>
      {r.paymentMethod && (r.paymentMethod.startsWith("bank-") || r.paymentMethod === "promptpay") ? (
        <BrandIcon brand={r.paymentMethod} size={32} className="rounded-lg" />
      ) : (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${isDark ? "bg-white/5" : "bg-gray-50"}`}>{r.categoryIcon}</div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-[7px] px-1 py-0.5 rounded font-bold leading-none ${isIncome ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500"}`}>
            {isIncome ? "รับ" : "จ่าย"}
          </span>
          <p className={`text-[13px] font-medium ${txt} truncate`}>{r.merchant}</p>
        </div>
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
