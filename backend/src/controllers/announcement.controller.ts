import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';

const createAnnouncementSchema = z.object({
  title: z.string(),
  content: z.string(),
  targetAudience: z.array(z.enum(['ALL', 'PARENTS', 'TEACHERS', 'STUDENTS', 'SPECIFIC_CLASS'])),
  attachments: z.array(z.string()).optional(),
  isImportant: z.boolean().optional(),
  expiresAt: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((val) => {
      if (!val || val === '' || val === null) return null;
      return new Date(val);
    })
    .optional(),
});

export const createAnnouncement = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = createAnnouncementSchema.parse(req.body);
    const schoolId = req.user!.schoolId;
    const createdBy = req.user!.id;

    const announcement = await prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        targetAudience: data.targetAudience,
        attachments: data.attachments || [],
        isImportant: data.isImportant || false,
        expiresAt: data.expiresAt || null,
        schoolId,
        createdBy,
      },
    });

    res.status(201).json(announcement);
  } catch (error) {
    next(error);
  }
};

export const getAnnouncements = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const schoolId = req.user!.schoolId;
    const { targetAudience } = req.query;

    const where: any = {
      schoolId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    };

    if (targetAudience) {
      where.targetAudience = {
        has: targetAudience as string,
      };
    }

    // Filter by user role
    if (req.user!.role === 'PARENT') {
      where.targetAudience = {
        hasSome: ['ALL', 'PARENTS'],
      };
    } else if (req.user!.role === 'TEACHER') {
      where.targetAudience = {
        hasSome: ['ALL', 'TEACHERS'],
      };
    } else if (req.user!.role === 'STUDENT') {
      where.targetAudience = {
        hasSome: ['ALL', 'STUDENTS'],
      };
    }

    const MAX_ANNOUNCEMENTS = 500;
    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: MAX_ANNOUNCEMENTS,
    });

    res.json(announcements);
  } catch (error) {
    next(error);
  }
};

export const getAnnouncement = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new AppError('Announcement not found', 404);
    }

    res.json(announcement);
  } catch (error) {
    next(error);
  }
};

