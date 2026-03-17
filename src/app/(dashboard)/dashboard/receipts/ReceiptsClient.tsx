"use client";

import { useState, useMemo } from "react";
import { Search, Filter, Receipt, FileText, CheckCircle, Clock, Pencil, Trash2, ImageIcon, Cloud, CloudOff, HardDrive } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import DataTable, { Column } from "@/components/dashboard/DataTable";

interface LineItem {
  name: string;
  qty: number;
  price: number;
}

interface ReceiptRow {
  _id: string;
  storeName: string;
  amount: number;
  category: string;
  date: string;
  time?: string;
  status: string;
  type: string;
  source: string;
  imageUrl?: string;
  driveUploaded?: boolean;
  items?: LineItem[];
}

const statusStyle: Record<string, string> = {
  confirmed: "bg-green-500/10 text-green-400",
  pending: "bg-yellow-500/10 text-yellow-400",
  rejected: "bg-red-500/10 text-red-400",
};
const statusLabel: Record<string, string> = {
  confirmed: "ยืนยันแล้ว",
  pending: "รอตรวจสอบ",
  rejected: "ปฏิเสธ",
};
const typeLabel: Record<string, string> = {
  receipt: "ใบเสร็จ",
  invoice: "ใบแจ้งหนี้",
  billing: "บิลเรียกเก็บ",
  debit_note: "ใบเพิ่มหนี้",
  credit_note: "ใบลดหนี้",
};

