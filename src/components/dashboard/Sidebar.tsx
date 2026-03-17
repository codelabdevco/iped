"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Receipt, FolderOpen, PiggyBank, BarChart3,
  Settings, LogOut, ChevronLeft, ChevronRight, Moon, Sun,
  Wallet, TrendingUp, TrendingDown, Repeat, ScanLine, FileCheck,
  Copy, CreditCard, Bell, Bot, Mail, Cloud, Download,
  Users, Building2, CheckSquare, FileSpreadsheet, Shield,
  Package, Globe, BadgeDollarSign, ChevronDown,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

type Mode = "personal" | "business";

interface NavGroup {
  label: string;
  items: { label: string; href: string; icon: React.ElementType }[];
}

/* ────────────────────────────────
   ส่วนตัว — 4 กลุ่ม
   ──────────────────────────────── */
const personalNav: NavGroup[] = [
  {
    label: "การเงิน",
    items: [
      { label: "ภาพรวม", href: "/dashboard", icon: LayoutDashboard },
      { label: "รายรับ", href: "/dashboard/income", icon: TrendingUp },
      { label: "รายจ่าย", href: "/dashboard/expenses", icon: TrendingDown },
      { label: "เงินออม", href: "/dashboard/savings", icon: PiggyBank },
      { label: "รายการประจำ", href: "/dashboard/recurring", icon: Repeat },
      { label: "งบประมาณ", href: "/dashboard/budget", icon: Wallet },
      { label: "หมวดหมู่", href: "/dashboard/categories", icon: FolderOpen },
      { label: "วิธีจ่าย", href: "/dashboard/payments", icon: CreditCard },
      { label: "สกุลเงิน", href: "/dashboard/currency", icon: Globe },
    ],
  },
  {
    label: "เอกสาร",
    items: [
      { label: "สแกน AI OCR", href: "/dashboard/scan", icon: ScanLine },
      { label: "ใบเสร็จ / เอกสาร", href: "/dashboard/receipts", icon: Receipt },
      { label: "จับคู่เอกสาร", href: "/dashboard/matching", icon: FileCheck },
      { label: "ตรวจเอกสารซ้ำ", href: "/dashboard/duplicates", icon: Copy },
    ],
  },
  {
    label: "รายงาน & แจ้งเตือน",
    items: [
      { label: "สรุป & Trend", href: "/dashboard/reports", icon: BarChart3 },
      { label: "แจ้งเตือน", href: "/dashboard/notifications", icon: Bell },
      { label: "ส่งออก PDF / CSV", href: "/dashboard/export", icon: Download },
    ],
  },
  {
    label: "เชื่อมต่อ",
    items: [
      { label: "LINE Bot", href: "/dashboard/line-bot", icon: Bot },
      { label: "Email Scanner", href: "/dashboard/email-scanner", icon: Mail },
      { label: "Drive / Sheets / Notion", href: "/dashboard/sync", icon: Cloud },
    ],
  },
];

/* ────────────────────────────────
   บริษัท — 6 กลุ่ม
   ──────────────────────────────── */
