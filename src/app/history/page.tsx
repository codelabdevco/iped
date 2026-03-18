"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/shared/Navbar";
import ReceiptList from "@/components/shared/ReceiptList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ALL_CATEGORIES } from "@/lib/categories";
import { formatCurrency } from "@/lib/utils";

export default function HistoryPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalToday: 0, totalMonth: 0, countToday: 0, countMonth: 0, budget: 50000 });

  useEffect(() => {
    fetch("/api/receipts")
      .then((r) => r.json())
      .then((data) => {
        setReceipts(data.receipts || []);
        setFiltered(data.receipts || []);
        setStats(data.stats);
      });
  }, []);

  useEffect(() => {
    let result = [...receipts];
    if (selectedCategory) {
      result = result.filter((r) => r.category === selectedCategory);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.merchant.toLowerCase().includes(q) || r.note?.toLowerCase().includes(q));
    }
    setFiltered(result);
  }, [search, selectedCategory, receipts]);

  const categorySummary = ALL_CATEGORIES.map((cat) => {
    const catReceipts = receipts.filter((r) => r.category === cat.id);
    return {
      ...cat,
      total: catReceipts.reduce((sum, r) => sum + r.amount, 0),
      count: catReceipts.length,
    };
  }).filter((c) => c.count > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">ประวัติรายการ</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {categorySummary.map((cat) => (
            <Card key={cat.id} className={"cursor-pointer transition-all hover:shadow-md " + (selectedCategory === cat.id ? "ring-2 ring-primary" : "")} onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-2"><span className="text-lg">{cat.icon}</span><span className="text-sm font-medium text-gray-700">{cat.name}</span></div>
                <p className="text-lg font-bold mt-1">{formatCurrency(cat.total)}</p>
                <p className="text-xs text-muted-foreground">{cat.count} รายการ</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex gap-3 mb-4">
          <Input placeholder="🔍 ค้นหาร้านค้า, หมายเหตุ..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
          {(search || selectedCategory) && (<Button variant="ghost" size="sm" onClick={() => { setSearch(""); setSelectedCategory(null); }}>ล้างตัวกรอง</Button>)}
          <span className="text-sm text-muted-foreground self-center ml-auto">{filtered.length} รายการ</span>
        </div>
        <ReceiptList receipts={filtered} />
      </main>
    </div>
  );
}
