import mongoose, { Schema, Document } from "mongoose";

export interface IReceipt extends Document {
  type: "receipt" | "invoice" | "billing" | "debit_note" | "credit_note";
  source: "line" | "email" | "web";
  documentNumber?: string;
  merchant: string;
  merchantTaxId?: string;
  date: Date;
  time?: string;
  dueDate?: Date;
  amount: number;
  vat?: number;
  wht?: number;
  category: string;
  categoryIcon: string;
  subCategory?: string;
  paymentMethod?: "cash" | "transfer" | "credit" | "debit" | "other";
  status: "pending" | "confirmed" | "edited" | "paid" | "overdue" | "matched" | "cancelled" | "duplicate";
  matchedWith?: string[];
  imageUrl?: string;
  imageHash?: string;
  note?: string;
  ocrConfidence?: number;
  ocrRawText?: string;
  lineItems?: { description: string; quantity: number; unitPrice: number; amount: number }[];
  userId?: string;
  orgId?: string;
  accountType: "personal" | "business";
  createdAt: Date;
  updatedAt: Date;
}

const ReceiptSchema = new Schema<IReceipt>(
  {
    type: { type: String, enum: ["receipt", "invoice", "billing", "debit_note", "credit_note"], default: "receipt" },
    source: { type: String, enum: ["line", "email", "web"], default: "web" },
    documentNumber: String,
    merchant: { type: String, required: true },
    merchantTaxId: String,
    date: { type: Date, required: true },
    time: String,
    dueDate: Date,
    amount: { type: Number, required: true },
    vat: Number,
    wht: Number,
    category: { type: String, required: true },
    categoryIcon: { type: String, default: "📋" },
    subCategory: String,
    paymentMethod: { type: String, enum: ["cash", "transfer", "credit", "debit", "other"] },
    status: { type: String, enum: ["pending", "confirmed", "edited", "paid", "overdue", "matched", "cancelled", "duplicate"], default: "pending" },
    matchedWith: [String],
    imageUrl: String,
    imageHash: String,
    note: String,
    ocrConfidence: Number,
    ocrRawText: String,
    lineItems: [{ description: String, quantity: Number, unitPrice: Number, amount: Number }],
    userId: String,
    orgId: String,
    accountType: { type: String, enum: ["personal", "business"], default: "personal" },
  },
  { timestamps: true }
);

ReceiptSchema.index({ merchant: "text", note: "text", ocrRawText: "text" });
ReceiptSchema.index({ date: -1 });
ReceiptSchema.index({ category: 1 });
ReceiptSchema.index({ status: 1 });
ReceiptSchema.index({ imageHash: 1 });

export default mongoose.models.Receipt || mongoose.model<IReceipt>("Receipt", ReceiptSchema);
