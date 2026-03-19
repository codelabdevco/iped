import mongoose, { Schema, Document } from "mongoose";

export interface IOrganization extends Document {
  name: string;
  taxId?: string;
  branchNumber?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  type: "individual" | "company" | "partnership" | "foundation";
  vatRegistered: boolean;
  whtEnabled: boolean;
  settings: {
    defaultCurrency: string;
    fiscalYearStart: number;
    approvalRequired: boolean;
    approvalThreshold: number;
    autoMatch: boolean;
    emailScanEnabled: boolean;
    emailScanAddresses: string[];
  };
  members: {
    userId: mongoose.Types.ObjectId;
    role: "owner" | "admin" | "manager" | "accountant" | "viewer";
    joinedAt: Date;
  }[];
  inviteCode?: string;
  packageId?: mongoose.Types.ObjectId;
  packageExpiry?: Date;
  status: "active" | "inactive" | "suspended";
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true },
    taxId: { type: String, unique: true, sparse: true },
    branchNumber: String,
    address: String,
    phone: String,
    email: String,
    logo: String,
    type: { type: String, enum: ["individual", "company", "partnership", "foundation"], default: "individual" },
    vatRegistered: { type: Boolean, default: false },
    whtEnabled: { type: Boolean, default: false },
    settings: {
      defaultCurrency: { type: String, default: "THB" },
      fiscalYearStart: { type: Number, default: 1 },
      approvalRequired: { type: Boolean, default: false },
      approvalThreshold: { type: Number, default: 10000 },
      autoMatch: { type: Boolean, default: true },
      emailScanEnabled: { type: Boolean, default: false },
      emailScanAddresses: [String],
    },
    members: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        role: { type: String, enum: ["owner", "admin", "manager", "accountant", "viewer"] },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    inviteCode: { type: String, unique: true, sparse: true },
    packageId: { type: Schema.Types.ObjectId, ref: "Package" },
    packageExpiry: Date,
    status: { type: String, enum: ["active", "inactive", "suspended"], default: "active" },
  },
  { timestamps: true }
);

OrganizationSchema.index({ taxId: 1 });
OrganizationSchema.index({ "members.userId": 1 });

export default mongoose.models.Organization || mongoose.model<IOrganization>("Organization", OrganizationSchema);
