"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
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
}

const personalSteps: Step[] = [
  { id: "line", label: "เชื่อมต่อ LINE", description: "Login + รับแจ้งเตือนผ่าน LINE", icon: MessageCircle, href: "/dashboard/line-bot" },
  { id: "mode", label: "เลือกโหมดใช้งาน", description: "เลือกโหมดส่วนตัว", icon: UserRoundCog, href: "/dashboard/settings" },
  { id: "drive", label: "เชื่อมต่อ Google Drive", description: "สำรอง/จัดเก็บเอกสาร", icon: HardDrive, href: "/dashboard/sync" },
  { id: "gmail", label: "เชื่อมต่อ Gmail", description: "สแกนเอกสารจากอีเมลอัตโนมัติ", icon: Mail, href: "/dashboard/email-scanner" },
  { id: "first-scan", label: "อัปโหลดใบเสร็จแรก", description: "ทดลอง AI OCR สแกนใบเสร็จจริง", icon: ScanLine, href: "/dashboard/scan" },
  { id: "signature", label: "ใส่ลายเซ็นรับรอง", description: "ลายเซ็นดิจิทัลสำหรับใบแทนใบเสร็จ", icon: PenTool, href: "/dashboard/settings" },
  { id: "sheets-notion", label: "เชื่อม Sheets / Notion", description: "เชื่อม Google Sheets หรือ Notion", icon: Sheet, href: "/dashboard/sync" },
  { id: "p-categories", label: "ตั้งหมวดหมู่รายจ่าย", description: "เลือกจาก preset หรือกำหนดเอง", icon: FolderOpen, href: "/dashboard/categories" },
  { id: "p-budget", label: "ตั้งงบประมาณเดือนแรก", description: "งบรายวัน / รายเดือน / ตามหมวด", icon: Wallet, href: "/dashboard/budget" },
  { id: "p-savings", label: "ตั้งเป้าเงินออม", description: "เป้าหมายออมเงินรายเดือน", icon: PiggyBank, href: "/dashboard/savings" },
];

const businessSteps: Step[] = [
  { id: "line", label: "เชื่อมต่อ LINE", description: "Login + รับแจ้งเตือนผ่าน LINE", icon: MessageCircle, href: "/dashboard/line-bot" },
  { id: "mode", label: "เลือกโหมดใช้งาน", description: "เลือกโหมดบริษัท", icon: UserRoundCog, href: "/dashboard/settings" },
  { id: "drive", label: "เชื่อมต่อ Google Drive", description: "สำรอง/จัดเก็บเอกสาร", icon: HardDrive, href: "/dashboard/sync" },
  { id: "gmail", label: "เชื่อมต่อ Gmail", description: "สแกนเอกสารจากอีเมลอัตโนมัติ", icon: Mail, href: "/dashboard/email-scanner" },
  { id: "first-scan", label: "อัปโหลดใบเสร็จแรก", description: "ทดลอง AI OCR สแกนใบเสร็จจริง", icon: ScanLine, href: "/dashboard/scan" },
  { id: "signature", label: "ใส่ลายเซ็นรับรอง", description: "ลายเซ็นดิจิทัลสำหรับใบแทนใบเสร็จ", icon: PenTool, href: "/dashboard/settings" },
  { id: "sheets-notion", label: "เชื่อม Sheets / Notion", description: "เชื่อม Google Sheets หรือ Notion", icon: Sheet, href: "/dashboard/sync" },
  { id: "b-company", label: "กรอกข้อมูลบริษัท", description: "ชื่อ, เลขผู้เสียภาษี, ที่อยู่, โลโก้", icon: Building2, href: "/dashboard/settings" },
  { id: "b-team", label: "เพิ่มพนักงาน & แผนก", description: "เชิญทีม + กำหนดสิทธิ์", icon: Users, href: "/dashboard/team" },
  { id: "b-approval", label: "ตั้งค่า Approval", description: "กำหนด workflow อนุมัติรายจ่าย", icon: CheckSquare, href: "/dashboard/approvals" },
  { id: "b-categories", label: "ตั้งหมวดหมู่รายจ่าย", description: "หมวดตาม chart of accounts บริษัท", icon: FolderOpen, href: "/dashboard/categories" },
  { id: "b-accounting", label: "เชื่อมโปรแกรมบัญชี", description: "เชื่อมกับซอฟต์แวร์บัญชีที่ใช้อยู่", icon: FileSpreadsheet, href: "/dashboard/accounting" },
];

