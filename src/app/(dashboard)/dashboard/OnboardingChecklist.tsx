"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  MessageCircle, UserRoundCog, HardDrive, Mail, ScanLine,
  PenTool, Sheet, FolderOpen, Wallet, PiggyBank,
  Building2, Users, CheckSquare, FileSpreadsheet,
  Check, ChevronDown, ChevronUp, X, Sparkles,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface Step {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  href: string;
  autoKey?: string; // key from /api/onboarding/status to auto-detect
}

const personalSteps: Step[] = [
  { id: "line", label: "เชื่อมต่อ LINE", description: "Login + รับแจ้งเตือนผ่าน LINE", icon: MessageCircle, href: "/dashboard/line-bot", autoKey: "line" },
  { id: "mode", label: "เลือกโหมดใช้งาน", description: "เลือกโหมดส่วนตัว", icon: UserRoundCog, href: "/dashboard/settings" },
  { id: "drive", label: "เชื่อมต่อ Google Drive", description: "สำรอง/จัดเก็บเอกสาร", icon: HardDrive, href: "/dashboard/sync", autoKey: "drive" },
  { id: "gmail", label: "เชื่อมต่อ Gmail", description: "สแกนเอกสารจากอีเมลอัตโนมัติ", icon: Mail, href: "/dashboard/email-scanner", autoKey: "gmail" },
  { id: "sheets-notion", label: "เชื่อม Sheets / Notion", description: "เชื่อม Google Sheets หรือ Notion", icon: Sheet, href: "/dashboard/sync" },
  { id: "p-categories", label: "ตั้งหมวดหมู่รายจ่าย", description: "เลือกจาก preset หรือกำหนดเอง", icon: FolderOpen, href: "/dashboard/categories" },
  { id: "p-budget", label: "ตั้งงบประมาณเดือนแรก", description: "งบรายวัน / รายเดือน / ตามหมวด", icon: Wallet, href: "/dashboard/budget", autoKey: "budget" },
  { id: "p-savings", label: "ตั้งเป้าเงินออม", description: "เป้าหมายออมเงินรายเดือน", icon: PiggyBank, href: "/dashboard/savings" },
];

const businessSteps: Step[] = [
  { id: "line", label: "เชื่อมต่อ LINE", description: "Login + รับแจ้งเตือนผ่าน LINE OA", icon: MessageCircle, href: "/dashboard/line-bot", autoKey: "line" },
  { id: "mode", label: "เลือกโหมดใช้งาน", description: "เลือกโหมดบริษัท", icon: UserRoundCog, href: "/dashboard/settings" },
  { id: "drive", label: "เชื่อมต่อ Google Drive", description: "สำรองเอกสารบริษัทอัตโนมัติ", icon: HardDrive, href: "/dashboard/sync", autoKey: "drive" },
  { id: "gmail", label: "เชื่อมต่อ Gmail", description: "สแกนใบแจ้งหนี้/ใบเสร็จจากอีเมล", icon: Mail, href: "/dashboard/email-scanner", autoKey: "gmail" },
  { id: "first-scan", label: "อัปโหลดใบเสร็จแรก", description: "ทดลอง AI OCR สแกนเอกสารจริง", icon: ScanLine, href: "/dashboard/scan", autoKey: "receipts" },
  { id: "signature", label: "ใส่ลายเซ็นรับรอง", description: "ลายเซ็นดิจิทัลผู้มีอำนาจลงนาม", icon: PenTool, href: "/dashboard/settings" },
  { id: "sheets-notion", label: "เชื่อม Sheets / Notion", description: "ส่งออกข้อมูลไป Google Sheets / Notion", icon: Sheet, href: "/dashboard/sync" },
  { id: "b-company", label: "กรอกข้อมูลบริษัท", description: "ชื่อ, เลขผู้เสียภาษี, ที่อยู่, โลโก้", icon: Building2, href: "/dashboard/settings", autoKey: "company" },
  { id: "b-team", label: "เพิ่มพนักงาน & แผนก", description: "เชิญทีม + กำหนดสิทธิ์อนุมัติ", icon: Users, href: "/dashboard/team" },
  { id: "b-approval", label: "ตั้งค่า Approval", description: "กำหนด workflow อนุมัติรายจ่าย", icon: CheckSquare, href: "/dashboard/approvals" },
  { id: "b-categories", label: "ตั้งหมวดหมู่รายจ่าย", description: "หมวดตาม chart of accounts บริษัท", icon: FolderOpen, href: "/dashboard/categories" },
  { id: "b-accounting", label: "เชื่อมโปรแกรมบัญชี", description: "เชื่อมกับซอฟต์แวร์บัญชีที่ใช้อยู่", icon: FileSpreadsheet, href: "/dashboard/accounting" },
];

const STORAGE_KEY = "iped-onboarding";
const PERSONAL_COMMON = 5;
const BUSINESS_COMMON = 7;

