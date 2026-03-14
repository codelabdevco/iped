import mongoose, { Schema, Document as MongoDocument } from "mongoose";

export interface IDocument extends MongoDocument {
  type: "receipt" | "invoice" | "billing" | "debit_note" | "credit_note" | "tax_invoice" | "quotation";
  documentNumber?: string;
  source: "line" | "email" | "web" | "api";
  merchant: string;
  merchantTaxId?: string;
  merchantBranch?: string;
  merchantAddress?: string;
  date: Date;
  dueDate?: Date;
  paidDate?: Date;
  amount: number;
  subtotal?: number;
  discount?: number;
  vat?: number;
  vatRate?: number;
  wht?: number;
  whtRate?: number;
  netAmount?: number;
  currency: string;
  exchangeRate?: number;
  amountTHB?: number;
  category: string;
  categoryIcon: string;
  subCategory?: string;
  tags?: string[];
  paymentMethod?: "cash" | "transfer" | "credit" | "debit" | "cheque" | "ewallet" | "other";
  paymentRef?: string;
  bankAccount?: string;
  status: "pending" | "confirmed" | "edited" | "paid" | "overdue" | "matched" | "cancelled" | "rejected" | "awaiting_approval";
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  matchedWith?: mongoose.Types.ObjectId[];
  matchScore?: number;
  matchType?: "auto" | "manual";
  imageHash?: string;
  contentHash?: string;
  isDuplicate?: boolean;
  duplicateOf?: mongoose.Types.ObjectId;
  imageUrl?: string;
  thumbnailUrl?: string;
  ocrConfidence?: number;
  ocrRawText?: string;
  ocrProvider?: string;
  ocrProcessedAt?: Date;
  lineItems?: {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    vat?: number;
  }[];
  isRecurring?: boolean;
  recurringPattern?: {
    frequency: "daily" | "weekly" | "monthly" | "yearly";
    interval: number;
    nextDate?: Date;
    endDate?: Date;
  };
  userId: mongoose.Types.ObjectId;
  orgId?: mongoose.Types.ObjectId;
  accountType: "personal" | "business";
  emailMessageId?: string;
  emailFrom?: string;
  emailSubject?: string;
  note?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    type: {
      type: String,
      enum: ["receipt", "invoice", "billing", "debit_note", "credit_note", "tax_invoice", "quotation"],
      default: "receipt",
    },
    documentNumber: String,
    source: { type: String, enum: ["line", "email", "web", "api"], default: "web" },
    merchant: { type: String, required: true },
    merchantTaxId: String,
    merchantBranch: String,
    merchantAddress: String,
    date: { type: Date, required: true },
    dueDate: Date,
    paidDate: Date,
    amount: { type: Number, required: true },
    subtotal: Number,
    discount: Number,
    vat: Number,
    vatRate: { type: Number, default: 7 },
    wht: Number,
    whtRate: Number,
    netAmount: Number,
    currency: { type: String, default: "THB" },
    exchangeRate: Number,
    amountTHB: Number,
    category: { type: String, required: true },
    categoryIcon: { type: String, default: "\ud83d\udccb" },
    subCategory: String,
    tags: [String],
    paymentMethod: {
      type: String,
      enum: ["cash", "transfer", "credit", "debit", "cheque", "ewallet", "other"],
    },
    paymentRef: String,
    bankAccount: String,
    status: {
      type: String,
      enum: ["pending", "confirmed", "edited", "paid", "overdue", "matched", "cancelled", "rejected", "awaiting_approval"],
      default: "pending",
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: Date,
    rejectionReason: String,
    matchedWith: [{ type: Schema.Types.ObjectId, ref: "Document" }],
    matchScore: Number,
    matchType: { type: String, enum: ["auto", "manual"] },
    imageHash: String,
    contentHash: String,
    isDuplicate: { type: Boolean, default: false },
    duplicateOf: { type: Schema.Types.ObjectId, ref: "Document" },
    imageUrl: String,
    thumbnailUrl: String,
    ocrConfidence: Number,
    ocrRawText: String,
    ocrProvider: String,
    ocrProcessedAt: Date,
    lineItems: [
      {
        description: String,
        quantity: Number,
        unitPrice: Number,
        amount: Number,
        vat: Number,
      },
    ],
    isRecurring: { type: Boolean, default: false },
    recurringPattern: {
      frequency: { type: String, enum: ["daily", "weekly", "monthly", "yearly"] },
      interval: Number,
      nextDate: Date,
      endDate: Date,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", index: true },
    accountType: { type: String, enum: ["personal", "business"], default: "personal" },
    emailMessageId: String,
    emailFrom: String,
    emailSubject: String,
    note: String,
    attachments: [String],
  },
  { timestamps: true }
);

// Indexes for performance
DocumentSchema.index({ merchant: "text", note: "text", ocrRawText: "text", documentNumber: "text" });
DocumentSchema.index({ userId: 1, date: -1 });
DocumentSchema.index({ orgId: 1, date: -1 });
DocumentSchema.index({ category: 1 });
DocumentSchema.index({ status: 1 });
DocumentSchema.index({ imageHash: 1 });
DocumentSchema.index({ contentHash: 1 });
DocumentSchema.index({ type: 1 });
DocumentSchema.index({ source: 1 });
DocumentSchema.index({ currency: 1 });
DocumentSchema.index({ "recurringPattern.nextDate": 1 });
DocumentSchema.index({ dueDate: 1, status: 1 });

export default mongoose.models.Document || mongoose.model<IDocument>("Document", DocumentSchema);
