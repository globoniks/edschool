import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';

const createClassSchema = z.object({
  name: z.string(),
  section: z.string().optional(),
  academicYear: z.string(),
  capacity: z.number().positive().optional(),
});

const createSubjectSchema = z.object({
  name: z.string(),
  code: z.string().optional(),
  description: z.string().optional(),
});

const assignClassSubjectSchema = z.object({
  classId: z.string(),
  subjectId: z.string(),
  teacherId: z.string().optional(),
});

export const createClass = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = createClassSchema.parse(req.body);
    const schoolId = req.user!.schoolId;

    const class_ = await prisma.class.create({
      data: {
        ...data,
        schoolId,
        capacity: data.capacity || 40,
      },
      include: {
        _count: {
          select: {
            students: true,
            subjects: true,
          },
        },
      },
    });

    res.status(201).json(class_);
  } catch (error) {
    next(error);
  }
};

export const getClasses = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const schoolId = req.user!.schoolId;
    const { academicYear } = req.query;

    const where: any = { schoolId };

    if (academicYear) {
      where.academicYear = academicYear as string;
    }

    const classes = await prisma.class.findMany({
      where,
      include: {
        _count: {
          select: {
            students: true,
            subjects: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(classes);
  } catch (error) {
    next(error);
  }
};

export const createSubject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = createSubjectSchema.parse(req.body);
    const schoolId = req.user!.schoolId;

    const subject = await prisma.subject.create({
      data: {
        ...data,
        schoolId,
      },
    });

    res.status(201).json(subject);
  } catch (error) {
    next(error);
  }
};

export const getSubjects = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const schoolId = req.user!.schoolId;

    const subjects = await prisma.subject.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' },
    });

    res.json(subjects);
  } catch (error) {
    next(error);
  }
};

export const assignClassSubject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = assignClassSubjectSchema.parse(req.body);

    const classSubject = await prisma.classSubject.upsert({
      where: {
        classId_subjectId: {
          classId: data.classId,
          subjectId: data.subjectId,
        },
      },
      update: {
        teacherId: data.teacherId,
      },
      create: data,
      include: {
        class: true,
        subject: true,
        teacher: true,
      },
    });

    res.status(201).json(classSubject);
  } catch (error) {
    next(error);
  }
};

export const getClassSubjects = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { classId } = req.params;

    const classSubjects = await prisma.classSubject.findMany({
      where: { classId },
      include: {
        subject: true,
        teacher: true,
      },
    });

    res.json(classSubjects);
  } catch (error) {
    next(error);
  }
};

