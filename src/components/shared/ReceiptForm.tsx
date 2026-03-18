"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ALL_CATEGORIES } from "@/lib/categories";
import { formatCurrency } from "@/lib/utils";

export interface ReceiptData {
  merchant: string;
  date: string;
  amount: number;
  vat?: number;
  category: string;
  categoryIcon: string;
  subCategory?: string;
  paymentMethod?: string;
  note?: string;
  type: string;
  ocrConfidence?: number;
  ocrRawText?: string;
  imageUrl?: string;
}

interface ReceiptFormProps {
  data: ReceiptData;
  imagePreview?: string;
  isDuplicate?: boolean;
  duplicateInfo?: string;
  onConfirm: (data: ReceiptData) => void;
  onCancel: () => void;
}

const PAYMENT_METHODS = [
  { value: "cash", label: "เงินสด", icon: "💵" },
  { value: "transfer", label: "โอนเงิน", icon: "📲" },
  { value: "credit", label: "บัตรเครดิต", icon: "💳" },
  { value: "debit", label: "บัตรเดบิต", icon: "💳" },
  { value: "other", label: "อื่นๆ", icon: "📋" },
];

const DOC_TYPES = [
  { value: "receipt", label: "ใบเสร็จ" },
  { value: "invoice", label: "ใบแจ้งหนี้" },
  { value: "billing", label: "ใบวางบิล" },
  { value: "debit_note", label: "ใบเพิ่มหนี้" },
  { value: "credit_note", label: "ใบลดหนี้" },
];

export default function ReceiptForm({ data, imagePreview, isDuplicate, duplicateInfo, onConfirm, onCancel }: ReceiptFormProps) {
  const [form, setForm] = useState<ReceiptData>(data);
  const [showCategories, setShowCategories] = useState(false);

  const updateField = (field: keyof ReceiptData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const selectCategory = (cat: (typeof ALL_CATEGORIES)[0]) => {
    setForm((prev) => ({ ...prev, category: cat.id, categoryIcon: cat.icon }));
    setShowCategories(false);
  };

  const currentCategory = ALL_CATEGORIES.find((c) => c.id === form.category);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {imagePreview && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">รูปต้นฉบับ</CardTitle></CardHeader>
          <CardContent>
            <img src={imagePreview} alt="ใบเสร็จ" className="w-full rounded-lg border object-contain max-h-[500px]" />
            {data.ocrConfidence !== undefined && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">ความแม่นยำ OCR:</span>
                <Badge variant={data.ocrConfidence > 90 ? "success" : data.ocrConfidence > 70 ? "warning" : "destructive"}>{data.ocrConfidence}%</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">ข้อมูลที่อ่านได้</CardTitle>
            {isDuplicate && <Badge variant="warning" className="text-xs">⚠️ อาจซ้ำ: {duplicateInfo}</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">ประเภทเอกสาร</label>
            <div className="flex flex-wrap gap-2">{DOC_TYPES.map((t) => (<Button key={t.value} variant={form.type === t.value ? "default" : "outline"} size="sm" onClick={() => updateField("type", t.value)}>{t.label}</Button>))}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">ร้านค้า / ผู้ออก</label>
            <Input value={form.merchant} onChange={(e) => updateField("merchant", e.target.value)} placeholder="ชื่อร้านค้า" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">วันที่</label>
            <Input type="date" value={form.date} onChange={(e) => updateField("date", e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1"><label className="text-sm font-medium text-gray-700 mb-1 block">ยอดรวม (฿)</label><Input type="number" value={form.amount} onChange={(e) => updateField("amount", parseFloat(e.target.value) || 0)} className="text-right font-semibold text-lg" /></div>
            <div><label className="text-sm font-medium text-gray-700 mb-1 block">VAT 7%</label><Input type="number" value={form.vat || ""} onChange={(e) => updateField("vat", parseFloat(e.target.value) || 0)} className="text-right" placeholder="0" /></div>
            <div><label className="text-sm font-medium text-gray-700 mb-1 block">หัก ณ ที่จ่าย</label><Input type="number" value={0} className="text-right" placeholder="0" readOnly /></div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">หมวดหมู่</label>
            <Button variant="outline" className="w-full justify-start text-left" onClick={() => setShowCategories(!showCategories)}>
              <span className="mr-2">{currentCategory?.icon || "📋"}</span>{currentCategory?.name || "เลือกหมวดหมู่"}
            </Button>
            {showCategories && (<div className="mt-2 grid grid-cols-2 gap-2">{ALL_CATEGORIES.map((cat) => (<Button key={cat.id} variant={form.category === cat.id ? "default" : "outline"} size="sm" className="justify-start" onClick={() => selectCategory(cat)}><span className="mr-2">{cat.icon}</span>{cat.name}</Button>))}</div>)}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">วิธีชำระเงิน</label>
            <div className="flex flex-wrap gap-2">{PAYMENT_METHODS.map((pm) => (<Button key={pm.value} variant={form.paymentMethod === pm.value ? "default" : "outline"} size="sm" onClick={() => updateField("paymentMethod", pm.value)}>{pm.icon} {pm.label}</Button>))}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">หมายเหตุ</label>
            <Input value={form.note || ""} onChange={(e) => updateField("note", e.target.value)} placeholder="เพิ่มหมายเหตุ (ไม่บังคับ)" />
          </div>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button className="flex-1" onClick={() => onConfirm(form)}>✅ ยืนยันบันทึก</Button>
          <Button variant="outline" onClick={onCancel}>ยกเลิก</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
