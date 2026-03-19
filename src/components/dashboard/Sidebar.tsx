"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Receipt, FolderOpen, PiggyBank, BarChart3,
  Settings, LogOut, ChevronLeft, ChevronRight, Moon, Sun,
  Wallet, TrendingUp, TrendingDown, Repeat, ScanLine, FileCheck,
  Copy, CreditCard, Bell, Bot, Mail, Cloud, Download,
  Users, Building2, CheckSquare, FileSpreadsheet, Shield,
  Package, Globe, BadgeDollarSign, ChevronDown,
  ContactRound, FileOutput, FileInput, CircleDollarSign, ShieldCheck,
  ArrowRightLeft,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useMode } from "@/contexts/ModeContext";

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
    ],
  },
  {
    label: "เอกสาร",
    items: [
      { label: "Cloud Drive", href: "/dashboard/drive", icon: Cloud },
      { label: "ใบเสร็จ / เอกสาร", href: "/dashboard/receipts", icon: Receipt },
      { label: "สแกน & จับคู่", href: "/dashboard/matching", icon: ScanLine },
      { label: "ตรวจเอกสารซ้ำ", href: "/dashboard/duplicates", icon: Copy },
    ],
  },
  {
    label: "บริษัท",
    items: [
      { label: "สถานะเบิกจ่าย", href: "/dashboard/my-claims", icon: ArrowRightLeft },
    ],
  },
  {
    label: "รายงาน",
    items: [
      { label: "สรุป & Trend", href: "/dashboard/reports", icon: BarChart3 },
    ],
  },
];

/* ────────────────────────────────
   บริษัท — กลุ่ม
   ──────────────────────────────── */
const businessNav: NavGroup[] = [
  {
    label: "การเงิน",
    items: [
      { label: "ภาพรวม", href: "/dashboard", icon: LayoutDashboard },
      { label: "รายรับ", href: "/dashboard/income", icon: TrendingUp },
      { label: "รายจ่าย", href: "/dashboard/expenses", icon: TrendingDown },
      { label: "เงินออม", href: "/dashboard/savings", icon: PiggyBank },
      { label: "VAT / WHT", href: "/dashboard/tax", icon: BadgeDollarSign },
    ],
  },
  {
    label: "ลูกค้า & คู่ค้า",
    items: [
      { label: "รายชื่อลูกค้า", href: "/dashboard/customers", icon: ContactRound },
      { label: "ใบเสนอราคา", href: "/dashboard/quotations", icon: FileOutput },
      { label: "ใบแจ้งหนี้ขาออก", href: "/dashboard/invoices", icon: FileInput },
      { label: "ยอดค้างชำระ", href: "/dashboard/receivables", icon: CircleDollarSign },
    ],
  },
  {
    label: "เอกสาร",
    items: [
      { label: "Cloud Drive", href: "/dashboard/drive", icon: Cloud },
      { label: "ใบเสร็จ / เอกสาร", href: "/dashboard/receipts", icon: Receipt },
      { label: "สแกน & จับคู่", href: "/dashboard/matching", icon: ScanLine },
      { label: "ตรวจเอกสารซ้ำ", href: "/dashboard/duplicates", icon: Copy },
    ],
  },
  {
    label: "องค์กร",
    items: [
      { label: "ควบคุมองค์กร", href: "/dashboard/org-control", icon: LayoutDashboard },
      { label: "พนักงาน & แผนก", href: "/dashboard/team", icon: Users },
      { label: "จ่ายเงินเดือน", href: "/dashboard/payroll", icon: BadgeDollarSign },
      { label: "อนุมัติรายจ่าย", href: "/dashboard/approvals", icon: CheckSquare },
      { label: "ค่าใช้จ่ายบริษัท", href: "/dashboard/reimbursement", icon: ArrowRightLeft },
    ],
  },
  {
    label: "รายงาน",
    items: [
      { label: "สรุป & Trend", href: "/dashboard/reports", icon: BarChart3 },
      { label: "เชื่อมโปรแกรมบัญชี", href: "/dashboard/accounting", icon: FileSpreadsheet },
    ],
  },
  {
    label: "ระบบ",
    items: [
      { label: "จัดการผู้ใช้งาน", href: "/dashboard/admin", icon: ShieldCheck },
      { label: "จัดการ Subscription", href: "/dashboard/admin/subscriptions", icon: CreditCard },
      { label: "Package & Billing", href: "/dashboard/billing", icon: Package },
    ],
  },
];

