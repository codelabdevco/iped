"use client";

import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Copy, Trash2, Merge, Archive, AlertCircle, ImageIcon } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";

interface DuplicateDoc {
  id: string;
  shop: string;
  amount: number;
  date: string;
  similarity: number;
}

interface DuplicateGroup {
  id: string;
  docs: DuplicateDoc[];
  resolved: boolean;
}

const initialGroups: DuplicateGroup[] = [
  {
    id: "DG001",
    resolved: false,
    docs: [
      { id: "D001a", shop: "เซเว่นอีเลฟเว่น สาขาสีลม", amount: 245.0, date: "2026-03-17 10:32", similarity: 98 },
      { id: "D001b", shop: "เซเว่นอีเลฟเว่น สาขาสีลม", amount: 245.0, date: "2026-03-17 10:33", similarity: 98 },
    ],
  },
  {
    id: "DG002",
    resolved: false,
    docs: [
      { id: "D002a", shop: "แม็คโคร สาขาจรัญฯ", amount: 3820.5, date: "2026-03-15 09:15", similarity: 95 },
      { id: "D002b", shop: "แม็คโคร จรัญสนิทวงศ์", amount: 3820.5, date: "2026-03-15 09:16", similarity: 95 },
      { id: "D002c", shop: "แม็คโคร สาขาจรัญฯ", amount: 3820.5, date: "2026-03-15 14:20", similarity: 91 },
    ],
  },
  {
    id: "DG003",
    resolved: false,
    docs: [
      { id: "D003a", shop: "Cafe Amazon สาขาสีลม", amount: 120.0, date: "2026-03-14 08:30", similarity: 92 },
      { id: "D003b", shop: "คาเฟ่ อเมซอน สาขาอโศก", amount: 120.0, date: "2026-03-14 08:31", similarity: 92 },
    ],
  },
  {
    id: "DG004",
    resolved: false,
    docs: [
      { id: "D004a", shop: "บริษัท ไทยพาณิชย์ จำกัด", amount: 5600.0, date: "2026-03-13 15:00", similarity: 88 },
      { id: "D004b", shop: "บ. ไทยพาณิชย์ จก.", amount: 5600.0, date: "2026-03-13 15:01", similarity: 88 },
      { id: "D004c", shop: "Thai Panich Co Ltd", amount: 5600.0, date: "2026-03-13 15:02", similarity: 85 },
    ],
  },
];

export default function DuplicatesPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [groups, setGroups] = useState<DuplicateGroup[]>(initialGroups);

  const clearDemo = () => setGroups([]);
  const resolveGroup = (groupId: string) => setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, resolved: true } : g)));

  const cardCls = isDark ? "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)]" : "bg-white border-gray-200";
  const tp = isDark ? "text-white" : "text-gray-900";
  const ts = isDark ? "text-gray-400" : "text-gray-500";
  const tm = isDark ? "text-gray-500" : "text-gray-400";
  const subBg = isDark ? "bg-[rgba(255,255,255,0.06)]" : "bg-gray-100";
  const btnCls = isDark ? "bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-gray-300 hover:bg-[rgba(255,255,255,0.08)]" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50";

  return (
    <div className="space-y-6">
      <PageHeader title="ตรวจเอกสารซ้ำ" description="ตรวจจับและจัดการเอกสารที่อาจซ้ำกัน" onClear={clearDemo} />

      <div className="grid grid-cols-2 gap-4">
        <div className={"rounded-2xl border p-4 text-center " + cardCls}>
          <p className="text-3xl font-bold text-orange-500">{groups.length}</p>
          <p className={"text-sm mt-1 " + ts}>กลุ่มที่พบ</p>
        </div>
        <div className={"rounded-2xl border p-4 text-center " + cardCls}>
          <p className="text-3xl font-bold text-emerald-500">{groups.filter((g) => g.resolved).length}</p>
          <p className={"text-sm mt-1 " + ts}>จัดการแล้ว</p>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className={"rounded-2xl border p-12 text-center " + cardCls}>
          <p className={tm}>ไม่มีข้อมูลตัวอย่าง</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.id} className={"rounded-2xl border p-5 " + cardCls + (group.resolved ? " opacity-50" : "")}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <span className={tp + " font-medium"}>{"พบเอกสารคล้ายกัน " + group.docs.length + " รายการ"}</span>
                  {group.resolved && (
                    <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-500">จัดการแล้ว</span>
                  )}
                </div>
                <span className={"text-sm " + ts}>{"ความคล้าย ~" + group.docs[0].similarity + "%"}</span>
              </div>

              <div className="space-y-2 mb-4">
                {group.docs.map((doc) => (
                  <div key={doc.id} className={"flex items-center gap-3 rounded-xl p-3 " + subBg}>
                    <div className={"w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 " + (isDark ? "bg-[rgba(255,255,255,0.04)]" : "bg-white")}>
                      <ImageIcon className={"w-5 h-5 " + tm} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={"text-sm font-medium truncate " + tp}>{doc.shop}</p>
                      <p className={"text-xs " + ts}>{doc.date}</p>
                    </div>
                    <p className={"text-sm font-semibold " + tp}>{"฿" + doc.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</p>
                    <span className={"text-xs px-2 py-0.5 rounded-md font-medium " + (doc.similarity >= 95 ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500")}>{doc.similarity + "%"}</span>
                  </div>
                ))}
              </div>

              {!group.resolved && (
                <div className="flex items-center gap-2">
                  <button onClick={() => resolveGroup(group.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors">
                    <Merge className="w-4 h-4" />
                    รวม
                  </button>
                  <button onClick={() => resolveGroup(group.id)} className={"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors " + (isDark ? "bg-[rgba(255,255,255,0.06)] text-gray-300 hover:bg-[rgba(255,255,255,0.1)]" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                    <Archive className="w-4 h-4" />
                    เก็บทั้งหมด
                  </button>
                  <button onClick={() => resolveGroup(group.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors">
                    <Trash2 className="w-4 h-4" />
                    ลบซ้ำ
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
