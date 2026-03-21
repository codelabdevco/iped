"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Package, Monitor, CheckCircle, AlertTriangle, Clock, Plus, Search,
  Pencil, Trash2, X, Loader2, ArrowLeftRight, Wrench, History,
  CircleDollarSign, Archive, Hand, RotateCcw, Laptop, Car, Building2,
  Armchair, Printer, Smartphone, HardDrive, Wifi,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import DataTable, { Column } from "@/components/dashboard/DataTable";
import Select from "@/components/dashboard/Select";
import DatePicker from "@/components/dashboard/DatePicker";
import Baht from "@/components/dashboard/Baht";

interface HistoryItem {
  _id: string; action: string; date: string; borrowerName: string; department: string;
  purpose: string; conditionBefore: string; conditionAfter: string; actualReturnDate: string; note: string;
}

interface AssetRow {
  _id: string; assetCode: string; name: string; description: string;
  category: string; subCategory: string; brand: string; model: string; serialNumber: string;
  purchaseDate: string; purchasePrice: number; currentValue: number;
  vendor: string; warrantyExpiry: string; location: string; department: string;
  status: string; condition: string; currentBorrowerName: string;
  borrowDate: string; expectedReturnDate: string; borrowPurpose: string;
  historyCount: number; history: HistoryItem[]; note: string; createdAt: string;
}

interface Props {
  assets: AssetRow[];
  stats: { total: number; totalValue: number; available: number; inUse: number; borrowed: number; maintenance: number; overdue: number };
}

const CATEGORIES = [
  { value: "computer", label: "คอมพิวเตอร์/โน้ตบุ๊ก" }, { value: "phone", label: "โทรศัพท์/แท็บเล็ต" },
  { value: "printer", label: "เครื่องพิมพ์/สแกนเนอร์" }, { value: "network", label: "อุปกรณ์เครือข่าย" },
  { value: "furniture", label: "เฟอร์นิเจอร์" }, { value: "vehicle", label: "ยานพาหนะ" },
  { value: "tool", label: "เครื่องมือ/อุปกรณ์" }, { value: "software", label: "ซอฟต์แวร์/ลิขสิทธิ์" },
  { value: "building", label: "อาคาร/สิ่งปลูกสร้าง" }, { value: "other", label: "อื่นๆ" },
];

const CONDITIONS = [
  { value: "new", label: "ใหม่" }, { value: "excellent", label: "ดีมาก" },
  { value: "good", label: "ดี" }, { value: "fair", label: "พอใช้" },
  { value: "poor", label: "ทรุดโทรม" }, { value: "broken", label: "เสียหาย" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "ทั้งหมด" }, { value: "available", label: "พร้อมใช้" },
  { value: "in-use", label: "กำลังใช้" }, { value: "borrowed", label: "ยืมออก" },
  { value: "maintenance", label: "ซ่อมบำรุง" }, { value: "retired", label: "ปลดระวาง" },
];

const statusStyle: Record<string, string> = {
  available: "bg-green-500/20 text-green-400", "in-use": "bg-blue-500/20 text-blue-400",
  borrowed: "bg-yellow-500/20 text-yellow-400", maintenance: "bg-orange-500/20 text-orange-400",
  retired: "bg-gray-500/20 text-gray-400", lost: "bg-red-500/20 text-red-400", disposed: "bg-gray-500/20 text-gray-400",
};
const statusLabel: Record<string, string> = {
  available: "พร้อมใช้", "in-use": "กำลังใช้", borrowed: "ยืมออก",
  maintenance: "ซ่อมบำรุง", retired: "ปลดระวาง", lost: "สูญหาย", disposed: "จำหน่ายแล้ว",
};
const condStyle: Record<string, string> = {
  new: "text-green-400", excellent: "text-green-400", good: "text-blue-400",
  fair: "text-yellow-400", poor: "text-orange-400", broken: "text-red-400",
};
const condLabel: Record<string, string> = {
  new: "ใหม่", excellent: "ดีมาก", good: "ดี", fair: "พอใช้", poor: "ทรุดโทรม", broken: "เสียหาย",
};
const actionLabel: Record<string, string> = {
  register: "ลงทะเบียน", borrow: "ยืม", return: "คืน", transfer: "โอนย้าย",
  maintenance: "ซ่อมบำรุง", retire: "ปลดระวาง", "condition-change": "เปลี่ยนสภาพ",
};
const catIcon: Record<string, typeof Monitor> = {
  computer: Laptop, phone: Smartphone, printer: Printer, network: Wifi,
  furniture: Armchair, vehicle: Car, building: Building2, tool: Wrench,
  software: HardDrive, other: Package,
};

