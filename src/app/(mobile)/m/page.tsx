import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Receipt from "@/models/Receipt";
import User from "@/models/User";
import Organization from "@/models/Organization";
import MobileApp from "./MobileApp";

async function MobileData() {
  const session = await getSession();
  if (!session) redirect("/m/liff");

  await connectDB();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const user = await User.findById(session.userId)
    .select("-passwordHash -googleAccessToken -googleRefreshToken")
    .lean() as any;
  if (!user) redirect("/login");

  // Mobile page — LINE login only
  if (!user.lineUserId) redirect("/m/liff");

  const [
    allReceipts,
    todayReceipts,
    monthExpenseAgg,
    monthIncomeAgg,
    catBreakdown,
    monthlyTotals,
    totalCount,
    recentDays,
    topMerchants,
    paymentMethods,
  ] = await Promise.all([
    Receipt.find({ userId: session.userId, status: { $nin: ["cancelled", "draft"] } })
      .select("merchant amount category categoryIcon direction paymentMethod date time status source imageHash createdAt")
      .sort({ createdAt: -1 }).limit(100).lean(),
    Receipt.find({ userId: session.userId, date: { $gte: todayStart }, status: { $nin: ["cancelled", "draft"] } })
      .select("amount direction").lean(),
    Receipt.aggregate([
      { $match: { userId: session.userId, date: { $gte: monthStart }, direction: { $ne: "income" }, status: { $nin: ["cancelled", "draft"] } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Receipt.aggregate([
      { $match: { userId: session.userId, date: { $gte: monthStart }, direction: "income", status: { $nin: ["cancelled", "draft"] } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Receipt.aggregate([
      { $match: { userId: session.userId, date: { $gte: monthStart }, direction: { $ne: "income" }, status: { $nin: ["cancelled", "draft"] } } },
      { $group: { _id: "$category", icon: { $first: "$categoryIcon" }, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]),
    Receipt.aggregate([
      { $match: { userId: session.userId, date: { $gte: sixMonthsAgo }, status: { $nin: ["cancelled", "draft"] } } },
      { $group: { _id: { month: { $month: "$date" }, year: { $year: "$date" }, direction: { $ifNull: ["$direction", "expense"] } }, total: { $sum: "$amount" } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    Receipt.countDocuments({ userId: session.userId, status: { $nin: ["cancelled", "draft"] } }),
    Receipt.aggregate([
      { $match: { userId: session.userId, status: { $nin: ["cancelled", "draft"] } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } } } },
      { $sort: { _id: -1 } },
      { $limit: 60 },
    ]),
    // Top merchants this month
    Receipt.aggregate([
      { $match: { userId: session.userId, date: { $gte: monthStart }, direction: { $ne: "income" }, status: { $nin: ["cancelled", "draft"] } } },
      { $group: { _id: "$merchant", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
    ]),
    // Payment methods this month
    Receipt.aggregate([
      { $match: { userId: session.userId, date: { $gte: monthStart }, status: { $nin: ["cancelled", "draft"] } } },
      { $group: { _id: "$paymentMethod", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
    ]),
  ]);

  // Streak
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (recentDays.some((r: any) => r._id === key)) streak++;
    else if (i > 0) break;
  }

  // Monthly chart data
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth() + 1, y = d.getFullYear();
    const exp = (monthlyTotals as any[]).find((t) => t._id.month === m && t._id.year === y && t._id.direction !== "income")?.total || 0;
    const inc = (monthlyTotals as any[]).find((t) => t._id.month === m && t._id.year === y && t._id.direction === "income")?.total || 0;
    monthlyData.push({ month: months[d.getMonth()], expense: exp, income: inc });
  }

  const todayExpense = todayReceipts.filter((r: any) => r.direction !== "income").reduce((s: number, r: any) => s + (r.amount || 0), 0);
  const todayIncome = todayReceipts.filter((r: any) => r.direction === "income").reduce((s: number, r: any) => s + (r.amount || 0), 0);

  const data = {
    // User
    profile: {
      _id: String(user._id),
      name: user.name || "",
      firstNameTh: user.firstNameTh || "",
      lastNameTh: user.lastNameTh || "",
      firstNameEn: user.firstNameEn || "",
      lastNameEn: user.lastNameEn || "",
      lineDisplayName: user.lineDisplayName || "",
      lineProfilePic: user.lineProfilePic || "",
      email: user.email || "",
      phone: user.phone || "",
      age: user.age || 0,
      occupation: user.occupation || "",
      gender: user.gender || "",
      accountType: user.accountType || "personal",
      businessName: user.businessName || "",
      monthlyBudget: user.monthlyBudget || 0,
      goals: user.goals || [],
      googleEmail: user.googleEmail || "",
      googleConnectedAt: user.googleConnectedAt ? new Date(user.googleConnectedAt).toISOString() : "",
      lastLogin: user.lastLogin ? new Date(user.lastLogin).toISOString() : "",
      createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : "",
      status: user.status || "active",
      loginCount: user.loginCount || 0,
      onboardingComplete: user.onboardingComplete || false,
      orgId: user.orgId ? String(user.orgId) : "",
      orgName: "",
      settings: {
        dailySummary: user.settings?.notifications?.dailySummary ?? true,
        dailySummaryTime: user.settings?.notifications?.dailySummaryTime || "20:00",
        lineAlerts: user.settings?.notifications?.lineAlerts ?? true,
        budgetWarning: user.settings?.notifications?.budgetWarning ?? 80,
      },
    },
    // Home
    todayExpense,
    todayIncome,
    todayCount: todayReceipts.length,
    monthExpense: monthExpenseAgg[0]?.total || 0,
    monthIncome: monthIncomeAgg[0]?.total || 0,
    // Receipts
    receipts: allReceipts.map((r: any) => ({
      _id: String(r._id),
      merchant: r.merchant || "ไม่ระบุ",
      amount: r.amount || 0,
      category: r.category || "",
      categoryIcon: r.categoryIcon || "📦",
      direction: r.direction || "expense",
      paymentMethod: r.paymentMethod || "",
      date: r.date ? new Date(r.date).toLocaleDateString("th-TH", { day: "numeric", month: "short" }) : "",
      time: r.time || "",
      status: r.status || "pending",
      source: r.source || "web",
      hasImage: !!r.imageHash,
    })),
    // Reports
    categories: catBreakdown.map((c: any) => ({ name: c._id || "อื่นๆ", icon: c.icon || "📦", total: c.total, count: c.count })),
    monthlyData,
    totalExpense: catBreakdown.reduce((s: number, c: any) => s + c.total, 0),
    topMerchants: (topMerchants as any[]).map((m) => ({ name: m._id || "ไม่ระบุ", total: m.total, count: m.count })),
    paymentMethods: (paymentMethods as any[]).filter((p) => p._id).map((p) => ({ method: p._id, total: p.total, count: p.count })),
    daysInMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
    // Stats
    stats: {
      totalReceipts: totalCount,
      monthReceipts: allReceipts.filter((r: any) => new Date(r.createdAt) >= monthStart).length,
      monthExpense: monthExpenseAgg[0]?.total || 0,
      monthIncome: monthIncomeAgg[0]?.total || 0,
      streak,
      memberSince: user.createdAt ? new Date(user.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" }) : "",
      lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "",
    },
  };

  // Fetch org name if connected
  if (user.orgId) {
    try {
      const org = await Organization.findById(user.orgId).select("name").lean() as any;
      if (org) data.profile.orgName = org.name;
    } catch {}
  }

  // Claims: receipts sent to business
  const claimReceipts = await Receipt.find({
    userId: session.userId,
    accountType: "personal",
    note: /ส่งเป็นค่าใช้จ่ายบริษัทแล้ว/,
  }).select("merchant amount category note imageHash createdAt").sort({ createdAt: -1 }).limit(20).lean();

  const claims = await Promise.all(claimReceipts.map(async (r: any) => {
    const refMatch = (r.note || "").match(/ref:\s*([a-f0-9]+)/);
    let bizStatus = "pending";
    let companyNote = "";
    let payRef = "";
    let hasCompanySlip = false;
    if (refMatch) {
      const biz = await Receipt.findById(refMatch[1]).select("status companyNote companySlipImage paymentMethod").lean() as any;
      if (biz) {
        bizStatus = biz.status;
        companyNote = biz.companyNote || "";
        hasCompanySlip = !!biz.companySlipImage;
        payRef = (biz.paymentMethod || "").replace("โอน ref: ", "");
      }
    }
    return {
      _id: String(r._id),
      merchant: r.merchant || "ไม่ระบุ",
      amount: r.amount || 0,
      category: r.category || "",
      date: r.createdAt ? new Date(r.createdAt).toISOString() : "",
      hasImage: !!r.imageHash,
      bizStatus, companyNote, payRef, hasCompanySlip,
      bizReceiptId: refMatch ? refMatch[1] : "",
    };
  }));

  (data as any).claims = JSON.parse(JSON.stringify(claims));

  return <MobileApp data={data} />;
}

export default function MobilePage() {
  return (
    <Suspense fallback={
      <div className="space-y-4 p-4 animate-pulse">
        <div className="h-32 rounded-2xl bg-white/[0.04]" />
        <div className="h-12 rounded-2xl bg-white/[0.04]" />
        <div className="h-48 rounded-2xl bg-white/[0.04]" />
      </div>
    }>
      <MobileData />
    </Suspense>
  );
}