export default function Sidebar({ onNavigate, badges = {}, hasOrg = false, planUsage }: { onNavigate?: () => void; badges?: Record<string, number>; hasOrg?: boolean; planUsage?: any }) {
  const [collapsed, setCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const navRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const { mode, switchMode: ctxSwitchMode } = useMode();

  // Build href with mode prefix: /personal/dashboard/receipts or /business/dashboard/receipts
  const modeHref = (href: string) => `/${mode}${href}`;

  // Extract raw dashboard path from current URL (strip /personal or /business prefix)
  const rawPath = pathname.replace(/^\/(personal|business)/, "") || "/dashboard";

  const switchMode = (m: Mode) => {
    ctxSwitchMode(m);
    // Navigate to same page under new mode — <a> tag = full server request = fresh data
    const currentPage = rawPath || "/dashboard";
    window.location.href = `/${m}${currentPage}`;
  };

  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  // Filter nav: hide "บริษัท" section in personal if user hasn't joined a company
  const navGroups = mode === "personal"
    ? (hasOrg ? personalNav : personalNav.filter((g) => g.label !== "บริษัท"))
    : businessNav;

  // Check which nav items exist to determine if a path has children
  const allHrefs = navGroups.flatMap((g) => g.items.map((i) => i.href));
  const isActive = (href: string) => {
    if (rawPath === href) return true;
    if (href === "/dashboard") return rawPath === "/dashboard";
    // If another nav item starts with this href (it's a parent), only exact match
    const hasChild = allHrefs.some((h) => h !== href && h.startsWith(href + "/"));
    if (hasChild) return rawPath === href;
    // Otherwise allow prefix match for sub-pages not in nav
    return rawPath.startsWith(href + "/");
  };

  // Auto-collapse groups without active item + scroll active into view
  useEffect(() => {
    const init: Record<string, boolean> = {};
    navGroups.forEach((g) => {
      const hasActive = g.items.some((i) => isActive(i.href));
      if (!hasActive) init[g.label] = true;
    });
    setCollapsedGroups(init);
    setTimeout(() => {
      const el = navRef.current?.querySelector("[data-active='true']");
      if (el) el.scrollIntoView({ block: "nearest", behavior: "instant" });
    }, 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const muted = isDark ? "text-white/30" : "text-gray-400";

  const fadeStyle = (): React.CSSProperties => ({
    opacity: collapsed ? 0 : 1,
    transform: collapsed ? "translateX(-8px)" : "translateX(0)",
    transition: "opacity 200ms ease, transform 200ms ease",
    pointerEvents: collapsed ? "none" : "auto",
  });

  return (
    <aside
      className={`${bg} border-r flex flex-col h-full overflow-hidden`}
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
          <img src="/logo-cropped.png" alt="อาซิ่ม" className="w-10 h-10 rounded-xl shrink-0 object-cover" />
          <div className="flex flex-col items-start justify-center h-10" style={fadeStyle()}>
            <span className={`text-[17px] font-bold tracking-tight leading-tight ${isDark ? "text-white" : "text-gray-900"}`}>อาซิ่ม</span>
            <span className={`text-[8px] tracking-[0.05em] leading-tight ${isDark ? "text-white/20" : "text-gray-300"}`}>Powered by codelabs tech</span>
          </div>
        </div>
      </div>

      {/* Mode Switcher — only show if user joined a company */}
      {!collapsed && hasOrg && (
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
      {hasOrg && collapsed && (
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
      <nav ref={navRef} className="flex-1 py-1 px-2 space-y-0 overflow-y-auto overflow-x-hidden">
        {navGroups.map((group, gi) => {
          const isGroupCollapsed = collapsedGroups[group.label];
          return (
            <div key={group.label}>
              {/* Section Label */}
              {!collapsed && (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={`flex items-center justify-between w-full px-3 ${gi === 0 ? "pt-1" : "pt-2.5"} pb-1 ${sectionLabel}`}
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
                  const badgeKey = item.href.split("?")[0];
                  const badge = badges[badgeKey];
                  return (
                    <Link
                      key={item.href}
                      href={modeHref(item.href)}
                      onClick={onNavigate}
                      data-active={active ? "true" : undefined}
                      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors whitespace-nowrap overflow-hidden ${
                        active ? activeCls : txt
                      }`}
                      title={collapsed ? `${item.label}${badge ? ` (${badge})` : ""}` : undefined}
                    >
                      <div className="relative shrink-0">
                        <Icon size={16} />
                        {collapsed && badge ? (
                          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-[#FA3633] text-white text-[9px] font-bold leading-none">
                            {badge > 99 ? "99+" : badge}
                          </span>
                        ) : null}
                      </div>
                      <span className="flex-1" style={fadeStyle()}>{item.label}</span>
                      {!collapsed && badge ? (
                        <span className="ml-auto px-1.5 py-0.5 min-w-[20px] text-center rounded-full bg-[#FA3633] text-white text-[10px] font-bold leading-none" style={fadeStyle()}>
                          {badge > 99 ? "99+" : badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
            </div>
          );
        })}
        {/* Theme toggle */}
        <div className="pt-2">
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12.5px] font-medium ${txt} w-full whitespace-nowrap overflow-hidden`}
            title={collapsed ? (isDark ? "โหมดสว่าง" : "โหมดมืด") : undefined}
          >
            {isDark ? <Sun size={16} className="shrink-0" /> : <Moon size={16} className="shrink-0" />}
            <span style={fadeStyle()}>{isDark ? "โหมดสว่าง" : "โหมดมืด"}</span>
          </button>
        </div>
      </nav>

      {/* Bottom */}
      <div className={`py-1.5 px-2 border-t ${borderCls} overflow-hidden`}>
        {/* Plan badge */}
        {planUsage && !collapsed && (
          <Link href={modeHref("/dashboard/billing")} className={`flex items-center justify-between px-2.5 py-1 mb-1 rounded-lg ${isDark ? "bg-white/[0.03] hover:bg-white/[0.06]" : "bg-gray-50 hover:bg-gray-100"} transition-colors`}>
            <span className={`text-[10px] font-bold ${muted}`}>{planUsage.planName?.toUpperCase()}</span>
            <span className={`text-[9px] ${sub}`}>{planUsage.usage?.receipts || 0}/{(planUsage.limits?.receiptsPerMonth ?? 30) === -1 ? "\u221E" : planUsage.limits?.receiptsPerMonth ?? 30} ใบเสร็จ</span>
          </Link>
        )}
        <div className="flex gap-0.5">
          <Link
            href={modeHref("/dashboard/settings")}
            className={`flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap overflow-hidden ${
              rawPath.startsWith("/dashboard/settings") ? activeCls : txt
            }`}
          >
            <Settings size={15} className="shrink-0" />
            <span style={fadeStyle()}>ตั้งค่า</span>
          </Link>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] font-medium ${
              isDark ? "text-white/40 hover:text-red-400 hover:bg-white/[0.04]" : "text-gray-400 hover:text-red-500 hover:bg-gray-100"
            } transition-colors whitespace-nowrap overflow-hidden`}
          >
            <LogOut size={15} className="shrink-0" />
            <span style={fadeStyle()}>ออก</span>
          </button>
        </div>

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
