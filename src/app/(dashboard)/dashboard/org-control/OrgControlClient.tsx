"use client";

import { useMemo } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Crown, Users, Banknote, Receipt, ClipboardCheck, FileBarChart,
  BarChart3, Zap, ArrowUpRight, CreditCard, Building2,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import Link from "next/link";

/* ── Types ── */

interface OrgInfo {
  name: string;
  taxId: string;
  type: string;
  membersCount: number;
  status: string;
}

interface EmployeeRow {
  _id: string;
  name: string;
  position: string;
  department: string;
  baseSalary: number;
  status: string;
  employeeCode: string;
}

interface UserPlan {
  plan: string;
  planName: string;
  type: string;
  limits: any;
  features: any;
  subscription: any;
  usage: {
    receipts: number;
    ocr: number;
    storageBytes: number;
    gmailScans: number;
    transfers: number;
    aiChats: number;
  };
}

interface StatusBucket {
  count: number;
  total: number;
}

interface Props {
  org: OrgInfo;
  employees: EmployeeRow[];
  userPlan: UserPlan;
  receiptSummary: Record<string, StatusBucket>;
  payrollSummary: Record<string, StatusBucket>;
}

/* ── Helpers ── */

const tierStyle: Record<string, string> = {
  free: "bg-gray-500/20 text-gray-400",
  plus: "bg-blue-500/20 text-blue-400",
  pro: "bg-purple-500/20 text-purple-400",
  starter: "bg-teal-500/20 text-teal-400",
  business: "bg-orange-500/20 text-orange-400",
  enterprise: "bg-red-500/20 text-red-400",
};

const tierBg: Record<string, string> = {
  free: "bg-gray-500/10",
  plus: "bg-blue-500/10",
  pro: "bg-purple-500/10",
  starter: "bg-teal-500/10",
  business: "bg-orange-500/10",
  enterprise: "bg-red-500/10",
};

const tierColors: Record<string, string> = {
  free: "text-gray-400",
  plus: "text-blue-400",
  pro: "text-purple-400",
  starter: "text-teal-400",
  business: "text-orange-400",
  enterprise: "text-red-400",
};

const empStatusStyle: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  probation: "bg-yellow-500/20 text-yellow-400",
  resigned: "bg-gray-500/20 text-gray-400",
  terminated: "bg-red-500/20 text-red-400",
};

const empStatusLabel: Record<string, string> = {
  active: "ทำงาน",
  probation: "ทดลองงาน",
  resigned: "ลาออก",
  terminated: "เลิกจ้าง",
};

function baht(n: number) {
  return `฿${n.toLocaleString("th-TH", { minimumFractionDigits: 0 })}`;
}

function UsageBar({
  label,
  current,
  limit,
  color,
  isDark,
}: {
  label: string;
  current: number;
  limit: number;
  color: string;
  isDark: boolean;
}) {
  const pct =
    limit <= 0 ? 0 : limit === -1 ? 5 : Math.min((current / limit) * 100, 100);
  const isUnlimited = limit === -1;
  const isOver = !isUnlimited && limit > 0 && current >= limit;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span>
        <span className={isOver ? "text-red-400 font-bold" : ""}>
          {current.toLocaleString()}
          {isUnlimited ? "" : ` / ${limit.toLocaleString()}`}
          {isUnlimited ? " (ไม่จำกัด)" : ""}
        </span>
      </div>
      <div
        className={`h-2 rounded-full overflow-hidden ${
          isDark ? "bg-white/10" : "bg-gray-200"
        }`}
      >
        <div
          className={`h-full rounded-full transition-all ${
            isOver ? "bg-red-500" : color
          }`}
          style={{ width: `${isUnlimited ? 5 : pct}%` }}
        />
      </div>
    </div>
  );
}

/* ── Main Component ── */

