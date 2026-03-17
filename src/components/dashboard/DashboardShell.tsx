"use client";

import { useState, useCallback } from "react";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

function ShellInner({ displayName, children }: { displayName: string; children: React.ReactNode }) {
  const { isDark } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleMobile = useCallback(() => setMobileOpen((p) => !p), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <div className={`flex h-screen overflow-hidden ${isDark ? "bg-[#0a0a0a] text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onNavigate={closeMobile} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header displayName={displayName} pictureUrl="" onMenuToggle={toggleMobile} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardShell({ displayName, children }: { displayName: string; children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ShellInner displayName={displayName}>{children}</ShellInner>
    </ThemeProvider>
  );
}
