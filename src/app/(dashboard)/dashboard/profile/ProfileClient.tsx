"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Pencil, Check, X, ChevronRight, Bell, Shield, Moon, Sun, Target, CreditCard, ChevronDown, Loader2 } from "lucide-react";
import BrandIcon from "@/components/dashboard/BrandIcon";

interface ProfileProps {
  profile: {
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
    age: number;
    occupation: string;
    gender: string;
    accountType: string;
    businessName: string;
    monthlyBudget: number;
    goals: string[];
    googleEmail: string;
    googleConnectedAt: string;
    lastLogin: string;
    createdAt: string;
    status: string;
    loginCount: number;
    onboardingComplete: boolean;
    settings: {
      dailySummary: boolean;
      dailySummaryTime: string;
      lineAlerts: boolean;
      budgetWarning: number;
    };
  };
  stats: {
    totalReceipts: number;
    monthReceipts: number;
    monthExpense: number;
    monthIncome: number;
    streak: number;
    memberSince: string;
    lastLogin: string;
  };
}

export default function ProfileClient({ profile: initProfile, stats }: ProfileProps) {
  const { isDark, toggleTheme } = useTheme();
  const [profile, setProfile] = useState(initProfile);
  const [editSection, setEditSection] = useState<string | null>(null);
  const [form, setForm] = useState({ ...initProfile });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");

  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const muted = isDark ? "text-white/30" : "text-gray-400";
  const inp = `w-full h-10 px-3 ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900"} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`;
  const lbl = `block text-xs ${isDark ? "text-white/40" : "text-gray-500"} mb-1`;

  const streakEmoji = stats.streak >= 30 ? "🔥" : stats.streak >= 7 ? "⚡" : stats.streak >= 1 ? "👍" : "👋";
  const streakLevel = stats.streak >= 30 ? "ระดับ Pro" : stats.streak >= 7 ? "ระดับขยัน" : stats.streak >= 1 ? "เริ่มต้นดี" : "เริ่มจดกันเลย!";
  const nextLevel = stats.streak >= 30 ? 60 : stats.streak >= 7 ? 30 : stats.streak >= 1 ? 7 : 1;
  const streakPct = Math.min(100, (stats.streak / nextLevel) * 100);
  const budgetPct = profile.monthlyBudget > 0 ? Math.min(100, (stats.monthExpense / profile.monthlyBudget) * 100) : 0;

  const startEdit = (section: string) => {
    setForm({ ...profile });
    setEditSection(section);
  };

  const cancelEdit = () => setEditSection(null);

  const saveField = async (fields: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        setProfile((p) => ({ ...p, ...fields } as any));
        setSaved(editSection || "");
        setEditSection(null);
        setTimeout(() => setSaved(""), 2000);
      }
    } catch {} finally {
      setSaving(false);
    }
  };

  const saveSettings = async (fields: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        // Update local profile settings
        const newSettings = { ...profile.settings };
        for (const [k, v] of Object.entries(fields)) {
          if (k === "settings.notifications.dailySummary") (newSettings as any).dailySummary = v;
          if (k === "settings.notifications.lineAlerts") (newSettings as any).lineAlerts = v;
          if (k === "settings.notifications.dailySummaryTime") (newSettings as any).dailySummaryTime = v;
          if (k === "settings.notifications.budgetWarning") (newSettings as any).budgetWarning = v;
        }
        setProfile((p) => ({ ...p, settings: newSettings }));
      }
    } catch {} finally {
      setSaving(false);
    }
  };

  const SectionHeader = ({ title, section, children }: { title: string; section: string; children?: React.ReactNode }) => (
    <div className="flex items-center justify-between mb-3">
      <p className={`text-sm font-semibold ${txt}`}>{title}</p>
      {editSection === section ? (
        <div className="flex items-center gap-2">
          <button onClick={cancelEdit} className={`p-1.5 rounded-lg ${isDark ? "hover:bg-white/10" : "hover:bg-gray-100"}`}>
            <X size={16} className={muted} />
          </button>
          <button
            onClick={() => {
              if (section === "personal") {
                saveField({ firstNameTh: form.firstNameTh, lastNameTh: form.lastNameTh, firstNameEn: form.firstNameEn, lastNameEn: form.lastNameEn, phone: form.phone, occupation: form.occupation, gender: form.gender });
              } else if (section === "budget") {
                saveField({ monthlyBudget: form.monthlyBudget });
              } else if (section === "business") {
                saveField({ businessName: form.businessName, accountType: form.accountType });
              }
            }}
            disabled={saving}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FA3633] text-white text-xs font-medium"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            บันทึก
          </button>
        </div>
      ) : (
        <button onClick={() => startEdit(section)} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${isDark ? "text-white/40 hover:text-white/70 hover:bg-white/5" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}>
          <Pencil size={12} /> แก้ไข
        </button>
      )}
      {saved === section && <span className="text-xs text-green-500 font-medium">✓ บันทึกแล้ว</span>}
    </div>
  );

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-8">
      {/* ── Profile Header ── */}
      <div className={`${card} border ${border} rounded-2xl p-6`}>
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {profile.lineProfilePic ? (
              <img src={profile.lineProfilePic} alt={profile.name} className="w-20 h-20 rounded-full object-cover border-4 border-[#FA3633]/20" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FA3633] to-[#ff6b6b] flex items-center justify-center text-white text-2xl font-bold">
                {(profile.name || "U")[0]}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-white dark:border-[#0a0a0a] flex items-center justify-center">
              <span className="text-[8px] text-white">✓</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className={`text-lg font-bold ${txt} truncate`}>{profile.lineDisplayName || profile.name}</h1>
            <p className={`text-sm ${sub}`}>{profile.occupation || "บัญชีส่วนตัว"}</p>
            {profile.gender && profile.age > 0 && <p className={`text-xs ${muted} mt-0.5`}>{profile.gender} · {profile.age} ปี</p>}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10">
                <BrandIcon brand="line" size={12} />
                <span className="text-[10px] text-green-500 font-medium">LINE</span>
              </div>
              {profile.googleEmail && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10">
                  <BrandIcon brand="gmail" size={12} />
                  <span className="text-[10px] text-blue-500 font-medium">{profile.googleEmail}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Streak ── */}
      <div className={`${card} border ${border} rounded-2xl p-5`}>
        <div className="flex items-center justify-between mb-1">
          <span className={`text-sm font-semibold ${txt}`}>จดต่อเนื่องมา</span>
          <span className={`text-xs ${muted}`}>{streakLevel}</span>
        </div>
        <div className="flex items-end gap-2 mb-2">
          <span className={`text-4xl font-bold ${txt}`}>{stats.streak}</span>
          <span className={`text-lg ${sub} mb-1`}>วัน {streakEmoji}</span>
        </div>
        <div className={`h-2.5 rounded-full ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
          <div className="h-full rounded-full bg-gradient-to-r from-[#FA3633] to-[#ff6b6b] transition-all" style={{ width: `${streakPct}%` }} />
        </div>
        <p className={`text-xs ${muted} mt-2`}>เลเวลต่อไปใน {Math.max(0, nextLevel - stats.streak)} วัน</p>
      </div>

      {/* ── Personal Info (editable) ── */}
      <div className={`${card} border ${border} rounded-2xl p-5`}>
        <SectionHeader title="ข้อมูลส่วนตัว" section="personal" />
        {editSection === "personal" ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>ชื่อ (ไทย)</label><input value={form.firstNameTh} onChange={(e) => setForm({ ...form, firstNameTh: e.target.value })} placeholder="ชื่อ" className={inp} /></div>
              <div><label className={lbl}>นามสกุล (ไทย)</label><input value={form.lastNameTh} onChange={(e) => setForm({ ...form, lastNameTh: e.target.value })} placeholder="นามสกุล" className={inp} /></div>
              <div><label className={lbl}>First Name</label><input value={form.firstNameEn} onChange={(e) => setForm({ ...form, firstNameEn: e.target.value })} placeholder="First" className={inp} /></div>
              <div><label className={lbl}>Last Name</label><input value={form.lastNameEn} onChange={(e) => setForm({ ...form, lastNameEn: e.target.value })} placeholder="Last" className={inp} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>เบอร์โทร</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inp} /></div>
              <div><label className={lbl}>อาชีพ</label><input value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} className={inp} /></div>
            </div>
            <div><label className={lbl}>เพศ</label>
              <div className="flex gap-2">
                {["ชาย", "หญิง", "อื่นๆ"].map((g) => (
                  <button key={g} onClick={() => setForm({ ...form, gender: g })} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${form.gender === g ? "bg-[#FA3633] text-white" : isDark ? "bg-white/5 text-white/60" : "bg-gray-100 text-gray-600"}`}>{g}</button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {profile.firstNameTh ? (
              <InfoRow label="ชื่อ-นามสกุล (ไทย)" value={`${profile.firstNameTh} ${profile.lastNameTh}`.trim()} isDark={isDark} />
            ) : (
              <InfoRow label="ชื่อ" value={profile.name} isDark={isDark} />
            )}
            {profile.firstNameEn && <InfoRow label="Name (EN)" value={`${profile.firstNameEn} ${profile.lastNameEn}`.trim()} isDark={isDark} />}
            {profile.phone && <InfoRow label="เบอร์โทร" value={profile.phone} isDark={isDark} />}
            {profile.occupation && <InfoRow label="อาชีพ" value={profile.occupation} isDark={isDark} />}
            {profile.gender && <InfoRow label="เพศ" value={profile.gender} isDark={isDark} />}
          </div>
        )}
      </div>

      {/* ── Budget (editable) ── */}
      <div className={`${card} border ${border} rounded-2xl p-5`}>
        <SectionHeader title="งบประมาณ" section="budget" />
        {editSection === "budget" ? (
          <div>
            <label className={lbl}>งบประมาณรายเดือน (฿)</label>
            <input type="number" value={form.monthlyBudget || ""} onChange={(e) => setForm({ ...form, monthlyBudget: Number(e.target.value) || 0 })} placeholder="0" className={inp} />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs ${sub}`}>งบประมาณ/เดือน</span>
              <span className={`text-sm font-bold ${txt}`}>{profile.monthlyBudget > 0 ? `฿${profile.monthlyBudget.toLocaleString()}` : "ยังไม่ตั้ง"}</span>
            </div>
            {profile.monthlyBudget > 0 && (
              <>
                <div className={`h-2.5 rounded-full ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
                  <div className={`h-full rounded-full transition-all ${budgetPct > 80 ? "bg-red-500" : "bg-[#FA3633]"}`} style={{ width: `${budgetPct}%` }} />
                </div>
                <p className={`text-xs ${muted} mt-1`}>ใช้ไป ฿{stats.monthExpense.toLocaleString()} ({Math.round(budgetPct)}%)</p>
              </>
            )}
          </>
        )}
      </div>

      {/* ── Monthly Stats ── */}
      <div className={`${card} border ${border} rounded-2xl p-5`}>
        <p className={`text-sm font-semibold ${txt} mb-3`}>สรุปเดือนนี้</p>
        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-xl p-3 ${isDark ? "bg-red-500/10" : "bg-red-50"}`}>
            <p className="text-xs text-red-500">รายจ่าย</p>
            <p className="text-lg font-bold text-red-500 mt-1">฿{stats.monthExpense.toLocaleString()}</p>
          </div>
          <div className={`rounded-xl p-3 ${isDark ? "bg-green-500/10" : "bg-green-50"}`}>
            <p className="text-xs text-green-500">รายรับ</p>
            <p className="text-lg font-bold text-green-500 mt-1">฿{stats.monthIncome.toLocaleString()}</p>
          </div>
        </div>
        <div className={`flex items-center justify-between mt-3 pt-3 border-t ${border}`}>
          <span className={`text-xs ${sub}`}>ใบเสร็จเดือนนี้</span>
          <span className={`text-sm font-semibold ${txt}`}>{stats.monthReceipts} รายการ</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className={`text-xs ${sub}`}>ใบเสร็จทั้งหมด</span>
          <span className={`text-sm font-semibold ${txt}`}>{stats.totalReceipts} รายการ</span>
        </div>
      </div>

      {/* ── Notifications (toggle inline) ── */}
      <div className={`${card} border ${border} rounded-2xl overflow-hidden divide-y ${isDark ? "divide-white/5" : "divide-gray-100"}`}>
        <ToggleRow
          icon={<Bell size={18} />}
          label="สรุปรายวัน (LINE)"
          value={profile.settings.dailySummary}
          detail={profile.settings.dailySummaryTime}
          onChange={(v) => saveSettings({ "settings.notifications.dailySummary": v })}
          isDark={isDark}
        />
        <ToggleRow
          icon={<Bell size={18} />}
          label="แจ้งเตือนใบเสร็จ"
          value={profile.settings.lineAlerts}
          onChange={(v) => saveSettings({ "settings.notifications.lineAlerts": v })}
          isDark={isDark}
        />
      </div>

      {/* ── Connections ── */}
      <div className={`${card} border ${border} rounded-2xl overflow-hidden divide-y ${isDark ? "divide-white/5" : "divide-gray-100"}`}>
        <div className={`flex items-center gap-3 px-4 py-3.5`}>
          <BrandIcon brand="line" size={28} />
          <div className="flex-1">
            <p className={`text-sm font-medium ${txt}`}>LINE</p>
            <p className={`text-xs ${muted}`}>{profile.lineDisplayName}</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-green-500/10 text-green-500">เชื่อมต่อแล้ว</span>
        </div>
        <div className={`flex items-center gap-3 px-4 py-3.5`}>
          <BrandIcon brand="gmail" size={28} />
          <div className="flex-1">
            <p className={`text-sm font-medium ${txt}`}>Google</p>
            <p className={`text-xs ${muted}`}>{profile.googleEmail || "Gmail + Drive + Sheets"}</p>
          </div>
          {profile.googleEmail ? (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-green-500/10 text-green-500">เชื่อมต่อแล้ว</span>
          ) : (
            <a href="/api/auth/google" className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#FA3633] text-white">เชื่อมต่อ</a>
          )}
        </div>
      </div>

      {/* ── Quick Settings ── */}
      <div className={`${card} border ${border} rounded-2xl overflow-hidden divide-y ${isDark ? "divide-white/5" : "divide-gray-100"}`}>
        <button onClick={toggleTheme} className={`w-full flex items-center gap-3 px-4 py-3.5 ${isDark ? "hover:bg-white/5" : "hover:bg-gray-50"} transition-colors`}>
          <span className={isDark ? "text-white/50" : "text-gray-400"}>{isDark ? <Moon size={18} /> : <Sun size={18} />}</span>
          <span className={`text-sm flex-1 text-left ${txt}`}>{isDark ? "โหมดมืด" : "โหมดสว่าง"}</span>
          <span className={`text-xs ${muted}`}>{isDark ? "เปิด" : "ปิด"}</span>
        </button>
      </div>

      {/* ── Account Info ── */}
      <div className={`${card} border ${border} rounded-2xl p-5`}>
        <p className={`text-sm font-semibold ${txt} mb-3`}>ข้อมูลบัญชี</p>
        <div className="space-y-2.5">
          <InfoRow label="สมาชิกตั้งแต่" value={stats.memberSince} isDark={isDark} />
          {stats.lastLogin && <InfoRow label="เข้าใช้ล่าสุด" value={stats.lastLogin} isDark={isDark} />}
          <InfoRow label="เข้าใช้งาน" value={`${profile.loginCount} ครั้ง`} isDark={isDark} />
          <InfoRow label="สถานะ" value={profile.status === "active" ? "✅ ใช้งานอยู่" : profile.status} isDark={isDark} />
        </div>
      </div>

      <p className={`text-center text-xs ${muted} py-2`}>iPED v1.0 — by codelabs tech</p>
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

function ToggleRow({ icon, label, value, detail, onChange, isDark }: {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  detail?: string;
  onChange: (v: boolean) => void;
  isDark: boolean;
}) {
  const [on, setOn] = useState(value);
  const toggle = () => {
    const next = !on;
    setOn(next);
    onChange(next);
  };
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5`}>
      <span className={isDark ? "text-white/50" : "text-gray-400"}>{icon}</span>
      <div className="flex-1">
        <span className={`text-sm ${isDark ? "text-white" : "text-gray-900"}`}>{label}</span>
        {detail && on && <span className={`text-xs ${isDark ? "text-white/30" : "text-gray-400"} ml-2`}>{detail}</span>}
      </div>
      <button onClick={toggle} className={`w-11 h-6 rounded-full transition-colors relative ${on ? "bg-[#FA3633]" : isDark ? "bg-white/10" : "bg-gray-300"}`}>
        <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${on ? "translate-x-[22px]" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}
