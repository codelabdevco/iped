'use client';
import { useState, useRef } from 'react';

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

const COLUMNS = [
  { key: 'storeName', label: 'ร้านค้า' },
  { key: 'type', label: 'ประเภท' },
  { key: 'description', label: 'รายละเอียด' },
  { key: 'category', label: 'หมวดหมู่' },
  { key: 'amount', label: 'จำนวนเงิน' },
  { key: 'date', label: 'วันที่' },
  { key: 'time', label: 'เวลา' },
  { key: 'status', label: 'สถานะ' },
];

function getThaiType(type: string): string {
  switch (type) {
    case 'receipt': return 'ใบเสร็จ';
    case 'invoice': return 'ใบแจ้งหนี้';
    case 'payment': return 'ใบรับเงิน';
    default: return type;
  }
}

function getStatusInfo(status: string): { text: string; bg: string; textColor: string } {
  switch (status) {
    case 'confirmed':
      return { text: 'ยืนยันแล้ว', bg: 'bg-green-100 dark:bg-green-900/30', textColor: 'text-green-700 dark:text-green-400' };
    case 'pending':
      return { text: 'รอตรวจสอบ', bg: 'bg-yellow-100 dark:bg-yellow-900/30', textColor: 'text-yellow-700 dark:text-yellow-400' };
    case 'rejected':
      return { text: 'ปฏิเสธ', bg: 'bg-red-100 dark:bg-red-900/30', textColor: 'text-red-700 dark:text-red-400' };
    case 'duplicate':
      return { text: 'เอกสารซ้ำ', bg: 'bg-orange-100 dark:bg-orange-900/30', textColor: 'text-orange-700 dark:text-orange-400' };
    default:
      return { text: status, bg: 'bg-gray-100 dark:bg-gray-900/30', textColor: 'text-gray-700 dark:text-gray-400' };
  }
}

