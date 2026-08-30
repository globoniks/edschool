import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';

const createSchoolSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  logo: z.string().optional(),
});

export const createSchool = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = createSchoolSchema.parse(req.body);

    // Check if code exists
    const existing = await prisma.school.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new AppError('School code already exists', 400);
    }

    const school = await prisma.school.create({
      data,
    });

    res.status(201).json(school);
  } catch (error) {
    next(error);
  }
};

/** SUPER_ADMIN sees the whole platform; everyone else only ever sees their own school. */
export const getSchools = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const actor = req.user!;
    const schools = await prisma.school.findMany({
      where: {
        isActive: true,
        ...(actor.role === 'SUPER_ADMIN' ? {} : { id: actor.schoolId }),
      },
      include: {
        _count: {
          select: {
            students: true,
            teachers: true,
            users: true,
          },
        },
      },
    });

    res.json(schools);
  } catch (error) {
    next(error);
  }
};

export const getSchool = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const actor = req.user!;

    if (actor.role !== 'SUPER_ADMIN' && id !== actor.schoolId) {
      throw new AppError('Access denied to this school', 403);
    }

    const school = await prisma.school.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            students: true,
            teachers: true,
            users: true,
            classes: true,
          },
        },
      },
    });

    if (!school) {
      throw new AppError('School not found', 404);
    }

    res.json(school);
  } catch (error) {
    next(error);
  }
};

export const updateSchool = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const actor = req.user!;

    // A SCHOOL_ADMIN may only edit their own school, not any id they can guess.
    if (actor.role !== 'SUPER_ADMIN' && id !== actor.schoolId) {
      throw new AppError('Access denied to this school', 403);
    }

    const data = createSchoolSchema.partial().parse(req.body);

    const school = await prisma.school.update({
      where: { id },
      data,
    });

    res.json(school);
  } catch (error) {
    next(error);
  }
};

