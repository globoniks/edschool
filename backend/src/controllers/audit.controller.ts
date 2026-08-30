import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';

const listQuerySchema = z.object({
  action: z.string().optional(),
  entity: z.string().optional(),
  entityId: z.string().optional(),
  actorId: z.string().optional(),
  /** ISO dates, inclusive. */
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

/**
 * GET /api/audit-logs — paginated trail for the caller's school.
 *
 * Always scoped to the actor's tenant (a SUPER_ADMIN may pass ?schoolId to look
 * at one specific school); the trail is read-only by design — there is no
 * update or delete endpoint, so an admin cannot quietly erase their own tracks.
 */
export const listAuditLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const query = listQuerySchema.parse(req.query);

    const requestedSchoolId =
      typeof req.query.schoolId === 'string' ? req.query.schoolId : undefined;
    const schoolId =
      actor.role === 'SUPER_ADMIN' ? requestedSchoolId ?? undefined : actor.schoolId;

    const createdAt: { gte?: Date; lte?: Date } = {};
    if (query.from) createdAt.gte = new Date(query.from);
    if (query.to) createdAt.lte = new Date(query.to);

    const where = {
      ...(schoolId ? { schoolId } : {}),
      ...(query.action ? { action: query.action } : {}),
      ...(query.entity ? { entity: query.entity } : {}),
      ...(query.entityId ? { entityId: query.entityId } : {}),
      ...(query.actorId ? { actorId: query.actorId } : {}),
      ...(createdAt.gte || createdAt.lte ? { createdAt } : {}),
    };

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    res.json({
      logs,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/** GET /api/audit-logs/actions — the distinct actions present, for filter dropdowns. */
export const listAuditActions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const actor = req.user!;
    const rows = await prisma.auditLog.findMany({
      where: actor.role === 'SUPER_ADMIN' ? {} : { schoolId: actor.schoolId },
      distinct: ['action'],
      select: { action: true },
      orderBy: { action: 'asc' },
    });
    res.json(rows.map((r) => r.action));
  } catch (error) {
    next(error);
  }
};
