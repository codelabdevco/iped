import mongoose, { Schema, Document } from "mongoose";

export interface ISubscription extends Document {
  userId: string;
  orgId?: string;
  packageId: mongoose.Types.ObjectId;
  status: "active" | "trial" | "past_due" | "cancelled" | "expired";
  billingCycle: "monthly" | "yearly";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  cancelledAt?: Date;
  autoRenew: boolean;
  paymentGateway?: string; // "omise" | "manual"
  gatewayCustomerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: String, required: true },
    orgId: { type: String },
    packageId: { type: Schema.Types.ObjectId, ref: "Package", required: true },
    status: {
      type: String,
      enum: ["active", "trial", "past_due", "cancelled", "expired"],
      default: "active",
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },
    trialEnd: { type: Date },
    cancelledAt: { type: Date },
    autoRenew: { type: Boolean, default: true },
    paymentGateway: { type: String },
    gatewayCustomerId: { type: String },
  },
  { timestamps: true }
);

// Personal sub: userId + no orgId | Business sub: orgId (shared by org members)
SubscriptionSchema.index({ userId: 1, orgId: 1 }, { unique: true, sparse: true });
SubscriptionSchema.index({ orgId: 1 });
SubscriptionSchema.index({ status: 1 });

export default mongoose.models.Subscription ||
  mongoose.model<ISubscription>("Subscription", SubscriptionSchema);
