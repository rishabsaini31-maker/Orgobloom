import { db } from "@/db";
import { auditLogs } from "@/db/schema/auditLogs";
import { Request } from "express";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "BULK_UPDATE"
  | "BULK_DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "EXPORT";
export type EntityType =
  | "PRODUCT"
  | "ORDER"
  | "CUSTOMER"
  | "REVIEW"
  | "USER"
  | "BLOG"
  | "PAYMENT"
  | "SETTING";

interface AuditLogData {
  userId: string;
  userEmail: string;
  action: AuditAction;
  entityType: EntityType;
  entityId?: string;
  entityName?: string;
  description: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(data: AuditLogData) {
  try {
    await db.insert(auditLogs).values({
      userId: data.userId,
      userEmail: data.userEmail,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      entityName: data.entityName,
      description: data.description,
      oldValues: data.oldValues,
      newValues: data.newValues,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // Don't throw - audit logging should not break the main operation
  }
}

export function getClientInfo(req: Request) {
  return {
    ipAddress:
      req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown",
    userAgent: req.headers["user-agent"] || "unknown",
  };
}

// Helper to create audit log from request
export async function auditLogFromRequest(
  req: any,
  data: Omit<AuditLogData, "userId" | "userEmail" | "ipAddress" | "userAgent">,
) {
  const clientInfo = getClientInfo(req);
  const user = req.user;

  if (!user) {
    console.warn("Attempted to create audit log without user context");
    return;
  }

  await createAuditLog({
    ...data,
    userId: user.id,
    userEmail: user.email,
    ...clientInfo,
  });
}
