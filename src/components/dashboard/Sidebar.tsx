"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Receipt, FolderOpen, PiggyBank,
  BarChart3, FileText, Settings, LogOut, ChevronLeft,
  ChevronRight, Moon, Sun,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const navItems = [
  { label: "\u0e20\u0e32\u0e1e\u0e23\u0e27\u0e21", href: "/dashboard", icon: LayoutDashboard },
  { label: "\u0e43\u0e1a\u0e40\u0e2a\u0e23\u0e47\u0e08", href: "/dashboard/receipts", icon: Receipt },
  { label: "\u0e2b\u0e21\u0e27\u0e14\u0e2b\u0e21\u0e39\u0e48", href: "/dashboard/categories", icon: FolderOpen },
  { label: "\u0e07\u0e1a\u0e1b\u0e23\u0e30\u0e21\u0e32\u0e13", href: "/dashboard/budget", icon: PiggyBank },
  { label: "\u0e2a\u0e23\u0e38\u0e1b\u0e23\u0e32\u0e22\u0e07\u0e32\u0e19", href: "/dashboard/reports", icon: BarChart3 },
  { label: "\u0e40\u0e2d\u0e01\u0e2a\u0e32\u0e23", href: "/dashboard/documents", icon: FileText },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const isActive = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  const handleLogout = async () => {
    document.cookie = "iped-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  const bg = isDark ? "bg-[#111111] border-white/10" : "bg-white border-gray-200";
  const txt = isDark ? "text-white/60 hover:text-white hover:bg-white/5" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100";
  const activeCls = "bg-[#FA3633]/10 text-[#FA3633]";
  const borderCls = isDark ? "border-white/5" : "border-gray-200";

  return (
    <aside className={`${collapsed ? "w-[70px]" : "w-[240px]"} ${bg} border-r flex flex-col transition-all duration-300`}>
      {/* Logo */}
      <div className={`h-16 flex items-center px-4 border-b ${borderCls}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#FA3633] rounded-lg flex items-center justify-center font-bold text-sm shrink-0 text-white">iP</div>
          {!collapsed && <span className="text-lg font-semibold tracking-tight">iPED</span>}
        </div>
      </div>
      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? activeCls : txt}`}
              title={collapsed ? item.label : undefined}>
              <Icon size={20} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      {/* Bottom */}
      <div className={`py-4 px-3 border-t ${borderCls} space-y-1`}>
        <button onClick={toggleTheme}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${txt} w-full`}
          title={collapsed ? (isDark ? "Light Mode" : "Dark Mode") : undefined}>
          {isDark ? <Sun size={20} className="shrink-0" /> : <Moon size={20} className="shrink-0" />}
          {!collapsed && <span>{isDark ? "\u0e42\u0e2b\u0e21\u0e14\u0e2a\u0e27\u0e48\u0e32\u0e07" : "\u0e42\u0e2b\u0e21\u0e14\u0e21\u0e37\u0e14"}</span>}
        </button>
        <Link href="/dashboard/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${pathname.startsWith("/dashboard/settings") ? activeCls : txt}`}>
          <Settings size={20} className="shrink-0" />
          {!collapsed && <span>\u0e15\u0e31\u0e49\u0e07\u0e04\u0e48\u0e32</span>}
        </Link>
        <button onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${isDark ? "text-white/60 hover:text-red-400 hover:bg-white/5" : "text-gray-500 hover:text-red-500 hover:bg-gray-100"} transition-colors w-full`}>
          <LogOut size={20} className="shrink-0" />
          {!collapsed && <span>\u0e2d\u0e2d\u0e01\u0e08\u0e32\u0e01\u0e23\u0e30\u0e1a\u0e1a</span>}
        </button>
        <button onClick={() => setCollapsed(!collapsed)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${txt} w-full`}>
          {collapsed ? <ChevronRight size={20} className="shrink-0" /> : (<><ChevronLeft size={20} className="shrink-0" /><span>\u0e22\u0e48\u0e2d\u0e40\u0e21\u0e19\u0e39</span></>)}
        </button>
      </div>
    </aside>
  );
}
