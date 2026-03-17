"use client";

import { useState, useMemo } from "react";
import { Search, Filter, Receipt, FileText, CheckCircle, Clock, Pencil, Trash2, ImageIcon, Cloud, CloudOff, HardDrive } from "lucide-react";
import Select from "@/components/dashboard/Select";
import DatePicker from "@/components/dashboard/DatePicker";
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

const PAYMENT_METHODS = [
  { value: "cash", label: "เงินสด" },
  { value: "promptpay", label: "พร้อมเพย์" },
  { value: "credit", label: "บัตรเครดิต" },
  { value: "debit", label: "บัตรเดบิต" },
  { value: "transfer", label: "โอนธนาคาร" },
  { value: "bank-scb", label: "SCB ไทยพาณิชย์" },
  { value: "bank-kbank", label: "KBank กสิกรไทย" },
  { value: "bank-bbl", label: "BBL กรุงเทพ" },
  { value: "bank-ktb", label: "KTB กรุงไทย" },
  { value: "bank-tmb", label: "TTB ทีเอ็มบีธนชาต" },
  { value: "bank-bay", label: "BAY กรุงศรีอยุธยา" },
  { value: "bank-gsb", label: "GSB ออมสิน" },
  { value: "bank-ghb", label: "GHB อาคารสงเคราะห์" },
  { value: "bank-baac", label: "ธ.ก.ส." },
  { value: "bank-tisco", label: "TISCO ทิสโก้" },
  { value: "bank-kk", label: "KKP เกียรตินาคินภัทร" },
  { value: "bank-lhbank", label: "LH Bank แลนด์แอนด์เฮ้าส์" },
  { value: "bank-cimb", label: "CIMB ซีไอเอ็มบี" },
  { value: "bank-uob", label: "UOB ยูโอบี" },
  { value: "bank-icbc", label: "ICBC ไอซีบีซี" },
  { value: "ewallet-truemoney", label: "TrueMoney Wallet" },
  { value: "ewallet-rabbit", label: "Rabbit LINE Pay" },
  { value: "ewallet-shopee", label: "ShopeePay" },
  { value: "other", label: "อื่นๆ" },
];
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
  const [editItems, setEditItems] = useState<LineItem[]>([]);
  const [vatEnabled, setVatEnabled] = useState(false);
  const [whtEnabled, setWhtEnabled] = useState(false);

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
    setEditItems(r.items && r.items.length > 0 ? [...r.items] : [{ name: r.storeName, qty: 1, price: r.amount }]);
    setVatEnabled(false);
    setWhtEnabled(false);
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    const itemsTotal = editItems.reduce((s, it) => s + it.qty * it.price, 0);
    const vat = vatEnabled ? Math.round(itemsTotal * 0.07) : 0;
    const wht = whtEnabled ? Math.round(itemsTotal * 0.03) : 0;
    const total = itemsTotal + vat - wht;
    setReceipts((prev) => prev.map((r) => r._id === editingId ? { ...r, ...editForm, amount: total, items: editItems } : r));
    setEditingId(null);
    setEditForm({});
    setEditItems([]);
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
      <div className={`fixed inset-y-0 right-0 z-50 w-[540px] max-w-[95vw] bg-[#0a0a0a] border-l border-white/10 shadow-2xl overflow-y-auto transition-transform duration-300 ease-out ${editingId ? "translate-x-0" : "translate-x-full"}`}>
        {editingReceipt && (() => {
          const itemsTotal = editItems.reduce((s, it) => s + it.qty * it.price, 0);
          const vatAmount = vatEnabled ? Math.round(itemsTotal * 0.07) : 0;
          const whtAmount = whtEnabled ? Math.round(itemsTotal * 0.03) : 0;
          const grandTotal = itemsTotal + vatAmount - whtAmount;
          const inp = "w-full h-9 px-3 bg-white/5 border border-white/10 text-white rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50";
          const lbl = "block text-xs text-white/40 mb-1";

          return (
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">แก้ไขใบเสร็จ</h2>
              <button onClick={handleCancelEdit} className="w-8 h-8 rounded-lg hover:bg-white/5 text-white/40 hover:text-white flex items-center justify-center text-xl transition-colors">&times;</button>
            </div>

            {/* Slip image */}
            <div className="w-full h-52 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
              {editingReceipt.imageUrl ? (
                <img src={editingReceipt.imageUrl} alt="" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center"><ImageIcon size={36} className="text-white/15 mx-auto mb-2" /><p className="text-xs text-white/30">ไม่มีรูปสลิป</p></div>
              )}
            </div>

            {/* Edit form */}
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 space-y-3">
              <p className="text-xs font-semibold text-white/50">ข้อมูลใบเสร็จ</p>
              <div><label className={lbl}>ร้านค้า</label><input value={editForm.storeName || ""} onChange={(e) => setEditForm({ ...editForm, storeName: e.target.value })} className={inp} /></div>
              <div><label className={lbl}>รายละเอียด</label><textarea rows={2} defaultValue="" placeholder="หมายเหตุ, รายละเอียดเพิ่มเติม..." className={`${inp} h-auto py-2`} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>วันที่</label><DatePicker value={editForm.date || ""} onChange={(v) => setEditForm({ ...editForm, date: v })} /></div>
                <div><label className={lbl}>วิธีจ่าย</label>
                  <Select value={editForm.source || "cash"} onChange={(v) => setEditForm({ ...editForm, source: v })} options={PAYMENT_METHODS} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>หมวดหมู่</label>
                  <Select value={editForm.category || "ไม่ระบุ"} onChange={(v) => setEditForm({ ...editForm, category: v })} options={Object.entries(CATEGORY_COLORS).map(([c, color]) => ({ value: c, label: c, dot: color }))} />
                </div>
                <div><label className={lbl}>สถานะ</label>
                  <Select value={editForm.status || "pending"} onChange={(v) => setEditForm({ ...editForm, status: v })} options={[{ value: "confirmed", label: "ยืนยันแล้ว" }, { value: "pending", label: "รอตรวจสอบ" }, { value: "rejected", label: "ปฏิเสธ" }]} />
                </div>
              </div>
              <div><label className={lbl}>ประเภท</label>
                <Select value={editForm.type || "receipt"} onChange={(v) => setEditForm({ ...editForm, type: v })} options={Object.entries(typeLabel).map(([k, v]) => ({ value: k, label: v }))} />
              </div>
            </div>

            {/* Line items — add/remove */}
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-white/50">รายการสินค้า/บริการ</p>
                <button onClick={() => setEditItems([...editItems, { name: "", qty: 1, price: 0 }])} className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">+ เพิ่มรายการ</button>
              </div>
              {/* Column headers */}
              <div className="flex items-center gap-2 text-[10px] text-white/30 font-medium">
                <span className="w-5 shrink-0">#</span>
                <span className="flex-1">รายการ</span>
                <span className="w-12 text-center">จำนวน</span>
                <span className="w-20 text-right">ราคา/หน่วย</span>
                <span className="w-20 text-right">รวม</span>
                <span className="w-7 shrink-0"></span>
              </div>
              <div className="space-y-2">
                {editItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded text-[10px] font-medium bg-white/5 text-white/30 flex items-center justify-center shrink-0">{i + 1}</span>
                    <input value={item.name} onChange={(e) => { const n = [...editItems]; n[i] = { ...n[i], name: e.target.value }; setEditItems(n); }} placeholder="ชื่อรายการ" className="flex-1 h-8 px-2 bg-white/5 border border-white/10 text-white rounded text-xs focus:outline-none focus:border-[#FA3633]/50" />
                    <input type="number" value={item.qty} min={1} onChange={(e) => { const n = [...editItems]; n[i] = { ...n[i], qty: Math.max(1, Number(e.target.value)) }; setEditItems(n); }} className="w-12 h-8 px-2 bg-white/5 border border-white/10 text-white rounded text-xs text-center focus:outline-none" />
                    <input type="number" value={item.price} onChange={(e) => { const n = [...editItems]; n[i] = { ...n[i], price: Number(e.target.value) }; setEditItems(n); }} placeholder="0" className="w-20 h-8 px-2 bg-white/5 border border-white/10 text-white rounded text-xs text-right focus:outline-none" />
                    <span className="w-20 text-right text-xs font-medium text-white/60">฿{(item.qty * item.price).toLocaleString()}</span>
                    {editItems.length > 1 ? (
                      <button onClick={() => setEditItems(editItems.filter((_, j) => j !== i))} className="w-7 h-7 rounded hover:bg-red-500/10 text-white/20 hover:text-red-400 flex items-center justify-center transition-colors shrink-0"><Trash2 size={12} /></button>
                    ) : <span className="w-7 shrink-0" />}
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 pt-3 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-white/40">รวมสินค้า ({editItems.length} รายการ)</span><span className="text-white font-medium">฿{itemsTotal.toLocaleString()}</span></div>
              </div>
            </div>

            {/* VAT / WHT */}
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 space-y-3">
              <p className="text-xs font-semibold text-white/50">ภาษี</p>
              <label className="flex items-center justify-between cursor-pointer py-1">
                <div><p className="text-sm text-white">ภาษีมูลค่าเพิ่ม (VAT 7%)</p><p className="text-xs text-white/30">คำนวณ VAT จากยอดรวมสินค้า</p></div>
                <button onClick={() => setVatEnabled(!vatEnabled)} className={`w-11 h-6 rounded-full transition-colors relative ${vatEnabled ? "bg-[#FA3633]" : "bg-white/10"}`}><div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${vatEnabled ? "translate-x-[22px]" : "translate-x-0.5"}`} /></button>
              </label>
              {vatEnabled && (
                <div className="flex justify-between text-sm pl-1"><span className="text-white/40">VAT 7%</span><span className="text-blue-400 font-medium">+฿{vatAmount.toLocaleString()}</span></div>
              )}
              <label className="flex items-center justify-between cursor-pointer py-1">
                <div><p className="text-sm text-white">ภาษีหัก ณ ที่จ่าย (WHT 3%)</p><p className="text-xs text-white/30">หักภาษี ณ ที่จ่ายจากยอดรวม</p></div>
                <button onClick={() => setWhtEnabled(!whtEnabled)} className={`w-11 h-6 rounded-full transition-colors relative ${whtEnabled ? "bg-[#FA3633]" : "bg-white/10"}`}><div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${whtEnabled ? "translate-x-[22px]" : "translate-x-0.5"}`} /></button>
              </label>
              {whtEnabled && (
                <div className="flex justify-between text-sm pl-1"><span className="text-white/40">WHT 3%</span><span className="text-orange-400 font-medium">-฿{whtAmount.toLocaleString()}</span></div>
              )}
            </div>

            {/* Grand total */}
            {(() => {
              const ocrAmount = editingReceipt.amount;
              const mismatch = grandTotal !== ocrAmount && grandTotal > 0;
              return (
                <div className={`rounded-xl p-4 ${mismatch ? "bg-amber-500/10 border border-amber-500/20" : "bg-[#FA3633]/10 border border-[#FA3633]/20"}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white/70">ยอดสุทธิ</span>
                    <span className="text-2xl font-bold text-white">฿{grandTotal.toLocaleString()}</span>
                  </div>
                  {(vatEnabled || whtEnabled) && (
                    <p className="text-[11px] text-white/30 mt-1">สินค้า ฿{itemsTotal.toLocaleString()}{vatEnabled ? ` + VAT ฿${vatAmount.toLocaleString()}` : ""}{whtEnabled ? ` - WHT ฿${whtAmount.toLocaleString()}` : ""}</p>
                  )}
                  {mismatch && (
                    <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10">
                      <span className="text-amber-400 text-sm mt-0.5">⚠</span>
                      <div>
                        <p className="text-xs font-medium text-amber-400">ยอดไม่ตรงกับ OCR</p>
                        <p className="text-[11px] text-amber-400/60 mt-0.5">ยอดจาก OCR: ฿{ocrAmount.toLocaleString()} — ยอดที่แก้ไข: ฿{grandTotal.toLocaleString()} (ต่างกัน ฿{Math.abs(grandTotal - ocrAmount).toLocaleString()})</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Financial info */}
            <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 space-y-2">
              <p className="text-xs font-semibold text-white/50">ข้อมูลเพิ่มเติม</p>
              <div className="flex justify-between text-sm"><span className="text-white/40">วิธีจ่าย</span><span className="text-white">{editingReceipt.source || "-"}</span></div>
              <div className="flex justify-between text-sm"><span className="text-white/40">Drive</span><span className="flex items-center gap-1.5">{editingReceipt.driveUploaded ? <><Cloud size={14} className="text-green-500" /><span className="text-green-400 text-xs">อัปโหลดแล้ว</span></> : <><CloudOff size={14} className="text-white/20" /><span className="text-white/30 text-xs">ยังไม่อัปโหลด</span></>}</span></div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 sticky bottom-0 pb-6 bg-[#0a0a0a]">
              <button onClick={handleSaveEdit} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors">บันทึก</button>
              <button onClick={handleCancelEdit} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-white/60 hover:bg-white/10 transition-colors">ยกเลิก</button>
            </div>
          </div>
          );
        })()}
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
          <Select value={statusFilter} onChange={setStatusFilter} className="w-40" options={[{ value: "all", label: "สถานะทั้งหมด" }, { value: "confirmed", label: "ยืนยันแล้ว" }, { value: "pending", label: "รอตรวจสอบ" }, { value: "rejected", label: "ปฏิเสธ" }]} />
          <Select value={typeFilter} onChange={setTypeFilter} className="w-40" options={[{ value: "all", label: "ประเภททั้งหมด" }, ...Object.entries(typeLabel).map(([k, v]) => ({ value: k, label: v }))]} />
          <Select value={driveFilter} onChange={setDriveFilter} className="w-44" options={[{ value: "all", label: "Drive ทั้งหมด" }, { value: "uploaded", label: "อัปโหลดแล้ว" }, { value: "not_uploaded", label: "ยังไม่อัปโหลด" }]} />
        </div>
      </div>

      <DataTable dateField="rawDate" columns={columns} data={filtered} rowKey={(r) => r._id} expandRender={expandRender} />
    </div>
  );
}
