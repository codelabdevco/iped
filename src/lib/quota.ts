import { connectDB } from "./mongodb";
import Package from "@/models/Package";
import Subscription from "@/models/Subscription";
import Usage from "@/models/Usage";

export type QuotaResource =
  | "receipts"
  | "ocr"
  | "storage"
  | "employees"
  | "departments"
  | "gmail"
  | "transfers"
  | "aiChat"
  | "invoices"
  | "quotations";

export interface QuotaResult {
  allowed: boolean;
  current: number;
  limit: number; // -1 = unlimited
  plan: string;
  message?: string;
}

/**
 * Check if user can perform an action based on their subscription plan.
 * Returns { allowed, current, limit, plan, message }
 */
export async function checkQuota(
  userId: string,
  resource: QuotaResource
): Promise<QuotaResult> {
  await connectDB();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Get user's subscription -> package
  const sub = (await Subscription.findOne({
    userId,
    status: { $in: ["active", "trial"] },
  })
    .populate("packageId")
    .lean()) as any;

  // Default to free plan if no subscription
  const pkg = sub?.packageId || ((await Package.findOne({ tier: "free" }).lean()) as any);
  if (!pkg) return { allowed: true, current: 0, limit: -1, plan: "free" };

  // Get or create usage for this month
  let usage = (await Usage.findOne({ userId, month, year }).lean()) as any;
  if (!usage)
    usage = {
      receipts: 0,
      ocr: 0,
      storageBytes: 0,
      gmailScans: 0,
      transfers: 0,
      aiChats: 0,
      invoices: 0,
      quotations: 0,
    };

  const limits = pkg.limits;
  const features = pkg.features;
  const plan = pkg.tier || pkg.name || "free";

  // Map resource to limit + current usage
  const checks: Record<
    QuotaResource,
    { current: number; limit: number; featureGate?: boolean }
  > = {
    receipts: {
      current: usage.receipts,
      limit: limits.receiptsPerMonth ?? limits.documentsPerMonth ?? 30,
    },
    ocr: {
      current: usage.ocr,
      limit: limits.ocrPerMonth ?? 10,
    },
    storage: {
      current: usage.storageBytes,
      limit: limits.storageBytes ?? 104857600,
    },
    employees: {
      current: 0,
      limit: limits.employees ?? 0,
    }, // count separately
    departments: {
      current: 0,
      limit: limits.departments ?? 0,
    },
    gmail: {
      current: usage.gmailScans,
      limit: limits.gmailAccounts ?? 0,
      featureGate: !features.emailScanner && !features.gmail,
    },
    transfers: {
      current: usage.transfers,
      limit: limits.transferPerMonth ?? 0,
      featureGate: !features.reimbursement,
    },
    aiChat: {
      current: usage.aiChats,
      limit: limits.aiChatPerMonth ?? 0,
      featureGate: !features.aiChat,
    },
    invoices: {
      current: usage.invoices,
      limit: limits.invoicesPerMonth ?? 0,
    },
    quotations: {
      current: usage.quotations,
      limit: limits.quotationsPerMonth ?? 0,
    },
  };

  const check = checks[resource];
  if (!check) return { allowed: true, current: 0, limit: -1, plan };

  // Feature gate - feature not available in this plan
  if (check.featureGate) {
    return {
      allowed: false,
      current: check.current,
      limit: 0,
      plan,
      message: `ฟีเจอร์นี้ไม่รวมในแพ็กเกจ ${plan}`,
    };
  }

  // Unlimited
  if (check.limit === -1)
    return { allowed: true, current: check.current, limit: -1, plan };

  // Check limit
  if (check.current >= check.limit) {
    return {
      allowed: false,
      current: check.current,
      limit: check.limit,
      plan,
      message: `ใช้ครบ ${check.limit} แล้วในเดือนนี้`,
    };
  }

  return { allowed: true, current: check.current, limit: check.limit, plan };
}

/**
 * Increment usage counter for a resource.
 * Call AFTER the action succeeds.
 */
export async function incrementUsage(
  userId: string,
  resource: QuotaResource,
  amount: number = 1
): Promise<void> {
  await connectDB();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const fieldMap: Record<string, string> = {
    receipts: "receipts",
    ocr: "ocr",
    storage: "storageBytes",
    gmail: "gmailScans",
    transfers: "transfers",
    aiChat: "aiChats",
    invoices: "invoices",
    quotations: "quotations",
  };

  const field = fieldMap[resource];
  if (!field) return;

  await Usage.findOneAndUpdate(
    { userId, month, year },
    { $inc: { [field]: amount } },
    { upsert: true }
  );
}

/**
 * Get user's current plan details + usage for display.
 */
export async function getUserPlan(userId: string) {
  await connectDB();
  const now = new Date();

  const sub = (await Subscription.findOne({
    userId,
    status: { $in: ["active", "trial"] },
  })
    .populate("packageId")
    .lean()) as any;

  const pkg =
    sub?.packageId ||
    ((await Package.findOne({ tier: "free" }).lean()) as any);

  const usage = (await Usage.findOne({
    userId,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  }).lean()) as any;

  return {
    plan: pkg?.tier || "free",
    planName: pkg?.name || "Free",
    type: pkg?.type || "personal",
    limits: pkg?.limits || {},
    features: pkg?.features || {},
    subscription: sub
      ? {
          status: sub.status,
          billingCycle: sub.billingCycle,
          currentPeriodEnd: sub.currentPeriodEnd,
          trialEnd: sub.trialEnd,
          autoRenew: sub.autoRenew,
        }
      : null,
    usage: {
      receipts: usage?.receipts || 0,
      ocr: usage?.ocr || 0,
      storageBytes: usage?.storageBytes || 0,
      gmailScans: usage?.gmailScans || 0,
      transfers: usage?.transfers || 0,
      aiChats: usage?.aiChats || 0,
      invoices: usage?.invoices || 0,
      quotations: usage?.quotations || 0,
    },
  };
}
