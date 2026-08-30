import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { randomBytes } from 'crypto';
import { hashPassword } from '../utils/password.util.js';
import { recordAudit } from '../utils/auditLog.js';

const updateTagsSchema = z.object({
  tagSlugs: z.array(z.string()).min(0),
});

/** GET /api/users - list users for same school (SCHOOL_ADMIN / SUPER_ADMIN) */
export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user!.schoolId;
    if (req.user!.role !== 'SUPER_ADMIN' && !schoolId) {
      throw new AppError('School context required', 403);
    }
    const where: { schoolId?: string } = {};
    if (req.user!.role !== 'SUPER_ADMIN') {
      where.schoolId = schoolId;
    }
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        profile: { select: { firstName: true, lastName: true, phone: true } },
        userTags: { include: { tag: { select: { id: true, slug: true, name: true, type: true } } } },
      },
      orderBy: { email: 'asc' },
    });
    const list = users.map((u) => ({
      ...u,
      tags: u.userTags.map((ut) => ut.tag.slug),
    }));
    res.json(list);
  } catch (error) {
    next(error);
  }
};

/** GET /api/users/:id - get one user with tags */
export const getUserById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const schoolId = req.user!.schoolId;
    const user = await prisma.user.findFirst({
      where: {
        id,
        ...(req.user!.role !== 'SUPER_ADMIN' ? { schoolId } : {}),
      },
      include: {
        profile: true,
        userTags: { include: { tag: true } },
      },
    });
    if (!user) throw new AppError('User not found', 404);
    const tags = user.userTags.map((ut) => ut.tag.slug);
    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      profile: user.profile,
      tags,
    });
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/users/:id/tags - set tags for user (SUB_ADMIN: only SUB_ADMIN tags; TEACHER: only TEACHER tags) */
export const updateUserTags = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id: userId } = req.params;
    const body = updateTagsSchema.parse(req.body);
    const schoolId = req.user!.schoolId;
    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        ...(req.user!.role !== 'SUPER_ADMIN' ? { schoolId } : {}),
      },
    });
    if (!targetUser) throw new AppError('User not found', 404);

    const tags = await prisma.tag.findMany({
      where: { slug: { in: body.tagSlugs } },
      select: { id: true, type: true },
    });
    if (tags.length !== body.tagSlugs.length) {
      throw new AppError('One or more tag slugs are invalid', 400);
    }
    if (targetUser.role === 'SUB_ADMIN') {
      const invalid = tags.some((t) => t.type !== 'SUB_ADMIN');
      if (invalid) throw new AppError('Sub-admin can only have SUB_ADMIN type tags (ACADEMIC, FINANCE, HR, TRANSPORT)', 400);
    }
    if (targetUser.role === 'TEACHER') {
      const invalid = tags.some((t) => t.type !== 'TEACHER');
      if (invalid) throw new AppError('Teacher can only have TEACHER type tags (e.g. HOD)', 400);
    }
    if (targetUser.role !== 'SUB_ADMIN' && targetUser.role !== 'TEACHER') {
      throw new AppError('Tags can only be set for SUB_ADMIN or TEACHER users', 400);
    }

    await prisma.$transaction([
      prisma.userTag.deleteMany({ where: { userId } }),
      ...tags.map((tag) =>
        prisma.userTag.create({ data: { userId, tagId: tag.id } })
      ),
    ]);

    const updated = await prisma.user.findUnique({
      where: { id: userId },
      include: { userTags: { include: { tag: { select: { slug: true } } } } },
    });

    await recordAudit(req, {
      action: 'user.tags_updated',
      entity: 'User',
      entityId: userId,
      summary: `Set permissions for ${targetUser.email} to [${body.tagSlugs.join(', ') || 'none'}]`,
      metadata: { tagSlugs: body.tagSlugs },
      schoolId: targetUser.schoolId || undefined,
    });

    res.json({
      tags: updated?.userTags.map((ut) => ut.tag.slug) ?? [],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate a readable temporary password.
 *
 * Uses a crypto RNG (not Math.random) and an alphabet with the characters that
 * get misread over the phone removed — 0/O, 1/l/I — because an admin normally
 * reads this out to a parent.
 */
const TEMP_PASSWORD_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

const generateTempPassword = (length = 12): string => {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += TEMP_PASSWORD_ALPHABET[bytes[i] % TEMP_PASSWORD_ALPHABET.length];
  }
  return out;
};

/**
 * POST /api/users/:id/reset-password — admin issues a temporary password.
 *
 * There is no email or SMS in this system yet, so the new password is returned
 * once in the response for the admin to hand over, and the account is flagged
 * so the owner must replace it at next login. Stamping `passwordChangedAt`
 * also kills any session the previous password still had open.
 */
export const resetUserPassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const actor = req.user!;

    const target = await prisma.user.findFirst({
      where: {
        id,
        ...(actor.role !== 'SUPER_ADMIN' ? { schoolId: actor.schoolId } : {}),
      },
      select: { id: true, email: true, role: true, schoolId: true },
    });
    if (!target) throw new AppError('User not found', 404);

    // A school admin must not be able to seize a super admin account.
    if (target.role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') {
      throw new AppError('Only a super admin can reset a super admin password', 403);
    }

    const tempPassword = generateTempPassword();

    await prisma.user.update({
      where: { id: target.id },
      data: {
        password: await hashPassword(tempPassword),
        mustChangePassword: true,
        passwordChangedAt: new Date(),
      },
    });

    await recordAudit(req, {
      action: 'user.password_reset',
      entity: 'User',
      entityId: target.id,
      summary: `Issued a temporary password for ${target.email}`,
      schoolId: target.schoolId || undefined,
    });

    res.json({
      message: 'Temporary password issued. Share it with the user — it is shown only once.',
      email: target.email,
      temporaryPassword: tempPassword,
    });
  } catch (error) {
    next(error);
  }
};
