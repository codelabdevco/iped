import mongoose, { Schema, Document } from "mongoose";

export interface IUsage extends Document {
  userId: string;
  month: number; // 1-12
  year: number;
  receipts: number;
  ocr: number;
  storageBytes: number;
  gmailScans: number;
  transfers: number;
  aiChats: number;
  invoices: number;
  quotations: number;
  createdAt: Date;
  updatedAt: Date;
}

const UsageSchema = new Schema<IUsage>(
  {
    userId: { type: String, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    receipts: { type: Number, default: 0 },
    ocr: { type: Number, default: 0 },
    storageBytes: { type: Number, default: 0 },
    gmailScans: { type: Number, default: 0 },
    transfers: { type: Number, default: 0 },
    aiChats: { type: Number, default: 0 },
    invoices: { type: Number, default: 0 },
    quotations: { type: Number, default: 0 },
  },
  { timestamps: true }
);

UsageSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.models.Usage ||
  mongoose.model<IUsage>("Usage", UsageSchema);
