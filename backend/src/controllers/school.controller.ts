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

export const getSchools = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const schools = await prisma.school.findMany({
      where: { isActive: true },
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
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

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
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
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

