import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import DocumentModel from "@/models/Document";
import mongoose from "mongoose";
import CustomersClient from "./CustomersClient";

async function CustomersData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();
  const merchants = await DocumentModel.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(session.userId) } },
    {
      $group: {
        _id: "$merchant",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
        lastDate: { $max: "$date" },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 50 },
  ]);

  const data = merchants
    .filter((m: any) => m._id)
    .map((m: any) => ({
      _id: m._id,
      name: m._id,
      total: m.total || 0,
      count: m.count || 0,
      rawLastDate: m.lastDate ? new Date(m.lastDate).toISOString().slice(0, 10) : "",
      lastDate: m.lastDate ? new Date(m.lastDate).toLocaleDateString("th-TH") : "-",
    }));

  return <CustomersClient customers={data} />;
}

export default function CustomersPage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-32 rounded-lg bg-white/[0.06]" /><div className="h-40 rounded-2xl bg-white/[0.04]" /></div>}>
      <CustomersData />
    </Suspense>
  );
}
