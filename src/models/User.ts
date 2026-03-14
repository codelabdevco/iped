import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  lineUserId?: string;
  lineDisplayName?: string;
  lineProfilePic?: string;
  email?: string;
  passwordHash?: string;
  name: string;
  phone?: string;
  role: "superadmin" | "admin" | "manager" | "accountant" | "user";
  accountType: "personal" | "business";
  orgId?: mongoose.Types.ObjectId;
  packageId?: mongoose.Types.ObjectId;
  packageExpiry?: Date;
  settings: {
    language: "th" | "en";
    currency: string;
    timezone: string;
    notifications: {
      lineAlerts: boolean;
      emailAlerts: boolean;
      budgetWarning: number;
      dailySummary: boolean;
      dailySummaryTime: string;
    };
    pdpaConsent: boolean;
    pdpaConsentDate?: Date;
    dataRetentionDays: number;
  };
  status: "active" | "inactive" | "suspended" | "pending";
  lastLogin?: Date;
  loginCount: number;
  documentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    lineUserId: { type: String, unique: true, sparse: true },
    lineDisplayName: String,
    lineProfilePic: String,
    email: { type: String, unique: true, sparse: true },
    passwordHash: String,
    name: { type: String, required: true },
    phone: String,
    role: {
      type: String,
      enum: ["superadmin", "admin", "manager", "accountant", "user"],
      default: "user",
    },
    accountType: { type: String, enum: ["personal", "business"], default: "personal" },
    orgId: { type: Schema.Types.ObjectId, ref: "Organization" },
    packageId: { type: Schema.Types.ObjectId, ref: "Package" },
    packageExpiry: Date,
    settings: {
      language: { type: String, default: "th" },
      currency: { type: String, default: "THB" },
      timezone: { type: String, default: "Asia/Bangkok" },
      notifications: {
        lineAlerts: { type: Boolean, default: true },
        emailAlerts: { type: Boolean, default: false },
        budgetWarning: { type: Number, default: 80 },
        dailySummary: { type: Boolean, default: true },
        dailySummaryTime: { type: String, default: "20:00" },
      },
      pdpaConsent: { type: Boolean, default: false },
      pdpaConsentDate: Date,
      dataRetentionDays: { type: Number, default: 365 },
    },
    status: { type: String, enum: ["active", "inactive", "suspended", "pending"], default: "active" },
    lastLogin: Date,
    loginCount: { type: Number, default: 0 },
    documentsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

UserSchema.index({ lineUserId: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ orgId: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ role: 1 });

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
