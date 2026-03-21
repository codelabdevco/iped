import mongoose, { Schema, Document } from "mongoose";

export interface IDebtFile {
  name: string;
  type: string;
  size: number;
  data: string; // base64
  uploadedAt: Date;
}

export interface IDebtPayment {
  date: Date;
  amount: number;
  principal: number;
  interest: number;
  paymentType: "installment" | "lump-sum" | "interest-only" | "partial" | "other";
  note?: string;
  receiptId?: string;
  files?: IDebtFile[];
}

export interface IDebt extends Document {
  userId: string;
  orgId?: string;
  creditor: string;
  creditorType: "bank" | "company" | "personal" | "government" | "other";
  debtType: "term-loan" | "credit-line" | "overdraft" | "leasing" | "mortgage" | "personal-loan" | "supplier-credit" | "other";
  originalAmount: number;
  remainingBalance: number;
  interestRate: number;
  interestType: "fixed" | "floating";
  monthlyPayment: number;
  startDate: Date;
  dueDate: Date;
  contractNumber?: string;
  collateral?: string;
  guarantor?: string;
  bankAccount?: string;
  payments: IDebtPayment[];
  totalPaid: number;
  totalInterestPaid: number;
  files: IDebtFile[];
  status: "active" | "paid" | "overdue" | "restructured" | "defaulted" | "cancelled";
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DebtFileSchema = new Schema({
  name: String,
  type: String,
  size: Number,
  data: String,
  uploadedAt: { type: Date, default: Date.now },
}, { _id: true });

const DebtPaymentSchema = new Schema({
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  principal: { type: Number, default: 0 },
  interest: { type: Number, default: 0 },
  paymentType: { type: String, enum: ["installment", "lump-sum", "interest-only", "partial", "other"], default: "installment" },
  note: String,
  receiptId: String,
  files: [DebtFileSchema],
}, { _id: true });

const DebtSchema = new Schema<IDebt>(
  {
    userId: { type: String, required: true },
    orgId: String,
    creditor: { type: String, required: true },
    creditorType: { type: String, enum: ["bank", "company", "personal", "government", "other"], default: "bank" },
    debtType: { type: String, enum: ["term-loan", "credit-line", "overdraft", "leasing", "mortgage", "personal-loan", "supplier-credit", "other"], default: "term-loan" },
    originalAmount: { type: Number, required: true },
    remainingBalance: { type: Number, required: true },
    interestRate: { type: Number, default: 0 },
    interestType: { type: String, enum: ["fixed", "floating"], default: "fixed" },
    monthlyPayment: { type: Number, default: 0 },
    startDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    contractNumber: String,
    collateral: String,
    guarantor: String,
    bankAccount: String,
    payments: [DebtPaymentSchema],
    files: [DebtFileSchema],
    totalPaid: { type: Number, default: 0 },
    totalInterestPaid: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "paid", "overdue", "restructured", "defaulted", "cancelled"], default: "active" },
    note: String,
  },
  { timestamps: true }
);

DebtSchema.index({ userId: 1, orgId: 1 });
DebtSchema.index({ status: 1 });

export default mongoose.models.Debt || mongoose.model<IDebt>("Debt", DebtSchema);
