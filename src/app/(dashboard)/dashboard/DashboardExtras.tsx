'use client';

import React, { useMemo, useState } from 'react';

interface DashboardExtrasProps {
  data: {
    totalAmount: number;
    receiptCount: number;
    avgPerReceipt: number;
    categoryData: Record<string, number>;
    monthlyData: { month: string; [cat: string]: number | string }[];
    recentReceipts: {
      _id: string;
      storeName: string;
      category: string;
      amount: number;
      date: string;
      type: string;
      status: string;
    }[];
    changePercent?: number;
    categoryCount?: number;
  };
  isDark: boolean;
  getCatColor: (cat: string) => string;
}

interface StoreAggregate {
  storeName: string;
  total: number;
  count: number;
  category?: string;
}

interface DailySpending {
  date: Date;
  dateStr: string;
  amount: number;
}

interface WeekDay {
  date: Date;
  day: number;
  amount: number;
}

interface AnomalyAlert {
  id: string;
  type: 'outlier' | 'exceeded';
  description: string;
  amount: number;
  category: string;
}

const THAI_WEEKDAYS = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];
const THAI_MONTHS = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

// Helper: Convert Buddhist Era date string (DD/MM/YYYY BE) to CE Date object
const parseThaiDate = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('/').map(Number);
  const ceYear = year - 543;
  return new Date(ceYear, month - 1, day);
};

// Helper: Get week number of a date
const getWeekNumber = (date: Date): number => {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDay.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDay.getDay() + 1) / 7);
};

// Helper: Get ISO week date
const getISOWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

// Component 1: Spending Trend Sparkline
const SpendingTrend: React.FC<{
  monthlyData: { month: string; [cat: string]: number | string }[];
  isDark: boolean;
  changePercent?: number;
}> = ({ monthlyData, isDark, changePercent = 0 }) => {
  const monthlyTotals = useMemo(() => {
    return monthlyData.map((item) => {
      const total = Object.entries(item).reduce((sum, [key, val]) => {
        if (key !== 'month' && typeof val === 'number') {
          return sum + val;
        }
        return sum;
      }, 0);
      return { month: item.month, total };
    });
  }, [monthlyData]);

  const maxTotal = Math.max(...monthlyTotals.map((m) => m.total), 1);
  const points = monthlyTotals.map((m) => (m.total / maxTotal) * 100);

  const svgPath = points
    .map((point, i) => `${(i / (points.length - 1)) * 100},${100 - point}`)
    .join(' L ');

  const isPositive = changePercent >= 0;
  const arrowIcon = isPositive ? '↑' : '↓';
  const colorClass = isPositive ? 'text-red-500' : 'text-green-500';

  return (
    <div
      className={`rounded-2xl p-5 ${isDark ? 'bg-[#1e1e1e] border border-white/5' : 'bg-white border border-gray-100 shadow-sm'}`}
    >
      <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        แนวโน้มการใช้จ่าย
      </h3>
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
            เดือนนี้ vs เดือนที่แล้ว
          </p>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {monthlyTotals[monthlyTotals.length - 1]?.total.toLocaleString('th-TH') || '0'}
            <span className="text-xs ml-1">฿</span>
          </p>
        </div>
        <div className={`flex items-center gap-1 ${colorClass} text-sm font-semibold`}>
          {arrowIcon}
          {Math.abs(changePercent).toFixed(1)}%
        </div>
      </div>

      {points.length > 1 && (
        <svg
          viewBox="0 0 100 100"
          className="w-full h-20"
          preserveAspectRatio="none"
          style={{ overflow: 'visible' }}
        >
          <polyline
            points={svgPath}
            fill="none"
            stroke={isDark ? '#3b82f6' : '#0ea5e9'}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          <polyline
            points={`0,100 L ${svgPath} L 100,100`}
            fill={isDark ? 'url(#gradientDark)' : 'url(#gradientLight)'}
            opacity="0.1"
          />
          <defs>
            <linearGradient id="gradientDark" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#3b82f6' }} />
              <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0 }} />
            </linearGradient>
            <linearGradient id="gradientLight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#0ea5e9' }} />
              <stop offset="100%" style={{ stopColor: '#0ea5e9', stopOpacity: 0 }} />
            </linearGradient>
          </defs>
        </svg>
      )}

      <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
        <div>
          <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
            เดือนที่แล้ว
          </p>
          <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {monthlyTotals[monthlyTotals.length - 2]?.total.toLocaleString('th-TH') || '0'}
            <span className="text-xs ml-1">฿</span>
          </p>
        </div>
        <div className="text-right">
          <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
            เฉลี่ย
          </p>
          <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {(monthlyTotals.reduce((sum, m) => sum + m.total, 0) / monthlyTotals.length).toLocaleString(
              'th-TH',
              { maximumFractionDigits: 0 }
            )}
            <span className="text-xs ml-1">฿</span>
          </p>
        </div>
      </div>
    </div>
  );
};

