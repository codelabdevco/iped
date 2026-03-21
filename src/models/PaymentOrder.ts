import mongoose, { Schema, Document } from "mongoose";

export interface IPaymentOrder extends Document {
  userId: string;
  orgId?: string;
  packageId: mongoose.Types.ObjectId;
  packageTier: string;
  packageName: string;
  billingCycle: "monthly" | "yearly";
  amount: number;
  // Payment proof
  slipImage?: string; // base64
  bankFrom?: string;
  transferDate?: Date;
  transferTime?: string;
  note?: string;
  // Status
  status: "pending" | "approved" | "rejected" | "expired";
  approvedBy?: string;
  approvedAt?: Date;
  rejectedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentOrderSchema = new Schema<IPaymentOrder>(
  {
    userId: { type: String, required: true },
    orgId: String,
    packageId: { type: Schema.Types.ObjectId, ref: "Package", required: true },
    packageTier: { type: String, required: true },
    packageName: { type: String, required: true },
    billingCycle: { type: String, enum: ["monthly", "yearly"], default: "monthly" },
    amount: { type: Number, required: true },
    slipImage: String,
    bankFrom: String,
    transferDate: Date,
    transferTime: String,
    note: String,
    status: { type: String, enum: ["pending", "approved", "rejected", "expired"], default: "pending" },
    approvedBy: String,
    approvedAt: Date,
    rejectedReason: String,
  },
  { timestamps: true }
);

PaymentOrderSchema.index({ userId: 1, status: 1 });
PaymentOrderSchema.index({ status: 1 });

export default mongoose.models.PaymentOrder || mongoose.model<IPaymentOrder>("PaymentOrder", PaymentOrderSchema);
