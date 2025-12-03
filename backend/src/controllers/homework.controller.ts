import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';

const createHomeworkSchema = z.object({
  classId: z.string(),
  subjectId: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  dueDate: z.string().transform((str) => new Date(str)),
});

const submitHomeworkSchema = z.object({
  submission: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

export const createHomework = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = createHomeworkSchema.parse(req.body);
    const schoolId = req.user!.schoolId;
    const teacherId = req.user!.role === 'TEACHER' ? (await prisma.teacher.findFirst({
      where: { userId: req.user!.id },
    }))?.id : undefined;

    if (!teacherId && req.user!.role !== 'ADMIN') {
      throw new AppError('Teacher not found', 404);
    }

    const homework = await prisma.homework.create({
      data: {
        ...data,
        schoolId,
        teacherId: teacherId || req.body.teacherId,
        attachments: data.attachments || [],
      },
      include: {
        class: true,
        teacher: true,
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    res.status(201).json(homework);
  } catch (error) {
    next(error);
  }
};

export const getHomeworks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const schoolId = req.user!.schoolId;
    const { classId, teacherId, studentId, status } = req.query;

    const where: any = { schoolId };

    if (classId) {
      where.classId = classId as string;
    }

    if (teacherId) {
      where.teacherId = teacherId as string;
    }

    if (status) {
      where.status = status as string;
    }

    const homeworks = await prisma.homework.findMany({
      where,
      include: {
        class: true,
        teacher: true,
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: { dueDate: 'desc' },
    });

    // If studentId is provided, include submission status
    if (studentId) {
      const homeworksWithSubmission = await Promise.all(
        homeworks.map(async (hw) => {
          const submission = await prisma.homeworkSubmission.findUnique({
            where: {
              homeworkId_studentId: {
                homeworkId: hw.id,
                studentId: studentId as string,
              },
            },
          });

          return {
            ...hw,
            submission,
          };
        })
      );

      return res.json(homeworksWithSubmission);
    }

    // For logged-in students, automatically attach their own submission
    if (req.user!.role === 'STUDENT') {
      const me = await prisma.student.findFirst({
        where: { userId: req.user!.id, schoolId },
        select: { id: true },
      });
      if (me) {
        const homeworksWithSubmission = await Promise.all(
          homeworks.map(async (hw) => {
            const submission = await prisma.homeworkSubmission.findUnique({
              where: {
                homeworkId_studentId: {
                  homeworkId: hw.id,
                  studentId: me.id,
                },
              },
            });

            return {
              ...hw,
              submission,
            };
          })
        );

        return res.json(homeworksWithSubmission);
      }
    }

    res.json(homeworks);
  } catch (error) {
    next(error);
  }
};

export const getHomeworkSubmissions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const schoolId = req.user!.schoolId;

    const homework = await prisma.homework.findFirst({
      where: { id, schoolId },
    });

    if (!homework) {
      throw new AppError('Homework not found', 404);
    }

    const submissions = await prisma.homeworkSubmission.findMany({
      where: { homeworkId: id },
      include: {
        student: true,
      },
      orderBy: { submittedAt: 'desc' },
    });

    res.json(submissions);
  } catch (error) {
    next(error);
  }
};

export const submitHomework = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const data = submitHomeworkSchema.parse(req.body);

    // Get student ID from user
    const student = await prisma.student.findFirst({
      where: { userId: req.user!.id },
    });

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    const homework = await prisma.homework.findUnique({
      where: { id },
    });

    if (!homework) {
      throw new AppError('Homework not found', 404);
    }

    // Check if already submitted
    const existing = await prisma.homeworkSubmission.findUnique({
      where: {
        homeworkId_studentId: {
          homeworkId: id,
          studentId: student.id,
        },
      },
    });

    if (existing) {
      const updated = await prisma.homeworkSubmission.update({
        where: { id: existing.id },
        data: {
          ...data,
          status: 'SUBMITTED',
          submittedAt: new Date(),
          attachments: data.attachments || [],
        },
      });

      return res.json(updated);
    }

    const submission = await prisma.homeworkSubmission.create({
      data: {
        homeworkId: id,
        studentId: student.id,
        ...data,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        attachments: data.attachments || [],
      },
      include: {
        homework: true,
        student: true,
      },
    });

    res.status(201).json(submission);
  } catch (error) {
    next(error);
  }
};

export const evaluateHomework = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { marks, remarks } = req.body;

    const submission = await prisma.homeworkSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new AppError('Submission not found', 404);
    }

    const updated = await prisma.homeworkSubmission.update({
      where: { id },
      data: {
        marks,
        remarks,
        status: 'EVALUATED',
        evaluatedAt: new Date(),
      },
      include: {
        homework: true,
        student: true,
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

