import mongoose, { Schema, Document } from "mongoose";

export interface IPackage extends Document {
  name: string;
  nameEn: string;
  tier: "free" | "starter" | "pro" | "business" | "enterprise";
  price: {
    monthly: number;
    yearly: number;
    currency: string;
  };
  limits: {
    documentsPerMonth: number;
    usersPerOrg: number;
    storageGB: number;
    ocrPerMonth: number;
    emailAccounts: number;
    apiCalls: number;
  };
  features: {
    aiOcr: boolean;
    lineBot: boolean;
    emailScanner: boolean;
    documentMatching: boolean;
    budgetAlerts: boolean;
    multiCurrency: boolean;
    recurring: boolean;
    approval: boolean;
    export: boolean;
    googleSync: boolean;
    notionSync: boolean;
    apiAccess: boolean;
    whiteLabel: boolean;
    prioritySupport: boolean;
  };
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
    tier: { type: String, enum: ["free", "starter", "pro", "business", "enterprise"], required: true, unique: true },
    price: {
      monthly: { type: Number, required: true },
      yearly: { type: Number, required: true },
      currency: { type: String, default: "THB" },
    },
    limits: {
      documentsPerMonth: { type: Number, default: 50 },
      usersPerOrg: { type: Number, default: 1 },
      storageGB: { type: Number, default: 1 },
      ocrPerMonth: { type: Number, default: 50 },
      emailAccounts: { type: Number, default: 0 },
      apiCalls: { type: Number, default: 0 },
    },
    features: {
      aiOcr: { type: Boolean, default: true },
      lineBot: { type: Boolean, default: true },
      emailScanner: { type: Boolean, default: false },
      documentMatching: { type: Boolean, default: false },
      budgetAlerts: { type: Boolean, default: true },
      multiCurrency: { type: Boolean, default: false },
      recurring: { type: Boolean, default: false },
      approval: { type: Boolean, default: false },
      export: { type: Boolean, default: false },
      googleSync: { type: Boolean, default: false },
      notionSync: { type: Boolean, default: false },
      apiAccess: { type: Boolean, default: false },
      whiteLabel: { type: Boolean, default: false },
      prioritySupport: { type: Boolean, default: false },
    },
    isPopular: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "discontinued"], default: "active" },
  },
  { timestamps: true }
);

export default mongoose.models.Package || mongoose.model<IPackage>("Package", PackageSchema);
