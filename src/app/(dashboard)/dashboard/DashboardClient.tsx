"use client";

import { Receipt, TrendingUp, Calculator, FileText } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";

interface ReceiptRow {
  _id: string;
  storeName: string;
  amount: number;
  category: string;
  date: string;
  status: string;
  type: string;
}

interface Props {
  data: {
    stats: {
      totalThisMonth: number;
      changePercent: number;
      receiptCount: number;
      receiptCountChange: number;
      averageAmount: number;
    };
    recentReceipts: ReceiptRow[];
    categories: { name: string; amount: number }[];
    monthlyTrend: { month: string; amount: number; count: number }[];
  };
}

const statusStyle: Record<string, string> = {
  confirmed: "bg-emerald-500/10 text-emerald-400",
  pending: "bg-yellow-500/10 text-yellow-400",
  rejected: "bg-red-500/10 text-red-400",
};
const statusLabel: Record<string, string> = {
  confirmed: "ยืนยันแล้ว",
  pending: "รอตรวจสอบ",
  rejected: "ปฏิเสธ",
};
const catColors = [
  "#FA3633",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
];

const fmt = (n: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(n);

export default function DashboardClient({ data }: Props) {
  const { stats, recentReceipts, categories, monthlyTrend } = data;
  const maxTrend = Math.max(...monthlyTrend.map((m) => m.amount), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ภาพรวม</h1>
        <p className="text-sm text-white/40 mt-1">สรุปข้อมูลรายจ่ายเดือนนี้</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="ยอดรวมเดือนนี้"
          value={fmt(stats.totalThisMonth)}
          change={stats.changePercent}
          icon={TrendingUp}
          color="#FA3633"
        />
        <StatsCard
          title="จำนวนใบเสร็จ"
          value={`${stats.receiptCount} ใบ`}
          change={stats.receiptCountChange}
          icon={Receipt}
          color="#3B82F6"
        />
        <StatsCard
          title="เฉลี่ยต่อใบ"
          value={fmt(stats.averageAmount)}
          icon={Calculator}
          color="#10B981"
        />
        <StatsCard
          title="หมวดหมู่"
          value={`${categories.length} หมวด`}
          icon={FileText}
          color="#F59E0B"
        />
      </div>

      {/* Chart + Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly trend */}
        <div className="lg:col-span-2 bg-[#111111] border border-white/5 rounded-xl p-5">
          <h3 className="text-base font-semibold mb-4">แนวโน้มรายเดือน</h3>
          <div className="flex items-end gap-3 h-48">
            {monthlyTrend.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs text-white/40">{fmt(m.amount)}</span>
                <div
                  className="w-full rounded-t-md transition-all duration-500"
                  style={{
                    height: `${Math.max((m.amount / maxTrend) * 140, 4)}px`,
                    backgroundColor:
                      i === monthlyTrend.length - 1 ? "#FA3633" : "#FA363340",
                  }}
                />
                <span className="text-xs text-white/60">{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="bg-[#111111] border border-white/5 rounded-xl p-5">
          <h3 className="text-base font-semibold mb-4">สัดส่วนหมวดหมู่</h3>
          <div className="space-y-3">
            {categories.length === 0 && (
              <p className="text-white/30 text-sm text-center py-8">
                ยังไม่มีข้อมูล
              </p>
            )}
            {categories.slice(0, 6).map((cat, i) => {
              const total = categories.reduce((s, c) => s + c.amount, 0);
              const pct = total > 0 ? Math.round((cat.amount / total) * 100) : 0;
              return (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">{cat.name}</span>
                    <span className="text-white/40">
                      {fmt(cat.amount)} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: catColors[i % catColors.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent receipts */}
      <div className="bg-[#111111] border border-white/5 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-base font-semibold">ใบเสร็จล่าสุด</h3>
          <a
            href="/dashboard/receipts"
            className="text-sm text-[#FA3633] hover:text-[#FA3633]/80"
          >
            ดูทั้งหมด →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["ร้านค้า", "ประเภท", "หมวดหมู่", "จำนวนเงิน", "วันที่", "สถานะ"].map(
                  (h) => (
                    <th
                      key={h}
                      className={`text-xs font-medium text-white/40 px-5 py-3 ${
                        h === "จำนวนเงิน" ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {recentReceipts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-white/30 text-sm">
                    ยังไม่มีใบเสร็จ — ลองส่งรูปใบเสร็จผ่าน LINE ดูสิ!
                  </td>
                </tr>
              )}
              {recentReceipts.map((r) => (
                <tr
                  key={r._id}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-5 py-3.5 text-sm">{r.storeName}</td>
                  <td className="px-5 py-3.5 text-sm text-white/60">{r.type}</td>
                  <td className="px-5 py-3.5 text-sm text-white/60">
                    {r.category}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-medium text-right">
                    {fmt(r.amount)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-white/60">{r.date}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                        statusStyle[r.status] || statusStyle.pending
                      }`}
                    >
                      {statusLabel[r.status] || r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
