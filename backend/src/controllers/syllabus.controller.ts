import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export const getSyllabusTracking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const schoolId = req.user!.schoolId;

    // Get parent's children
    const parent = await prisma.parent.findFirst({
      where: { userId },
      include: {
        students: {
          include: {
            student: {
              include: {
                class: {
                  include: {
                    subjects: {
                      include: {
                        subject: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!parent || !parent.students.length) {
      throw new AppError('No children found', 404);
    }

    // For now, return mock data structure
    // TODO: Implement actual syllabus tracking when schema is updated
    const subjects = parent.students[0].student.class?.subjects?.map((cs: any) => ({
      id: cs.subjectId,
      name: cs.subject.name,
      completionPercentage: Math.floor(Math.random() * 100), // Mock data
      completedChapters: Math.floor(Math.random() * 10),
      totalChapters: 10,
    })) || [];

    res.json({ subjects });
  } catch (error) {
    next(error);
  }
};

