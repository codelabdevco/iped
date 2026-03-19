"use client";

import { useState, useCallback } from "react";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { ModeProvider } from "@/contexts/ModeContext";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

interface ShellProps {
  displayName: string;
  pictureUrl?: string;
  pendingReceipts?: number;
  children: React.ReactNode;
}

function ShellInner({ displayName, pictureUrl, pendingReceipts, children }: ShellProps) {
  const { isDark } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleMobile = useCallback(() => setMobileOpen((p) => !p), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const badges: Record<string, number> = {};
  if (pendingReceipts && pendingReceipts > 0) {
    badges["/dashboard/receipts"] = pendingReceipts;
  }

  return (
    <div className="flex h-screen overflow-hidden shell-theme">
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full">
        <Sidebar badges={badges} />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={closeMobile} />
      )}

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar onNavigate={closeMobile} badges={badges} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header displayName={displayName} pictureUrl={pictureUrl} onMenuToggle={toggleMobile} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardShell({ displayName, pictureUrl, pendingReceipts, children }: ShellProps) {
  return (
    <ThemeProvider>
      <ModeProvider>
        <ShellInner displayName={displayName} pictureUrl={pictureUrl} pendingReceipts={pendingReceipts}>{children}</ShellInner>
      </ModeProvider>
    </ThemeProvider>
  );
}
