import { prisma } from '@/utils/prisma';
import type { Prisma } from '@prisma/client';

export type AuditEvent =
  | 'checkin.geofence'
  | 'checkin.photo'
  | 'quiz.submit'
  | 'badge.earned'
  | 'review.submit';

export async function logAuditEvent(
  userId: string,
  event: AuditEvent,
  metadata?: Record<string, unknown>,
) {
  try {
    await prisma.auditLog.create({
      data: { userId, event, metadata: metadata as Prisma.InputJsonValue },
    });
  } catch (error) {
    console.error(`[audit] Failed to log event ${event}:`, error);
  }
}
