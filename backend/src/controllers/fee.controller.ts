import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';

const createFeeStructureSchema = z.object({
  name: z.string(),
  type: z.enum(['TUITION', 'TRANSPORT', 'HOSTEL', 'LIBRARY', 'LAB', 'SPORTS', 'OTHER']),
  amount: z.number().positive(),
  classId: z.string().optional(),
  billingCycle: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY', 'ONE_TIME']),
  dueDate: z.number().min(1).max(31),
});

const createPaymentSchema = z.object({
  studentId: z.string(),
  feeStructureId: z.string(),
  amount: z.number().positive(),
  discount: z.number().min(0).optional(),
  scholarship: z.number().min(0).optional(),
  dueDate: z.string().transform((str) => new Date(str)),
  paymentMethod: z.string().optional(),
  transactionId: z.string().optional(),
  remarks: z.string().optional(),
});

export const createFeeStructure = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = createFeeStructureSchema.parse(req.body);
    const schoolId = req.user!.schoolId;

    const feeStructure = await prisma.feeStructure.create({
      data: {
        ...data,
        schoolId,
      },
    });

    res.status(201).json(feeStructure);
  } catch (error) {
    next(error);
  }
};

export const getFeeStructures = async (
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

    const feeStructures = await prisma.feeStructure.findMany({
      where,
      include: {
        _count: {
          select: {
            payments: true,
          },
        },
      },
    });

    res.json(feeStructures);
  } catch (error) {
    next(error);
  }
};

export const createPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = createPaymentSchema.parse(req.body);

    const feeStructure = await prisma.feeStructure.findUnique({
      where: { id: data.feeStructureId },
    });

    if (!feeStructure) {
      throw new AppError('Fee structure not found', 404);
    }

    const discount = data.discount || 0;
    const scholarship = data.scholarship || 0;
    const finalAmount = data.amount - discount - scholarship;

    // Generate receipt number
    const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const payment = await prisma.feePayment.create({
      data: {
        ...data,
        discount,
        scholarship,
        finalAmount,
        receiptNumber,
        status: finalAmount <= 0 ? 'PAID' : 'PENDING',
        paymentDate: finalAmount <= 0 ? new Date() : null,
      },
      include: {
        student: true,
        feeStructure: true,
      },
    });

    res.status(201).json(payment);
  } catch (error) {
    next(error);
  }
};

export const updatePayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status, paymentDate, paymentMethod, transactionId } = req.body;

    const payment = await prisma.feePayment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    const updated = await prisma.feePayment.update({
      where: { id },
      data: {
        status,
        paymentDate: paymentDate ? new Date(paymentDate) : payment.paymentDate,
        paymentMethod,
        transactionId,
      },
      include: {
        student: true,
        feeStructure: true,
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const getPayments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { studentId, status, startDate, endDate } = req.query;

    const where: any = {};

    // Students should only see their own payments
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

    if (status) {
      where.status = status as string;
    }

    if (startDate && endDate) {
      where.dueDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const payments = await prisma.feePayment.findMany({
      where,
      include: {
        student: true,
        feeStructure: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(payments);
  } catch (error) {
    next(error);
  }
};

export const getFeeDues = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { studentId } = req.params;

    const payments = await prisma.feePayment.findMany({
      where: {
        studentId,
        status: {
          in: ['PENDING', 'PARTIAL'],
        },
      },
      include: {
        feeStructure: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    const totalDue = payments.reduce((sum, p) => sum + p.finalAmount, 0);

    res.json({
      payments,
      totalDue,
      count: payments.length,
    });
  } catch (error) {
    next(error);
  }
};

