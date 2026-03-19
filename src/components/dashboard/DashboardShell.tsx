"use client";

import { useState, useCallback } from "react";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { ModeProvider } from "@/contexts/ModeContext";
import { ModalProvider } from "@/components/dashboard/ConfirmModal";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

interface ShellProps {
  displayName: string;
  pictureUrl?: string;
  pendingReceipts?: number;
  badges?: Record<string, number>;
  hasOrg?: boolean;
  children: React.ReactNode;
}

function ShellInner({ displayName, pictureUrl, badges: propBadges, hasOrg, children }: ShellProps) {
  const { isDark } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleMobile = useCallback(() => setMobileOpen((p) => !p), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const badges = propBadges || {};

  return (
    <div className="flex h-screen overflow-hidden shell-theme">
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full">
        <Sidebar badges={badges} hasOrg={!!hasOrg} />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={closeMobile} />
      )}

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar onNavigate={closeMobile} badges={badges} hasOrg={!!hasOrg} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header displayName={displayName} pictureUrl={pictureUrl} onMenuToggle={toggleMobile} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardShell({ displayName, pictureUrl, pendingReceipts, badges, hasOrg, children }: ShellProps) {
  return (
    <ThemeProvider>
      <ModeProvider>
        <ModalProvider>
          <ShellInner displayName={displayName} pictureUrl={pictureUrl} badges={badges} hasOrg={hasOrg}>{children}</ShellInner>
        </ModalProvider>
      </ModeProvider>
    </ThemeProvider>
  );
}
