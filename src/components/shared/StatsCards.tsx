"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface StatsData {
  totalToday: number;
  totalMonth: number;
  countToday: number;
  countMonth: number;
  budget?: number;
}

export default function StatsCards({ stats }: { stats: StatsData }) {
  const budgetPercent = stats.budget ? Math.round((stats.totalMonth / stats.budget) * 100) : null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-l-4 border-l-yellow-400">
        <CardContent className="pt-5 pb-4 px-5">
          <p className="text-xs text-muted-foreground font-medium">ใช้จ่ายวันนี้</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalToday)}</p>
          <p className="text-xs text-muted-foreground mt-1">{stats.countToday} รายการ</p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-gray-900">
        <CardContent className="pt-5 pb-4 px-5">
          <p className="text-xs text-muted-foreground font-medium">ใช้จ่ายเดือนนี้</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalMonth)}</p>
          <p className="text-xs text-muted-foreground mt-1">{stats.countMonth} รายการ</p>
        </CardContent>
      </Card>

      {stats.budget && budgetPercent !== null && (
        <>
          <Card>
            <CardContent className="pt-5 pb-4 px-5">
              <p className="text-xs text-muted-foreground font-medium">งบเดือนนี้</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.budget)}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className={"h-2 rounded-full transition-all " + (budgetPercent > 90 ? "bg-red-500" : budgetPercent > 70 ? "bg-yellow-400" : "bg-gray-900")}
                  style={{ width: Math.min(budgetPercent, 100) + "%" }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 pb-4 px-5">
              <p className="text-xs text-muted-foreground font-medium">งบคงเหลือ</p>
              <p className={"text-2xl font-bold mt-1 " + (stats.budget - stats.totalMonth < 0 ? "text-red-600" : "text-gray-900")}>
                {formatCurrency(stats.budget - stats.totalMonth)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{budgetPercent}% ใช้ไปแล้ว</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