export default function ReceiptsTable({ receipts, isDark, getCatColor }: Props) {
  const [colOrder, setColOrder] = useState<number[]>(COLUMNS.map((_, i) => i));
  const [perPage, setPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [hovered, setHovered] = useState<string | null>(null);
  const dragFrom = useRef<number | null>(null);

  const totalPages = Math.max(1, Math.ceil(receipts.length / perPage));
  const safeP = Math.min(page, totalPages);
  const sliced = receipts.slice((safeP - 1) * perPage, safeP * perPage);

  const onDragStart = (idx: number) => {
    dragFrom.current = idx;
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (idx: number) => {
    if (dragFrom.current === null || dragFrom.current === idx) return;
    const newOrder = [...colOrder];
    const from = dragFrom.current;
    const item = newOrder.splice(from, 1)[0];
    newOrder.splice(idx, 0, item);
    setColOrder(newOrder);
    dragFrom.current = null;
  };

  const renderCell = (key: string, r: Receipt) => {
    switch (key) {
      case 'storeName':
        return (
          <div className="relative group">
            <span className="font-medium">{r.storeName}</span>
            <div className="absolute z-50 hidden group-hover:block bottom-full left-0 mb-2 w-64 p-3 rounded-lg shadow-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <p className="font-semibold text-sm mb-1">{r.storeName}</p>
              <p className="text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: getCatColor(r.category) }}></span>
                {r.category}
              </p>
              <p className="text-xs mt-1">{new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(r.amount)}</p>
              <p className="text-xs mt-1">{new Date(r.date).toLocaleDateString('th-TH')}</p>
            </div>
          </div>
        );
      case 'type':
        return <span>{getThaiType(r.type)}</span>;
      case 'description':
        return (
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px] inline-block">
            {r.description || '-'}
          </span>
        );
      case 'category':
        return (
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getCatColor(r.category) }}></span>
            {r.category}
          </span>
        );
      case 'amount':
        return (
          <span className="font-medium">
            {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(r.amount)}
          </span>
        );
      case 'date':
        return <span>{new Date(r.date).toLocaleDateString('th-TH')}</span>;
      case 'time':
        return <span className="text-xs">{r.time || '-'}</span>;
      case 'status': {
        const info = getStatusInfo(r.status);
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${info.bg} ${info.textColor}`}>
            {info.text}
          </span>
        );
      }
      default:
        return null;
    }
  };

  const pageNumbers = (): number[] => {
    const pages: number[] = [];
    let start = Math.max(1, safeP - 2);
    let end = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={isDark ? 'border-b border-gray-700' : 'border-b border-gray-200'}>
              {colOrder.map((ci, idx) => (
                <th
                  key={COLUMNS[ci].key}
                  draggable
                  onDragStart={() => onDragStart(idx)}
                  onDragOver={onDragOver}
                  onDrop={() => onDrop(idx)}
                  className={`py-3 px-4 text-left text-xs font-medium uppercase tracking-wider cursor-grab active:cursor-grabbing select-none ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  {COLUMNS[ci].label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sliced.map((r) => (
              <tr
                key={r._id}
                onMouseEnter={() => setHovered(r._id)}
                onMouseLeave={() => setHovered(null)}
                className={`transition-colors ${
                  hovered === r._id
                    ? isDark ? 'bg-gray-700/50' : 'bg-gray-50'
                    : ''
                } ${isDark ? 'border-b border-gray-700' : 'border-b border-gray-100'}`}
              >
                {colOrder.map((ci) => (
                  <td key={COLUMNS[ci].key} className="py-3 px-4 whitespace-nowrap">
                    {renderCell(COLUMNS[ci].key, r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className={`mt-5 px-4 py-3 rounded-xl ${
        isDark ? 'bg-gray-800/60 border border-gray-700/50' : 'bg-gray-50/80 border border-gray-200/60'
      }`}>
        {/* Info row */}
        <div className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          แสดงรายการที่ <span className={isDark ? 'text-gray-200 font-semibold' : 'text-gray-700 font-semibold'}>{Math.min((safeP - 1) * perPage + 1, receipts.length)}-{Math.min(safeP * perPage, receipts.length)}</span> จากทั้งหมด <span className={isDark ? 'text-gray-200 font-semibold' : 'text-gray-700 font-semibold'}>{receipts.length}</span> รายการ
        </div>

        <div className="flex items-center justify-between">
          {/* Left: Page navigation */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(1)}
              disabled={safeP <= 1}
              className={`h-9 px-2.5 flex items-center justify-center rounded-lg text-xs font-medium transition-all duration-200 ${
                safeP <= 1
                  ? 'opacity-25 cursor-not-allowed'
                  : isDark
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
                    : 'hover:bg-gray-200/70 text-gray-500 hover:text-gray-700'
              }`}
              title="หน้าแรก"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>
            </button>
            <button
              onClick={() => setPage(Math.max(1, safeP - 1))}
              disabled={safeP <= 1}
              className={`h-9 px-2.5 flex items-center justify-center rounded-lg text-xs font-medium transition-all duration-200 ${
                safeP <= 1
                  ? 'opacity-25 cursor-not-allowed'
                  : isDark
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
                    : 'hover:bg-gray-200/70 text-gray-500 hover:text-gray-700'
              }`}
              title="ก่อนหน้า"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>

            <div className={`flex items-center gap-1 mx-1 px-1 py-1 rounded-lg ${
              isDark ? 'bg-gray-900/50' : 'bg-white shadow-sm'
            }`}>
              {pageNumbers().map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`min-w-[36px] h-8 px-2 flex items-center justify-center rounded-md text-sm font-semibold transition-all duration-200 ${
                    p === safeP
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : isDark
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              onClick={() => setPage(Math.min(totalPages, safeP + 1))}
              disabled={safeP >= totalPages}
              className={`h-9 px-2.5 flex items-center justify-center rounded-lg text-xs font-medium transition-all duration-200 ${
                safeP >= totalPages
                  ? 'opacity-25 cursor-not-allowed'
                  : isDark
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
                    : 'hover:bg-gray-200/70 text-gray-500 hover:text-gray-700'
              }`}
              title="ถัดไป"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={safeP >= totalPages}
              className={`h-9 px-2.5 flex items-center justify-center rounded-lg text-xs font-medium transition-all duration-200 ${
                safeP >= totalPages
                  ? 'opacity-25 cursor-not-allowed'
                  : isDark
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
                    : 'hover:bg-gray-200/70 text-gray-500 hover:text-gray-700'
              }`}
              title="หน้าสุดท้าย"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
            </button>
          </div>

          {/* Right: Per-page selector */}
          <div className="flex items-center gap-3">
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>แสดง</span>
            <div className={`inline-flex items-center rounded-lg overflow-hidden ${
              isDark ? 'bg-gray-900/50 border border-gray-700/50' : 'bg-white shadow-sm border border-gray-200/60'
            }`}>
              {[5, 10, 20, 50].map((n, i) => (
                <button
                  key={n}
                  onClick={() => { setPerPage(n); setPage(1); }}
                  className={`h-8 px-3.5 text-sm font-semibold transition-all duration-200 ${
                    i > 0 ? (isDark ? 'border-l border-gray-700/50' : 'border-l border-gray-200/60') : ''
                  } ${
                    perPage === n
                      ? 'bg-blue-600 text-white'
                      : isDark
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700/70'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>รายการ</span>
          </div>
        </div>
      </div>
    </div>
  );
}
