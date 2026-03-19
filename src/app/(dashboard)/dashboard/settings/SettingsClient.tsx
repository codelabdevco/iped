"use client";

import { useState, useEffect, useCallback } from "react";
import { User, Bell, Palette, Shield, Link2, Building2, Trash2, Download, Smartphone, Monitor, Eye, FolderOpen, Plus, Pencil, AlertTriangle, Loader2 } from "lucide-react";
import Select from "@/components/dashboard/Select";
import DatePicker from "@/components/dashboard/DatePicker";
import { useTheme } from "@/contexts/ThemeContext";
import PageHeader from "@/components/dashboard/PageHeader";
import { useModal } from "@/components/dashboard/ConfirmModal";

interface Profile {
  _id: string;
  name: string;
  firstNameTh: string;
  lastNameTh: string;
  firstNameEn: string;
  lastNameEn: string;
  lineDisplayName: string;
  lineProfilePic: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: string;
  occupation: string;
  accountType: string;
  businessName: string;
  monthlyBudget: number;
  googleEmail: string;
  googleConnectedAt: string;
  settings: {
    language: string;
    currency: string;
    timezone: string;
    lineAlerts: boolean;
    emailAlerts: boolean;
    budgetWarning: number;
    dailySummary: boolean;
    dailySummaryTime: string;
    pdpaConsent: boolean;
    dataRetentionDays: number;
  };
}

const allTabs = [
  { id: "profile", label: "โปรไฟล์", icon: User, modes: ["personal", "business"] },
  { id: "company", label: "ข้อมูลบริษัท", icon: Building2, modes: ["business"] },
  { id: "notifications", label: "การแจ้งเตือน", icon: Bell, modes: ["personal", "business"] },
  { id: "connections", label: "การเชื่อมต่อ", icon: Link2, modes: ["personal", "business"] },
  { id: "categories", label: "หมวดหมู่", icon: FolderOpen, modes: ["personal", "business"] },
  { id: "preferences", label: "ตั้งค่าทั่วไป", icon: Palette, modes: ["personal", "business"] },
  { id: "security", label: "ความปลอดภัย", icon: Shield, modes: ["personal", "business"] },
  { id: "privacy", label: "ความเป็นส่วนตัว", icon: Eye, modes: ["personal", "business"] },
] as const;

type TabId = (typeof allTabs)[number]["id"];
type Mode = "personal" | "business";

interface CatStat { name: string; direction: string; count: number; total: number; }

import { ALL_CATEGORIES } from "@/lib/categories";
import BrandIcon from "@/components/dashboard/BrandIcon";
const DEFAULT_CATS = ALL_CATEGORIES.map((c) => ({ name: c.name, emoji: c.icon, color: c.color, dir: c.direction }));
const CAT_COLORS = ["#FB923C","#60A5FA","#818CF8","#F472B6","#34D399","#FBBF24","#F87171","#A78BFA","#22c55e","#ec4899","#F59E0B","#78716c"];
const DIR_LABEL: Record<string, string> = { expense: "รายจ่าย", income: "รายรับ", savings: "เงินออม" };

