import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Package from "@/models/Package";
import BillingClient from "./BillingClient";

const FEATURE_LABELS: Record<string, string> = {
  aiOcr: "OCR + AI วิเคราะห์",
  lineBot: "LINE Bot",
  emailScanner: "Email Scanner",
  documentMatching: "จับคู่เอกสาร",
  budgetAlerts: "แจ้งเตือนงบประมาณ",
  multiCurrency: "หลายสกุลเงิน",
  apiAccess: "API Access",
  prioritySupport: "Priority Support",
  export: "ส่งออก PDF/CSV",
  googleSync: "เชื่อม Google",
  approval: "ระบบอนุมัติ",
};

async function BillingData() {
  const session = await getSession();
  if (!session) redirect("/login");

  await connectDB();

  const user = await User.findById(session.userId)
    .populate("packageId")
    .lean<any>();

  const packages = await Package.find({ status: "active" })
    .sort({ sortOrder: 1 })
    .lean<any[]>();

  const currentPkg = user?.packageId;
  const currentPkgId = currentPkg?._id ? String(currentPkg._id) : null;

  const plans = packages.map((pkg: any) => {
    // Build feature list from boolean flags
    const features: string[] = [];
    if (pkg.features) {
      for (const [key, value] of Object.entries(pkg.features)) {
        if (value && FEATURE_LABELS[key]) {
          features.push(FEATURE_LABELS[key]);
        }
      }
    }
    // Add limit-based features
    if (pkg.limits?.documentsPerMonth) {
      const docs = pkg.limits.documentsPerMonth >= 999999
        ? "ใบเสร็จไม่จำกัด"
        : `ใบเสร็จ ${pkg.limits.documentsPerMonth.toLocaleString()} ใบ/เดือน`;
      features.unshift(docs);
    }
    if (pkg.limits?.usersPerOrg) {
      const users = pkg.limits.usersPerOrg >= 999999
        ? "ผู้ใช้ไม่จำกัด"
        : `ผู้ใช้ ${pkg.limits.usersPerOrg} คน`;
      features.splice(1, 0, users);
    }

    return {
      _id: String(pkg._id),
      name: pkg.name,
      tier: pkg.tier,
      priceMonthly: pkg.price?.monthly || 0,
      features,
      isPopular: pkg.isPopular || false,
      isCurrent: currentPkgId === String(pkg._id),
    };
  });

  const currentPackageName = currentPkg?.name || "Free";
  const currentPackagePrice = currentPkg?.price?.monthly || 0;
  const packageExpiry = user?.packageExpiry
    ? new Date(user.packageExpiry).toLocaleDateString("th-TH")
    : null;

  return (
    <BillingClient
      currentPackageName={currentPackageName}
      currentPackagePrice={currentPackagePrice}
      packageExpiry={packageExpiry}
      plans={plans}
    />
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-32 rounded-lg bg-white/[0.06]" />
          <div className="h-40 rounded-2xl bg-white/[0.04]" />
        </div>
      }
    >
      <BillingData />
    </Suspense>
  );
}
