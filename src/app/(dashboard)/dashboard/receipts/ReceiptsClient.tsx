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
  rawDate?: string;
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
const CATEGORY_COLORS: Record<string, string> = {
  "ช็อปปิ้ง": "#818CF8", "อาหาร": "#FB923C", "เดินทาง": "#60A5FA",
  "สาธารณูปโภค": "#F472B6", "ของใช้ในบ้าน": "#C084FC", "สุขภาพ": "#34D399",
  "การศึกษา": "#FBBF24", "บันเทิง": "#F87171", "ไม่ระบุ": "#9CA3AF",
};
const FALLBACK_COLORS = ["#818CF8","#FB923C","#60A5FA","#F472B6","#C084FC","#34D399","#FBBF24","#F87171"];
function getCatColor(cat: string): string {
  if (CATEGORY_COLORS[cat]) return CATEGORY_COLORS[cat];
  const idx = cat.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % FALLBACK_COLORS.length;
  return FALLBACK_COLORS[idx];
}

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
    setEditForm({ storeName: r.storeName, amount: r.amount, category: r.category, status: r.status, type: r.type, date: r.rawDate || r.date, source: r.source });
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
    { key: "category", label: "หมวดหมู่", render: (r) => (
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getCatColor(r.category) }} />
        {r.category}
      </span>
    ) },
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

  const editingReceipt = editingId ? receipts.find((r) => r._id === editingId) : null;
  const panelInput = isDark ? "bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.08)] text-white" : "bg-white border-gray-200 text-gray-900";
  const panelLabel = isDark ? "text-white/50" : "text-gray-500";

  return (
    <div className="space-y-6">
      {/* Slide-in edit panel from right */}
      {editingId && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity" onClick={handleCancelEdit} />}
      <div className={`fixed inset-y-0 right-0 z-50 w-[460px] max-w-[95vw] bg-[#0d0d0d] border-l border-white/10 shadow-2xl overflow-y-auto transition-transform duration-300 ease-out ${editingId ? "translate-x-0" : "translate-x-full"}`}>
        {editingReceipt && (
          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">แก้ไขใบเสร็จ</h2>
              <button onClick={handleCancelEdit} className="w-8 h-8 rounded-lg hover:bg-white/5 text-white/40 hover:text-white flex items-center justify-center text-xl transition-colors">&times;</button>
            </div>

            {/* Receipt image / slip */}
            <div className="w-full h-56 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
              {editingReceipt.imageUrl ? (
                <img src={editingReceipt.imageUrl} alt="" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center">
                  <ImageIcon size={40} className="text-white/15 mx-auto mb-2" />
                  <p className="text-xs text-white/30">ไม่มีรูปสลิป</p>
                </div>
              )}
            </div>

            {/* Financial summary */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
              <p className="text-xs font-semibold text-white/60">ข้อมูลการเงิน</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/50">ยอดรวม</span>
                <span className="text-xl font-bold text-white">฿{(editForm.amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/50">วิธีจ่าย</span>
                <span className="text-sm text-white">{editingReceipt.source || "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/50">สถานะ</span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusStyle[editingReceipt.status] || statusStyle.pending}`}>{statusLabel[editingReceipt.status] || editingReceipt.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/50">Drive</span>
                <span className="flex items-center gap-1.5 text-sm">{editingReceipt.driveUploaded ? <><Cloud size={14} className="text-green-500" /> <span className="text-green-400">อัปโหลดแล้ว</span></> : <><CloudOff size={14} className="text-white/20" /> <span className="text-white/30">ยังไม่อัปโหลด</span></>}</span>
              </div>
            </div>

            {/* Line items — split payment */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-white/60">รายการในใบเสร็จ</p>
                <span className="text-[10px] text-white/30">{(editingReceipt.items || [{ name: editingReceipt.storeName, qty: 1, price: editingReceipt.amount }]).length} รายการ</span>
              </div>
              {(editingReceipt.items && editingReceipt.items.length > 0 ? editingReceipt.items : [{ name: editingReceipt.storeName, qty: 1, price: editingReceipt.amount }]).map((item, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded text-[10px] font-medium bg-white/5 text-white/40 flex items-center justify-center">{i + 1}</span>
                    <span className="text-sm text-white/80">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/30">x{item.qty}</span>
                    <span className="text-sm font-medium text-white">฿{item.price.toLocaleString()}</span>
                  </div>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-white/10">
                <span className="text-sm font-semibold text-white/60">รวม</span>
                <span className="text-sm font-bold text-white">฿{editingReceipt.amount.toLocaleString()}</span>
              </div>
            </div>

            {/* Edit form */}
            <div className="space-y-4">
              <p className="text-xs font-semibold text-white/60">แก้ไขข้อมูล</p>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">ร้านค้า</label>
                <input value={editForm.storeName || ""} onChange={(e) => setEditForm({ ...editForm, storeName: e.target.value })} className="w-full h-10 px-3 bg-white/5 border border-white/10 text-white rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">จำนวนเงิน</label>
                  <input type="number" value={editForm.amount || 0} onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })} className="w-full h-10 px-3 bg-white/5 border border-white/10 text-white rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50" />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">วันที่</label>
                  <input type="date" value={editForm.date || ""} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className="w-full h-10 px-3 bg-white/5 border border-white/10 text-white rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">หมวดหมู่</label>
                <input value={editForm.category || ""} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className="w-full h-10 px-3 bg-white/5 border border-white/10 text-white rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">สถานะ</label>
                  <select value={editForm.status || "pending"} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-full h-10 px-3 bg-white/5 border border-white/10 text-white rounded-lg text-sm focus:outline-none">
                    <option value="confirmed">ยืนยันแล้ว</option>
                    <option value="pending">รอตรวจสอบ</option>
                    <option value="rejected">ปฏิเสธ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">ประเภท</label>
                  <select value={editForm.type || "receipt"} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })} className="w-full h-10 px-3 bg-white/5 border border-white/10 text-white rounded-lg text-sm focus:outline-none">
                    {Object.entries(typeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">แหล่งที่มา</label>
                <input value={editForm.source || ""} onChange={(e) => setEditForm({ ...editForm, source: e.target.value })} className="w-full h-10 px-3 bg-white/5 border border-white/10 text-white rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 sticky bottom-0 pb-6">
              <button onClick={handleSaveEdit} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors">บันทึก</button>
              <button onClick={handleCancelEdit} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-white/60 hover:bg-white/10 transition-colors">ยกเลิก</button>
            </div>
          </div>
        )}
      </div>

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

      <DataTable dateField="rawDate" columns={columns} data={filtered} rowKey={(r) => r._id} expandRender={expandRender} />
    </div>
  );
}
