import { connectDB } from "./mongodb";
import AuditLog from "@/models/AuditLog";

interface AuditEntry {
  action: string;
  category: "auth" | "document" | "budget" | "user" | "org" | "admin" | "system" | "export" | "email" | "line";
  description: string;
  userId?: string;
  orgId?: string;
  targetId?: string;
  targetType?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  level?: "info" | "warning" | "error" | "critical";
}

export async function logAudit(entry: AuditEntry) {
  try {
    await connectDB();
    await AuditLog.create({
      ...entry,
      level: entry.level || "info",
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
}

export async function logDocumentAction(
  action: string,
  description: string,
  userId: string,
  documentId: string,
  metadata?: Record<string, unknown>
) {
  return logAudit({
    action,
    category: "document",
    description,
    userId,
    targetId: documentId,
    targetType: "Document",
    metadata,
  });
}

export async function logAuthAction(action: string, description: string, userId?: string, metadata?: Record<string, unknown>) {
  return logAudit({
    action,
    category: "auth",
    description,
    userId,
    metadata,
  });
}

export async function logAdminAction(action: string, description: string, userId: string, metadata?: Record<string, unknown>) {
  return logAudit({
    action,
    category: "admin",
    description,
    userId,
    metadata,
    level: "warning",
  });
}
