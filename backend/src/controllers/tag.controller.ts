import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';

const createTagSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[A-Z0-9_]+$/i, 'Slug must be alphanumeric or underscores'),
  type: z.enum(['SUB_ADMIN', 'TEACHER']),
  permissions: z.array(z.string()).min(0),
});

const updateTagSchema = createTagSchema.partial();

/** GET /api/tags - list tags (SUPER_ADMIN: all; SCHOOL_ADMIN: global + own school) */
export const listTags = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user!.schoolId;
    const where: { OR?: { schoolId: string | null }[] } = {};
    if (req.user!.role === 'SCHOOL_ADMIN' && schoolId) {
      where.OR = [{ schoolId: null }, { schoolId }];
    }
    const tags = await prisma.tag.findMany({
      where: Object.keys(where).length ? where : undefined,
      orderBy: [{ type: 'asc' }, { slug: 'asc' }],
      select: { id: true, slug: true, name: true, type: true, permissions: true, schoolId: true },
    });
    res.json(tags);
  } catch (error) {
    next(error);
  }
};

/** POST /api/tags - create tag (SCHOOL_ADMIN: scoped to their school) */
export const createTag = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createTagSchema.parse(req.body);
    const slug = data.slug.toUpperCase().replace(/\s+/g, '_');
    const schoolId = req.user!.role === 'SUPER_ADMIN' ? undefined : req.user!.schoolId;
    const existing = await prisma.tag.findUnique({ where: { slug } });
    if (existing) throw new AppError('A tag with this slug already exists', 400);
    const tag = await prisma.tag.create({
      data: {
        name: data.name,
        slug,
        type: data.type,
        permissions: data.permissions,
        schoolId: schoolId ?? undefined,
      },
      select: { id: true, slug: true, name: true, type: true, permissions: true, schoolId: true },
    });
    res.status(201).json(tag);
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/tags/:id - update tag */
export const updateTag = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const body = updateTagSchema.parse(req.body);
    const schoolId = req.user!.schoolId;
    const tag = await prisma.tag.findFirst({
      where: {
        id,
        ...(req.user!.role === 'SCHOOL_ADMIN' ? { OR: [{ schoolId: null }, { schoolId }] } : {}),
      },
    });
    if (!tag) throw new AppError('Tag not found', 404);
    if (body.slug && body.slug !== tag.slug) {
      const existing = await prisma.tag.findUnique({ where: { slug: body.slug } });
      if (existing) throw new AppError('A tag with this slug already exists', 400);
    }
    const updated = await prisma.tag.update({
      where: { id },
      data: {
        ...(body.name != null && { name: body.name }),
        ...(body.slug != null && { slug: body.slug.toUpperCase().replace(/\s+/g, '_') }),
        ...(body.type != null && { type: body.type }),
        ...(body.permissions != null && { permissions: body.permissions }),
      },
      select: { id: true, slug: true, name: true, type: true, permissions: true, schoolId: true },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/tags/:id - delete tag (only school-scoped or SUPER_ADMIN) */
export const deleteTag = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const tag = await prisma.tag.findFirst({
      where: {
        id,
        ...(req.user!.role === 'SCHOOL_ADMIN' ? { OR: [{ schoolId: null }, { schoolId: req.user!.schoolId }] } : {}),
      },
    });
    if (!tag) throw new AppError('Tag not found', 404);
    if (req.user!.role === 'SCHOOL_ADMIN' && tag.schoolId === null) {
      throw new AppError('Cannot delete global tags. Only school-specific tags can be deleted.', 403);
    }
    await prisma.tag.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
