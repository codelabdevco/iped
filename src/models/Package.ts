import mongoose, { Schema, Document } from "mongoose";

export interface IPackage extends Document {
  name: string;
  nameEn: string;
  tier: "free" | "plus" | "pro" | "starter" | "business" | "enterprise";
  type: "personal" | "business";
  price: {
    monthly: number;
    yearly: number;
    currency: string;
  };
  limits: {
    receiptsPerMonth: number; // -1 = unlimited
    documentsPerMonth: number; // alias for receiptsPerMonth (backward compat)
    ocrPerMonth: number;
    storageBytes: number;
    gmailAccounts: number;
    driveAccounts: number;
    employees: number;
    departments: number;
    transferPerMonth: number;
    aiChatPerMonth: number;
    historyMonths: number;
    invoicesPerMonth: number;
    quotationsPerMonth: number;
    apiCalls: number;
    usersPerOrg: number;
  };
  features: {
    aiOcr: boolean;
    lineBot: boolean;
    emailScanner: boolean;
    gmail: boolean;
    googleDrive: boolean;
    documentMatching: boolean;
    budgetAlerts: boolean;
    multiCurrency: boolean;
    recurring: boolean;
    approval: boolean | string; // true | "single" | "multi" | "custom"
    export: boolean;
    googleSync: boolean;
    notionSync: boolean;
    googleSheets: boolean;
    apiAccess: boolean;
    whiteLabel: boolean;
    prioritySupport: boolean;
    sso: boolean;
    reimbursement: boolean;
    payroll: boolean;
    vat: boolean;
    accounting: boolean;
    lineNotify: string; // "none" | "daily" | "daily+budget" | "all"
    emailNotify: boolean;
    aiChat: boolean;
    ads: boolean;
  };
  trialDays: number;
  isPopular: boolean;
  sortOrder: number;
  status: "active" | "discontinued";
  createdAt: Date;
  updatedAt: Date;
}

const PackageSchema = new Schema<IPackage>(
  {
    name: { type: String, required: true },
    nameEn: { type: String, required: true },
    tier: {
      type: String,
      enum: ["free", "plus", "pro", "starter", "business", "enterprise"],
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["personal", "business"],
      default: "personal",
    },
    price: {
      monthly: { type: Number, required: true },
      yearly: { type: Number, required: true },
      currency: { type: String, default: "THB" },
    },
    limits: {
      receiptsPerMonth: { type: Number, default: 30 }, // -1 = unlimited
      documentsPerMonth: { type: Number, default: 30 }, // backward compat alias
      ocrPerMonth: { type: Number, default: 10 },
      storageBytes: { type: Number, default: 104857600 }, // 100MB
      gmailAccounts: { type: Number, default: 0 },
      driveAccounts: { type: Number, default: 0 },
      employees: { type: Number, default: 0 },
      departments: { type: Number, default: 0 },
      transferPerMonth: { type: Number, default: 0 },
      aiChatPerMonth: { type: Number, default: 0 },
      historyMonths: { type: Number, default: 3 },
      invoicesPerMonth: { type: Number, default: 0 },
      quotationsPerMonth: { type: Number, default: 0 },
      apiCalls: { type: Number, default: 0 },
      usersPerOrg: { type: Number, default: 1 },
    },
    features: {
      aiOcr: { type: Boolean, default: true },
      lineBot: { type: Boolean, default: true },
      emailScanner: { type: Boolean, default: false },
      gmail: { type: Boolean, default: false },
      googleDrive: { type: Boolean, default: false },
      documentMatching: { type: Boolean, default: false },
      budgetAlerts: { type: Boolean, default: true },
      multiCurrency: { type: Boolean, default: false },
      recurring: { type: Boolean, default: false },
      approval: { type: Schema.Types.Mixed, default: false }, // boolean or string
      export: { type: Boolean, default: false },
      googleSync: { type: Boolean, default: false },
      notionSync: { type: Boolean, default: false },
      googleSheets: { type: Boolean, default: false },
      apiAccess: { type: Boolean, default: false },
      whiteLabel: { type: Boolean, default: false },
      prioritySupport: { type: Boolean, default: false },
      sso: { type: Boolean, default: false },
      reimbursement: { type: Boolean, default: false },
      payroll: { type: Boolean, default: false },
      vat: { type: Boolean, default: false },
      accounting: { type: Boolean, default: false },
      lineNotify: { type: String, default: "none" }, // "none"|"daily"|"daily+budget"|"all"
      emailNotify: { type: Boolean, default: false },
      aiChat: { type: Boolean, default: false },
      ads: { type: Boolean, default: true },
    },
    trialDays: { type: Number, default: 0 },
    isPopular: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "discontinued"], default: "active" },
  },
  { timestamps: true }
);

// Keep documentsPerMonth in sync with receiptsPerMonth on save
PackageSchema.pre("save", function (next) {
  if (this.isModified("limits.receiptsPerMonth")) {
    this.limits.documentsPerMonth = this.limits.receiptsPerMonth;
  }
  next();
});

export default mongoose.models.Package || mongoose.model<IPackage>("Package", PackageSchema);
