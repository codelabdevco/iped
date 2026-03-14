import mongoose, { Schema, Document } from "mongoose";

export interface IBudget extends Document {
  userId: mongoose.Types.ObjectId;
  orgId?: mongoose.Types.ObjectId;
  name: string;
  type: "daily" | "weekly" | "monthly" | "yearly" | "category";
  category?: string;
  amount: number;
  currency: string;
  spent: number;
  period: {
    start: Date;
    end: Date;
  };
  alerts: {
    enabled: boolean;
    thresholds: number[];
    sentAlerts: number[];
  };
  autoReset: boolean;
  status: "active" | "paused" | "expired";
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orgId: { type: Schema.Types.ObjectId, ref: "Organization" },
    name: { type: String, required: true },
    type: { type: String, enum: ["daily", "weekly", "monthly", "yearly", "category"], required: true },
    category: String,
    amount: { type: Number, required: true },
    currency: { type: String, default: "THB" },
    spent: { type: Number, default: 0 },
    period: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
    alerts: {
      enabled: { type: Boolean, default: true },
      thresholds: { type: [Number], default: [50, 80, 100] },
      sentAlerts: { type: [Number], default: [] },
    },
    autoReset: { type: Boolean, default: true },
    status: { type: String, enum: ["active", "paused", "expired"], default: "active" },
  },
  { timestamps: true }
);

BudgetSchema.index({ userId: 1, type: 1 });
BudgetSchema.index({ orgId: 1 });
BudgetSchema.index({ "period.end": 1 });
BudgetSchema.index({ status: 1 });

export default mongoose.models.Budget || mongoose.model<IBudget>("Budget", BudgetSchema);
