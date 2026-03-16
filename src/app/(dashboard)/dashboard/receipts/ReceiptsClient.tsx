"use client";

import { useState, useMemo } from "react";
import { Search, Filter, Download } from "lucide-react";

interface ReceiptRow {
  _id: string;
  storeName: string;
  amount: number;
  category: string;
  date: string;
  status: string;
  type: string;
  source: string;
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

const fmt = (n: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(n);

export default function ReceiptsClient({
  receipts,
}: {
  receipts: ReceiptRow[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = useMemo(() => {
    return receipts.filter((r) => {
      const matchSearch =
        !search ||
        r.storeName.toLowerCase().includes(search.toLowerCase()) ||
        r.category.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "all" || r.status === statusFilter;
      const matchType = typeFilter === "all" || r.type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [receipts, search, statusFilter, typeFilter]);

  const totalAmount = filtered.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ใบเสร็จทั้งหมด</h1>
          <p className="text-sm text-white/40 mt-1">
            {filtered.length} รายการ — รวม {fmt(totalAmount)}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-colors">
          <Download size={16} />
          ส่งออก
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
          />
          <input
            type="text"
            placeholder="ค้นหาร้านค้า, หมวดหมู่..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#FA3633]/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-white/40" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none"
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="confirmed">ยืนยันแล้ว</option>
            <option value="pending">รอตรวจสอบ</option>
            <option value="rejected">ปฏิเสธ</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none"
          >
            <option value="all">ประเภททั้งหมด</option>
            <option value="receipt">ใบเสร็จ</option>
            <option value="invoice">ใบแจ้งหนี้</option>
            <option value="billing">บิลเรียกเก็บ</option>
            <option value="debit_note">ใบเพิ่มหนี้</option>
            <option value="credit_note">ใบลดหนี้</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111111] border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {[
                  "ร้านค้า",
                  "ประเภท",
                  "หมวดหมู่",
                  "แหล่งที่มา",
                  "จำนวนเงิน",
                  "วันที่",
                  "สถานะ",
                ].map((h) => (
                  <th
                    key={h}
                    className={`text-xs font-medium text-white/40 px-5 py-3 ${
                      h === "จำนวนเงิน" ? "text-right" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-white/30 text-sm"
                  >
                    ไม่พบรายการที่ตรงกับตัวกรอง
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr
                  key={r._id}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3.5 text-sm">{r.storeName}</td>
                  <td className="px-5 py-3.5 text-sm text-white/60">
                    {r.type}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-white/60">
                    {r.category}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-white/60 capitalize">
                    {r.source}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-medium text-right">
                    {fmt(r.amount)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-white/60">
                    {r.date}
                  </td>
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