export default function OrgControlClient({
  org,
  employees,
  userPlan,
  receiptSummary,
  payrollSummary,
}: Props) {
  const { isDark } = useTheme();
  const c = (d: string, l: string) => (isDark ? d : l);
  const card = c(
    "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]",
    "bg-white border-gray-200"
  );
  const txt = c("text-white", "text-gray-900");
  const sub = c("text-white/50", "text-gray-500");
  const muted = c("text-white/30", "text-gray-400");

  // Derived stats
  const totalReceiptsPaid =
    (receiptSummary["paid"]?.total || 0) +
    (receiptSummary["confirmed"]?.total || 0);
  const totalPayrollPaid = payrollSummary["paid"]?.total || 0;
  const pendingReimbursement =
    (receiptSummary["pending"]?.count || 0);
  const limits = userPlan.limits || {};
  const usage = userPlan.usage;
  const subInfo = userPlan.subscription;
  const receiptLimit =
    limits.receiptsPerMonth ?? limits.documentsPerMonth ?? 30;

  // Employee table columns
  const columns: Column<EmployeeRow>[] = useMemo(
    () => [
      {
        key: "employeeCode",
        label: "รหัส",
        render: (r) => (
          <span className={`text-xs font-mono ${sub}`}>{r.employeeCode}</span>
        ),
      },
      {
        key: "name",
        label: "ชื่อ",
        render: (r) => (
          <span className={`text-sm font-medium ${txt}`}>{r.name}</span>
        ),
      },
      {
        key: "position",
        label: "ตำแหน่ง",
        render: (r) => (
          <span className={`text-xs ${sub}`}>{r.position || "-"}</span>
        ),
      },
      {
        key: "department",
        label: "แผนก",
        render: (r) => (
          <span className={`text-xs ${sub}`}>{r.department || "-"}</span>
        ),
      },
      {
        key: "baseSalary",
        label: "เงินเดือน",
        render: (r) => (
          <span className={`text-sm font-medium ${txt}`}>
            {baht(r.baseSalary)}
          </span>
        ),
      },
      {
        key: "status",
        label: "สถานะ",
        render: (r) => (
          <span
            className={`px-2 py-1 rounded-full text-[11px] font-medium ${
              empStatusStyle[r.status] || empStatusStyle.active
            }`}
          >
            {empStatusLabel[r.status] || r.status}
          </span>
        ),
      },
    ],
    [txt, sub]
  );

  // Quick action links
  const quickActions = [
    {
      label: "พนักงาน",
      href: "/dashboard/team",
      icon: Users,
      color: "text-blue-400",
    },
    {
      label: "จ่ายเงินเดือน",
      href: "/dashboard/payroll",
      icon: Banknote,
      color: "text-green-400",
    },
    {
      label: "อนุมัติรายจ่าย",
      href: "/dashboard/approvals",
      icon: ClipboardCheck,
      color: "text-yellow-400",
    },
    {
      label: "ค่าใช้จ่ายบริษัท",
      href: "/dashboard/reimbursement",
      icon: Receipt,
      color: "text-orange-400",
    },
    {
      label: "Billing",
      href: "/dashboard/billing",
      icon: CreditCard,
      color: "text-purple-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Section 1: Header */}
      <PageHeader
        title="ควบคุมองค์กร"
        description="ภาพรวมและจัดการทั้งหมดขององค์กร"
      />

      {/* Section 2: Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          label="แพ็กเกจ"
          value={userPlan.planName}
          icon={<Crown size={20} />}
          color={tierColors[userPlan.plan] || "text-gray-400"}
        />
        <StatsCard
          label="พนักงาน"
          value={`${employees.length} คน`}
          icon={<Users size={20} />}
          color="text-blue-500"
        />
        <StatsCard
          label="ค่าใช้จ่ายเดือนนี้"
          value={baht(totalReceiptsPaid)}
          icon={<Receipt size={20} />}
          color="text-orange-500"
        />
        <StatsCard
          label="เงินเดือนเดือนนี้"
          value={baht(totalPayrollPaid)}
          icon={<Banknote size={20} />}
          color="text-green-500"
        />
        <StatsCard
          label="รอเบิกจ่าย"
          value={`${pendingReimbursement} รายการ`}
          icon={<ClipboardCheck size={20} />}
          color="text-yellow-500"
        />
        <StatsCard
          label="Quota ใบเสร็จ"
          value={`${usage.receipts}/${receiptLimit === -1 ? "\u221E" : receiptLimit}`}
          icon={<FileBarChart size={20} />}
          color="text-purple-500"
        />
      </div>

      {/* Section 3: Organization Subscription */}
      <div className={`${card} border rounded-2xl p-6`}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                tierBg[userPlan.plan] || tierBg.free
              }`}
            >
              <Crown
                size={24}
                className={tierColors[userPlan.plan] || tierColors.free}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-lg font-bold ${txt}`}>
                  {userPlan.planName}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    tierStyle[userPlan.plan] || tierStyle.free
                  }`}
                >
                  {userPlan.plan.toUpperCase()}
                </span>
              </div>
              {subInfo ? (
                <p className={`text-xs ${sub}`}>
                  {subInfo.status === "trial"
                    ? "ทดลองใช้"
                    : subInfo.billingCycle === "yearly"
                      ? "รายปี"
                      : "รายเดือน"}
                  {subInfo.currentPeriodEnd &&
                    ` \u2022 หมดอายุ ${new Date(subInfo.currentPeriodEnd).toLocaleDateString("th-TH")}`}
                </p>
              ) : (
                <p className={`text-xs ${sub}`}>แพ็กเกจปัจจุบัน</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/billing"
              className={`text-sm ${sub} hover:text-[#FA3633] transition-colors`}
            >
              ดู Billing
            </Link>
            <Link
              href="/pricing"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors"
            >
              <Zap size={16} />
              อัพเกรด
            </Link>
          </div>
        </div>

        {/* Usage bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UsageBar
            label="ใบเสร็จ"
            current={usage.receipts}
            limit={limits.receiptsPerMonth ?? limits.documentsPerMonth ?? 30}
            color="bg-blue-500"
            isDark={isDark}
          />
          <UsageBar
            label="OCR สแกน"
            current={usage.ocr}
            limit={limits.ocrPerMonth ?? 10}
            color="bg-purple-500"
            isDark={isDark}
          />
          <UsageBar
            label="พื้นที่ (MB)"
            current={Math.round(usage.storageBytes / 1048576)}
            limit={
              limits.storageBytes
                ? Math.round(limits.storageBytes / 1048576)
                : 100
            }
            color="bg-teal-500"
            isDark={isDark}
          />
          <UsageBar
            label="พนักงาน"
            current={employees.length}
            limit={limits.employees ?? 0}
            color="bg-orange-500"
            isDark={isDark}
          />
        </div>

        {/* Auto-renew status */}
        {subInfo && (
          <div className={`flex items-center gap-4 mt-4 pt-4 border-t ${c("border-white/5", "border-gray-100")}`}>
            <div>
              <p className={`text-[10px] ${muted}`}>ต่ออายุอัตโนมัติ</p>
              <p
                className={`text-sm font-medium ${
                  subInfo.autoRenew ? "text-green-400" : "text-yellow-400"
                }`}
              >
                {subInfo.autoRenew ? "เปิด" : "ปิด"}
              </p>
            </div>
            {subInfo.currentPeriodEnd && (
              <div>
                <p className={`text-[10px] ${muted}`}>วันหมดอายุ</p>
                <p className={`text-sm ${txt}`}>
                  {new Date(subInfo.currentPeriodEnd).toLocaleDateString(
                    "th-TH",
                    { year: "numeric", month: "long", day: "numeric" }
                  )}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 4: Employee Table */}
      <div className={`${card} border rounded-2xl p-6`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-blue-400" />
            <h3 className={`text-sm font-bold ${txt}`}>พนักงานทั้งหมด</h3>
            <span className={`text-xs ${muted}`}>({employees.length} คน)</span>
          </div>
          <Link
            href="/dashboard/team"
            className={`text-xs ${sub} hover:text-[#FA3633] flex items-center gap-1 transition-colors`}
          >
            จัดการ <ArrowUpRight size={12} />
          </Link>
        </div>
        <DataTable
          columns={columns}
          data={employees}
          rowKey={(r) => r._id}
          emptyText="ยังไม่มีพนักงาน"
          columnConfigKey="org-control-employees"
        />
      </div>

      {/* Section 5: Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Reimbursement summary */}
        <div className={`${card} border rounded-2xl p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <Receipt size={18} className="text-orange-400" />
            <h3 className={`text-sm font-bold ${txt}`}>สรุปเบิกจ่าย</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-sm ${sub}`}>รอดำเนินการ</span>
              <div className="text-right">
                <span className={`text-sm font-medium ${txt}`}>
                  {receiptSummary["pending"]?.count || 0} รายการ
                </span>
                <span className={`text-xs ${muted} ml-2`}>
                  {baht(receiptSummary["pending"]?.total || 0)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${sub}`}>ยืนยันแล้ว</span>
              <div className="text-right">
                <span className={`text-sm font-medium ${txt}`}>
                  {receiptSummary["confirmed"]?.count || 0} รายการ
                </span>
                <span className={`text-xs ${muted} ml-2`}>
                  {baht(receiptSummary["confirmed"]?.total || 0)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${sub}`}>จ่ายแล้ว</span>
              <div className="text-right">
                <span className={`text-sm font-medium text-green-400`}>
                  {receiptSummary["paid"]?.count || 0} รายการ
                </span>
                <span className={`text-xs ${muted} ml-2`}>
                  {baht(receiptSummary["paid"]?.total || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payroll summary */}
        <div className={`${card} border rounded-2xl p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <Banknote size={18} className="text-green-400" />
            <h3 className={`text-sm font-bold ${txt}`}>สรุปเงินเดือน</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-sm ${sub}`}>ร่าง</span>
              <div className="text-right">
                <span className={`text-sm font-medium ${txt}`}>
                  {payrollSummary["draft"]?.count || 0} รายการ
                </span>
                <span className={`text-xs ${muted} ml-2`}>
                  {baht(payrollSummary["draft"]?.total || 0)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${sub}`}>อนุมัติแล้ว</span>
              <div className="text-right">
                <span className={`text-sm font-medium ${txt}`}>
                  {payrollSummary["approved"]?.count || 0} รายการ
                </span>
                <span className={`text-xs ${muted} ml-2`}>
                  {baht(payrollSummary["approved"]?.total || 0)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${sub}`}>จ่ายแล้ว</span>
              <div className="text-right">
                <span className={`text-sm font-medium text-green-400`}>
                  {payrollSummary["paid"]?.count || 0} รายการ
                </span>
                <span className={`text-xs ${muted} ml-2`}>
                  {baht(payrollSummary["paid"]?.total || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 6: Quick Actions */}
      <div className={`${card} border rounded-2xl p-6`}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} className={sub} />
          <h3 className={`text-sm font-bold ${txt}`}>ลัดไปยัง</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors ${c(
                  "bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04]",
                  "bg-gray-50 hover:bg-gray-100 border border-gray-100"
                )}`}
              >
                <Icon size={22} className={action.color} />
                <span className={`text-xs font-medium ${txt}`}>
                  {action.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