const businessNav: NavGroup[] = [
  {
    label: "การเงิน",
    items: [
      { label: "ภาพรวม", href: "/dashboard", icon: LayoutDashboard },
      { label: "รายรับ", href: "/dashboard/income", icon: TrendingUp },
      { label: "รายจ่าย", href: "/dashboard/expenses", icon: TrendingDown },
      { label: "รายการประจำ", href: "/dashboard/recurring", icon: Repeat },
      { label: "งบประมาณ", href: "/dashboard/budget", icon: Wallet },
      { label: "หมวดหมู่", href: "/dashboard/categories", icon: FolderOpen },
      { label: "วิธีจ่าย", href: "/dashboard/payments", icon: CreditCard },
      { label: "สกุลเงิน", href: "/dashboard/currency", icon: Globe },
      { label: "VAT / WHT", href: "/dashboard/tax", icon: BadgeDollarSign },
    ],
  },
  {
    label: "เอกสาร",
    items: [
      { label: "สแกน AI OCR", href: "/dashboard/scan", icon: ScanLine },
      { label: "ใบเสร็จ / เอกสาร", href: "/dashboard/receipts", icon: Receipt },
      { label: "จับคู่เอกสาร", href: "/dashboard/matching", icon: FileCheck },
      { label: "ตรวจเอกสารซ้ำ", href: "/dashboard/duplicates", icon: Copy },
    ],
  },
  {
    label: "องค์กร",
    items: [
      { label: "พนักงาน & แผนก", href: "/dashboard/team", icon: Users },
      { label: "อนุมัติรายจ่าย", href: "/dashboard/approvals", icon: CheckSquare },
    ],
  },
  {
    label: "รายงาน & แจ้งเตือน",
    items: [
      { label: "สรุป & Trend", href: "/dashboard/reports", icon: BarChart3 },
      { label: "เชื่อมโปรแกรมบัญชี", href: "/dashboard/accounting", icon: FileSpreadsheet },
      { label: "แจ้งเตือน", href: "/dashboard/notifications", icon: Bell },
      { label: "ส่งออก PDF / CSV", href: "/dashboard/export", icon: Download },
    ],
  },
  {
    label: "เชื่อมต่อ",
    items: [
      { label: "LINE Bot", href: "/dashboard/line-bot", icon: Bot },
      { label: "Email Scanner", href: "/dashboard/email-scanner", icon: Mail },
      { label: "Drive / Sheets / Notion", href: "/dashboard/sync", icon: Cloud },
    ],
  },
  {
    label: "ระบบ",
    items: [
      { label: "Admin Dashboard", href: "/dashboard/admin", icon: Building2 },
      { label: "Package & Billing", href: "/dashboard/billing", icon: Package },
      { label: "PDPA & Audit Logs", href: "/dashboard/security", icon: Shield },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mode, setMode] = useState<Mode>("personal");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const pathname = usePathname();
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const saved = localStorage.getItem("iped-mode") as Mode | null;
    if (saved) setMode(saved);
  }, []);

  const switchMode = (m: Mode) => {
    setMode(m);
    localStorage.setItem("iped-mode", m);
  };

  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const navGroups = mode === "personal" ? personalNav : businessNav;

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  const handleLogout = async () => {
    document.cookie = "iped-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  const bg = isDark
    ? "bg-[#111111] border-[rgba(255,255,255,0.06)]"
    : "bg-white border-gray-200";
  const txt = isDark
    ? "text-white/60 hover:text-white hover:bg-[rgba(255,255,255,0.04)]"
    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100";
  const activeCls = "bg-[#FA3633]/10 text-[#FA3633]";
  const borderCls = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const sectionLabel = isDark ? "text-white/30" : "text-gray-400";

  const fadeStyle = (): React.CSSProperties => ({
    opacity: collapsed ? 0 : 1,
    transform: collapsed ? "translateX(-8px)" : "translateX(0)",
    transition: "opacity 200ms ease, transform 200ms ease",
    pointerEvents: collapsed ? "none" : "auto",
  });

  return (
    <aside
      className={`${bg} border-r flex flex-col overflow-hidden`}
      style={{
        width: collapsed ? 70 : 260,
        minWidth: collapsed ? 70 : 260,
        transition:
          "width 300ms cubic-bezier(0.4,0,0.2,1), min-width 300ms cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {/* Logo */}
      <div className={`h-16 flex items-center px-4 border-b ${borderCls} overflow-hidden`}>
        <div className="flex items-center gap-3 whitespace-nowrap">
          <div className="w-8 h-8 bg-[#FA3633] rounded-lg flex items-center justify-center font-bold text-sm shrink-0 text-white">
            iP
          </div>
          <span className="text-lg font-semibold tracking-tight" style={fadeStyle()}>
            iPED
          </span>
        </div>
      </div>

      {/* Mode Switcher */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-1">
          <div
            className={`flex p-1 rounded-xl ${
              isDark ? "bg-white/5" : "bg-gray-100"
            }`}
          >
            <button
              onClick={() => switchMode("personal")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === "personal"
                  ? "bg-[#FA3633] text-white shadow-sm shadow-[#FA3633]/25"
                  : isDark
                    ? "text-white/50 hover:text-white/70"
                    : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Wallet size={14} />
              ส่วนตัว
            </button>
            <button
              onClick={() => switchMode("business")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === "business"
                  ? "bg-[#FA3633] text-white shadow-sm shadow-[#FA3633]/25"
                  : isDark
                    ? "text-white/50 hover:text-white/70"
                    : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Building2 size={14} />
              บริษัท
            </button>
          </div>
        </div>
      )}

      {/* Collapsed mode indicator */}
      {collapsed && (
        <div className="flex justify-center py-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
              isDark
                ? "bg-white/5 text-white/50 hover:bg-white/10"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
            onClick={() => switchMode(mode === "personal" ? "business" : "personal")}
            title={mode === "personal" ? "ส่วนตัว — คลิกเพื่อสลับ" : "บริษัท — คลิกเพื่อสลับ"}
          >
            {mode === "personal" ? <Wallet size={16} /> : <Building2 size={16} />}
          </div>
        </div>
      )}

      {/* Nav Groups */}
      <nav className="flex-1 py-2 px-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navGroups.map((group, gi) => {
          const isGroupCollapsed = collapsedGroups[group.label];
          return (
            <div key={group.label}>
              {/* Section Label */}
              {!collapsed && (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={`flex items-center justify-between w-full px-2 ${gi === 0 ? "pt-2" : "pt-4"} pb-1.5 ${sectionLabel}`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    {group.label}
                  </span>
                  <ChevronDown
                    size={12}
                    className={`transition-transform duration-200 ${
                      isGroupCollapsed ? "-rotate-90" : ""
                    }`}
                  />
                </button>
              )}

              {/* Collapsed: divider dot */}
              {collapsed && gi !== 0 && (
                <div className="flex justify-center py-2">
                  <div
                    className={`w-1 h-1 rounded-full ${
                      isDark ? "bg-white/15" : "bg-gray-300"
                    }`}
                  />
                </div>
              )}

              {/* Items */}
              {(!isGroupCollapsed || collapsed) &&
                group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap overflow-hidden ${
                        active ? activeCls : txt
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon size={18} className="shrink-0" />
                      <span style={fadeStyle()}>{item.label}</span>
                    </Link>
                  );
                })}
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className={`py-3 px-3 border-t ${borderCls} space-y-0.5 overflow-hidden`}>
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium ${txt} w-full whitespace-nowrap overflow-hidden`}
          title={collapsed ? (isDark ? "โหมดสว่าง" : "โหมดมืด") : undefined}
        >
          {isDark ? (
            <Sun size={18} className="shrink-0" />
          ) : (
            <Moon size={18} className="shrink-0" />
          )}
          <span style={fadeStyle()}>{isDark ? "โหมดสว่าง" : "โหมดมืด"}</span>
        </button>

        <Link
          href="/dashboard/settings"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap overflow-hidden ${
            pathname.startsWith("/dashboard/settings") ? activeCls : txt
          }`}
        >
          <Settings size={18} className="shrink-0" />
          <span style={fadeStyle()}>ตั้งค่า</span>
        </Link>

        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium ${
            isDark
              ? "text-white/60 hover:text-red-400 hover:bg-[rgba(255,255,255,0.04)]"
              : "text-gray-500 hover:text-red-500 hover:bg-gray-100"
          } transition-colors w-full whitespace-nowrap overflow-hidden`}
        >
          <LogOut size={18} className="shrink-0" />
          <span style={fadeStyle()}>ออกจากระบบ</span>
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] ${txt} w-full whitespace-nowrap overflow-hidden`}
        >
          {collapsed ? (
            <ChevronRight size={18} className="shrink-0" />
          ) : (
            <ChevronLeft size={18} className="shrink-0" />
          )}
          <span style={fadeStyle()}>ย่อเมนู</span>
        </button>
      </div>
    </aside>
  );
}
