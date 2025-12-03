import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';

const createTeacherSchema = z.object({
  employeeId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  dateOfBirth: z.string().transform((str) => new Date(str)).optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  qualification: z.string().optional(),
  experience: z.number().min(0).optional(),
  joiningDate: z.string().transform((str) => new Date(str)).optional(),
  photo: z.string().optional(),
  address: z.string().optional(),
  userId: z.string().optional(),
  assignments: z.array(z.object({
    classId: z.string(),
    subjectId: z.string(),
  })).optional(),
});

export const createTeacher = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = createTeacherSchema.parse(req.body);
    const schoolId = req.user!.schoolId;

    // Check if employee ID exists
    const existing = await prisma.teacher.findUnique({
      where: { employeeId: data.employeeId },
    });

    if (existing) {
      throw new AppError('Employee ID already exists', 400);
    }

    const { assignments, ...teacherData } = data;

    const teacher = await prisma.teacher.create({
      data: {
        ...teacherData,
        schoolId,
        joiningDate: teacherData.joiningDate || new Date(),
        experience: teacherData.experience || 0,
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (assignments && assignments.length > 0) {
      await Promise.all(
        assignments.map((assignment) =>
          prisma.classSubject.upsert({
            where: {
              classId_subjectId: {
                classId: assignment.classId,
                subjectId: assignment.subjectId,
              },
            },
            create: {
              classId: assignment.classId,
              subjectId: assignment.subjectId,
              teacherId: teacher.id,
            },
            update: {
              teacherId: teacher.id,
            },
          })
        )
      );
    }

    res.status(201).json(teacher);
  } catch (error) {
    next(error);
  }
};

export const getTeachers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const schoolId = req.user!.schoolId;
    const { search, page = '1', limit = '20' } = req.query;

    const where: any = { schoolId, isActive: true };

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { employeeId: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({
        where,
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.teacher.count({ where }),
    ]);

    res.json({
      teachers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTeacher = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const schoolId = req.user!.schoolId;

    const teacher = await prisma.teacher.findFirst({
      where: { id, schoolId },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        classSubjects: {
          include: {
            class: true,
            subject: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new AppError('Teacher not found', 404);
    }

    res.json(teacher);
  } catch (error) {
    next(error);
  }
};

export const updateTeacher = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const schoolId = req.user!.schoolId;
    const data = createTeacherSchema.partial().parse(req.body);

    const teacher = await prisma.teacher.findFirst({
      where: { id, schoolId },
    });

    if (!teacher) {
      throw new AppError('Teacher not found', 404);
    }

    const updated = await prisma.teacher.update({
      where: { id },
      data,
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

