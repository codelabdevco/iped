export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Asset from "@/models/Asset";
import AssetsClient from "./AssetsClient";

function serialize(obj: any) {
  return JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === "object" && v?.constructor?.name === "ObjectId" ? String(v) : v)));
}

async function AssetsData() {
  const session = await getSession();
  if (!session) redirect("/login");
  await connectDB();

  const query = session.orgId
    ? { $or: [{ orgId: session.orgId }, { userId: session.userId }] }
    : { userId: session.userId };

  const assets = await Asset.find(query).sort({ status: 1, category: 1, name: 1 }).lean();

  const data = assets.map((a: any) => ({
    _id: String(a._id),
    assetCode: a.assetCode, name: a.name, description: a.description || "",
    category: a.category, subCategory: a.subCategory || "",
    brand: a.brand || "", model: a.model || "", serialNumber: a.serialNumber || "",
    purchaseDate: a.purchaseDate ? new Date(a.purchaseDate).toISOString() : "",
    purchasePrice: a.purchasePrice || 0, currentValue: a.currentValue || 0,
    vendor: a.vendor || "", warrantyExpiry: a.warrantyExpiry ? new Date(a.warrantyExpiry).toISOString() : "",
    location: a.location || "", department: a.department || "",
    status: a.status || "available", condition: a.condition || "new",
    currentBorrowerName: a.currentBorrowerName || "",
    borrowDate: a.borrowDate ? new Date(a.borrowDate).toISOString() : "",
    expectedReturnDate: a.expectedReturnDate ? new Date(a.expectedReturnDate).toISOString() : "",
    borrowPurpose: a.borrowPurpose || "",
    historyCount: a.history?.length || 0,
    history: (a.history || []).slice(-20).map((h: any) => ({
      _id: String(h._id), action: h.action, date: h.date ? new Date(h.date).toISOString() : "",
      borrowerName: h.borrowerName || "", department: h.department || "", purpose: h.purpose || "",
      conditionBefore: h.conditionBefore || "", conditionAfter: h.conditionAfter || "",
      actualReturnDate: h.actualReturnDate ? new Date(h.actualReturnDate).toISOString() : "",
      note: h.note || "",
    })),
    note: a.note || "",
    createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : "",
  }));

  const totalValue = data.reduce((s, a) => s + a.purchasePrice, 0);
  const stats = {
    total: data.length, totalValue,
    available: data.filter(a => a.status === "available").length,
    inUse: data.filter(a => a.status === "in-use").length,
    borrowed: data.filter(a => a.status === "borrowed").length,
    maintenance: data.filter(a => a.status === "maintenance").length,
    overdue: data.filter(a => a.status === "borrowed" && a.expectedReturnDate && new Date(a.expectedReturnDate) < new Date()).length,
  };

  return <AssetsClient assets={serialize(data)} stats={stats} />;
}

export default function AssetsPage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-48 rounded-lg bg-white/[0.06]" /><div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-white/[0.04]" />)}</div></div>}>
      <AssetsData />
    </Suspense>
  );
}
