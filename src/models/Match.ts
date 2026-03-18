import mongoose, { Schema, Document } from "mongoose";

export interface IMatch extends Document {
  receiptA: string; // receipt _id
  receiptB: string; // receipt _id
  matchScore: number; // 0-100
  matchType: "auto" | "manual" | "email";
  matchReason: string;
  status: "matched" | "pending" | "rejected";
  userId: string;
  createdAt: Date;
}

const MatchSchema = new Schema<IMatch>(
  {
    receiptA: { type: String, required: true, index: true },
    receiptB: { type: String, required: true, index: true },
    matchScore: { type: Number, default: 0 },
    matchType: { type: String, enum: ["auto", "manual", "email"], default: "auto" },
    matchReason: String,
    status: { type: String, enum: ["matched", "pending", "rejected"], default: "pending" },
    userId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.Match || mongoose.model<IMatch>("Match", MatchSchema);
