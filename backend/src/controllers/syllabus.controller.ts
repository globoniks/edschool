import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

/** GET /api/syllabus/tracking - syllabus progress per subject (from real Curriculum + chapters) */
export const getSyllabusTracking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const schoolId = req.user!.schoolId;

    const parent = await prisma.parent.findFirst({
      where: { userId },
      include: {
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

    if (!parent || !parent.students.length) {
      throw new AppError('No children found', 404);
    }

    const student = parent.students[0].student;
    const classId = student.classId;
    if (!classId || !student.class) {
      return res.json({ subjects: [] });
    }

    const academicYear = student.class.academicYear;
    const curricula = await prisma.curriculum.findMany({
      where: { classId, schoolId, academicYear },
      include: {
        subject: { select: { id: true, name: true } },
        _count: { select: { chapters: true } },
      },
    });

    const subjects = curricula.map((c) => ({
      id: c.subjectId,
      name: c.subject.name,
      totalChapters: c._count.chapters,
      completedChapters: 0,
      completionPercentage: c._count.chapters === 0 ? 0 : 0,
    }));

    res.json({ subjects });
  } catch (error) {
    next(error);
  }
};

