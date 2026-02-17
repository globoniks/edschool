import { Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import {
  getTeacherAccessibleClasses,
  getParentAccessibleStudents,
} from '../utils/permissions.js';

const createClassMomentSchema = z.object({
  classId: z.string(),
  imageUrl: z.string().min(1),
  caption: z.string().optional(),
});

const MAX_MOMENTS_LIST = 100;

export const createClassMoment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = createClassMomentSchema.parse(req.body);
    const schoolId = req.user!.schoolId;

    if (req.user!.role !== 'TEACHER') {
      throw new AppError('Only teachers can share photos to a class', 403);
    }

    const teacher = await prisma.teacher.findFirst({
      where: { userId: req.user!.id, schoolId },
      select: { id: true },
    });
    if (!teacher) {
      throw new AppError('Teacher profile not found', 404);
    }

    const accessibleClassIds = await getTeacherAccessibleClasses(teacher.id);
    if (!accessibleClassIds.includes(data.classId)) {
      throw new AppError('You do not have access to this class', 403);
    }

    const cls = await prisma.class.findFirst({
      where: { id: data.classId, schoolId },
      select: { id: true },
    });
    if (!cls) {
      throw new AppError('Class not found', 404);
    }

    const moment = await prisma.classMoment.create({
      data: {
        schoolId,
        classId: data.classId,
        teacherId: teacher.id,
        imageUrl: data.imageUrl,
        caption: data.caption ?? null,
      },
      include: {
        class: { select: { name: true, section: true } },
        teacher: { select: { firstName: true, lastName: true } },
      },
    });

    res.status(201).json(moment);
  } catch (error) {
    next(error);
  }
};

export const getClassMoments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const schoolId = req.user!.schoolId;
    const { classId } = req.query;

    const where: { schoolId: string; classId?: string | { in: string[] } } = {
      schoolId,
    };

    if (req.user!.role === 'TEACHER') {
      const teacher = await prisma.teacher.findFirst({
        where: { userId: req.user!.id, schoolId },
        select: { id: true },
      });
      if (!teacher) {
        return res.json([]);
      }
      const accessibleClassIds = await getTeacherAccessibleClasses(teacher.id);
      where.classId = { in: accessibleClassIds };
      if (classId && typeof classId === 'string') {
        if (accessibleClassIds.includes(classId)) {
          where.classId = classId;
        }
      }
    } else if (req.user!.role === 'STUDENT') {
      const student = await prisma.student.findFirst({
        where: { userId: req.user!.id, schoolId },
        select: { classId: true },
      });
      if (!student?.classId) {
        return res.json([]);
      }
      where.classId = student.classId;
    } else if (req.user!.role === 'PARENT') {
      const parent = await prisma.parent.findFirst({
        where: { userId: req.user!.id },
        select: { id: true },
      });
      if (!parent) {
        return res.json([]);
      }
      const studentIds = await getParentAccessibleStudents(parent.id);
      const students = await prisma.student.findMany({
        where: { id: { in: studentIds }, schoolId },
        select: { classId: true },
      });
      const classIds = [...new Set(students.map((s) => s.classId).filter(Boolean))] as string[];
      if (classIds.length === 0) {
        return res.json([]);
      }
      where.classId = { in: classIds };
      if (classId && typeof classId === 'string' && classIds.includes(classId)) {
        where.classId = classId;
      }
    } else {
      // Admin etc: can filter by classId or see all
      if (classId && typeof classId === 'string') {
        where.classId = classId;
      }
    }

    const moments = await prisma.classMoment.findMany({
      where,
      include: {
        class: { select: { name: true, section: true } },
        teacher: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_MOMENTS_LIST,
    });

    res.json(moments);
  } catch (error) {
    next(error);
  }
};
