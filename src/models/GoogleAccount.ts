import mongoose, { Schema, Document } from "mongoose";

export interface IGoogleAccount extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  accessToken: string;
  refreshToken: string;
  connectedAt: Date;
  lastScanAt?: Date;
  autoScan: boolean;
  status: "active" | "expired" | "disconnected";
  createdAt: Date;
  updatedAt: Date;
}

const GoogleAccountSchema = new Schema<IGoogleAccount>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    email: { type: String, required: true },
    accessToken: { type: String, required: true },
    refreshToken: String,
    connectedAt: { type: Date, default: Date.now },
    lastScanAt: Date,
    autoScan: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "expired", "disconnected"], default: "active" },
  },
  { timestamps: true }
);

GoogleAccountSchema.index({ userId: 1, email: 1 }, { unique: true });

export default mongoose.models.GoogleAccount || mongoose.model<IGoogleAccount>("GoogleAccount", GoogleAccountSchema);
