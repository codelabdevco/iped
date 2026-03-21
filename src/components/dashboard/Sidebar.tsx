"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Receipt, FolderOpen, PiggyBank, BarChart3,
  Settings, LogOut, ChevronLeft, ChevronRight, Moon, Sun,
  Wallet, TrendingUp, TrendingDown, Repeat, ScanLine, FileCheck,
  Copy, CreditCard, Bell, Bot, Mail, Cloud, Download,
  Users, Building2, CheckSquare, FileSpreadsheet, Shield,
  Package, Globe, BadgeDollarSign, ChevronDown,
  ContactRound, FileOutput, FileInput, CircleDollarSign, ShieldCheck,
  ArrowRightLeft, Landmark,
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
    label: "ทรัพย์สิน & หนี้สิน",
    items: [
      { label: "ทรัพย์สิน & ครุภัณฑ์", href: "/dashboard/assets", icon: Package },
      { label: "หนี้สินบริษัท", href: "/dashboard/debts", icon: Landmark },
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
      { label: "รายการชำระเงิน", href: "/dashboard/admin/payments", icon: Receipt },
      { label: "Package & Billing", href: "/dashboard/billing", icon: Package },
    ],
  },
];

export default function Sidebar({ onNavigate, badges = {}, hasOrg = false, planUsage }: { onNavigate?: () => void; badges?: Record<string, number>; hasOrg?: boolean; planUsage?: any }) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      try { return localStorage.getItem("iped-sidebar-collapsed") === "true"; } catch {}
    }
    return false;
  });
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("iped-sidebar-groups");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {};
  });
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
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
    setCollapsedGroups((prev) => {
      const next = { ...prev, [label]: !prev[label] };
      try { localStorage.setItem("iped-sidebar-groups", JSON.stringify(next)); } catch {}
      return next;
    });
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

  // Auto-collapse groups without active item (only if no saved state) + auto-expand active group + scroll into view
  useEffect(() => {
    const hasSaved = (() => {
      try { return !!localStorage.getItem("iped-sidebar-groups"); } catch { return false; }
    })();
    if (!hasSaved) {
      const init: Record<string, boolean> = {};
      navGroups.forEach((g) => {
        const hasActive = g.items.some((i) => isActive(i.href));
        if (!hasActive) init[g.label] = true;
      });
      setCollapsedGroups(init);
      try { localStorage.setItem("iped-sidebar-groups", JSON.stringify(init)); } catch {}
    } else {
      // Even with saved state, always expand the group containing the active item
      setCollapsedGroups((prev) => {
        let changed = false;
        const next = { ...prev };
        navGroups.forEach((g) => {
          const hasActive = g.items.some((i) => isActive(i.href));
          if (hasActive && next[g.label]) {
            next[g.label] = false;
            changed = true;
          }
        });
        if (changed) {
          try { localStorage.setItem("iped-sidebar-groups", JSON.stringify(next)); } catch {}
        }
        return changed ? next : prev;
      });
    }
    setTimeout(() => {
      const el = navRef.current?.querySelector("[data-active='true']");
      if (el) el.scrollIntoView({ block: "nearest", behavior: "instant" });
    }, 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll indicator detection
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const check = () => {
      setCanScrollUp(nav.scrollTop > 8);
      setCanScrollDown(nav.scrollTop + nav.clientHeight < nav.scrollHeight - 8);
    };
    check();
    nav.addEventListener("scroll", check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(nav);
    return () => { nav.removeEventListener("scroll", check); ro.disconnect(); };
  }, [collapsed, mode]);

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

  const [tooltip, setTooltip] = useState<{ text: string; top: number } | null>(null);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout>>();

  const showTooltip = (e: React.MouseEvent, text: string) => {
    if (!collapsed) return;
    clearTimeout(tooltipTimer.current);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({ text, top: rect.top + rect.height / 2 });
  };
  const hideTooltip = () => {
    clearTimeout(tooltipTimer.current);
    tooltipTimer.current = setTimeout(() => setTooltip(null), 100);
  };

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
      <div className="flex-1 relative overflow-hidden">
        {/* Scroll fade top */}
        <div
          className={`absolute top-0 left-0 right-0 h-6 z-10 pointer-events-none transition-opacity duration-200 ${canScrollUp ? "opacity-100" : "opacity-0"}`}
          style={{ background: isDark ? "linear-gradient(to bottom, #111111, transparent)" : "linear-gradient(to bottom, white, transparent)" }}
        />
        {/* Scroll fade bottom */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-6 z-10 pointer-events-none transition-opacity duration-200 ${canScrollDown ? "opacity-100" : "opacity-0"}`}
          style={{ background: isDark ? "linear-gradient(to top, #111111, transparent)" : "linear-gradient(to top, white, transparent)" }}
        />
      <nav ref={navRef} className="h-full py-1 px-2 space-y-0 overflow-y-auto overflow-x-hidden">
        {navGroups.map((group, gi) => {
          const isGroupCollapsed = collapsedGroups[group.label];
          return (
            <div key={group.label}>
              {/* Section Label */}
              {!collapsed && (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={`flex items-center justify-between w-full px-3 ${gi === 0 ? "pt-2" : "pt-3.5"} pb-1.5 rounded-md hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors ${sectionLabel}`}
                >
                  <span className="text-[11px] font-bold uppercase tracking-widest">
                    {group.label}
                  </span>
                  <ChevronDown
                    size={14}
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
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap overflow-hidden ${
                        active ? activeCls : txt
                      }`}
                      onMouseEnter={(e) => showTooltip(e, `${item.label}${badge ? ` (${badge})` : ""}`)}
                      onMouseLeave={hideTooltip}
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
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium ${txt} w-full whitespace-nowrap overflow-hidden`}
            title={collapsed ? (isDark ? "โหมดสว่าง" : "โหมดมืด") : undefined}
          >
            {isDark ? <Sun size={16} className="shrink-0" /> : <Moon size={16} className="shrink-0" />}
            <span style={fadeStyle()}>{isDark ? "โหมดสว่าง" : "โหมดมืด"}</span>
          </button>
        </div>
      </nav>
      </div>

      {/* Bottom */}
      <div className={`border-t ${borderCls} overflow-hidden`}>
        {/* Plan badge */}
        {planUsage && !collapsed && (
          <div className="px-2 pt-2">
            <Link href={modeHref("/dashboard/billing")} className={`flex items-center justify-between px-3 py-2 rounded-xl ${isDark ? "bg-white/[0.04] hover:bg-white/[0.07]" : "bg-gray-50 hover:bg-gray-100"} transition-colors`}>
              <span className={`text-[10px] font-bold tracking-wide ${muted}`}>{planUsage.planName?.toUpperCase()}</span>
              <span className={`text-[10px] ${sub}`}>{planUsage.usage?.receipts || 0}/{(planUsage.limits?.receiptsPerMonth ?? 30) === -1 ? "\u221E" : planUsage.limits?.receiptsPerMonth ?? 30} ใบเสร็จ</span>
            </Link>
          </div>
        )}

        {/* Settings & Logout group */}
        <div className="px-2 pt-2 space-y-0.5">
          <Link
            href={modeHref("/dashboard/settings")}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap overflow-hidden w-full ${
              rawPath.startsWith("/dashboard/settings") ? activeCls : txt
            }`}
            onMouseEnter={(e) => showTooltip(e, "ตั้งค่า")}
            onMouseLeave={hideTooltip}
          >
            <Settings size={16} className="shrink-0" />
            <span style={fadeStyle()}>ตั้งค่า</span>
          </Link>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium w-full ${
              isDark ? "text-white/40 hover:text-red-400 hover:bg-white/[0.04]" : "text-gray-400 hover:text-red-500 hover:bg-gray-100"
            } transition-colors whitespace-nowrap overflow-hidden`}
            onMouseEnter={(e) => showTooltip(e, "ออกจากระบบ")}
            onMouseLeave={hideTooltip}
          >
            <LogOut size={16} className="shrink-0" />
            <span style={fadeStyle()}>ออกจากระบบ</span>
          </button>
        </div>

        {/* Collapse toggle — visually separated */}
        <div className={`mx-2 mt-1.5 mb-2 pt-1.5 border-t ${isDark ? "border-white/[0.04]" : "border-gray-100"}`}>
          <button
            onClick={() => {
              const next = !collapsed;
              setCollapsed(next);
              try { localStorage.setItem("iped-sidebar-collapsed", String(next)); } catch {}
            }}
            className={`flex items-center justify-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12px] w-full whitespace-nowrap overflow-hidden ${
              isDark ? "text-white/25 hover:text-white/50 hover:bg-white/[0.03]" : "text-gray-300 hover:text-gray-500 hover:bg-gray-50"
            } transition-colors`}
            onMouseEnter={(e) => showTooltip(e, collapsed ? "ขยายเมนู" : "ย่อเมนู")}
            onMouseLeave={hideTooltip}
          >
            {collapsed ? (
              <ChevronRight size={15} className="shrink-0" />
            ) : (
              <>
                <ChevronLeft size={15} className="shrink-0" />
                <span style={fadeStyle()}>ย่อเมนู</span>
              </>
            )}
          </button>
        </div>
      </div>
      {/* Tooltip for collapsed mode */}
      {collapsed && tooltip && (
        <div
          className={`fixed z-50 px-3 py-1.5 rounded-lg text-[12px] font-medium shadow-lg pointer-events-none whitespace-nowrap ${
            isDark ? "bg-[#222] text-white border border-white/10" : "bg-gray-900 text-white"
          }`}
          style={{
            left: 78,
            top: tooltip.top,
            transform: "translateY(-50%)",
          }}
        >
          {tooltip.text}
          <div
            className={`absolute top-1/2 -left-1 w-2 h-2 rotate-45 -translate-y-1/2 ${
              isDark ? "bg-[#222] border-l border-b border-white/10" : "bg-gray-900"
            }`}
          />
        </div>
      )}
    </aside>
  );
}
