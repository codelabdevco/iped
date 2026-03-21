export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Asset from "@/models/Asset";
import Organization from "@/models/Organization";
import AssetsClient from "./AssetsClient";

function serialize(obj: any) {
  return JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === "object" && v?.constructor?.name === "ObjectId" ? String(v) : v)));
}

function calcCurrentValue(a: any): number {
  if (!a.purchaseDate || !a.purchasePrice || a.depreciationMethod === "none") return a.purchasePrice || 0;
  const purchaseDate = new Date(a.purchaseDate);
  const now = new Date();
  const yearsUsed = (now.getTime() - purchaseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (yearsUsed <= 0) return a.purchasePrice;
  const usefulLife = a.usefulLifeYears || 5;
  const salvage = a.salvageValue || 0;

  if (a.depreciationMethod === "declining-balance") {
    const rate = 2 / usefulLife;
    let value = a.purchasePrice;
    const fullYears = Math.floor(yearsUsed);
    for (let i = 0; i < fullYears && i < usefulLife; i++) {
      value = value * (1 - rate);
      if (value < salvage) { value = salvage; break; }
    }
    return Math.max(value, salvage);
  }

  // straight-line
  const annualDep = (a.purchasePrice - salvage) / usefulLife;
  const totalDep = annualDep * Math.min(yearsUsed, usefulLife);
  return Math.max(a.purchasePrice - totalDep, salvage);
}

async function AssetsData() {
  const session = await getSession();
  if (!session) redirect("/login");
  await connectDB();

  const query = session.orgId
    ? { $or: [{ orgId: session.orgId }, { userId: session.userId }] }
    : { userId: session.userId };

  const assets = await Asset.find(query).sort({ status: 1, category: 1, name: 1 }).lean();

  // Load org asset categories if available
  let orgCategories: any[] = [];
  if (session.orgId) {
    const org = await Organization.findById(session.orgId).select("assetCategories").lean() as any;
    orgCategories = (org?.assetCategories || []).map((c: any) => ({
      _id: String(c._id),
      name: c.name,
      icon: c.icon || "",
      description: c.description || "",
    }));
  }

  const data = assets.map((a: any) => {
    const computedValue = Math.round(calcCurrentValue(a));
    return {
      _id: String(a._id),
      assetCode: a.assetCode, name: a.name, description: a.description || "",
      category: a.category, subCategory: a.subCategory || "",
      brand: a.brand || "", model: a.model || "", serialNumber: a.serialNumber || "",
      purchaseDate: a.purchaseDate ? new Date(a.purchaseDate).toISOString() : "",
      purchasePrice: a.purchasePrice || 0, currentValue: computedValue,
      depreciationMethod: a.depreciationMethod || "straight-line",
      usefulLifeYears: a.usefulLifeYears || 5,
      salvageValue: a.salvageValue || 0,
      vendor: a.vendor || "", warrantyExpiry: a.warrantyExpiry ? new Date(a.warrantyExpiry).toISOString() : "",
      location: a.location || "", department: a.department || "",
      status: a.status || "available", condition: a.condition || "new",
      currentBorrowerName: a.currentBorrowerName || "",
      borrowDate: a.borrowDate ? new Date(a.borrowDate).toISOString() : "",
      expectedReturnDate: a.expectedReturnDate ? new Date(a.expectedReturnDate).toISOString() : "",
      borrowPurpose: a.borrowPurpose || "",
      historyCount: a.history?.length || 0,
      fileCount: a.files?.length || 0,
      thumbnail: (() => {
        const imgFile = (a.files || []).find((f: any) => f.type?.startsWith("image/"));
        return imgFile ? `data:${imgFile.type};base64,${imgFile.data}` : (a.imageUrl || "");
      })(),
      history: (a.history || []).slice(-20).map((h: any) => ({
        _id: String(h._id), action: h.action, date: h.date ? new Date(h.date).toISOString() : "",
        borrowerName: h.borrowerName || "", department: h.department || "", purpose: h.purpose || "",
        conditionBefore: h.conditionBefore || "", conditionAfter: h.conditionAfter || "",
        actualReturnDate: h.actualReturnDate ? new Date(h.actualReturnDate).toISOString() : "",
        note: h.note || "",
      })),
      note: a.note || "",
      createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : "",
    };
  });

  const totalValue = data.reduce((s, a) => s + a.purchasePrice, 0);
  const totalCurrentValue = data.reduce((s, a) => s + a.currentValue, 0);
  const stats = {
    total: data.length, totalValue, totalCurrentValue,
    available: data.filter(a => a.status === "available").length,
    inUse: data.filter(a => a.status === "in-use").length,
    borrowed: data.filter(a => a.status === "borrowed").length,
    maintenance: data.filter(a => a.status === "maintenance").length,
    overdue: data.filter(a => a.status === "borrowed" && a.expectedReturnDate && new Date(a.expectedReturnDate) < new Date()).length,
  };

  return <AssetsClient assets={serialize(data)} stats={stats} orgCategories={serialize(orgCategories)} />;
}

export default function AssetsPage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-48 rounded-lg bg-white/[0.06]" /><div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-white/[0.04]" />)}</div></div>}>
      <AssetsData />
    </Suspense>
  );
}
