import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';

const createParentSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string(),
  email: z.string().email().optional(),
  occupation: z.string().optional(),
  address: z.string().optional(),
  userId: z.string().optional(),
});

export const createParent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = createParentSchema.parse(req.body);

    // Check if phone exists
    const existing = await prisma.parent.findUnique({
      where: { phone: data.phone },
    });

    if (existing) {
      throw new AppError('Phone number already exists', 400);
    }

    const parent = await prisma.parent.create({
      data,
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        students: {
          include: {
            student: {
              include: {
                class: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json(parent);
  } catch (error) {
    next(error);
  }
};

export const getParent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const parent = await prisma.parent.findFirst({
      where: { userId },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        students: {
          include: {
            student: {
              include: {
                class: true,
                attendances: {
                  take: 30,
                  orderBy: { date: 'desc' },
                },
                examMarks: {
                  include: {
                    exam: true,
                    subject: true,
                  },
                  take: 10,
                  orderBy: { createdAt: 'desc' },
                },
                feePayments: {
                  where: {
                    status: {
                      in: ['PENDING', 'PARTIAL'],
                    },
                  },
                  include: {
                    feeStructure: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!parent) {
      throw new AppError('Parent not found', 404);
    }

    res.json(parent);
  } catch (error) {
    next(error);
  }
};

export const linkStudentToParent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { parentId, studentId, relationship, isPrimary } = req.body;

    const link = await prisma.parentStudent.create({
      data: {
        parentId,
        studentId,
        relationship: relationship || 'Parent',
        isPrimary: isPrimary || false,
      },
      include: {
        parent: true,
        student: true,
      },
    });

    res.status(201).json(link);
  } catch (error) {
    next(error);
  }
};

