export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { getSession, canViewAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import PaymentOrder from "@/models/PaymentOrder";
import PaymentsClient from "./PaymentsClient";

function serialize(obj: any) {
  return JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === "object" && v?.constructor?.name === "ObjectId" ? String(v) : v)));
}

async function PaymentsData() {
  const session = await getSession();
  if (!session) redirect("/login");
  await connectDB();
  const currentUser = await User.findById(session.userId).select("role").lean() as any;
  if (!currentUser || !canViewAdmin(currentUser.role)) redirect("/dashboard");

  const orders = await PaymentOrder.find().sort({ createdAt: -1 }).limit(200).lean();
  const userIds = [...new Set(orders.map((o: any) => o.userId))];
  const users = await User.find({ _id: { $in: userIds } }).select("lineDisplayName name lineProfilePic email").lean();
  const userMap: Record<string, any> = {};
  users.forEach((u: any) => { userMap[String(u._id)] = u; });

  const data = orders.map((o: any) => {
    const u = userMap[o.userId] || {};
    return {
      _id: String(o._id),
      userId: o.userId,
      userName: u.lineDisplayName || u.name || "ไม่ระบุ",
      userPic: u.lineProfilePic || "",
      userEmail: u.email || "",
      packageTier: o.packageTier,
      packageName: o.packageName,
      billingCycle: o.billingCycle,
      amount: o.amount,
      hasSlip: !!o.slipImage,
      bankFrom: o.bankFrom || "",
      transferDate: o.transferDate ? new Date(o.transferDate).toISOString() : "",
      transferTime: o.transferTime || "",
      note: o.note || "",
      status: o.status,
      rejectedReason: o.rejectedReason || "",
      createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : "",
    };
  });

  const stats = {
    total: data.length,
    pending: data.filter(d => d.status === "pending").length,
    approved: data.filter(d => d.status === "approved").length,
    rejected: data.filter(d => d.status === "rejected").length,
    totalAmount: data.filter(d => d.status === "approved").reduce((s, d) => s + d.amount, 0),
  };

  return <PaymentsClient orders={serialize(data)} stats={stats} />;
}

export default function AdminPaymentsPage() {
  return (
    <Suspense fallback={<div className="space-y-6 animate-pulse"><div className="h-8 w-48 rounded-lg bg-white/[0.06]" /><div className="h-64 rounded-2xl bg-white/[0.04]" /></div>}>
      <PaymentsData />
    </Suspense>
  );
}
