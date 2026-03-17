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
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(store.total / maxTotal) * 100}%`,
                    backgroundColor: getCatColor(store.category || ''),
                  }}
                />
              </div>
              <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
                {store.count} รายการ
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Component 3: Spending Heatmap
const SpendingHeatmap: React.FC<{
  recentReceipts: DashboardExtrasProps['data']['recentReceipts'];
  isDark: boolean;
}> = ({ recentReceipts, isDark }) => {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const dailySpending = useMemo(() => {
    const dailyMap: Record<string, number> = {};

    recentReceipts.forEach((receipt) => {
      const dateObj = parseThaiDate(receipt.date);
      const dateStr = dateObj.toISOString().split('T')[0];

      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = 0;
      }
      dailyMap[dateStr] += receipt.amount;
    });

    return Object.entries(dailyMap).map(([dateStr, amount]) => ({
      date: new Date(dateStr),
      dateStr,
      amount,
    }));
  }, [recentReceipts]);

  const weeks = useMemo(() => {
    if (dailySpending.length === 0) return [];

    const today = new Date();
    const weekGrid: (DailySpending | null)[][] = [];

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 84); // ~12 weeks

    for (let w = 0; w < 12; w++) {
      const week: (DailySpending | null)[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + w * 7 + d);
        const dateStr = date.toISOString().split('T')[0];

        const spending = dailySpending.find((ds) => ds.dateStr === dateStr) || null;
        week.push(spending);
      }
      weekGrid.push(week);
    }

    return weekGrid;
  }, [dailySpending]);

  const maxAmount = Math.max(...dailySpending.map((ds) => ds.amount), 1);

  const getColor = (amount: number | null): string => {
    if (amount === null || amount === 0) {
      return isDark ? 'bg-white/5' : 'bg-gray-50';
    }

    const intensity = amount / maxAmount;

    if (isDark) {
      if (intensity > 0.75) return 'bg-green-600';
      if (intensity > 0.5) return 'bg-green-500';
      if (intensity > 0.25) return 'bg-green-400';
      return 'bg-green-300';
    } else {
      if (intensity > 0.75) return 'bg-blue-600';
      if (intensity > 0.5) return 'bg-blue-400';
      if (intensity > 0.25) return 'bg-blue-300';
      return 'bg-blue-200';
    }
  };

  return (
    <div
      className={`rounded-2xl p-5 ${isDark ? 'bg-[#1e1e1e] border border-white/5' : 'bg-white border border-gray-100 shadow-sm'}`}
    >
      <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        แผนที่ความเข้มข้นการใช้จ่าย
      </h3>

      <div className="flex gap-2 overflow-x-auto pb-4">
        <div className="flex flex-col gap-1 min-w-fit">
          {THAI_WEEKDAYS.map((day, idx) => (
            <div
              key={idx}
              className={`w-6 h-6 flex items-center justify-center text-xs font-semibold ${isDark ? 'text-white/60' : 'text-gray-500'}`}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="flex gap-1 overflow-x-auto">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-1">
              {week.map((spending, dayIdx) => (
                <div
                  key={`${weekIdx}-${dayIdx}`}
                  className={`w-6 h-6 rounded transition-all cursor-pointer hover:ring-2 ring-blue-400 ${getColor(spending?.amount || 0)}`}
                  onMouseEnter={() => {
                    if (spending) setHoveredDate(spending.dateStr);
                  }}
                  onMouseLeave={() => setHoveredDate(null)}
                  title={
                    spending
                      ? `${spending.dateStr}: ${spending.amount.toLocaleString('th-TH')}฿`
                      : ''
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {hoveredDate && (
        <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
          {hoveredDate}:{' '}
          {(dailySpending.find((ds) => ds.dateStr === hoveredDate)?.amount || 0).toLocaleString(
            'th-TH'
          )}
          ฿
        </div>
      )}

      <div className="flex gap-2 items-center mt-3 pt-3 border-t border-white/5 text-xs">
        <span className={isDark ? 'text-white/50' : 'text-gray-400'}>น้อย</span>
        {[0, 0.33, 0.66, 1].map((intensity) => (
          <div
            key={intensity}
            className={`w-4 h-4 rounded ${
              isDark
                ? intensity === 0
                  ? 'bg-white/5'
                  : intensity < 0.5
                    ? 'bg-green-400'
                    : intensity < 0.75
                      ? 'bg-green-500'
                      : 'bg-green-600'
                : intensity === 0
                  ? 'bg-gray-50'
                  : intensity < 0.5
                    ? 'bg-blue-300'
                    : intensity < 0.75
                      ? 'bg-blue-400'
                      : 'bg-blue-600'
            }`}
          />
        ))}
        <span className={isDark ? 'text-white/50' : 'text-gray-400'}>มาก</span>
      </div>
    </div>
  );
};

// Component 4: Anomaly Alerts
const AnomalyAlerts: React.FC<{
  recentReceipts: DashboardExtrasProps['data']['recentReceipts'];
  categoryData: Record<string, number>;
  avgPerReceipt: number;
  isDark: boolean;
}> = ({ recentReceipts, categoryData, avgPerReceipt, isDark }) => {
  const alerts = useMemo(() => {
    const detectedAlerts: AnomalyAlert[] = [];

    // Calculate category averages
    const categoryAmounts: Record<string, number[]> = {};
    recentReceipts.forEach((receipt) => {
      if (!categoryAmounts[receipt.category]) {
        categoryAmounts[receipt.category] = [];
      }
      categoryAmounts[receipt.category].push(receipt.amount);
    });

    // Flag outliers (amount > 2x category average)
    recentReceipts.forEach((receipt) => {
      const categoryAvg =
        categoryAmounts[receipt.category]?.reduce((a, b) => a + b, 0) /
          categoryAmounts[receipt.category]?.length || 0;

      if (categoryAvg > 0 && receipt.amount > categoryAvg * 2) {
        detectedAlerts.push({
          id: receipt._id,
          type: 'outlier',
          description: `${receipt.storeName} - ${receipt.category}: ${receipt.amount.toLocaleString('th-TH')}฿`,
          amount: receipt.amount,
          category: receipt.category,
        });
      }
    });

    return detectedAlerts.slice(0, 5);
  }, [recentReceipts]);

  return (
    <div
      className={`rounded-2xl p-5 ${isDark ? 'bg-[#1e1e1e] border border-white/5' : 'bg-white border border-gray-100 shadow-sm'}`}
    >
      <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        การแจ้งเตือนความผิดปกติ
      </h3>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="flex items-center gap-2 py-4">
            <span className="text-green-500 text-xl">✓</span>
            <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
              ไม่พบรายจ่ายผิดปกติ
            </p>
          </div>
        ) : (
          alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg ${isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'}`}
            >
              <div className="flex gap-3">
                <span className="text-red-500 text-lg flex-shrink-0">⚠</span>
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {alert.description}
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                    {alert.type === 'outlier' ? 'สูงกว่าปกติ 2 เท่า' : 'เกินกำหนด'}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Component 5: Weekly Summary
const WeeklySummary: React.FC<{
  recentReceipts: DashboardExtrasProps['data']['recentReceipts'];
  isDark: boolean;
}> = ({ recentReceipts, isDark }) => {
  const weekData = useMemo(() => {
    const today = new Date();
    const weekStart = getISOWeekStart(today);

    const weekDays: WeekDay[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      weekDays.push({
        date,
        day: i,
        amount: 0,
      });
    }

    recentReceipts.forEach((receipt) => {
      const receiptDate = parseThaiDate(receipt.date);
      const receiptDayStr = receiptDate.toISOString().split('T')[0];

      const weekDay = weekDays.find(
        (wd) => wd.date.toISOString().split('T')[0] === receiptDayStr
      );

      if (weekDay) {
        weekDay.amount += receipt.amount;
      }
    });

    return weekDays;
  }, [recentReceipts]);

  const weekTotal = weekData.reduce((sum, day) => sum + day.amount, 0);
  const maxAmount = Math.max(...weekData.map((wd) => wd.amount), 1);
  const today = new Date();

  return (
    <div
      className={`rounded-2xl p-5 ${isDark ? 'bg-[#1e1e1e] border border-white/5' : 'bg-white border border-gray-100 shadow-sm'}`}
    >
      <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        สรุปการใช้จ่ายรายสัปดาห์
      </h3>

      <div className="flex items-end justify-between gap-2 mb-4 h-32">
        {weekData.map((day, idx) => {
          const isToday =
            day.date.toISOString().split('T')[0] === today.toISOString().split('T')[0];
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col items-center">
                <div
                  className={`w-full rounded-t transition-all ${isToday ? 'ring-2 ring-blue-400' : ''} ${isDark ? 'bg-blue-500/60' : 'bg-blue-300'}`}
                  style={{
                    height: `${(day.amount / maxAmount) * 100}px`,
                    minHeight: '4px',
                  }}
                />
              </div>
              <p className={`text-xs font-semibold ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                {THAI_WEEKDAYS[idx]}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
        <div>
          <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
            รวมสัปดาห์นี้
          </p>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {weekTotal.toLocaleString('th-TH')}
            <span className="text-sm ml-1">฿</span>
          </p>
        </div>
        <div className="text-right">
          <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
            เฉลี่ยต่อวัน
          </p>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {(weekTotal / 7).toLocaleString('th-TH', { maximumFractionDigits: 0 })}
            <span className="text-sm ml-1">฿</span>
          </p>
        </div>
      </div>
    </div>
  );
};

// Main Component: DashboardExtras
const DashboardExtras: React.FC<DashboardExtrasProps> = ({ data, isDark, getCatColor }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {/* Row 1 */}
      <div className="lg:col-span-2">
        <SpendingTrend
          monthlyData={data.monthlyData}
          isDark={isDark}
          changePercent={data.changePercent}
        />
      </div>
      <div>
        <TopStores
          recentReceipts={data.recentReceipts}
          isDark={isDark}
          getCatColor={getCatColor}
        />
      </div>

      {/* Row 2 */}
      <div className="lg:col-span-2">
        <SpendingHeatmap recentReceipts={data.recentReceipts} isDark={isDark} />
      </div>
      <div>
        <AnomalyAlerts
          recentReceipts={data.recentReceipts}
          categoryData={data.categoryData}
          avgPerReceipt={data.avgPerReceipt}
          isDark={isDark}
        />
      </div>

      {/* Row 3 */}
      <div className="lg:col-span-3">
        <WeeklySummary recentReceipts={data.recentReceipts} isDark={isDark} />
      </div>
    </div>
  );
};

export default DashboardExtras;
