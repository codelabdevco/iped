"use client";

import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Settings, ChevronRight, Bell, Shield, CreditCard, LogOut, Receipt, TrendingUp, Calendar, Target, Moon, Sun, Zap, FileText } from "lucide-react";
import BrandIcon from "@/components/dashboard/BrandIcon";

interface ProfileProps {
  profile: {
    _id: string;
    name: string;
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

export default function ProfileClient({ profile, stats }: ProfileProps) {
  const { isDark, toggleTheme } = useTheme();

  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const muted = isDark ? "text-white/30" : "text-gray-400";
  const hoverBg = isDark ? "hover:bg-white/5" : "hover:bg-gray-50";

  const streakEmoji = stats.streak >= 30 ? "🔥" : stats.streak >= 7 ? "⚡" : stats.streak >= 1 ? "👍" : "👋";
  const streakLevel = stats.streak >= 30 ? "ระดับ Pro" : stats.streak >= 7 ? "ระดับขยัน" : stats.streak >= 1 ? "เริ่มต้นดี" : "เริ่มจดกันเลย!";
  const nextLevel = stats.streak >= 30 ? 60 : stats.streak >= 7 ? 30 : stats.streak >= 1 ? 7 : 1;
  const streakPct = Math.min(100, (stats.streak / nextLevel) * 100);

  const net = stats.monthIncome - stats.monthExpense;
  const budgetPct = profile.monthlyBudget > 0 ? Math.min(100, (stats.monthExpense / profile.monthlyBudget) * 100) : 0;

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-8">
      {/* ── Profile Header ── */}
      <div className={`${card} border ${border} rounded-2xl p-6`}>
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            {profile.lineProfilePic ? (
              <img
                src={profile.lineProfilePic}
                alt={profile.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-[#FA3633]/20"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FA3633] to-[#ff6b6b] flex items-center justify-center text-white text-2xl font-bold">
                {(profile.name || "U")[0]}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-white dark:border-[#0a0a0a] flex items-center justify-center">
              <span className="text-[8px] text-white">✓</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className={`text-lg font-bold ${txt} truncate`}>{profile.lineDisplayName || profile.name}</h1>
            <p className={`text-sm ${sub}`}>
              {profile.occupation || (profile.accountType === "business" ? profile.businessName || "ธุรกิจ" : "บัญชีส่วนตัว")}
            </p>
            {profile.gender && profile.age > 0 && (
              <p className={`text-xs ${muted} mt-0.5`}>{profile.gender} · {profile.age} ปี</p>
            )}

            {/* Connection badges */}
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

      {/* ── Streak Card ── */}
      <div className={`${card} border ${border} rounded-2xl p-5`}>
        <div className="flex items-center justify-between mb-1">
          <span className={`text-sm font-semibold ${txt}`}>จดต่อเนื่องมา</span>
          <a href="/dashboard/receipts" className="text-xs text-[#FA3633]">ดูเพิ่มเติม</a>
        </div>
        <div className="flex items-end gap-2 mb-2">
          <span className={`text-4xl font-bold ${txt}`}>{stats.streak}</span>
          <span className={`text-lg ${sub} mb-1`}>วัน</span>
          <span className="text-2xl mb-0.5">{streakEmoji}</span>
        </div>
        <p className={`text-xs ${muted} mb-3`}>{streakLevel} — เลเวลต่อไปใน {Math.max(0, nextLevel - stats.streak)} วัน</p>
        <div className={`h-2.5 rounded-full ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FA3633] to-[#ff6b6b] transition-all"
            style={{ width: `${streakPct}%` }}
          />
        </div>
      </div>

      {/* ── Personal Info ── */}
      <div className={`${card} border ${border} rounded-2xl p-5`}>
        <p className={`text-sm font-semibold ${txt} mb-3`}>ข้อมูลส่วนตัว</p>
        <div className="space-y-2.5">
          <InfoRow label="ชื่อ" value={profile.name} isDark={isDark} />
          {profile.phone && <InfoRow label="เบอร์โทร" value={profile.phone} isDark={isDark} />}
          {profile.email && <InfoRow label="อีเมล" value={profile.email} isDark={isDark} />}
          {profile.occupation && <InfoRow label="อาชีพ" value={profile.occupation} isDark={isDark} />}
          {profile.gender && <InfoRow label="เพศ" value={profile.gender} isDark={isDark} />}
          {profile.age > 0 && <InfoRow label="อายุ" value={`${profile.age} ปี`} isDark={isDark} />}
          <InfoRow label="ประเภทบัญชี" value={profile.accountType === "business" ? `ธุรกิจ — ${profile.businessName}` : "ส่วนตัว"} isDark={isDark} />
        </div>
        <a href="/dashboard/settings" className="inline-block mt-3 text-xs text-[#FA3633] font-medium">แก้ไขข้อมูล →</a>
      </div>

      {/* ── Account Info ── */}
      <div className={`${card} border ${border} rounded-2xl p-5`}>
        <p className={`text-sm font-semibold ${txt} mb-3`}>ข้อมูลบัญชี</p>
        <div className="space-y-2.5">
          <InfoRow label="สมาชิกตั้งแต่" value={stats.memberSince} isDark={isDark} />
          {stats.lastLogin && <InfoRow label="เข้าใช้ล่าสุด" value={stats.lastLogin} isDark={isDark} />}
          <InfoRow label="เข้าใช้งาน" value={`${profile.loginCount} ครั้ง`} isDark={isDark} />
          <InfoRow label="สถานะ" value={profile.status === "active" ? "✅ ใช้งานอยู่" : profile.status} isDark={isDark} />
          {profile.onboardingComplete && <InfoRow label="Onboarding" value="✅ เสร็จสิ้น" isDark={isDark} />}
        </div>
      </div>

      {/* ── Monthly Stats ── */}
      <div className={`${card} border ${border} rounded-2xl p-5`}>
        <p className={`text-sm font-semibold ${txt} mb-3`}>สรุปเดือนนี้</p>
        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-xl p-3 ${isDark ? "bg-red-500/10" : "bg-red-50"}`}>
            <p className="text-xs text-red-500">รายจ่าย</p>
            <p className="text-lg font-bold text-red-500 mt-1">฿{stats.monthExpense.toLocaleString("th-TH", { minimumFractionDigits: 0 })}</p>
          </div>
          <div className={`rounded-xl p-3 ${isDark ? "bg-green-500/10" : "bg-green-50"}`}>
            <p className="text-xs text-green-500">รายรับ</p>
            <p className="text-lg font-bold text-green-500 mt-1">฿{stats.monthIncome.toLocaleString("th-TH", { minimumFractionDigits: 0 })}</p>
          </div>
        </div>

        {/* Budget bar */}
        {profile.monthlyBudget > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs ${sub}`}>งบประมาณ</span>
              <span className={`text-xs font-medium ${budgetPct > 80 ? "text-red-500" : txt}`}>
                {Math.round(budgetPct)}% ของ ฿{profile.monthlyBudget.toLocaleString()}
              </span>
            </div>
            <div className={`h-2 rounded-full ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
              <div
                className={`h-full rounded-full transition-all ${budgetPct > 80 ? "bg-red-500" : "bg-[#FA3633]"}`}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
          </div>
        )}

        <div className={`flex items-center justify-between mt-3 pt-3 border-t ${border}`}>
          <span className={`text-xs ${sub}`}>ใบเสร็จเดือนนี้</span>
          <span className={`text-sm font-semibold ${txt}`}>{stats.monthReceipts} รายการ</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className={`text-xs ${sub}`}>ใบเสร็จทั้งหมด</span>
          <span className={`text-sm font-semibold ${txt}`}>{stats.totalReceipts} รายการ</span>
        </div>
      </div>

      {/* ── Menu List ── */}
      <div className={`${card} border ${border} rounded-2xl overflow-hidden divide-y ${isDark ? "divide-white/5" : "divide-gray-100"}`}>
        <MenuItem icon={<Bell size={18} />} label="เตือนจดประจำวัน" value={profile.settings.dailySummary ? `เปิด (${profile.settings.dailySummaryTime})` : "ปิด"} href="/dashboard/settings" isDark={isDark} />
        <MenuItem icon={<Target size={18} />} label="งบประมาณรายเดือน" value={profile.monthlyBudget > 0 ? `฿${profile.monthlyBudget.toLocaleString()}` : "ยังไม่ตั้ง"} href="/dashboard/budget" isDark={isDark} />
        <MenuItem icon={<FileText size={18} />} label="รายการประจำ" href="/dashboard/receipts" isDark={isDark} />
        <MenuItem icon={<TrendingUp size={18} />} label="สรุป & Trend" href="/dashboard/reports" isDark={isDark} />
      </div>

      <div className={`${card} border ${border} rounded-2xl overflow-hidden divide-y ${isDark ? "divide-white/5" : "divide-gray-100"}`}>
        <MenuItem icon={<CreditCard size={18} />} label="การเชื่อมต่อ" value={profile.googleEmail ? "Google เชื่อมแล้ว" : "ยังไม่เชื่อมต่อ"} href="/dashboard/settings" isDark={isDark} />
        <MenuItem icon={<Shield size={18} />} label="ความเป็นส่วนตัว" href="/dashboard/settings" isDark={isDark} />
        <button onClick={toggleTheme} className={`w-full flex items-center gap-3 px-4 py-3.5 ${isDark ? "hover:bg-white/5" : "hover:bg-gray-50"} transition-colors`}>
          <span className={isDark ? "text-white/50" : "text-gray-400"}>{isDark ? <Moon size={18} /> : <Sun size={18} />}</span>
          <span className={`text-sm flex-1 text-left ${isDark ? "text-white" : "text-gray-900"}`}>{isDark ? "โหมดมืด" : "โหมดสว่าง"}</span>
          <span className={`text-xs ${isDark ? "text-white/30" : "text-gray-400"}`}>{isDark ? "เปิด" : "ปิด"}</span>
          <ChevronRight size={16} className={isDark ? "text-white/20" : "text-gray-300"} />
        </button>
        <MenuItem icon={<Settings size={18} />} label="ตั้งค่าทั้งหมด" href="/dashboard/settings" isDark={isDark} />
      </div>

      {/* Version */}
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

function MenuItem({ icon, label, value, href, isDark }: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  href: string;
  isDark: boolean;
}) {
  return (
    <a
      href={href}
      className={`flex items-center gap-3 px-4 py-3.5 ${isDark ? "hover:bg-white/5" : "hover:bg-gray-50"} transition-colors`}
    >
      <span className={isDark ? "text-white/50" : "text-gray-400"}>{icon}</span>
      <span className={`text-sm flex-1 ${isDark ? "text-white" : "text-gray-900"}`}>{label}</span>
      {value && <span className={`text-xs ${isDark ? "text-white/30" : "text-gray-400"}`}>{value}</span>}
      <ChevronRight size={16} className={isDark ? "text-white/20" : "text-gray-300"} />
    </a>
  );
}
