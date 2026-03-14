import { NextRequest, NextResponse } from "next/server";

interface StoredReceipt {
  _id: string;
  type: string;
  source: string;
  merchant: string;
  date: string;
  amount: number;
  vat?: number;
  category: string;
  categoryIcon: string;
  subCategory?: string;
  paymentMethod?: string;
  status: string;
  note?: string;
  ocrConfidence?: number;
  imageHash?: string;
  imageUrl?: string;
  createdAt: string;
}

const demoReceipts: StoredReceipt[] = [
  {
    _id: "demo-1",
    type: "receipt",
    source: "line",
    merchant: "7-Eleven สาขาสยามพารากอน",
    date: new Date().toISOString(),
    amount: 385,
    vat: 27,
    category: "food",
    categoryIcon: "🍔",
    paymentMethod: "cash",
    status: "confirmed",
    ocrConfidence: 97,
    createdAt: new Date().toISOString(),
  },
  {
    _id: "demo-2",
    type: "receipt",
    source: "web",
    merchant: "Makro สาขารังสิต",
    date: new Date(Date.now() - 86400000).toISOString(),
    amount: 12500,
    vat: 875,
    category: "material",
    categoryIcon: "📦",
    paymentMethod: "transfer",
    status: "confirmed",
    ocrConfidence: 95,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    _id: "demo-3",
    type: "invoice",
    source: "email",
    merchant: "True Corporation",
    date: new Date(Date.now() - 172800000).toISOString(),
    amount: 1200,
    category: "service",
    categoryIcon: "📱",
    paymentMethod: "transfer",
    status: "pending",
    ocrConfidence: 92,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    _id: "demo-4",
    type: "receipt",
    source: "line",
    merchant: "Shell สาขาวิภาวดี",
    date: new Date(Date.now() - 259200000).toISOString(),
    amount: 1500,
    vat: 105,
    category: "transport",
    categoryIcon: "🚗",
    paymentMethod: "credit",
    status: "confirmed",
    ocrConfidence: 98,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    _id: "demo-5",
    type: "receipt",
    source: "web",
    merchant: "Cafe Amazon สาขาอโศก",
    date: new Date().toISOString(),
    amount: 165,
    vat: 12,
    category: "food",
    categoryIcon: "🍔",
    paymentMethod: "cash",
    status: "confirmed",
    ocrConfidence: 96,
    createdAt: new Date().toISOString(),
  },
];

declare global {
  // eslint-disable-next-line no-var
  var receiptsStore: StoredReceipt[] | undefined;
}

function getStore(): StoredReceipt[] {
  if (!global.receiptsStore) {
    global.receiptsStore = [...demoReceipts];
  }
  return global.receiptsStore;
}

export async function GET(request: NextRequest) {
  const store = getStore();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const status = searchParams.get("status");

  let filtered = [...store];

  if (category) filtered = filtered.filter((r) => r.category === category);
  if (status) filtered = filtered.filter((r) => r.status === status);

  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const todayReceipts = store.filter((r) => new Date(r.date) >= todayStart);
  const monthReceipts = store.filter((r) => new Date(r.date) >= monthStart);

  const stats = {
    totalToday: todayReceipts.reduce((sum, r) => sum + r.amount, 0),
    totalMonth: monthReceipts.reduce((sum, r) => sum + r.amount, 0),
    countToday: todayReceipts.length,
    countMonth: monthReceipts.length,
    budget: 50000,
  };

  return NextResponse.json({ receipts: filtered, stats });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const store = getStore();

    if (body.imageHash) {
      const dup = store.find((r) => r.imageHash === body.imageHash);
      if (dup) {
        return NextResponse.json(
          {
            error: "ใบเสร็จนี้อาจซ้ำ",
            duplicate: true,
            duplicateInfo: "เคยบันทึก " + dup.merchant + " เมื่อ " + new Date(dup.createdAt).toLocaleDateString("th-TH"),
            existingId: dup._id,
          },
          { status: 409 }
        );
      }
    }

    const newReceipt: StoredReceipt = {
      _id: "receipt-" + Date.now(),
      type: body.type || "receipt",
      source: body.source || "web",
      merchant: body.merchant,
      date: body.date,
      amount: body.amount,
      vat: body.vat,
      category: body.category,
      categoryIcon: body.categoryIcon,
      subCategory: body.subCategory,
      paymentMethod: body.paymentMethod,
      status: "confirmed",
      note: body.note,
      ocrConfidence: body.ocrConfidence,
      imageHash: body.imageHash,
      imageUrl: undefined,
      createdAt: new Date().toISOString(),
    };

    store.unshift(newReceipt);

    return NextResponse.json({ success: true, receipt: newReceipt });
  } catch (error) {
    console.error("Save Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการบันทึก" }, { status: 500 });
  }
}
