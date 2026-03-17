'use client';

import DataTable, { Column } from '@/components/dashboard/DataTable';

interface Receipt {
  _id: string;
  storeName: string;
  type: string;
  category: string;
  amount: number;
  date: string;
  status: string;
  time?: string;
  description?: string;
}

interface Props {
  receipts: Receipt[];
  isDark: boolean;
  getCatColor: (cat: string) => string;
}

function getThaiType(type: string): string {
  switch (type) {
    case 'receipt': return 'ใบเสร็จ';
    case 'invoice': return 'ใบแจ้งหนี้';
    case 'payment': return 'ใบรับเงิน';
    default: return type;
  }
}

const statusMap: Record<string, { text: string; cls: string }> = {
  confirmed: { text: 'ยืนยันแล้ว', cls: 'bg-green-500/10 text-green-400' },
  pending: { text: 'รอตรวจสอบ', cls: 'bg-yellow-500/10 text-yellow-400' },
  rejected: { text: 'ปฏิเสธ', cls: 'bg-red-500/10 text-red-400' },
  duplicate: { text: 'เอกสารซ้ำ', cls: 'bg-orange-500/10 text-orange-400' },
};

export default function ReceiptsTable({ receipts, isDark, getCatColor }: Props) {
  const columns: Column<Receipt>[] = [
    {
      key: 'storeName',
      label: 'ร้านค้า',
      render: (r) => <span className="font-medium">{r.storeName}</span>,
    },
    {
      key: 'type',
      label: 'ประเภท',
      render: (r) => <span>{getThaiType(r.type)}</span>,
    },
    {
      key: 'category',
      label: 'หมวดหมู่',
      render: (r) => (
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getCatColor(r.category) }} />
          {r.category}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'จำนวนเงิน',
      align: 'right',
      render: (r) => (
        <span className="font-semibold">
          ฿{r.amount.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'date',
      label: 'วันที่',
    },
    {
      key: 'status',
      label: 'สถานะ',
      render: (r) => {
        const info = statusMap[r.status] || { text: r.status, cls: 'bg-gray-500/10 text-gray-400' };
        return (
          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${info.cls}`}>
            {info.text}
          </span>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={receipts}
      rowKey={(r) => r._id}
    />
  );
}
