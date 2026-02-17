import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { getParentAccessibleClasses } from '../utils/permissions.js';

const createTimetableSchema = z.object({
  classId: z.string(),
  subjectId: z.string(),
  teacherId: z.string().optional(),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  room: z.string().optional(),
  academicYear: z.string(),
});

export const createTimetable = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = createTimetableSchema.parse(req.body);
    const schoolId = req.user!.schoolId;

    const timetable = await prisma.timetable.create({
      data: {
        ...data,
        schoolId,
      },
      include: {
        class: true,
        subject: true,
        teacher: true,
      },
    });

    res.status(201).json(timetable);
  } catch (error) {
    next(error);
  }
};

export const getTimetables = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const schoolId = req.user!.schoolId;
    const { classId, teacherId, dayOfWeek } = req.query;

    const where: any = { schoolId };

    // Parents can only see timetables for their children's classes
    if (req.user!.role === 'PARENT') {
      const parent = await prisma.parent.findFirst({
        where: { userId: req.user!.id },
        select: { id: true },
      });
      if (parent) {
        const accessibleClassIds = await getParentAccessibleClasses(parent.id);
        if (accessibleClassIds.length === 0) {
          // No children, return empty array
          return res.json([]);
        }
        // If classId is specified, verify parent has access to it
        if (classId) {
          if (!accessibleClassIds.includes(classId as string)) {
            return res.json([]); // Return empty instead of error
          }
          where.classId = classId as string;
        } else {
          // Filter to only show timetables for classes where parent has children
          where.classId = { in: accessibleClassIds };
        }
      } else {
        return res.json([]); // No access
      }
    } else if (classId) {
      where.classId = classId as string;
    }

    if (teacherId) {
      where.teacherId = teacherId as string;
    }

    if (dayOfWeek !== undefined) {
      where.dayOfWeek = Number(dayOfWeek);
    }

    const timetables = await prisma.timetable.findMany({
      where,
      include: {
        class: true,
        subject: true,
        teacher: true,
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });

    res.json(timetables);
  } catch (error) {
    next(error);
  }
};

export const updateTimetable = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = createTimetableSchema.partial().parse(req.body);

    const timetable = await prisma.timetable.update({
      where: { id },
      data,
      include: {
        class: true,
        subject: true,
        teacher: true,
      },
    });

    res.json(timetable);
  } catch (error) {
    next(error);
  }
};

export const deleteTimetable = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await prisma.timetable.delete({
      where: { id },
    });

    res.json({ message: 'Timetable deleted successfully' });
  } catch (error) {
    next(error);
  }
};