/* ── Controlled Toggle ── */
function Toggle({ checked, onChange, isDark }: { checked: boolean; onChange: (v: boolean) => void; isDark: boolean }) {
  return (
    <button onClick={() => onChange(!checked)} className={`w-11 h-6 rounded-full transition-colors relative ${checked ? "bg-[#FA3633]" : isDark ? "bg-white/10" : "bg-gray-300"}`}>
      <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function SettingsClient({ profile, categoryStats = [] }: { profile: Profile; categoryStats?: CatStat[] }) {
  const { isDark } = useTheme();
  const modal = useModal();
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mode, setMode] = useState<Mode>("personal");

  // ── Profile form ──
  const [form, setForm] = useState({
    name: profile.name,
    firstNameTh: profile.firstNameTh,
    lastNameTh: profile.lastNameTh,
    firstNameEn: profile.firstNameEn,
    lastNameEn: profile.lastNameEn,
    phone: profile.phone,
    occupation: profile.occupation,
    gender: profile.gender,
    birthDate: profile.birthDate,
    accountType: profile.accountType,
    businessName: profile.businessName,
    monthlyBudget: profile.monthlyBudget,
  });

  // ── Notifications state ──
  const [notif, setNotif] = useState({
    lineAlerts: profile.settings.lineAlerts,
    emailAlerts: profile.settings.emailAlerts,
    budgetWarning: profile.settings.budgetWarning > 0,
    dailySummary: profile.settings.dailySummary,
    duplicateAlerts: true,
    billReminders: true,
    weeklyReport: false,
  });

  // ── Preferences state ──
  const [prefs, setPrefs] = useState({
    currency: profile.settings.currency || "THB",
    language: profile.settings.language || "th",
    dateFormat: "th",
    timezone: profile.settings.timezone === "UTC" ? "utc" : "asia-bkk",
  });

  // ── Company form (localStorage — no backend model yet) ──
  const [company, setCompany] = useState<Record<string, string>>({
    companyName: "", taxId: "", address: "", phone: "", email: "", website: "", branch: "", businessType: "",
    vatRate: "7", whtRate: "3", fiscalYear: "jan-dec",
  });

  // ── Privacy state ──
  const [dataRetentionDays, setDataRetentionDays] = useState(String(profile.settings.dataRetentionDays || 365));
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const m = localStorage.getItem("iped-mode");
    if (m === "business") setMode("business");
    // Load company from localStorage
    try {
      const c = localStorage.getItem("iped-company");
      if (c) setCompany((prev) => ({ ...prev, ...JSON.parse(c) }));
    } catch {}
    // Listen for mode changes from sidebar
    const handleModeChange = (e: Event) => {
      const newMode = (e as CustomEvent).detail as Mode;
      setMode(newMode);
      const newTabs = allTabs.filter((t) => (t.modes as readonly string[]).includes(newMode));
      setActiveTab((prev) => newTabs.some((t) => t.id === prev) ? prev : "profile");
    };
    window.addEventListener("iped-mode-change", handleModeChange);
    return () => window.removeEventListener("iped-mode-change", handleModeChange);
  }, []);

  const toggleMode = (newMode: Mode) => {
    setMode(newMode);
    localStorage.setItem("iped-mode", newMode);
    document.cookie = `iped-mode=${newMode}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
    // If current tab doesn't exist in new mode, reset to profile
    const newTabs = allTabs.filter((t) => (t.modes as readonly string[]).includes(newMode));
    if (!newTabs.some((t) => t.id === activeTab)) setActiveTab("profile");
    // Dispatch event so sidebar can sync + redirect if needed
    window.dispatchEvent(new CustomEvent("iped-mode-change", { detail: newMode }));
  };

  const isBiz = mode === "business";
  const tabs = allTabs.filter((t) => (t.modes as readonly string[]).includes(mode));

  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const muted = isDark ? "text-white/30" : "text-gray-400";
  const inputCls = isDark ? "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-white" : "bg-gray-50 border-gray-200 text-gray-900";
  const labelCls = isDark ? "text-white/60" : "text-gray-600";
  const itemCls = `flex items-center justify-between p-4 rounded-xl border ${border} ${isDark ? "hover:bg-white/3" : "hover:bg-gray-50"} transition-colors`;
  const sectionTitle = `text-sm font-semibold ${txt}`;

  // ── Save handler — sends correct fields per tab ──
  const handleSave = useCallback(async (tab?: string) => {
    setSaving(true);
    setSaved(false);
    try {
      let body: Record<string, unknown> = {};

      if (tab === "company") {
        // Save company info to localStorage
        localStorage.setItem("iped-company", JSON.stringify(company));
        // Also save businessName to DB (real User field)
        body = { businessName: form.businessName };
        const res = await fetch("/api/user", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) setSaved(true);
        else await modal.alert({ title: "เกิดข้อผิดพลาด", message: "บันทึกไม่สำเร็จ", type: "error" });
        setSaving(false);
        setTimeout(() => setSaved(false), 2000);
        return;
      }

      if (tab === "notifications") {
        body = {
          "settings.notifications.lineAlerts": notif.lineAlerts,
          "settings.notifications.emailAlerts": notif.emailAlerts,
          "settings.notifications.budgetWarning": notif.budgetWarning ? 80 : 0,
          "settings.notifications.dailySummary": notif.dailySummary,
        };
      } else if (tab === "preferences") {
        body = {
          "settings.currency": prefs.currency,
          "settings.language": prefs.language,
          "settings.timezone": prefs.timezone === "utc" ? "UTC" : "Asia/Bangkok",
        };
      } else if (tab === "privacy") {
        body = {
          "settings.dataRetentionDays": Number(dataRetentionDays) || 365,
        };
      } else {
        // Profile tab
        body = { ...form };
      }

      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) setSaved(true);
      else await modal.alert({ title: "เกิดข้อผิดพลาด", message: "บันทึกไม่สำเร็จ", type: "error" });
    } catch {
      await modal.alert({ title: "เกิดข้อผิดพลาด", message: "เกิดข้อผิดพลาด", type: "error" });
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(false), 2000);
    }
  }, [form, notif, prefs, company, dataRetentionDays, modal]);

  // ── Data export handler ──
  const handleExportData = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/receipts");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `iped-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      await modal.alert({ title: "เกิดข้อผิดพลาด", message: "ส่งออกข้อมูลไม่สำเร็จ", type: "error" });
    } finally {
      setExporting(false);
    }
  };

  // ── Delete account handler ──
  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/user", { method: "DELETE" });
      if (res.ok) {
        localStorage.clear();
        window.location.href = "/";
      } else {
        await modal.alert({ title: "เกิดข้อผิดพลาด", message: "ลบบัญชีไม่สำเร็จ", type: "error" });
      }
    } catch {
      await modal.alert({ title: "เกิดข้อผิดพลาด", message: "เกิดข้อผิดพลาด", type: "error" });
    } finally {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const SaveBtn = ({ tab }: { tab?: string }) => (
    <button onClick={() => handleSave(tab)} disabled={saving} className={`px-6 py-2.5 ${saved ? "bg-green-500" : "bg-[#FA3633]"} text-white rounded-xl text-sm font-medium hover:bg-[#e0302d] disabled:opacity-50 transition-colors`}>
      {saving ? "กำลังบันทึก..." : saved ? "✓ บันทึกแล้ว" : "บันทึก"}
    </button>
  );

  const Divider = () => <hr className={border} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="ตั้งค่า" description={isBiz ? "จัดการข้อมูลบริษัทและการตั้งค่า" : "จัดการข้อมูลส่วนตัวและการตั้งค่า"} />
        {/* ── Mode Toggle ── */}
        <div className={`flex items-center gap-1 ${card} border ${border} rounded-xl p-1`}>
          <button
            onClick={() => toggleMode("personal")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !isBiz
                ? "bg-[#FA3633] text-white shadow-sm"
                : isDark ? "text-white/40 hover:text-white/60" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <User size={13} />
            ส่วนตัว
          </button>
          <button
            onClick={() => toggleMode("business")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isBiz
                ? "bg-[#FA3633] text-white shadow-sm"
                : isDark ? "text-white/40 hover:text-white/60" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Building2 size={13} />
            บริษัท
          </button>
        </div>
      </div>

      <div className={`flex gap-1 ${card} border ${border} rounded-xl p-1 overflow-x-auto`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? "bg-[#FA3633]/10 text-[#FA3633]" : isDark ? "text-white/60 hover:text-white" : "text-gray-500 hover:text-gray-900"}`}>
              <Icon size={16} />{tab.label}
            </button>
          );
        })}
      </div>

      <div className={`${card} border ${border} rounded-2xl p-6`}>

        {/* ── โปรไฟล์ (ข้อมูลส่วนตัว) ── */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            {/* Avatar + header */}
            <div className="flex items-center gap-4">
              {profile.lineProfilePic ? (
                <img src={profile.lineProfilePic} alt="" width={64} height={64} className="rounded-full" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#FA3633]/20 text-[#FA3633] flex items-center justify-center text-xl font-bold">{(profile.name || "U")[0]}</div>
              )}
              <div>
                <h3 className={`font-medium ${txt}`}>{profile.lineDisplayName || profile.name}</h3>
                <p className={`text-sm ${sub}`}>{isBiz ? "บัญชีธุรกิจ" : "บัญชีส่วนตัว"}</p>
                {profile.email && <p className={`text-xs ${muted}`}>{profile.email}</p>}
              </div>
            </div>

            <Divider />

            {/* ── ชื่อ-นามสกุล ── */}
            <div className="space-y-4">
              <h3 className={sectionTitle}>ชื่อ-นามสกุล</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm ${labelCls} mb-1.5`}>ชื่อ (ไทย)</label>
                  <input value={form.firstNameTh} onChange={(e) => setForm({ ...form, firstNameTh: e.target.value })} placeholder="เช่น นคร" className={`w-full h-10 px-3 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
                </div>
                <div>
                  <label className={`block text-sm ${labelCls} mb-1.5`}>นามสกุล (ไทย)</label>
                  <input value={form.lastNameTh} onChange={(e) => setForm({ ...form, lastNameTh: e.target.value })} placeholder="เช่น นิ่มเซียน" className={`w-full h-10 px-3 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
                </div>
                <div>
                  <label className={`block text-sm ${labelCls} mb-1.5`}>First Name</label>
                  <input value={form.firstNameEn} onChange={(e) => setForm({ ...form, firstNameEn: e.target.value })} placeholder="e.g. Nakorn" className={`w-full h-10 px-3 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
                </div>
                <div>
                  <label className={`block text-sm ${labelCls} mb-1.5`}>Last Name</label>
                  <input value={form.lastNameEn} onChange={(e) => setForm({ ...form, lastNameEn: e.target.value })} placeholder="e.g. Nimsian" className={`w-full h-10 px-3 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
                </div>
              </div>
            </div>

            <Divider />

            {/* ── ข้อมูลติดต่อ ── */}
            <div className="space-y-4">
              <h3 className={sectionTitle}>ข้อมูลติดต่อ</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm ${labelCls} mb-1.5`}>เบอร์โทร</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="เช่น 081-234-5678" className={`w-full h-10 px-3 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
                </div>
                <div>
                  <label className={`block text-sm ${labelCls} mb-1.5`}>อีเมล</label>
                  <input value={profile.email || profile.googleEmail || ""} disabled className={`w-full h-10 px-3 ${inputCls} border rounded-lg text-sm opacity-60 cursor-not-allowed`} />
                </div>
              </div>
            </div>

            <Divider />

            {/* ── ข้อมูลทั่วไป ── */}
            <div className="space-y-4">
              <h3 className={sectionTitle}>ข้อมูลทั่วไป</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={`block text-sm ${labelCls} mb-1.5`}>วันเกิด</label><DatePicker value={form.birthDate} onChange={(v) => setForm({ ...form, birthDate: v })} /></div>
                <div>
                  <label className={`block text-sm ${labelCls} mb-1.5`}>เพศ</label>
                  <Select value={form.gender || "other"} onChange={(v) => setForm({ ...form, gender: v })} options={[{ value: "male", label: "ชาย" }, { value: "female", label: "หญิง" }, { value: "other", label: "อื่นๆ" }]} />
                </div>
                <div>
                  <label className={`block text-sm ${labelCls} mb-1.5`}>อาชีพ</label>
                  <input value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} placeholder="เช่น นักบัญชี" className={`w-full h-10 px-3 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
                </div>
              </div>
            </div>

            <Divider />

            {/* ── การเงินส่วนตัว ── */}
            <div className="space-y-4">
              <h3 className={sectionTitle}>การเงินส่วนตัว</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm ${labelCls} mb-1.5`}>งบประมาณ/เดือน</label>
                  <input type="number" value={form.monthlyBudget || ""} onChange={(e) => setForm({ ...form, monthlyBudget: Number(e.target.value) || 0 })} placeholder="฿0" className={`w-full h-10 px-3 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
                </div>
              </div>
            </div>

            <SaveBtn />
          </div>
        )}

        {/* ── ข้อมูลบริษัท ── */}
        {activeTab === "company" && (
          <div className="space-y-6">
            {/* ── ข้อมูลธุรกิจ ── */}
            <div className="space-y-4">
              <h3 className={sectionTitle}>ข้อมูลธุรกิจ</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm ${labelCls} mb-1.5`}>ชื่อธุรกิจ / ชื่อร้าน</label>
                  <input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} placeholder="เช่น ร้าน ABC" className={`w-full h-10 px-3 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
                </div>
                <div>
                  <label className={`block text-sm ${labelCls} mb-1.5`}>ประเภทธุรกิจ</label>
                  <input value={company.businessType} onChange={(e) => setCompany({ ...company, businessType: e.target.value })} placeholder="เช่น เทคโนโลยีสารสนเทศ" className={`w-full h-10 px-3 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
                </div>
              </div>
            </div>

            <Divider />

            {/* ── ข้อมูลนิติบุคคล ── */}
            <div className="space-y-4">
              <h3 className={sectionTitle}>ข้อมูลนิติบุคคล</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm ${labelCls} mb-1.5`}>ชื่อบริษัท (จดทะเบียน)</label>
                  <input value={company.companyName} onChange={(e) => setCompany({ ...company, companyName: e.target.value })} placeholder="เช่น บริษัท ตัวอย่าง จำกัด" className={`w-full h-10 px-3 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
                </div>
                <div>
                  <label className={`block text-sm ${labelCls} mb-1.5`}>เลขผู้เสียภาษี</label>
                  <input value={company.taxId} onChange={(e) => setCompany({ ...company, taxId: e.target.value })} placeholder="เช่น 0105560012345" className={`w-full h-10 px-3 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
                </div>
                <div>
                  <label className={`block text-sm ${labelCls} mb-1.5`}>สาขา</label>
                  <input value={company.branch} onChange={(e) => setCompany({ ...company, branch: e.target.value })} placeholder="เช่น สำนักงานใหญ่" className={`w-full h-10 px-3 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
                </div>
                <div className="col-span-full">
                  <label className={`block text-sm ${labelCls} mb-1.5`}>ที่อยู่</label>
                  <input value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} placeholder="เช่น 123 ถ.สุขุมวิท แขวงคลองเตย กรุงเทพฯ 10110" className={`w-full h-10 px-3 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
                </div>
              </div>
            </div>

            <Divider />

            {/* ── ช่องทางติดต่อบริษัท ── */}
            <div className="space-y-4">
              <h3 className={sectionTitle}>ช่องทางติดต่อ</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm ${labelCls} mb-1.5`}>โทรศัพท์</label>
                  <input value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} placeholder="เช่น 02-123-4567" className={`w-full h-10 px-3 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
                </div>
                <div>
                  <label className={`block text-sm ${labelCls} mb-1.5`}>อีเมล</label>
                  <input value={company.email} onChange={(e) => setCompany({ ...company, email: e.target.value })} placeholder="เช่น finance@company.co.th" className={`w-full h-10 px-3 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
                </div>
                <div>
                  <label className={`block text-sm ${labelCls} mb-1.5`}>เว็บไซต์</label>
                  <input value={company.website} onChange={(e) => setCompany({ ...company, website: e.target.value })} placeholder="เช่น https://company.co.th" className={`w-full h-10 px-3 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
                </div>
              </div>
            </div>

            <Divider />

            {/* ── ภาษี & บัญชี ── */}
            <div className="space-y-4">
              <h3 className={sectionTitle}>ภาษี & บัญชี</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm ${labelCls} mb-1.5`}>อัตรา VAT</label>
                  <Select value={company.vatRate || "7"} onChange={(v) => setCompany({ ...company, vatRate: v })} options={[{ value: "7", label: "7%" }, { value: "0", label: "0% (ยกเว้น)" }]} />
                </div>
                <div>
                  <label className={`block text-sm ${labelCls} mb-1.5`}>อัตรา WHT (หัก ณ ที่จ่าย)</label>
                  <Select value={company.whtRate || "3"} onChange={(v) => setCompany({ ...company, whtRate: v })} options={[{ value: "1", label: "1%" }, { value: "2", label: "2%" }, { value: "3", label: "3%" }, { value: "5", label: "5%" }, { value: "10", label: "10%" }, { value: "15", label: "15%" }, { value: "0", label: "ไม่หัก" }]} />
                </div>
                <div>
                  <label className={`block text-sm ${labelCls} mb-1.5`}>รอบบัญชี</label>
                  <Select value={company.fiscalYear || "jan-dec"} onChange={(v) => setCompany({ ...company, fiscalYear: v })} options={[{ value: "jan-dec", label: "ม.ค. — ธ.ค." }, { value: "apr-mar", label: "เม.ย. — มี.ค." }]} />
                </div>
              </div>
            </div>

            <Divider />

            {/* ── โลโก้ ── */}
            <div className="space-y-4">
              <h3 className={sectionTitle}>โลโก้บริษัท</h3>
              <div className={`border-2 border-dashed ${border} rounded-xl p-8 text-center ${isDark ? "hover:bg-white/3" : "hover:bg-gray-50"} transition-colors cursor-pointer`}>
                <Building2 size={32} className={`mx-auto ${muted} mb-2`} />
                <p className={`text-sm ${sub}`}>คลิกเพื่ออัปโหลดโลโก้</p>
                <p className={`text-xs ${muted}`}>PNG, JPG ขนาดไม่เกิน 2MB</p>
              </div>
            </div>

            <SaveBtn tab="company" />
          </div>
        )}

        {/* ── การแจ้งเตือน ── */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className={sectionTitle}>ทั่วไป</h3>
              {([
                { key: "lineAlerts" as const, label: "แจ้งเตือนใบเสร็จใหม่", desc: "รับการแจ้งเตือนเมื่อสแกนใบเสร็จสำเร็จ" },
                { key: "dailySummary" as const, label: "สรุปรายวัน", desc: "รับสรุปรายจ่ายประจำวันผ่าน LINE" },
                { key: "budgetWarning" as const, label: "แจ้งเตือนงบประมาณ", desc: "แจ้งเตือนเมื่อใช้จ่ายใกล้ถึงงบที่ตั้งไว้" },
                { key: "duplicateAlerts" as const, label: "ใบเสร็จซ้ำ", desc: "แจ้งเตือนเมื่อพบใบเสร็จที่อาจซ้ำกัน" },
                { key: "billReminders" as const, label: "บิลครบกำหนด", desc: "แจ้งเตือนก่อนบิลครบกำหนดชำระ" },
                { key: "weeklyReport" as const, label: "รายงานรายสัปดาห์", desc: "รับสรุปรายจ่ายรายสัปดาห์ผ่าน LINE" },
              ]).map((item) => (
                <div key={item.key} className={itemCls}>
                  <div><p className={`text-sm font-medium ${txt}`}>{item.label}</p><p className={`text-xs ${muted} mt-0.5`}>{item.desc}</p></div>
                  <Toggle checked={notif[item.key]} onChange={(v) => setNotif({ ...notif, [item.key]: v })} isDark={isDark} />
                </div>
              ))}
            </div>
            {isBiz && <>
              <Divider />
              <div className="space-y-4">
                <h3 className={sectionTitle}>สำหรับบริษัท</h3>
                {[
                  { label: "อนุมัติรายจ่ายใหม่", desc: "แจ้งเตือนเมื่อมีรายจ่ายรอการอนุมัติ" },
                  { label: "ใบแจ้งหนี้ครบกำหนด", desc: "แจ้งเตือนก่อนใบแจ้งหนี้ครบกำหนดชำระ 3 วัน" },
                  { label: "พนักงานใหม่เข้าร่วม", desc: "แจ้งเตือนเมื่อมีพนักงานใหม่เข้าสู่ระบบ" },
                  { label: "VAT/WHT ครบกำหนดยื่น", desc: "แจ้งเตือนก่อนกำหนดยื่นภาษี 7 วัน" },
                ].map((item) => (
                  <div key={item.label} className={itemCls}>
                    <div>
                      <p className={`text-sm font-medium ${txt}`}>{item.label}</p>
                      <p className={`text-xs ${muted} mt-0.5`}>{item.desc}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${isDark ? "bg-white/5 text-white/30" : "bg-gray-100 text-gray-400"}`}>เร็วๆ นี้</span>
                  </div>
                ))}
              </div>
            </>}
            <SaveBtn tab="notifications" />
          </div>
        )}

        {/* ── การเชื่อมต่อ ── */}
        {activeTab === "connections" && <ConnectionsTab isDark={isDark} isBiz={isBiz} txt={txt} sub={sub} muted={muted} itemCls={itemCls} sectionTitle={sectionTitle} />}

        {/* ── ตั้งค่าทั่วไป ── */}
        {activeTab === "preferences" && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className={sectionTitle}>การแสดงผล</h3>
              <div>
                <label className={`block text-sm ${labelCls} mb-1.5`}>สกุลเงินหลัก</label>
                <Select value={prefs.currency} onChange={(v) => setPrefs({ ...prefs, currency: v })} options={[{ value: "THB", label: "THB — บาท" }, { value: "USD", label: "USD — ดอลลาร์" }, { value: "EUR", label: "EUR — ยูโร" }]} />
              </div>
              <div>
                <label className={`block text-sm ${labelCls} mb-1.5`}>ภาษา OCR</label>
                <Select value={prefs.language} onChange={(v) => setPrefs({ ...prefs, language: v })} options={[{ value: "th", label: "ไทย" }, { value: "en", label: "English" }, { value: "auto", label: "อัตโนมัติ" }]} />
              </div>
              <div>
                <label className={`block text-sm ${labelCls} mb-1.5`}>รูปแบบวันที่</label>
                <Select value={prefs.dateFormat} onChange={(v) => setPrefs({ ...prefs, dateFormat: v })} options={[{ value: "th", label: "DD/MM/YYYY (พ.ศ.)" }, { value: "en", label: "MM/DD/YYYY (ค.ศ.)" }, { value: "iso", label: "YYYY-MM-DD" }]} />
              </div>
              <div>
                <label className={`block text-sm ${labelCls} mb-1.5`}>เขตเวลา</label>
                <Select value={prefs.timezone} onChange={(v) => setPrefs({ ...prefs, timezone: v })} options={[{ value: "asia-bkk", label: "เอเชีย/กรุงเทพ (GMT+7)" }, { value: "utc", label: "UTC" }]} />
              </div>
            </div>
            {isBiz && <>
              <Divider />
              <div className={`flex items-center gap-2 p-3 rounded-xl ${isDark ? "bg-white/[0.04]" : "bg-gray-50"}`}>
                <Building2 size={14} className={muted} />
                <span className={`text-xs ${sub}`}>ภาษี & บัญชี (VAT, WHT, รอบบัญชี) ตั้งค่าได้ที่แท็บ <button onClick={() => setActiveTab("company")} className="text-[#FA3633] hover:underline font-medium">ข้อมูลบริษัท</button></span>
              </div>
            </>}
            <SaveBtn tab="preferences" />
          </div>
        )}

        {/* ── ความปลอดภัย ── */}
        {activeTab === "security" && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className={sectionTitle}>การเข้าสู่ระบบ</h3>
              <div className={itemCls}>
                <div className="flex items-center gap-3">
                  <BrandIcon brand="line" size={36} className="rounded-xl" />
                  <div>
                    <p className={`text-sm font-medium ${txt}`}>LINE Login</p>
                    <p className={`text-xs ${muted} mt-0.5`}>{profile.lineDisplayName || "เชื่อมต่อผ่าน LINE"}</p>
                  </div>
                </div>
                <span className={`px-3 py-1.5 rounded-xl text-xs font-medium ${isDark ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-600"}`}>เชื่อมต่อแล้ว</span>
              </div>
              {profile.googleEmail && (
                <div className={itemCls}>
                  <div className="flex items-center gap-3">
                    <BrandIcon brand="gmail" size={36} className="rounded-xl" />
                    <div>
                      <p className={`text-sm font-medium ${txt}`}>Google Account</p>
                      <p className={`text-xs ${muted} mt-0.5`}>{profile.googleEmail}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-medium ${isDark ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-600"}`}>เชื่อมต่อแล้ว</span>
                </div>
              )}
            </div>

            <Divider />

            <div className="space-y-4">
              <h3 className={sectionTitle}>การยืนยันตัวตน 2 ขั้นตอน (2FA)</h3>
              <div className={itemCls}>
                <div>
                  <p className={`text-sm font-medium ${txt}`}>เปิดใช้งาน 2FA</p>
                  <p className={`text-xs ${muted} mt-0.5`}>เพิ่มความปลอดภัยด้วย OTP ผ่าน LINE หรือ Authenticator</p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${isDark ? "bg-white/5 text-white/30" : "bg-gray-100 text-gray-400"}`}>เร็วๆ นี้</span>
              </div>
            </div>

            <Divider />

            <div className="space-y-4">
              <h3 className={sectionTitle}>เซสชันที่เข้าสู่ระบบ</h3>
              <div className={itemCls}>
                <div className="flex items-center gap-3">
                  <Monitor size={20} className={sub} />
                  <div>
                    <p className={`text-sm font-medium ${txt}`}>เซสชันปัจจุบัน <span className="text-xs text-green-500 ml-1">กำลังใช้งาน</span></p>
                    <p className={`text-xs ${muted} mt-0.5`}>เข้าสู่ระบบผ่าน LINE</p>
                  </div>
                </div>
              </div>
            </div>

            {isBiz && <>
              <Divider />
              <div className="space-y-4">
                <h3 className={sectionTitle}>สำหรับบริษัท</h3>
                {[
                  { label: "จำกัดสิทธิ์ตามบทบาท", desc: "กำหนดสิทธิ์ Admin / Manager / User ให้พนักงาน" },
                  { label: "IP Whitelist", desc: "อนุญาตเฉพาะ IP ที่กำหนดเข้าสู่ระบบ" },
                  { label: "Session Timeout", desc: "ออกจากระบบอัตโนมัติเมื่อไม่ใช้งาน" },
                ].map((item) => (
                  <div key={item.label} className={itemCls}>
                    <div>
                      <p className={`text-sm font-medium ${txt}`}>{item.label}</p>
                      <p className={`text-xs ${muted} mt-0.5`}>{item.desc}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${isDark ? "bg-white/5 text-white/30" : "bg-gray-100 text-gray-400"}`}>เร็วๆ นี้</span>
                  </div>
                ))}
              </div>
            </>}
          </div>
        )}

        {/* ── ความเป็นส่วนตัว ── */}
        {activeTab === "privacy" && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className={sectionTitle}>ข้อมูลส่วนบุคคล (PDPA)</h3>
              <div className={itemCls}>
                <div>
                  <p className={`text-sm font-medium ${txt}`}>ความยินยอมในการเก็บข้อมูล</p>
                  <p className={`text-xs ${muted} mt-0.5`}>{profile.settings.pdpaConsent ? "คุณได้ยินยอมให้จัดเก็บข้อมูลแล้ว" : "ยังไม่ได้ให้ความยินยอม"}</p>
                </div>
                {profile.settings.pdpaConsent ? (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-green-500/10 text-green-400">ยินยอมแล้ว</span>
                ) : (
                  <button
                    onClick={() => handleSave("privacy")}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors"
                  >ให้ความยินยอม</button>
                )}
              </div>
              <div className={itemCls}>
                <div>
                  <p className={`text-sm font-medium ${txt}`}>นโยบายความเป็นส่วนตัว</p>
                  <p className={`text-xs ${muted} mt-0.5`}>อัปเดตล่าสุด 01/01/2569</p>
                </div>
                <button className={`px-3 py-1.5 rounded-lg text-xs font-medium ${isDark ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"} transition-colors`}>ดูรายละเอียด</button>
              </div>
            </div>

            <Divider />

            <div className="space-y-4">
              <h3 className={sectionTitle}>จัดการข้อมูล</h3>
              <div className={itemCls}>
                <div>
                  <p className={`text-sm font-medium ${txt}`}>ดาวน์โหลดข้อมูลทั้งหมด</p>
                  <p className={`text-xs ${muted} mt-0.5`}>ส่งออกข้อมูลใบเสร็จทั้งหมดเป็นไฟล์ JSON</p>
                </div>
                <button
                  onClick={handleExportData}
                  disabled={exporting}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  {exporting ? "กำลังส่งออก..." : "ดาวน์โหลด"}
                </button>
              </div>
            </div>

            {isBiz && <>
              <Divider />
              <div className="space-y-4">
                <h3 className={sectionTitle}>สำหรับบริษัท</h3>
                <div>
                  <label className={`block text-sm ${labelCls} mb-1.5`}>ระยะเวลาเก็บข้อมูล (Data Retention)</label>
                  <Select
                    value={dataRetentionDays}
                    onChange={setDataRetentionDays}
                    options={[{ value: "365", label: "1 ปี" }, { value: "730", label: "2 ปี" }, { value: "1825", label: "5 ปี" }, { value: "0", label: "ไม่จำกัด" }]}
                  />
                </div>
                <SaveBtn tab="privacy" />
              </div>
            </>}

            <Divider />

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-red-500">โซนอันตราย</h3>
              {!deleteConfirm ? (
                <div className={`${itemCls} border-red-500/20`}>
                  <div>
                    <p className="text-sm font-medium text-red-500">ลบบัญชี</p>
                    <p className={`text-xs ${muted} mt-0.5`}>ลบข้อมูลทั้งหมดอย่างถาวร ไม่สามารถกู้คืนได้</p>
                  </div>
                  <button onClick={() => setDeleteConfirm(true)} className="px-4 py-2 rounded-xl text-xs font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors flex items-center gap-1.5"><Trash2 size={14} />ลบบัญชี</button>
                </div>
              ) : (
                <div className={`p-4 rounded-xl border border-red-500/30 ${isDark ? "bg-red-500/5" : "bg-red-50"}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={16} className="text-red-500" />
                    <p className="text-sm font-medium text-red-500">ยืนยันการลบบัญชี</p>
                  </div>
                  <p className={`text-xs ${muted} mb-4`}>การดำเนินการนี้จะลบข้อมูลทั้งหมดอย่างถาวร รวมถึงใบเสร็จ ไฟล์ และการตั้งค่าทั้งหมด ไม่สามารถกู้คืนได้</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      className="px-4 py-2 rounded-xl text-xs font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                    >
                      {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      {deleting ? "กำลังลบ..." : "ยืนยัน ลบบัญชี"}
                    </button>
                    <button onClick={() => setDeleteConfirm(false)} className={`px-4 py-2 rounded-xl text-xs font-medium ${isDark ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"} transition-colors`}>ยกเลิก</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── หมวดหมู่ ── */}
        {activeTab === "categories" && <CategoriesTab isDark={isDark} categoryStats={categoryStats} card={card} border={border} txt={txt} sub={sub} muted={muted} inputCls={inputCls} labelCls={labelCls} />}

      </div>
    </div>
  );
}

/* ═══════════════ Connections Tab ═══════════════ */
function ConnectionsTab({ isDark, isBiz, txt, sub, muted, itemCls, sectionTitle }: any) {
  const [googleStatus, setGoogleStatus] = useState<"checking" | "connected" | "not_connected">("checking");
  const [googleEmail, setGoogleEmail] = useState("");

  useEffect(() => {
    fetch("/api/auth/google/status").then((r) => r.json()).then((d) => {
      if (d.connected) { setGoogleStatus("connected"); setGoogleEmail(d.email || ""); }
      else setGoogleStatus("not_connected");
    }).catch(() => setGoogleStatus("not_connected"));
  }, []);

  const services = [
    { name: "LINE", brand: "line", desc: "Login + ส่งสลิป + OCR อัตโนมัติ", connected: true, action: null, detail: "เชื่อมต่อผ่าน LINE Login" },
    { name: "Gmail", brand: "gmail", desc: "สแกนใบเสร็จจากอีเมลอัตโนมัติ", connected: googleStatus === "connected", action: "/api/auth/google", detail: googleEmail || "ค้นหาใบเสร็จ/ใบแจ้งหนี้ในอีเมล" },
    { name: "Google Drive", brand: "google-drive", desc: "สำรองเอกสารอัตโนมัติ", connected: googleStatus === "connected", action: "/api/auth/google", detail: "ใช้ Google account เดียวกับ Gmail" },
    { name: "Google Sheet", brand: "google-sheets", desc: "ซิงค์ข้อมูลรายจ่ายเป็น Spreadsheet", connected: false, action: "/api/auth/google", detail: "ส่งออกข้อมูลเป็น Google Sheets" },
    { name: "Notion", brand: "notion", desc: "ซิงค์ข้อมูลไป Notion Database", connected: false, action: null, detail: "เร็วๆ นี้" },
    ...(isBiz ? [
      { name: "PEAK", brand: "other" as string, desc: "เชื่อมโปรแกรมบัญชี PEAK", connected: false, action: null, detail: "เร็วๆ นี้" },
      { name: "FlowAccount", brand: "other" as string, desc: "เชื่อมโปรแกรมบัญชี FlowAccount", connected: false, action: null, detail: "เร็วๆ นี้" },
    ] : []),
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className={sectionTitle}>บริการที่เชื่อมต่อ</h3>
        <p className={`text-xs ${muted} mt-1`}>จัดการการเชื่อมต่อกับบริการภายนอก</p>
      </div>
      {services.map((svc) => (
        <div key={svc.name} className={itemCls}>
          <div className="flex items-center gap-3">
            <BrandIcon brand={svc.brand} size={36} className="rounded-xl" />
            <div>
              <div className="flex items-center gap-2">
                <p className={`text-sm font-medium ${txt}`}>{svc.name}</p>
                <span className={`w-2 h-2 rounded-full ${svc.connected ? "bg-green-500" : isDark ? "bg-white/15" : "bg-gray-300"}`} />
              </div>
              <p className={`text-xs ${muted} mt-0.5`}>{svc.connected ? svc.detail : svc.desc}</p>
            </div>
          </div>
          {svc.connected ? (
            <span className={`px-3 py-1.5 rounded-xl text-xs font-medium ${isDark ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-600"}`}>เชื่อมต่อแล้ว</span>
          ) : svc.action ? (
            <button onClick={() => { window.location.href = svc.action!; }} className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors">เชื่อมต่อ</button>
          ) : (
            <span className={`px-3 py-1.5 rounded-xl text-xs font-medium ${isDark ? "bg-white/5 text-white/30" : "bg-gray-100 text-gray-400"}`}>เร็วๆ นี้</span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════ Categories Tab ═══════════════ */
function CategoriesTab({ isDark, categoryStats, txt, sub, muted }: any) {
  const [customCats, setCustomCats] = useState<{ name: string; emoji: string; color: string; dir: string }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState<{ name: string; dir: string; isNew?: boolean } | null>(null);
  const [form, setForm] = useState({ name: "", emoji: "📋", color: CAT_COLORS[0] });
  const [confirm, setConfirm] = useState<{ name: string; dir: string; action: "delete" | "edit"; newName?: string } | null>(null);

  useEffect(() => { try { const s = localStorage.getItem("iped-custom-cats"); if (s) setCustomCats(JSON.parse(s).map((c: any) => ({ ...c, dir: c.direction || c.dir }))); } catch {} setLoaded(true); }, []);
  useEffect(() => { if (loaded) localStorage.setItem("iped-custom-cats", JSON.stringify(customCats)); }, [customCats, loaded]);

  const stats = categoryStats as CatStat[];
  const getStat = (name: string, dir: string) => stats.find((c) => c.name === name && c.direction === dir);

  const seen = new Set<string>();
  const allCats: { name: string; emoji: string; color: string; dir: string }[] = [];

  stats.forEach((s) => {
    const key = s.name + "|" + s.direction;
    if (seen.has(key)) return;
    seen.add(key);
    const def = DEFAULT_CATS.find((d) => d.name === s.name && d.dir === s.direction);
    const cust = customCats.find((c) => c.name === s.name && c.dir === s.direction);
    allCats.push(cust || def || { name: s.name, emoji: "📋", color: "#9CA3AF", dir: s.direction });
  });

  customCats.forEach((c) => {
    const key = c.name + "|" + c.dir;
    if (!seen.has(key)) { seen.add(key); allCats.push(c); }
  });

  DEFAULT_CATS.forEach((d) => {
    const key = d.name + "|" + d.dir;
    if (!seen.has(key)) { seen.add(key); allCats.push(d); }
  });

  const openAdd = (dir: string) => { setEditing({ name: "", dir, isNew: true }); setForm({ name: "", emoji: "📋", color: CAT_COLORS[Math.floor(Math.random() * CAT_COLORS.length)] }); };
  const openEdit = (cat: any) => { setEditing({ name: cat.name, dir: cat.dir }); setForm({ name: cat.name, emoji: cat.emoji, color: cat.color }); };

  const handleSave = () => {
    if (!form.name.trim() || !editing) return;
    if (editing.isNew) {
      setCustomCats((prev) => [...prev, { name: form.name.trim(), emoji: form.emoji, color: form.color, dir: editing.dir }]);
    } else {
      const stat = getStat(editing.name, editing.dir);
      if (stat && stat.count > 0 && form.name !== editing.name) {
        setConfirm({ name: editing.name, dir: editing.dir, action: "edit", newName: form.name });
        return;
      }
      doEdit();
    }
    setEditing(null);
  };

  const doEdit = () => {
    if (!editing) return;
    setCustomCats((prev) => prev.map((c) => (c.name === editing.name && c.dir === editing.dir) ? { ...c, name: form.name.trim(), emoji: form.emoji, color: form.color } : c));
    setEditing(null); setConfirm(null);
  };

  const tryDelete = (name: string, dir: string) => {
    const stat = getStat(name, dir);
    if (stat && stat.count > 0) { setConfirm({ name, dir, action: "delete" }); return; }
    setCustomCats((prev) => prev.filter((c) => !(c.name === name && c.dir === dir)));
  };

  const doDelete = () => {
    if (!confirm) return;
    setCustomCats((prev) => prev.filter((c) => !(c.name === confirm.name && c.dir === confirm.dir)));
    setConfirm(null);
  };

  if (!loaded) return null;

  return (
    <div className="space-y-5">
      {confirm && (() => {
        const stat = getStat(confirm.name, confirm.dir);
        const isDelete = confirm.action === "delete";
        return (
          <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? "bg-amber-500/10 border border-amber-500/20" : "bg-amber-50 border border-amber-200"}`}>
            <AlertTriangle size={16} className="text-amber-500 shrink-0" />
            <span className={`text-xs flex-1 ${txt}`}>
              {isDelete ? `ลบ "${confirm.name}"?` : `เปลี่ยนชื่อ "${confirm.name}" → "${confirm.newName}"?`}
              {" "}มี <b>{stat?.count} รายการ</b> (฿{stat?.total?.toLocaleString("th-TH", { minimumFractionDigits: 2 })})
            </span>
            <button onClick={isDelete ? doDelete : doEdit} className={`px-2 py-1 rounded text-[11px] font-medium text-white ${isDelete ? "bg-red-500" : "bg-amber-500"}`}>{isDelete ? "ลบ" : "แก้ไข"}</button>
            <button onClick={() => setConfirm(null)} className={`px-2 py-1 rounded text-[11px] ${sub}`}>ยกเลิก</button>
          </div>
        );
      })()}

      {editing && (
        <div className={`flex items-center gap-2 p-3 rounded-xl ${isDark ? "bg-white/[0.04] border border-white/[0.08]" : "bg-gray-50 border border-gray-200"}`}>
          <input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} className={`w-9 h-9 text-center text-lg rounded-lg bg-transparent border ${isDark ? "border-white/10" : "border-gray-200"} focus:outline-none`} />
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ชื่อหมวด" className={`flex-1 h-9 px-2 text-sm rounded-lg bg-transparent border ${isDark ? "border-white/10 text-white" : "border-gray-200 text-gray-900"} focus:outline-none`} autoFocus onKeyDown={(e) => e.key === "Enter" && handleSave()} />
          <div className="flex gap-1">
            {CAT_COLORS.map((c) => (
              <button key={c} onClick={() => setForm({ ...form, color: c })} className={`w-5 h-5 rounded-full transition-transform ${form.color === c ? "scale-125 ring-2 ring-offset-1" : "hover:scale-110"}`} style={{ backgroundColor: c }} />
            ))}
          </div>
          <button onClick={handleSave} disabled={!form.name.trim()} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#FA3633] text-white disabled:opacity-40">{editing.isNew ? "เพิ่ม" : "บันทึก"}</button>
          <button onClick={() => setEditing(null)} className={`text-xs ${muted}`}>ยกเลิก</button>
        </div>
      )}

      {(["expense", "income", "savings"] as const).map((dir) => {
        const items = allCats.filter((c) => c.dir === dir);
        return (
          <div key={dir}>
            <span className={`text-xs font-medium ${sub} mb-2 block`}>{DIR_LABEL[dir]}</span>
            <div className="flex flex-wrap gap-1.5">
              {items.map((cat) => {
                const stat = getStat(cat.name, dir);
                const isCustom = customCats.some((c) => c.name === cat.name && c.dir === dir);
                return (
                  <span key={cat.name} className={`inline-flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full text-xs group transition-colors ${stat && stat.count > 0 ? (isDark ? "bg-white/[0.07]" : "bg-gray-100") : (isDark ? "bg-white/[0.02] opacity-50" : "bg-gray-50 opacity-60")} ${txt}`}>
                    <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className={stat && stat.count > 0 ? "font-medium" : ""}>{cat.name}</span>
                    {stat && stat.count > 0 && <span className="text-[9px] font-bold px-1 py-0.5 rounded-full leading-none" style={{ backgroundColor: cat.color + "20", color: cat.color }}>{stat.count}</span>}
                    {isCustom && (
                      <span className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(cat)} className={`${isDark ? "text-white/30 hover:text-white/60" : "text-gray-400 hover:text-gray-600"}`}><Pencil size={9} /></button>
                        <button onClick={() => tryDelete(cat.name, dir)} className={`${isDark ? "text-white/30 hover:text-red-400" : "text-gray-400 hover:text-red-500"}`}><Trash2 size={9} /></button>
                      </span>
                    )}
                  </span>
                );
              })}
              <button onClick={() => openAdd(dir)} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border border-dashed ${isDark ? "border-white/10 text-white/30 hover:text-white/50" : "border-gray-300 text-gray-400 hover:text-gray-500"}`}>
                <Plus size={10} /> เพิ่ม
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
