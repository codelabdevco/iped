"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateShort } from "@/lib/utils";

interface Receipt {
  _id: string;
  merchant: string;
  date: string;
  amount: number;
  category: string;
  categoryIcon: string;
  status: string;
  type: string;
  paymentMethod?: string;
}

interface ReceiptListProps {
  receipts: Receipt[];
  onSelect?: (id: string) => void;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
  pending: { label: "รอยืนยัน", variant: "warning" },
  confirmed: { label: "ยืนยันแล้ว", variant: "success" },
  edited: { label: "แก้ไขแล้ว", variant: "default" },
  paid: { label: "จ่ายแล้ว", variant: "success" },
  overdue: { label: "เกินกำหนด", variant: "destructive" },
  matched: { label: "จับคู่แล้ว", variant: "default" },
  cancelled: { label: "ยกเลิก", variant: "secondary" },
};

const TYPE_MAP: Record<string, string> = {
  receipt: "ใบเสร็จ",
  invoice: "ใบแจ้งหนี้",
  billing: "ใบวางบิล",
  debit_note: "ใบเพิ่มหนี้",
  credit_note: "ใบลดหนี้",
};

export default function ReceiptList({ receipts, onSelect }: ReceiptListProps) {
  if (receipts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-medium">ยังไม่มีรายการ</p>
          <p className="text-sm mt-1">อัปโหลดใบเสร็จเพื่อเริ่มต้นใช้งาน</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {receipts.map((r) => {
        const status = STATUS_MAP[r.status] || STATUS_MAP.pending;
        return (
          <Card key={r._id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSelect?.(r._id)}>
            <CardContent className="py-4 px-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{r.categoryIcon}</span>
                  <div>
                    <p className="font-medium text-gray-900">{r.merchant}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{formatDateShort(r.date)}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{TYPE_MAP[r.type] || r.type}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(r.amount)}</p>
                  <Badge variant={status.variant} className="mt-1 text-[10px]">
                    {status.label}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
