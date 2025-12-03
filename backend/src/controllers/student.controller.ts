import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';

const createStudentSchema = z.object({
  admissionNumber: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  dateOfBirth: z.string().transform((str) => new Date(str)),
  gender: z.string(),
  bloodGroup: z.string().optional(),
  photo: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  admissionDate: z.string().transform((str) => new Date(str)).optional(),
  classId: z.string().optional(),
  parentIds: z.array(z.string()).optional(),
});

export const createStudent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = createStudentSchema.parse(req.body);
    const schoolId = req.user!.schoolId;

    // Check if admission number exists
    const existing = await prisma.student.findUnique({
      where: { admissionNumber: data.admissionNumber },
    });

    if (existing) {
      throw new AppError('Admission number already exists', 400);
    }

    const { parentIds, ...studentData } = data;

    const student = await prisma.student.create({
      data: {
        ...studentData,
        schoolId,
        admissionDate: data.admissionDate || new Date(),
        parents: parentIds
          ? {
              create: parentIds.map((parentId) => ({
                parentId,
                relationship: 'Parent',
                isPrimary: false,
              })),
            }
          : undefined,
      },
      include: {
        class: true,
        parents: {
          include: {
            parent: true,
          },
        },
      },
    });

    res.status(201).json(student);
  } catch (error) {
    next(error);
  }
};

export const getStudents = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const schoolId = req.user!.schoolId;
    const { classId, search, page = '1', limit = '20' } = req.query;

    const where: any = { schoolId };

    // Students should only see their own record
    if (req.user!.role === 'STUDENT') {
      const me = await prisma.student.findFirst({
        where: { userId: req.user!.id, schoolId },
        select: { id: true },
      });
      if (!me) {
        throw new AppError('Student not found', 404);
      }
      where.id = me.id;
    }

    if (classId) {
      where.classId = classId as string;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { admissionNumber: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          class: true,
          parents: {
            include: {
              parent: true,
            },
          },
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.student.count({ where }),
    ]);

    res.json({
      students,
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

export const getStudent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const schoolId = req.user!.schoolId;

    const where: any = { id, schoolId };

    // Students can only fetch their own profile
    if (req.user!.role === 'STUDENT') {
      const me = await prisma.student.findFirst({
        where: { userId: req.user!.id, schoolId },
        select: { id: true },
      });
      if (!me || me.id !== id) {
        throw new AppError('Forbidden', 403);
      }
    }

    const student = await prisma.student.findFirst({
      where,
      include: {
        class: true,
        parents: {
          include: {
            parent: true,
          },
        },
        attendances: {
          take: 30,
          orderBy: { date: 'desc' },
        },
        examMarks: {
          include: {
            exam: true,
            subject: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        feePayments: {
          include: {
            feeStructure: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    res.json(student);
  } catch (error) {
    next(error);
  }
};

export const updateStudent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Students cannot update student records
    if (req.user!.role === 'STUDENT') {
      throw new AppError('Students cannot modify student records', 403);
    }

    const { id } = req.params;
    const schoolId = req.user!.schoolId;
    const data = createStudentSchema.partial().parse(req.body);

    const student = await prisma.student.findFirst({
      where: { id, schoolId },
    });

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    const updated = await prisma.student.update({
      where: { id },
      data,
      include: {
        class: true,
        parents: {
          include: {
            parent: true,
          },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteStudent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const schoolId = req.user!.schoolId;

    const student = await prisma.student.findFirst({
      where: { id, schoolId },
    });

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    await prisma.student.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: 'Student deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

