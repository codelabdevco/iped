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

export interface QuotaOptions {
  mode?: "personal" | "business";
  orgId?: string;
}

// ─── Internal helpers ───

async function findSubscription(userId: string, options?: QuotaOptions) {
  if (options?.mode === "business" && options?.orgId) {
    // Business: look up org subscription
    return (await Subscription.findOne({
      orgId: options.orgId,
      status: { $in: ["active", "trial"] },
    }).populate("packageId").lean()) as any;
  }
  // Personal: look up user subscription (without orgId)
  return (await Subscription.findOne({
    userId,
    $or: [{ orgId: { $exists: false } }, { orgId: null }, { orgId: "" }],
    status: { $in: ["active", "trial"] },
  }).populate("packageId").lean()) as any;
}

function usageKey(userId: string, options?: QuotaOptions): string {
  if (options?.mode === "business" && options?.orgId) {
    return `org:${options.orgId}`;
  }
  return userId;
}

function buildChecks(
  usage: any,
  limits: any,
  features: any,
): Record<QuotaResource, { current: number; limit: number; featureGate?: boolean }> {
  return {
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
    },
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
}

const emptyUsage = {
  receipts: 0, ocr: 0, storageBytes: 0, gmailScans: 0,
  transfers: 0, aiChats: 0, invoices: 0, quotations: 0,
};

// ─── Exported functions ───

/**
 * Check if user can perform an action based on their subscription plan.
 * options.mode: "business" checks org subscription, "personal" (default) checks user subscription.
 */
export async function checkQuota(
  userId: string,
  resource: QuotaResource,
  options?: QuotaOptions,
): Promise<QuotaResult> {
  await connectDB();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const sub = await findSubscription(userId, options);

  // Default to free plan if no subscription
  const pkg = sub?.packageId || ((await Package.findOne({ tier: "free" }).lean()) as any);
  if (!pkg) return { allowed: true, current: 0, limit: -1, plan: "free" };

  const key = usageKey(userId, options);
  let usage = (await Usage.findOne({ userId: key, month, year }).lean()) as any;
  if (!usage) usage = emptyUsage;

  const limits = pkg.limits;
  const features = pkg.features;
  const plan = pkg.tier || pkg.name || "free";

  const checks = buildChecks(usage, limits, features);
  const check = checks[resource];
  if (!check) return { allowed: true, current: 0, limit: -1, plan };

  if (check.featureGate) {
    return { allowed: false, current: check.current, limit: 0, plan, message: `ฟีเจอร์นี้ไม่รวมในแพ็กเกจ ${plan}` };
  }

  if (check.limit === -1) return { allowed: true, current: check.current, limit: -1, plan };

  if (check.current >= check.limit) {
    return { allowed: false, current: check.current, limit: check.limit, plan, message: `ใช้ครบ ${check.limit} แล้วในเดือนนี้` };
  }

  return { allowed: true, current: check.current, limit: check.limit, plan };
}

/**
 * Increment usage counter for a resource.
 * In business mode, usage is shared across the whole org.
 */
export async function incrementUsage(
  userId: string,
  resource: QuotaResource,
  amount: number = 1,
  options?: QuotaOptions,
): Promise<void> {
  await connectDB();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const fieldMap: Record<string, string> = {
    receipts: "receipts", ocr: "ocr", storage: "storageBytes",
    gmail: "gmailScans", transfers: "transfers", aiChat: "aiChats",
    invoices: "invoices", quotations: "quotations",
  };

  const field = fieldMap[resource];
  if (!field) return;

  const key = usageKey(userId, options);
  await Usage.findOneAndUpdate(
    { userId: key, month, year },
    { $inc: { [field]: amount } },
    { upsert: true },
  );
}

/**
 * Get user's current plan details + usage for display.
 * Returns both personal and business plan info.
 */
export async function getUserPlan(userId: string, orgId?: string) {
  await connectDB();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Personal subscription
  const personalSub = await findSubscription(userId);
  const personalPkg = personalSub?.packageId || ((await Package.findOne({ tier: "free" }).lean()) as any);
  const personalUsage = (await Usage.findOne({ userId, month, year }).lean()) as any;

  // Business subscription (if user belongs to an org)
  let businessPlan = null;
  if (orgId) {
    const bizSub = await findSubscription(userId, { mode: "business", orgId });
    if (bizSub?.packageId) {
      const bizPkg = bizSub.packageId as any;
      const bizKey = `org:${orgId}`;
      const bizUsage = (await Usage.findOne({ userId: bizKey, month, year }).lean()) as any;
      businessPlan = {
        plan: bizPkg.tier || "free",
        planName: bizPkg.name || "Free",
        type: "business",
        limits: bizPkg.limits || {},
        features: bizPkg.features || {},
        subscription: {
          status: bizSub.status,
          billingCycle: bizSub.billingCycle,
          currentPeriodEnd: bizSub.currentPeriodEnd,
          trialEnd: bizSub.trialEnd,
          autoRenew: bizSub.autoRenew,
        },
        usage: {
          receipts: bizUsage?.receipts || 0,
          ocr: bizUsage?.ocr || 0,
          storageBytes: bizUsage?.storageBytes || 0,
          gmailScans: bizUsage?.gmailScans || 0,
          transfers: bizUsage?.transfers || 0,
          aiChats: bizUsage?.aiChats || 0,
          invoices: bizUsage?.invoices || 0,
          quotations: bizUsage?.quotations || 0,
        },
      };
    }
  }

  return {
    // Top-level = personal (backward compat)
    plan: personalPkg?.tier || "free",
    planName: personalPkg?.name || "Free",
    type: personalPkg?.type || "personal",
    limits: personalPkg?.limits || {},
    features: personalPkg?.features || {},
    subscription: personalSub
      ? {
          status: personalSub.status,
          billingCycle: personalSub.billingCycle,
          currentPeriodEnd: personalSub.currentPeriodEnd,
          trialEnd: personalSub.trialEnd,
          autoRenew: personalSub.autoRenew,
        }
      : null,
    usage: {
      receipts: personalUsage?.receipts || 0,
      ocr: personalUsage?.ocr || 0,
      storageBytes: personalUsage?.storageBytes || 0,
      gmailScans: personalUsage?.gmailScans || 0,
      transfers: personalUsage?.transfers || 0,
      aiChats: personalUsage?.aiChats || 0,
      invoices: personalUsage?.invoices || 0,
      quotations: personalUsage?.quotations || 0,
    },
    // New: business plan (null if no org)
    business: businessPlan,
  };
}