export default function ReceiptsClient({ receipts: initialReceipts }: { receipts: ReceiptRow[] }) {
  const { isDark } = useTheme();
  const [receipts, setReceipts] = useState(initialReceipts);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [driveFilter, setDriveFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ReceiptRow>>({});

  const filtered = useMemo(() => {
    return receipts.filter((r) => {
      const matchSearch = !search || r.storeName.toLowerCase().includes(search.toLowerCase()) || r.category.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchType = typeFilter === "all" || r.type === typeFilter;
      const matchDrive = driveFilter === "all" || (driveFilter === "uploaded" ? r.driveUploaded : !r.driveUploaded);
      return matchSearch && matchStatus && matchType && matchDrive;
    });
  }, [receipts, search, statusFilter, typeFilter, driveFilter]);

  const totalAmount = filtered.reduce((s, r) => s + r.amount, 0);
  const confirmed = filtered.filter((r) => r.status === "confirmed").length;
  const pending = filtered.filter((r) => r.status === "pending").length;
  const driveUploaded = filtered.filter((r) => r.driveUploaded).length;

  const card = isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white";
  const border = isDark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
  const sub = isDark ? "text-white/50" : "text-gray-500";
  const muted = isDark ? "text-white/30" : "text-gray-400";
  const txt = isDark ? "text-white" : "text-gray-900";
  const inputCls = isDark
    ? "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-white placeholder-white/30"
    : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400";

  const handleDelete = (id: string) => {
    if (confirm("ต้องการลบใบเสร็จนี้?")) {
      setReceipts((prev) => prev.filter((r) => r._id !== id));
    }
  };

  const handleEdit = (r: ReceiptRow) => {
    setEditingId(r._id);
    setEditForm({ storeName: r.storeName, amount: r.amount, category: r.category, status: r.status, type: r.type });
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    setReceipts((prev) => prev.map((r) => r._id === editingId ? { ...r, ...editForm } : r));
    setEditingId(null);
    setEditForm({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const columns: Column<ReceiptRow>[] = [
    {
      key: "image",
      label: "รูป",
      render: (r, dark) => (
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden ${dark ? "bg-white/5" : "bg-gray-100"}`}>
          {r.imageUrl ? <img src={r.imageUrl} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={16} className={muted} />}
        </div>
      ),
    },
    { key: "storeName", label: "ร้านค้า", render: (r) => <span className="font-medium">{r.storeName}</span> },
    { key: "type", label: "ประเภท", render: (r) => <span>{typeLabel[r.type] || r.type}</span> },
    { key: "category", label: "หมวดหมู่" },
    { key: "amount", label: "จำนวนเงิน", align: "right", render: (r) => <span className="font-semibold">฿{r.amount.toLocaleString()}</span> },
    { key: "date", label: "วันที่" },
    { key: "time", label: "เวลา", render: (r) => <span className={muted}>{r.time || "-"}</span> },
    {
      key: "drive",
      label: "Drive",
      align: "center",
      render: (r, dark) => (
        <div className="relative group flex justify-center">
          {r.driveUploaded ? <Cloud size={16} className="text-green-500" /> : <CloudOff size={16} className={dark ? "text-white/20" : "text-gray-300"} />}
          <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 ${dark ? "bg-[#2a2a2a] text-white border border-white/10" : "bg-white text-gray-900 border border-gray-200 shadow-lg"}`}>
            {r.driveUploaded ? "อัปโหลดแล้ว" : "ยังไม่ได้อัปโหลด"}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "สถานะ",
      render: (r) => <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusStyle[r.status] || statusStyle.pending}`}>{statusLabel[r.status] || r.status}</span>,
    },
    {
      key: "actions",
      label: "",
      render: (r, dark) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => handleEdit(r)} className={`p-2 rounded-lg transition-colors ${dark ? "hover:bg-white/5 text-white/40 hover:text-blue-400" : "hover:bg-gray-100 text-gray-400 hover:text-blue-500"}`} title="แก้ไข">
            <Pencil size={14} />
          </button>
          <button onClick={() => handleDelete(r._id)} className={`p-2 rounded-lg transition-colors ${dark ? "hover:bg-white/5 text-white/40 hover:text-red-400" : "hover:bg-gray-100 text-gray-400 hover:text-red-500"}`} title="ลบ">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  const expandRender = (r: ReceiptRow, dark: boolean) => {
    const items = r.items && r.items.length > 0 ? r.items : [{ name: r.storeName, qty: 1, price: r.amount }];
    const b = dark ? "border-[rgba(255,255,255,0.06)]" : "border-gray-200";
    const inputC = dark ? "bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.08)] text-white" : "bg-white border-gray-200 text-gray-900";

    // If editing this row
    if (editingId === r._id) {
      return (
        <div className="space-y-4">
          <p className={`text-xs font-semibold ${dark ? "text-white/60" : "text-gray-600"}`}>แก้ไขข้อมูลใบเสร็จ</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className={`block text-xs ${dark ? "text-white/50" : "text-gray-500"} mb-1`}>ร้านค้า</label>
              <input value={editForm.storeName || ""} onChange={(e) => setEditForm({ ...editForm, storeName: e.target.value })} className={`w-full h-9 px-3 ${inputC} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
            </div>
            <div>
              <label className={`block text-xs ${dark ? "text-white/50" : "text-gray-500"} mb-1`}>จำนวนเงิน</label>
              <input type="number" value={editForm.amount || 0} onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })} className={`w-full h-9 px-3 ${inputC} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
            </div>
            <div>
              <label className={`block text-xs ${dark ? "text-white/50" : "text-gray-500"} mb-1`}>หมวดหมู่</label>
              <input value={editForm.category || ""} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className={`w-full h-9 px-3 ${inputC} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
            </div>
            <div>
              <label className={`block text-xs ${dark ? "text-white/50" : "text-gray-500"} mb-1`}>สถานะ</label>
              <select value={editForm.status || "pending"} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className={`w-full h-9 px-3 ${inputC} border rounded-lg text-sm focus:outline-none`}>
                <option value="confirmed">ยืนยันแล้ว</option>
                <option value="pending">รอตรวจสอบ</option>
                <option value="rejected">ปฏิเสธ</option>
              </select>
            </div>
            <div>
              <label className={`block text-xs ${dark ? "text-white/50" : "text-gray-500"} mb-1`}>ประเภท</label>
              <select value={editForm.type || "receipt"} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })} className={`w-full h-9 px-3 ${inputC} border rounded-lg text-sm focus:outline-none`}>
                {Object.entries(typeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleSaveEdit} className="px-4 py-2 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors">บันทึก</button>
            <button onClick={handleCancelEdit} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${dark ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>ยกเลิก</button>
          </div>
        </div>
      );
    }

    // Default: show line items
    return (
      <div className="space-y-2">
        <p className={`text-xs font-semibold ${dark ? "text-white/60" : "text-gray-600"}`}>รายละเอียดสินค้า/บริการ ({items.length} รายการ)</p>
        <div className="space-y-1">
          {items.map((item, i) => (
            <div key={i} className={`flex items-center justify-between px-4 py-2 rounded-lg ${dark ? "bg-white/3" : "bg-gray-100/50"}`}>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium w-6 h-6 rounded-md flex items-center justify-center ${dark ? "bg-white/5 text-white/40" : "bg-gray-200 text-gray-500"}`}>{i + 1}</span>
                <span className={`text-sm ${dark ? "text-white" : "text-gray-900"}`}>{item.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>x{item.qty}</span>
                <span className={`text-sm font-medium ${dark ? "text-white" : "text-gray-900"}`}>฿{item.price.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
        <div className={`flex justify-end pt-2 border-t ${b}`}>
          <span className={`text-sm font-semibold ${dark ? "text-white" : "text-gray-900"}`}>รวม ฿{r.amount.toLocaleString()}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="ใบเสร็จทั้งหมด" description={`${filtered.length} รายการ — รวม ฿${totalAmount.toLocaleString()}`} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="ใบเสร็จทั้งหมด" value={`${filtered.length} รายการ`} icon={<Receipt size={20} />} color="text-blue-500" />
        <StatsCard label="ยอดรวม" value={`฿${totalAmount.toLocaleString()}`} icon={<FileText size={20} />} color="text-[#FA3633]" />
        <StatsCard label="ยืนยันแล้ว" value={`${confirmed} รายการ`} icon={<CheckCircle size={20} />} color="text-green-500" />
        <StatsCard label="อัปโหลด Drive" value={`${driveUploaded} / ${filtered.length}`} icon={<HardDrive size={20} />} color="text-blue-400" />
      </div>

      {/* Filters — select dropdowns */}
      <div className={`${card} border ${border} rounded-xl px-5 py-3`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${sub}`} />
            <input type="text" placeholder="ค้นหาร้านค้า, หมวดหมู่..." value={search} onChange={(e) => setSearch(e.target.value)} className={`w-full h-10 pl-9 pr-4 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
          </div>
          <Filter size={16} className={sub} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`h-10 px-3 ${inputCls} border rounded-lg text-sm focus:outline-none`}>
            <option value="all">สถานะทั้งหมด</option>
            <option value="confirmed">ยืนยันแล้ว</option>
            <option value="pending">รอตรวจสอบ</option>
            <option value="rejected">ปฏิเสธ</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={`h-10 px-3 ${inputCls} border rounded-lg text-sm focus:outline-none`}>
            <option value="all">ประเภททั้งหมด</option>
            {Object.entries(typeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={driveFilter} onChange={(e) => setDriveFilter(e.target.value)} className={`h-10 px-3 ${inputCls} border rounded-lg text-sm focus:outline-none`}>
            <option value="all">Drive ทั้งหมด</option>
            <option value="uploaded">อัปโหลดแล้ว</option>
            <option value="not_uploaded">ยังไม่อัปโหลด</option>
          </select>
        </div>
      </div>

      <DataTable dateField="date" columns={columns} data={filtered} rowKey={(r) => r._id} expandRender={expandRender} />
    </div>
  );
}
