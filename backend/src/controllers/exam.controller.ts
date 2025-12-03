import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';

const createExamSchema = z.object({
  name: z.string(),
  classId: z.string().optional(),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  passingMarks: z.number().min(0).optional(),
});

const createExamMarkSchema = z.object({
  examId: z.string(),
  studentId: z.string(),
  subjectId: z.string(),
  marksObtained: z.number().min(0),
  maxMarks: z.number().positive(),
  grade: z.string().optional(),
  remarks: z.string().optional(),
});

export const createExam = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = createExamSchema.parse(req.body);
    const schoolId = req.user!.schoolId;

    const exam = await prisma.exam.create({
      data: {
        ...data,
        schoolId,
        passingMarks: data.passingMarks || 33.0,
      },
      include: {
        _count: {
          select: {
            marks: true,
          },
        },
      },
    });

    res.status(201).json(exam);
  } catch (error) {
    next(error);
  }
};

export const getExams = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const schoolId = req.user!.schoolId;
    const { classId } = req.query;

    const where: any = { schoolId, isActive: true };

    if (classId) {
      where.classId = classId as string;
    }

    const exams = await prisma.exam.findMany({
      where,
      include: {
        _count: {
          select: {
            marks: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    res.json(exams);
  } catch (error) {
    next(error);
  }
};

export const createExamMark = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = createExamMarkSchema.parse(req.body);

    // Check if mark already exists
    const existing = await prisma.examMark.findUnique({
      where: {
        examId_studentId_subjectId: {
          examId: data.examId,
          studentId: data.studentId,
          subjectId: data.subjectId,
        },
      },
    });

    if (existing) {
      const updated = await prisma.examMark.update({
        where: { id: existing.id },
        data,
      });

      return res.json(updated);
    }

    const mark = await prisma.examMark.create({
      data,
      include: {
        exam: true,
        student: true,
        subject: true,
      },
    });

    res.status(201).json(mark);
  } catch (error) {
    next(error);
  }
};

export const getExamMarks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { examId, studentId, classId } = req.query;

    const where: any = {};

    if (examId) {
      where.examId = examId as string;
    }

    // Students can only see their own marks
    if (req.user!.role === 'STUDENT') {
      const me = await prisma.student.findFirst({
        where: { userId: req.user!.id },
        select: { id: true },
      });
      if (!me) {
        throw new AppError('Student not found', 404);
      }
      where.studentId = me.id;
    } else if (studentId) {
      where.studentId = studentId as string;
    }

    if (classId) {
      // Get students in class first
      const students = await prisma.student.findMany({
        where: { classId: classId as string },
        select: { id: true },
      });

      where.studentId = {
        in: students.map((s) => s.id),
      };
    }

    const marks = await prisma.examMark.findMany({
      where,
      include: {
        exam: true,
        student: true,
        subject: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(marks);
  } catch (error) {
    next(error);
  }
};

export const getReportCard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { studentId, examId } = req.params;

    // Students can only access their own report card
    if (req.user!.role === 'STUDENT') {
      const me = await prisma.student.findFirst({
        where: { userId: req.user!.id },
        select: { id: true },
      });
      if (!me || me.id !== studentId) {
        throw new AppError('Forbidden', 403);
      }
    }

    const marks = await prisma.examMark.findMany({
      where: {
        studentId,
        examId,
      },
      include: {
        subject: true,
        exam: true,
      },
    });

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new AppError('Exam not found', 404);
    }

    const totalMarks = marks.reduce((sum, m) => sum + m.maxMarks, 0);
    const obtainedMarks = marks.reduce((sum, m) => sum + m.marksObtained, 0);
    const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
    const isPass = percentage >= exam.passingMarks;

    res.json({
      exam,
      marks,
      summary: {
        totalMarks,
        obtainedMarks,
        percentage: percentage.toFixed(2),
        isPass,
      },
    });
  } catch (error) {
    next(error);
  }
};