// Component 2: Top 5 Stores
const TopStores: React.FC<{
  recentReceipts: DashboardExtrasProps['data']['recentReceipts'];
  isDark: boolean;
  getCatColor: (cat: string) => string;
}> = ({ recentReceipts, isDark, getCatColor }) => {
  const topStores = useMemo(() => {
    const aggregated: Record<string, StoreAggregate> = {};

    recentReceipts.forEach((receipt) => {
      if (!aggregated[receipt.storeName]) {
        aggregated[receipt.storeName] = {
          storeName: receipt.storeName,
          total: 0,
          count: 0,
          category: receipt.category,
        };
      }
      aggregated[receipt.storeName].total += receipt.amount;
      aggregated[receipt.storeName].count += 1;
    });

    return Object.values(aggregated).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [recentReceipts]);

  const maxTotal = Math.max(...topStores.map((s) => s.total), 1);

  return (
    <div
      className={`rounded-2xl p-5 ${isDark ? 'bg-[#1e1e1e] border border-white/5' : 'bg-white border border-gray-100 shadow-sm'}`}
    >
      <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        ร้านค้าสูงสุด 5 อันดับ
      </h3>
      <div className="space-y-4">
        {topStores.length === 0 ? (
          <p className={isDark ? 'text-white/50' : 'text-gray-400'}>ไม่มีข้อมูล</p>
        ) : (
          topStores.map((store, idx) => (
            <div key={idx}>
              <div className="flex justify-between items-center mb-2">
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {store.storeName}
                </p>
                <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {store.total.toLocaleString('th-TH')}฿
                </p>
              </div>
              <div className="       RinOpacity: 0="gradientLight"  </linegradientLight"            gradientLight" x1="0p offsed                                   >
            {(morder-gray-100 shadow-sm'}`1 md:adow-sm'}`}
lg:adow-sm'}`3
    lg font-bo{/* Row 1 */}te border border-gray-1lg:sm'-    Each((receipt<                  </p>
            ={d];
               {store.to      r: Get I   {store.to             ={d];
                 {store./>
              <dild mb-4 ${isDark<         Memo(() => {
={`text-xs $={d];
 {
={`text-xs $   {store.to      r: Get I   {store.to           ={              {store./>
             font-bo{/* Row 2 */}te border border-gray-1lg:sm'-    Each((receipt<                {
={`text-xs $={d];
 {
={`text-xs $ o      r: Get I ./>
              <dild mb-4 ${isDark<ff = d.getDatMemo(() => {
={`text-xs $={d];
 {
={`text-xs $   {store.toring]: numbe={d];
  ing]: numbe   {store.to| string }[];={d];
 | string }[];   {store.to      r: Get I   {store./>
             font-bo{/* Row 3 */}te border border-gray-1lg:sm'-    E       >
   <arGradient>
  {
={`text-xs $={d];
 {
={`text-xs $ o      r: Get I ./>
              <div className="   ex     defaulnegradientLight" ;
