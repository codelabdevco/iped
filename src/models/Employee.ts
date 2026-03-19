import mongoose, { Schema, Document } from "mongoose";

export interface IAllowance {
  type: string;
  amount: number;
}

export interface IEmployee extends Document {
  userId?: string; // link to User model (optional)
  orgId?: string;
  employeeCode: string; // e.g. EMP001
  name: string;
  nickname?: string;
  position: string;
  department: string;
  employmentType: "full-time" | "part-time" | "contract" | "freelance";
  startDate: Date;
  endDate?: Date;
  // Compensation
  baseSalary: number;
  allowances: IAllowance[];
  // Deductions
  socialSecurity: boolean;
  providentFund: number; // % of salary, 0 if none
  // Banking
  bankName: string;
  bankAccount: string;
  // Tax
  taxId?: string;
  // Notifications
  lineUserId?: string;
  email?: string;
  // Status
  status: "active" | "resigned" | "terminated" | "probation";
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    userId: String,
    orgId: String,
    employeeCode: { type: String, required: true },
    name: { type: String, required: true },
    nickname: String,
    position: { type: String, default: "" },
    department: { type: String, default: "" },
    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "freelance"],
      default: "full-time",
    },
    startDate: { type: Date, default: Date.now },
    endDate: Date,
    baseSalary: { type: Number, required: true, default: 0 },
    allowances: [{ type: { type: String }, amount: Number }],
    socialSecurity: { type: Boolean, default: true },
    providentFund: { type: Number, default: 0 },
    bankName: { type: String, default: "" },
    bankAccount: { type: String, default: "" },
    taxId: String,
    lineUserId: String,
    email: String,
    status: {
      type: String,
      enum: ["active", "resigned", "terminated", "probation"],
      default: "active",
    },
  },
  { timestamps: true }
);

EmployeeSchema.index({ orgId: 1, status: 1 });
EmployeeSchema.index({ orgId: 1, employeeCode: 1 }, { unique: true });
EmployeeSchema.index({ userId: 1 });

export default mongoose.models.Employee ||
  mongoose.model<IEmployee>("Employee", EmployeeSchema);
