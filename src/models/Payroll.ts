import mongoose, { Schema, Document } from "mongoose";

export interface IPayrollItem {
  type: string;
  amount: number;
}

export interface IPayroll extends Document {
  employeeId: mongoose.Types.ObjectId;
  orgId: string;
  userId: string; // who created this payroll
  // Period
  month: number; // 1-12
  year: number;
  // Employee snapshot (at time of payroll)
  employeeName: string;
  employeeCode: string;
  department: string;
  position: string;
  bankName: string;
  bankAccount: string;
  // Earnings
  baseSalary: number;
  overtime: { hours: number; ratePerHour: number; amount: number };
  allowances: IPayrollItem[];
  bonus: number;
  grossPay: number;
  // Deductions
  socialSecurity: number;
  providentFund: number;
  tax: number;
  otherDeductions: IPayrollItem[];
  totalDeductions: number;
  // Net
  netPay: number;
  // Status
  status: "draft" | "pending" | "approved" | "paid" | "cancelled";
  approvedBy?: string;
  approvedAt?: Date;
  paidAt?: Date;
  bankTransferRef?: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PayrollSchema = new Schema<IPayroll>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    orgId: { type: String, required: true },
    userId: { type: String, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    employeeName: { type: String, required: true },
    employeeCode: { type: String, required: true },
    department: String,
    position: String,
    bankName: String,
    bankAccount: String,
    baseSalary: { type: Number, default: 0 },
    overtime: {
      hours: { type: Number, default: 0 },
      ratePerHour: { type: Number, default: 0 },
      amount: { type: Number, default: 0 },
    },
    allowances: [{ type: { type: String }, amount: Number }],
    bonus: { type: Number, default: 0 },
    grossPay: { type: Number, default: 0 },
    socialSecurity: { type: Number, default: 0 },
    providentFund: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    otherDeductions: [{ type: { type: String }, amount: Number }],
    totalDeductions: { type: Number, default: 0 },
    netPay: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "paid", "cancelled"],
      default: "draft",
    },
    approvedBy: String,
    approvedAt: Date,
    paidAt: Date,
    bankTransferRef: String,
    note: String,
  },
  { timestamps: true }
);

PayrollSchema.index({ orgId: 1, year: -1, month: -1 });
PayrollSchema.index({ employeeId: 1, year: -1, month: -1 });
PayrollSchema.index({ orgId: 1, status: 1 });

export default mongoose.models.Payroll ||
  mongoose.model<IPayroll>("Payroll", PayrollSchema);