export default function OnboardingChecklist() {
  const { isDark } = useTheme();
  const [completed, setCompleted] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<"personal" | "business">("personal");
  const initRef = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    try {
      const savedMode = localStorage.getItem("iped-mode");
      if (savedMode === "business") setMode("business");

      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed: string[] = raw ? JSON.parse(raw) : [];

      if (savedMode && !parsed.includes("mode")) {
        parsed.push("mode");
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }

      setCompleted(parsed);

      if (localStorage.getItem("iped-onboarding-dismissed") === "true") {
        setDismissed(true);
      }
    } catch {}
    setMounted(true);
  }, []);

  // Listen for mode changes from Sidebar
  useEffect(() => {
    const handleModeChange = (e: Event) => {
      const newMode = (e as CustomEvent).detail as "personal" | "business";
      setMode(newMode);
    };
    window.addEventListener("iped-mode-change", handleModeChange);
    return () => window.removeEventListener("iped-mode-change", handleModeChange);
  }, []);

  // Auto-detect completed steps from API
  const autoDetect = useCallback(async () => {
    try {
      const res = await fetch("/api/onboarding/status");
      if (!res.ok) return;
      const status = await res.json();

      setCompleted((prev) => {
        const steps = mode === "business" ? businessSteps : personalSteps;
        const next = [...prev];
        let changed = false;

        for (const step of steps) {
          if (step.autoKey && status[step.autoKey] && !next.includes(step.id)) {
            next.push(step.id);
            changed = true;
          }
        }

        if (changed) {
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
          return next;
        }
        return prev;
      });
    } catch {}
  }, [mode]);

  useEffect(() => {
    if (mounted) autoDetect();
  }, [mounted, autoDetect]);

  const steps = mode === "business" ? businessSteps : personalSteps;
  const completedCount = completed.filter((id) => steps.some((s) => s.id === id)).length;
  const totalCount = steps.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allDone = completedCount === totalCount;

  const markComplete = (stepId: string) => {
    if (completed.includes(stepId)) return;
    const next = [...completed, stepId];
    setCompleted(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem("iped-onboarding-dismissed", "true"); } catch {}
  };

  const restore = () => {
    setDismissed(false);
    try { localStorage.removeItem("iped-onboarding-dismissed"); } catch {}
  };

  if (!mounted) return null;

  if (dismissed) {
    return (
      <button onClick={restore} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all ${isDark ? "bg-white/5 text-white/40 hover:bg-white/8 hover:text-white/60" : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"}`}>
        <Sparkles size={14} />
        แสดง Onboarding Checklist
      </button>
    );
  }

  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const txt = isDark ? "text-white" : "text-gray-900";
  const txtSub = isDark ? "text-white/50" : "text-gray-500";
  const txtMuted = isDark ? "text-white/30" : "text-gray-400";

  return (
    <div className={`${card} border ${border} rounded-2xl overflow-hidden`}>
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#FA3633]/10 flex items-center justify-center shrink-0">
            <Sparkles size={18} className="text-[#FA3633]" />
          </div>
          <div className="min-w-0">
            <h3 className={`text-sm font-bold ${txt}`}>
              เริ่มต้นใช้งาน iPED — {mode === "business" ? "บริษัท" : "ส่วนตัว"}
            </h3>
            <p className={`text-xs ${txtSub} mt-0.5`}>
              {allDone ? "เสร็จสมบูรณ์!" : `${completedCount} / ${totalCount} ขั้นตอน`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setExpanded(!expanded)} className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-white/5 text-white/40" : "hover:bg-gray-100 text-gray-400"}`}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button onClick={dismiss} className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-white/5 text-white/40" : "hover:bg-gray-100 text-gray-400"}`}>
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="px-5 pb-3">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
          <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%`, background: allDone ? "linear-gradient(90deg, #22c55e, #16a34a)" : "linear-gradient(90deg, #FA3633, #f97316)" }} />
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-4 space-y-0.5">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const done = completed.includes(step.id);
            const isAuto = step.autoKey && done;
            return (
              <div key={step.id}>
                {i === 0 && (
                  <div className="flex items-center gap-2 px-3 pt-1 pb-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${txtMuted}`}>ตั้งค่าพื้นฐาน</span>
                    <div className={`flex-1 h-px ${isDark ? "bg-white/5" : "bg-gray-100"}`} />
                  </div>
                )}
                {i === (mode === "business" ? BUSINESS_COMMON : PERSONAL_COMMON) && (
                  <div className="flex items-center gap-2 px-3 pt-3 pb-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${txtMuted}`}>{mode === "business" ? "ตั้งค่าบริษัท" : "ตั้งค่าส่วนตัว"}</span>
                    <div className={`flex-1 h-px ${isDark ? "bg-white/5" : "bg-gray-100"}`} />
                  </div>
                )}
                <Link
                  href={step.href}
                  onClick={() => markComplete(step.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${done ? isDark ? "bg-green-500/5" : "bg-green-50" : isDark ? "hover:bg-white/3" : "hover:bg-gray-50"}`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${done ? "bg-green-500 border-green-500" : isDark ? "border-white/20 group-hover:border-white/40" : "border-gray-300 group-hover:border-gray-400"}`}>
                    {done && <Check size={12} className="text-white" strokeWidth={3} />}
                  </div>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${done ? isDark ? "bg-green-500/10 text-green-400" : "bg-green-100 text-green-600" : isDark ? "bg-white/5 text-white/40 group-hover:text-white/60" : "bg-gray-100 text-gray-400 group-hover:text-gray-600"}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-[13px] font-medium transition-all ${done ? isDark ? "text-green-400 line-through decoration-green-400/30" : "text-green-700 line-through decoration-green-300" : txt}`}>{step.label}</p>
                      {isAuto && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${isDark ? "bg-green-500/15 text-green-400" : "bg-green-100 text-green-600"}`}>
                          ตรวจพบแล้ว
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] ${txtSub} mt-0.5 truncate`}>{step.description}</p>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