const stepTriggers: Record<string, string[]> = {
  "line": ["/dashboard/line-bot"],
  "mode": ["/dashboard/settings"],
  "drive": ["/dashboard/sync"],
  "gmail": ["/dashboard/email-scanner"],
  "first-scan": ["/dashboard/scan"],
  "signature": ["/dashboard/settings"],
  "sheets-notion": ["/dashboard/sync"],
  "p-categories": ["/dashboard/categories"],
  "p-budget": ["/dashboard/budget"],
  "p-savings": ["/dashboard/savings"],
  "b-company": ["/dashboard/settings"],
  "b-team": ["/dashboard/team"],
  "b-approval": ["/dashboard/approvals"],
  "b-categories": ["/dashboard/categories"],
  "b-accounting": ["/dashboard/accounting"],
};

const STORAGE_KEY = "iped-onboarding";

export default function OnboardingChecklist() {
  const { isDark } = useTheme();
  const pathname = usePathname();
  const [completed, setCompleted] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<"personal" | "business">("personal");

  // All localStorage reads happen inside useEffect only
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem("iped-mode");
      if (savedMode === "business") setMode("business");

      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCompleted(JSON.parse(raw));

      const dis = localStorage.getItem("iped-onboarding-dismissed");
      if (dis === "true") setDismissed(true);
    } catch {}
    setMounted(true);
  }, []);

  const steps = mode === "business" ? businessSteps : personalSteps;

  // Auto-complete: "เลือกโหมดใช้งาน" when mode is set
  useEffect(() => {
    if (!mounted) return;
    try {
      const stored = localStorage.getItem("iped-mode");
      if (stored && !completed.includes("mode")) {
        const next = [...completed, "mode"];
        setCompleted(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
    } catch {}
  }, [mounted, completed]);

  // Auto-complete: when user visits a page that matches a step trigger
  useEffect(() => {
    if (!mounted || !pathname) return;
    const newCompleted = [...completed];
    let changed = false;

    for (const step of steps) {
      if (newCompleted.includes(step.id)) continue;
      const triggers = stepTriggers[step.id] || [];
      if (triggers.some((t) => pathname === t || pathname.startsWith(t + "/"))) {
        newCompleted.push(step.id);
        changed = true;
      }
    }

    if (changed) {
      setCompleted(newCompleted);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newCompleted)); } catch {}
    }
  }, [pathname, mounted, steps, completed]);

  const completedCount = completed.filter((id) => steps.some((s) => s.id === id)).length;
  const totalCount = steps.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allDone = completedCount === totalCount;

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
      <button
        onClick={restore}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all ${
          isDark
            ? "bg-white/5 text-white/40 hover:bg-white/8 hover:text-white/60"
            : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
        }`}
      >
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
  const commonCount = 7;

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
            return (
              <div key={step.id}>
                {i === 0 && (
                  <div className="flex items-center gap-2 px-3 pt-1 pb-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${txtMuted}`}>ตั้งค่าพื้นฐาน</span>
                    <div className={`flex-1 h-px ${isDark ? "bg-white/5" : "bg-gray-100"}`} />
                  </div>
                )}
                {i === commonCount && (
                  <div className="flex items-center gap-2 px-3 pt-3 pb-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${txtMuted}`}>{mode === "business" ? "ตั้งค่าบริษัท" : "ตั้งค่าส่วนตัว"}</span>
                    <div className={`flex-1 h-px ${isDark ? "bg-white/5" : "bg-gray-100"}`} />
                  </div>
                )}
                <Link href={step.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${done ? isDark ? "bg-green-500/5" : "bg-green-50" : isDark ? "hover:bg-white/3" : "hover:bg-gray-50"}`}>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${done ? "bg-green-500 border-green-500" : isDark ? "border-white/20 group-hover:border-white/40" : "border-gray-300 group-hover:border-gray-400"}`}>
                    {done && <Check size={12} className="text-white" strokeWidth={3} />}
                  </div>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${done ? isDark ? "bg-green-500/10 text-green-400" : "bg-green-100 text-green-600" : isDark ? "bg-white/5 text-white/40 group-hover:text-white/60" : "bg-gray-100 text-gray-400 group-hover:text-gray-600"}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-medium transition-all ${done ? isDark ? "text-green-400 line-through decoration-green-400/30" : "text-green-700 line-through decoration-green-300" : txt}`}>{step.label}</p>
                    <p className={`text-[11px] ${txtSub} mt-0.5 truncate`}>{step.description}</p>
                  </div>
                  {done && <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isDark ? "bg-green-500/10 text-green-400" : "bg-green-100 text-green-600"}`}>auto</span>}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
