import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLog extends Document {
  action: string;
  category: "auth" | "document" | "budget" | "user" | "org" | "admin" | "system" | "export" | "email" | "line";
  description: string;
  userId?: mongoose.Types.ObjectId;
  orgId?: mongoose.Types.ObjectId;
  targetId?: mongoose.Types.ObjectId;
  targetType?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  level: "info" | "warning" | "error" | "critical";
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true },
    category: {
      type: String,
      enum: ["auth", "document", "budget", "user", "org", "admin", "system", "export", "email", "line"],
      required: true,
    },
    description: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    orgId: { type: Schema.Types.ObjectId, ref: "Organization" },
    targetId: Schema.Types.ObjectId,
    targetType: String,
    metadata: Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
    level: { type: String, enum: ["info", "warning", "error", "critical"], default: "info" },
  },
  { timestamps: true }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ category: 1 });
AuditLogSchema.index({ level: 1 });
AuditLogSchema.index({ action: 1 });

// TTL index: auto-delete logs after 90 days
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
