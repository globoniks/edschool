import { prisma } from '../lib/prisma.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

/**
 * Actions worth keeping a permanent record of. Keep the list explicit rather
 * than free-form strings so the admin UI can filter on it and typos surface at
 * compile time.
 */
export type AuditAction =
  | 'user.created'
  | 'user.password_reset'
  | 'user.password_changed'
  | 'user.tags_updated'
  | 'exam_mark.created'
  | 'exam_mark.updated'
  | 'fee_payment.created'
  | 'fee_payment.updated'
  | 'student.created'
  | 'student.updated'
  | 'student.deleted';

interface AuditEntry {
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
  /** Overrides the actor's school — only needed when acting across tenants. */
  schoolId?: string;
}

/**
 * Write one audit entry.
 *
 * Deliberately never throws: an audit failure must not roll back or 500 the
 * action the user actually asked for. A failure is loud in the server log
 * instead, so a broken trail is noticed without breaking the app.
 */
export async function recordAudit(req: AuthRequest, entry: AuditEntry): Promise<void> {
  const actor = req.user;
  if (!actor) return;

  const schoolId = entry.schoolId ?? actor.schoolId;
  if (!schoolId) return;

  try {
    await prisma.auditLog.create({
      data: {
        schoolId,
        actorId: actor.id,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        summary: entry.summary,
        metadata: entry.metadata as never,
        ip: req.ip ?? null,
      },
    });
  } catch (error) {
    console.error('[audit] failed to record entry', entry.action, error);
  }
}
