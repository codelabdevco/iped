import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";
import CategoriesClient from "./CategoriesClient";

async function CategoriesData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();

  const agg = await Receipt.aggregate([
    { $match: { userId: session.userId, status: { $ne: "cancelled" } } },
    {
      $group: {
        _id: { category: "$category", direction: { $ifNull: ["$direction", "expense"] } },
        count: { $sum: 1 },
        total: { $sum: "$amount" },
      },
    },
    { $sort: { total: -1 } },
  ]);

  const categories = agg.map((item: any) => ({
    name: item._id.category || "ไม่ระบุ",
    count: item.count,
    total: item.total,
    direction: item._id.direction || "expense",
  }));

  return <CategoriesClient categories={categories} />;
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-32 rounded-lg bg-white/[0.06]" /><div className="h-40 rounded-2xl bg-white/[0.04]" /></div>}>
      <CategoriesData />
    </Suspense>
  );
}