function baht(n: number) { return `฿${n.toLocaleString("th-TH", { minimumFractionDigits: 0 })}`; }

export default function AssetsClient({ assets: initial, stats }: Props) {
  const { isDark } = useTheme();
  const router = useRouter();
  const c = (d: string, l: string) => (isDark ? d : l);
  const [assets, setAssets] = useState(initial);
  const [tab, setTab] = useState<"assets" | "borrows" | "history">("assets");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showPanel, setShowPanel] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [historyAssetId, setHistoryAssetId] = useState<string | null>(null);

  // Borrow modal
  const [borrowAssetId, setBorrowAssetId] = useState<string | null>(null);
  const [borrowForm, setBorrowForm] = useState({ borrowerName: "", department: "", purpose: "", expectedReturnDate: "", note: "" });
  const [borrowing, setBorrowing] = useState(false);

  // Return modal
  const [returnAssetId, setReturnAssetId] = useState<string | null>(null);
  const [returnForm, setReturnForm] = useState({ conditionAfter: "good", note: "" });
  const [returning, setReturning] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const defaultForm = {
    assetCode: "", name: "", description: "", category: "computer", subCategory: "",
    brand: "", model: "", serialNumber: "", purchaseDate: new Date().toISOString().slice(0, 10),
    purchasePrice: "", vendor: "", warrantyExpiry: "", condition: "new",
    location: "", department: "", note: "",
  };
  const [form, setForm] = useState(defaultForm);

  const filtered = useMemo(() => {
    let data = assets;
    if (tab === "borrows") data = data.filter(a => a.status === "borrowed");
    if (statusFilter !== "all" && tab === "assets") data = data.filter(a => a.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(a => a.name.toLowerCase().includes(q) || a.assetCode.toLowerCase().includes(q) || a.brand.toLowerCase().includes(q) || a.currentBorrowerName.toLowerCase().includes(q));
    }
    return data;
  }, [assets, tab, statusFilter, search]);

  const openAdd = () => { setEditingId(null); setForm(defaultForm); setShowPanel(true); };
  const openEdit = (a: AssetRow) => {
    setEditingId(a._id);
    setForm({
      assetCode: a.assetCode, name: a.name, description: a.description, category: a.category,
      subCategory: a.subCategory, brand: a.brand, model: a.model, serialNumber: a.serialNumber,
      purchaseDate: a.purchaseDate?.slice(0, 10) || "", purchasePrice: String(a.purchasePrice),
      vendor: a.vendor, warrantyExpiry: a.warrantyExpiry?.slice(0, 10) || "",
      condition: a.condition, location: a.location, department: a.department, note: a.note,
    });
    setShowPanel(true);
  };

  const handleSave = useCallback(async () => {
    if (!form.name || !form.assetCode || !form.category) return;
    setSaving(true);
    try {
      const url = editingId ? `/api/assets/${editingId}` : "/api/assets";
      const res = await fetch(url, { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { setShowPanel(false); window.location.reload(); }
    } catch {} finally { setSaving(false); }
  }, [form, editingId]);

  const handleBorrow = useCallback(async () => {
    if (!borrowAssetId || !borrowForm.borrowerName) return;
    setBorrowing(true);
    try {
      const res = await fetch(`/api/assets/${borrowAssetId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "borrow", ...borrowForm }),
      });
      if (res.ok) { setBorrowAssetId(null); window.location.reload(); }
    } catch {} finally { setBorrowing(false); }
  }, [borrowAssetId, borrowForm]);

  const handleReturn = useCallback(async () => {
    if (!returnAssetId) return;
    setReturning(true);
    try {
      const res = await fetch(`/api/assets/${returnAssetId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "return", ...returnForm }),
      });
      if (res.ok) { setReturnAssetId(null); window.location.reload(); }
    } catch {} finally { setReturning(false); }
  }, [returnAssetId, returnForm]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/assets/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) { setAssets(prev => prev.filter(a => a._id !== deleteTarget.id)); setDeleteTarget(null); }
    } catch {} finally { setDeleting(false); }
  }, [deleteTarget]);

  const inp = `w-full h-9 px-3 ${c("bg-white/5 border-white/10 text-white", "bg-gray-50 border-gray-200 text-gray-900")} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`;
  const lbl = `block text-xs ${c("text-white/40", "text-gray-500")} mb-1`;
  const panelBg = c("bg-[#0a0a0a] border-white/10", "bg-white border-gray-200");
  const cardBg = c("bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]", "bg-white border-gray-200");
  const inputCls = c("bg-white/5 border-white/10 text-white placeholder-white/30", "bg-white border-gray-200 text-gray-900 placeholder-gray-400");

  const isOverdue = (a: AssetRow) => a.status === "borrowed" && a.expectedReturnDate && new Date(a.expectedReturnDate) < new Date();

  const assetColumns: Column<AssetRow>[] = useMemo(() => [
    {
      key: "assetCode", label: "รหัส",
      render: (r) => <span className="font-mono text-xs">{r.assetCode}</span>,
    },
    {
      key: "name", label: "ทรัพย์สิน",
      render: (r) => {
        const Icon = catIcon[r.category] || Package;
        return (
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${c("bg-white/[0.06]", "bg-gray-100")}`}>
              <Icon size={16} className="text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-sm">{r.name}</p>
              {(r.brand || r.model) && <p className={`text-[10px] ${c("text-white/30", "text-gray-400")}`}>{[r.brand, r.model].filter(Boolean).join(" ")}</p>}
            </div>
          </div>
        );
      },
    },
    {
      key: "category", label: "หมวด",
      render: (r) => <span className={`text-xs ${c("text-white/50", "text-gray-500")}`}>{CATEGORIES.find(ct => ct.value === r.category)?.label || r.category}</span>,
    },
    {
      key: "purchasePrice", label: "มูลค่า", align: "right",
      render: (r) => <Baht value={r.purchasePrice} />,
    },
    {
      key: "condition", label: "สภาพ",
      render: (r) => <span className={`text-xs font-medium ${condStyle[r.condition]}`}>{condLabel[r.condition]}</span>,
    },
    {
      key: "status", label: "สถานะ",
      render: (r) => (
        <div>
          <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${statusStyle[r.status]}`}>{statusLabel[r.status]}</span>
          {r.status === "borrowed" && r.currentBorrowerName && (
            <p className={`text-[10px] mt-0.5 ${isOverdue(r) ? "text-red-400" : c("text-white/30", "text-gray-400")}`}>
              {r.currentBorrowerName} {isOverdue(r) && "• เกินกำหนด"}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "actions", label: "จัดการ", configurable: false,
      render: (r) => (
        <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
          {r.status === "available" && (
            <button onClick={() => { setBorrowAssetId(r._id); setBorrowForm({ borrowerName: "", department: "", purpose: "", expectedReturnDate: "", note: "" }); }}
              className={`p-1.5 rounded-lg transition-colors ${c("hover:bg-white/5 text-white/40 hover:text-yellow-400", "hover:bg-gray-100 text-gray-400 hover:text-yellow-500")}`} title="ให้ยืม"><Hand size={14} /></button>
          )}
          {r.status === "borrowed" && (
            <button onClick={() => { setReturnAssetId(r._id); setReturnForm({ conditionAfter: r.condition, note: "" }); }}
              className={`p-1.5 rounded-lg transition-colors ${c("hover:bg-white/5 text-white/40 hover:text-green-400", "hover:bg-gray-100 text-gray-400 hover:text-green-500")}`} title="รับคืน"><RotateCcw size={14} /></button>
          )}
          <button onClick={() => setHistoryAssetId(historyAssetId === r._id ? null : r._id)} className={`p-1.5 rounded-lg transition-colors ${c("hover:bg-white/5 text-white/40 hover:text-purple-400", "hover:bg-gray-100 text-gray-400 hover:text-purple-500")}`} title="ประวัติ"><History size={14} /></button>
          <button onClick={() => openEdit(r)} className={`p-1.5 rounded-lg transition-colors ${c("hover:bg-white/5 text-white/40 hover:text-blue-400", "hover:bg-gray-100 text-gray-400 hover:text-blue-500")}`} title="แก้ไข"><Pencil size={14} /></button>
          <button onClick={() => setDeleteTarget({ id: r._id, name: r.name })} className={`p-1.5 rounded-lg transition-colors ${c("hover:bg-white/5 text-white/40 hover:text-red-400", "hover:bg-gray-100 text-gray-400 hover:text-red-500")}`} title="ลบ"><Trash2 size={14} /></button>
        </div>
      ),
    },
  ], [isDark, historyAssetId]);

  return (
    <div className="space-y-6">
      {/* ── Add/Edit Panel ── */}
      {showPanel && <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setShowPanel(false)} />}
      {showPanel && (
        <div className={`fixed inset-y-0 right-0 z-50 w-[480px] max-w-[95vw] ${panelBg} border-l shadow-2xl overflow-y-auto animate-slide-in-right`}>
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className={`text-lg font-bold ${c("text-white", "text-gray-900")}`}>{editingId ? "แก้ไขทรัพย์สิน" : "เพิ่มทรัพย์สิน"}</h2>
              <button onClick={() => setShowPanel(false)} className={`w-8 h-8 rounded-lg ${c("hover:bg-white/5 text-white/40", "hover:bg-gray-100 text-gray-400")} flex items-center justify-center`}><X size={18} /></button>
            </div>
            <div className={`rounded-xl ${cardBg} border p-4 space-y-3`}>
              <p className="text-xs font-semibold text-[#FA3633]/70">ข้อมูลทรัพย์สิน</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>รหัสทรัพย์สิน *</label><input value={form.assetCode} onChange={e => setForm({ ...form, assetCode: e.target.value })} placeholder="AST-001" className={inp} /></div>
                <div><label className={lbl}>หมวดหมู่ *</label><Select value={form.category} onChange={v => setForm({ ...form, category: v })} options={CATEGORIES} /></div>
              </div>
              <div><label className={lbl}>ชื่อทรัพย์สิน *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="เช่น MacBook Pro 14 นิ้ว" className={inp} /></div>
              <div><label className={lbl}>รายละเอียด</label><input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="รายละเอียดเพิ่มเติม" className={inp} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>ยี่ห้อ</label><input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} placeholder="Apple" className={inp} /></div>
                <div><label className={lbl}>รุ่น</label><input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} placeholder="M3 Pro" className={inp} /></div>
              </div>
              <div><label className={lbl}>Serial Number</label><input value={form.serialNumber} onChange={e => setForm({ ...form, serialNumber: e.target.value })} placeholder="S/N" className={inp} /></div>
            </div>
            <div className={`rounded-xl ${cardBg} border p-4 space-y-3`}>
              <p className="text-xs font-semibold text-[#FA3633]/70">การจัดซื้อ</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>ราคาซื้อ (฿)</label><input type="number" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} placeholder="0" className={inp} /></div>
                <div><label className={lbl}>วันที่ซื้อ</label><DatePicker value={form.purchaseDate} onChange={v => setForm({ ...form, purchaseDate: v })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>ผู้จำหน่าย</label><input value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} placeholder="ร้านค้า/ผู้จำหน่าย" className={inp} /></div>
                <div><label className={lbl}>วันหมดประกัน</label><DatePicker value={form.warrantyExpiry} onChange={v => setForm({ ...form, warrantyExpiry: v })} /></div>
              </div>
              <div><label className={lbl}>สภาพ</label><Select value={form.condition} onChange={v => setForm({ ...form, condition: v })} options={CONDITIONS} /></div>
            </div>
            <div className={`rounded-xl ${cardBg} border p-4 space-y-3`}>
              <p className="text-xs font-semibold text-[#FA3633]/70">ที่ตั้ง</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>สถานที่</label><input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="สำนักงานใหญ่" className={inp} /></div>
                <div><label className={lbl}>แผนก</label><input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="IT" className={inp} /></div>
              </div>
              <div><label className={lbl}>หมายเหตุ</label><input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className={inp} /></div>
            </div>
            <div className={`flex gap-2 pt-2 sticky bottom-0 pb-6 ${c("bg-[#0a0a0a]", "bg-white")}`}>
              <button onClick={handleSave} disabled={saving || !form.name || !form.assetCode} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] disabled:opacity-40 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}{editingId ? "บันทึก" : "เพิ่มทรัพย์สิน"}
              </button>
              <button onClick={() => setShowPanel(false)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${c("bg-white/5 text-white/60", "bg-gray-100 text-gray-600")} transition-colors`}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      {/* Borrow Modal */}
      {borrowAssetId && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setBorrowAssetId(null)} />
          <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[420px] max-w-[90vw] ${panelBg} border rounded-2xl shadow-2xl`}>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center"><Hand size={20} className="text-yellow-400" /></div>
                <h2 className={`text-lg font-bold ${c("text-white", "text-gray-900")}`}>ให้ยืมทรัพย์สิน</h2>
              </div>
              <p className={`text-xs ${c("text-white/40", "text-gray-500")}`}>{assets.find(a => a._id === borrowAssetId)?.name}</p>
              <div><label className={lbl}>ผู้ยืม *</label><input value={borrowForm.borrowerName} onChange={e => setBorrowForm({ ...borrowForm, borrowerName: e.target.value })} placeholder="ชื่อ-นามสกุลผู้ยืม" className={inp} autoFocus /></div>
              <div><label className={lbl}>แผนก</label><input value={borrowForm.department} onChange={e => setBorrowForm({ ...borrowForm, department: e.target.value })} placeholder="แผนก" className={inp} /></div>
              <div><label className={lbl}>วัตถุประสงค์</label><input value={borrowForm.purpose} onChange={e => setBorrowForm({ ...borrowForm, purpose: e.target.value })} placeholder="เหตุผลการยืม" className={inp} /></div>
              <div><label className={lbl}>กำหนดคืน</label><DatePicker value={borrowForm.expectedReturnDate} onChange={v => setBorrowForm({ ...borrowForm, expectedReturnDate: v })} /></div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleBorrow} disabled={borrowing || !borrowForm.borrowerName} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-yellow-500 text-black hover:bg-yellow-400 disabled:opacity-40 flex items-center justify-center gap-2">
                  {borrowing && <Loader2 size={14} className="animate-spin" />}ยืนยันให้ยืม
                </button>
                <button onClick={() => setBorrowAssetId(null)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${c("bg-white/5 text-white/60", "bg-gray-100 text-gray-600")}`}>ยกเลิก</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Return Modal */}
      {returnAssetId && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setReturnAssetId(null)} />
          <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[420px] max-w-[90vw] ${panelBg} border rounded-2xl shadow-2xl`}>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center"><RotateCcw size={20} className="text-green-400" /></div>
                <h2 className={`text-lg font-bold ${c("text-white", "text-gray-900")}`}>รับคืนทรัพย์สิน</h2>
              </div>
              <p className={`text-xs ${c("text-white/40", "text-gray-500")}`}>{assets.find(a => a._id === returnAssetId)?.name} — ยืมโดย {assets.find(a => a._id === returnAssetId)?.currentBorrowerName}</p>
              <div><label className={lbl}>สภาพหลังคืน</label><Select value={returnForm.conditionAfter} onChange={v => setReturnForm({ ...returnForm, conditionAfter: v })} options={CONDITIONS} /></div>
              <div><label className={lbl}>หมายเหตุ</label><input value={returnForm.note} onChange={e => setReturnForm({ ...returnForm, note: e.target.value })} placeholder="หมายเหตุ" className={inp} /></div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleReturn} disabled={returning} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-green-500 text-white hover:bg-green-600 disabled:opacity-40 flex items-center justify-center gap-2">
                  {returning && <Loader2 size={14} className="animate-spin" />}ยืนยันรับคืน
                </button>
                <button onClick={() => setReturnAssetId(null)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${c("bg-white/5 text-white/60", "bg-gray-100 text-gray-600")}`}>ยกเลิก</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setDeleteTarget(null)} />
          <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[400px] max-w-[90vw] ${panelBg} border rounded-2xl shadow-2xl`}>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center"><AlertTriangle size={20} className="text-red-400" /></div>
                <h2 className={`text-lg font-bold ${c("text-white", "text-gray-900")}`}>ลบทรัพย์สิน</h2>
              </div>
              <p className={`text-sm ${c("text-white/60", "text-gray-600")}`}>ลบ <span className="font-bold">&ldquo;{deleteTarget.name}&rdquo;</span>? ข้อมูลและประวัติทั้งหมดจะถูกลบถาวร</p>
              <div className="flex gap-2 pt-2">
                <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 flex items-center justify-center gap-2">
                  {deleting && <Loader2 size={14} className="animate-spin" />}ลบถาวร
                </button>
                <button onClick={() => setDeleteTarget(null)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${c("bg-white/5 text-white/60", "bg-gray-100 text-gray-600")}`}>ยกเลิก</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Header ── */}
      <PageHeader title="ทรัพย์สิน & ครุภัณฑ์" description="จัดการทรัพย์สินบริษัท ระบบยืม-คืน และประวัติการใช้งาน" />

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatsCard label="ทั้งหมด" value={`${stats.total}`} icon={<Package size={18} />} color="text-blue-500" />
        <StatsCard label="พร้อมใช้" value={`${stats.available}`} icon={<CheckCircle size={18} />} color="text-green-500" />
        <StatsCard label="กำลังใช้" value={`${stats.inUse}`} icon={<Monitor size={18} />} color="text-blue-400" />
        <StatsCard label="ยืมออก" value={`${stats.borrowed}`} icon={<Hand size={18} />} color="text-yellow-500" />
        <StatsCard label="มูลค่ารวม" value={baht(stats.totalValue)} icon={<CircleDollarSign size={18} />} color="text-purple-500" />
        <StatsCard label="เกินกำหนดคืน" value={`${stats.overdue}`} icon={<AlertTriangle size={18} />} color="text-red-500" />
      </div>

      {/* ── Search + Tabs ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${c("text-white/30", "text-gray-400")}`} />
          <input type="text" placeholder="ค้นหาชื่อ, รหัส, ยี่ห้อ, ผู้ยืม..." value={search} onChange={e => setSearch(e.target.value)} className={`w-full h-10 pl-9 pr-4 ${inputCls} border rounded-lg text-sm focus:outline-none focus:border-[#FA3633]/50`} />
        </div>
        {tab === "assets" && <div className="w-32"><Select value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} /></div>}
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#FA3633] text-white hover:bg-[#e0302d] transition-colors shadow-sm shadow-[#FA3633]/25">
          <Plus size={16} />เพิ่มทรัพย์สิน
        </button>
      </div>

      <div className={`flex gap-1 p-1 rounded-xl w-fit ${c("bg-white/[0.04]", "bg-gray-100")}`}>
        <button onClick={() => { setTab("assets"); setSearch(""); setStatusFilter("all"); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "assets" ? c("bg-white/10 text-white", "bg-white text-gray-900 shadow-sm") : c("text-white/50", "text-gray-500")}`}>
          <Package size={14} className="inline mr-1.5 -mt-0.5" />ทรัพย์สิน
        </button>
        <button onClick={() => { setTab("borrows"); setSearch(""); }} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "borrows" ? c("bg-white/10 text-white", "bg-white text-gray-900 shadow-sm") : c("text-white/50", "text-gray-500")}`}>
          <ArrowLeftRight size={14} className="inline mr-1.5 -mt-0.5" />ยืม-คืน {stats.borrowed > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-yellow-500/20 text-yellow-400">{stats.borrowed}</span>}
        </button>
      </div>

      {/* ── Table ── */}
      <DataTable
        columns={assetColumns}
        data={filtered}
        rowKey={r => r._id}
        emptyText={tab === "borrows" ? "ไม่มีทรัพย์สินที่ยืมออก" : "ยังไม่มีทรัพย์สิน — กด 'เพิ่มทรัพย์สิน' เพื่อเริ่มต้น"}
        columnConfigKey={tab === "borrows" ? "assets-borrows" : "assets-all"}
      />

      {/* ── History Panel ── */}
      {historyAssetId && (() => {
        const a = assets.find(x => x._id === historyAssetId);
        if (!a) return null;
        return (
          <div className={`rounded-2xl border p-5 ${c("bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)]", "bg-white border-gray-200")}`}>
            <div className="flex items-center justify-between mb-4">
              <h4 className={`text-sm font-bold ${c("text-white", "text-gray-900")}`}>
                <History size={15} className="inline mr-1.5 -mt-0.5 text-purple-400" />ประวัติ — {a.name} ({a.historyCount} รายการ)
              </h4>
              <button onClick={() => setHistoryAssetId(null)} className={`p-1.5 rounded-lg ${c("hover:bg-white/5 text-white/40", "hover:bg-gray-100 text-gray-400")}`}><X size={14} /></button>
            </div>
            {a.history.length > 0 ? (
              <div className="space-y-2">
                {a.history.slice().reverse().map(h => (
                  <div key={h._id} className={`flex items-start gap-3 p-3 rounded-xl ${c("bg-white/[0.03] border border-white/[0.04]", "bg-gray-50 border border-gray-100")}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      h.action === "borrow" ? "bg-yellow-500/10" : h.action === "return" ? "bg-green-500/10" : h.action === "maintenance" ? "bg-orange-500/10" : "bg-blue-500/10"
                    }`}>
                      {h.action === "borrow" ? <Hand size={13} className="text-yellow-400" /> :
                       h.action === "return" ? <RotateCcw size={13} className="text-green-400" /> :
                       h.action === "maintenance" ? <Wrench size={13} className="text-orange-400" /> :
                       <History size={13} className="text-blue-400" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${c("text-white/80", "text-gray-700")}`}>{actionLabel[h.action] || h.action}</span>
                        <span className={`text-[10px] ${c("text-white/30", "text-gray-400")}`}>{new Date(h.date).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })} {new Date(h.date).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      {h.borrowerName && <p className={`text-[11px] ${c("text-white/50", "text-gray-500")}`}>ผู้ยืม: {h.borrowerName} {h.department && `(${h.department})`}</p>}
                      {h.purpose && <p className={`text-[11px] ${c("text-white/40", "text-gray-400")}`}>เหตุผล: {h.purpose}</p>}
                      {h.actualReturnDate && <p className={`text-[11px] text-green-400`}>คืนเมื่อ: {new Date(h.actualReturnDate).toLocaleDateString("th-TH")}</p>}
                      {h.conditionBefore && h.conditionAfter && h.conditionBefore !== h.conditionAfter && (
                        <p className={`text-[11px] ${c("text-white/40", "text-gray-400")}`}>สภาพ: {condLabel[h.conditionBefore]} → {condLabel[h.conditionAfter]}</p>
                      )}
                      {h.note && <p className={`text-[10px] ${c("text-white/30", "text-gray-400")}`}>{h.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-xs text-center py-6 ${c("text-white/30", "text-gray-400")}`}>ยังไม่มีประวัติ</p>
            )}
          </div>
        );
      })()}
    </div>
  );
}
