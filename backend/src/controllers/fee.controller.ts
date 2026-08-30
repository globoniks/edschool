import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { recordAudit } from '../utils/auditLog.js';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { appUrl, APP_ROUTES } from '../utils/appUrl.js';
import { getParentAccessibleStudents, canParentAccessStudent } from '../utils/permissions.js';
import { sendPushToUsers } from '../utils/pushNotification.js';

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

    // Fire-and-forget push to parents of this student
    try {
      const parents = await prisma.parentStudent.findMany({
        where: { studentId: data.studentId },
        include: { parent: { select: { userId: true } } },
      });
      const userIds = parents.map((p) => p.parent.userId).filter((id): id is string => id != null);
      if (userIds.length > 0) {
        sendPushToUsers(userIds, {
          title: 'Fee Payment Recorded',
          body: `Receipt ${payment.receiptNumber} – ${payment.feeStructure.name}.`,
          url: appUrl(APP_ROUTES.parentFees),
        });
      }
    } catch (_) {}

    await recordAudit(req, {
      action: 'fee_payment.created',
      entity: 'FeePayment',
      entityId: payment.id,
      summary:
        `Recorded ${payment.feeStructure.name} of ${payment.finalAmount} ` +
        `(receipt ${payment.receiptNumber}) for ` +
        `${payment.student.firstName} ${payment.student.lastName}`,
      metadata: {
        studentId: data.studentId,
        amount: data.amount,
        discount,
        scholarship,
        finalAmount,
        receiptNumber: payment.receiptNumber,
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

    // FeePayment has no schoolId of its own — the tenant comes from the student.
    const payment = await prisma.feePayment.findFirst({
      where: {
        id,
        ...(req.user!.role !== 'SUPER_ADMIN'
          ? { student: { schoolId: req.user!.schoolId } }
          : {}),
      },
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

    await recordAudit(req, {
      action: 'fee_payment.updated',
      entity: 'FeePayment',
      entityId: updated.id,
      summary:
        `Receipt ${updated.receiptNumber}: status ${payment.status} -> ${updated.status}`,
      metadata: {
        previousStatus: payment.status,
        newStatus: updated.status,
        paymentMethod: updated.paymentMethod,
        transactionId: updated.transactionId,
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
    const { studentId, status, startDate, endDate, page, limit } = req.query;

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
    }
    // Parents can only see their children's payments
    else if (req.user!.role === 'PARENT') {
      const parent = await prisma.parent.findFirst({
        where: { userId: req.user!.id },
        select: { id: true },
      });
      if (parent) {
        const accessibleStudentIds = await getParentAccessibleStudents(parent.id);
        where.studentId = { in: accessibleStudentIds };
      } else {
        where.studentId = { in: [] }; // No access
      }
    } else if (studentId) {
      where.studentId = studentId as string;
    }

    // Admin/school roles: restrict to current school (students in this school only)
    const schoolScopedRoles = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'SUB_ADMIN'];
    if (schoolScopedRoles.includes(req.user!.role as string) && req.user!.schoolId) {
      where.student = { schoolId: req.user!.schoolId };
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

    const MAX_PAYMENTS_LIST = 5000;
    const include = { student: true, feeStructure: true };
    const orderBy = { createdAt: 'desc' as const };

    // Pagination is opt-in: callers that need the whole set (the dashboard's
    // fee totals) still get a plain array, while list views ask for a page and
    // get an envelope. Changing the shape unconditionally would break every
    // existing caller.
    const wantsPage = page !== undefined || limit !== undefined;

    if (!wantsPage) {
      const payments = await prisma.feePayment.findMany({
        where,
        include,
        orderBy,
        take: MAX_PAYMENTS_LIST,
      });
      return res.json(payments);
    }

    const limitNum = Math.min(Math.max(1, Number(limit) || 25), MAX_PAYMENTS_LIST);
    const pageNum = Math.max(1, Number(page) || 1);

    const [payments, total] = await Promise.all([
      prisma.feePayment.findMany({
        where,
        include,
        orderBy,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.feePayment.count({ where }),
    ]);

    res.json({
      payments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.max(1, Math.ceil(total / limitNum)),
      },
    });
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

    // Students can only access their own fee dues
    if (req.user!.role === 'STUDENT') {
      const me = await prisma.student.findFirst({
        where: { userId: req.user!.id },
        select: { id: true },
      });
      if (!me || me.id !== studentId) {
        throw new AppError('Forbidden', 403);
      }
    }
    // Parents can only access their children's fee dues
    else if (req.user!.role === 'PARENT') {
      const parent = await prisma.parent.findFirst({
        where: { userId: req.user!.id },
        select: { id: true },
      });
      if (!parent) {
        throw new AppError('Parent not found', 404);
      }
      const hasAccess = await canParentAccessStudent(parent.id, studentId);
      if (!hasAccess) {
        throw new AppError('Forbidden', 403);
      }
    }

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


/**
 * GET /api/fees/stats — fee totals computed in the database.
 *
 * The dashboard used to fetch every payment row and add them up in the browser,
 * which meant shipping thousands of records to render four numbers. These are
 * the same figures, aggregated server-side.
 *
 * Raw SQL rather than Prisma's aggregate because `pending` needs a per-row
 * GREATEST(0, due - paid): summing the two columns separately and subtracting
 * would let an overpaid row cancel out a genuine due elsewhere.
 */
export const getFeeStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const actor = req.user!;

    // SUPER_ADMIN may inspect one school; everyone else is pinned to their own.
    const requestedSchoolId =
      typeof req.query.schoolId === 'string' ? req.query.schoolId : undefined;
    const schoolId =
      actor.role === 'SUPER_ADMIN' ? requestedSchoolId ?? actor.schoolId : actor.schoolId;

    if (!schoolId) {
      throw new AppError('School context required', 400);
    }

    const [row] = await prisma.$queryRaw<
      { totalBilled: number; collected: number; pending: number; paymentCount: number }[]
    >`
      SELECT
        COALESCE(SUM(fp."finalAmount"), 0)::double precision AS "totalBilled",
        COALESCE(SUM(CASE WHEN fp."status" = 'PAID'
                          THEN fp."amount" ELSE 0 END), 0)::double precision AS "collected",
        COALESCE(SUM(CASE WHEN fp."status" IN ('PENDING', 'PARTIAL')
                          THEN GREATEST(0, fp."finalAmount" - fp."amount")
                          ELSE 0 END), 0)::double precision AS "pending",
        COUNT(*)::int AS "paymentCount"
      FROM "FeePayment" fp
      JOIN "Student" s ON s."id" = fp."studentId"
      WHERE s."schoolId" = ${schoolId}
    `;

    const totalBilled = row?.totalBilled ?? 0;
    const collected = row?.collected ?? 0;

    res.json({
      totalBilled,
      collected,
      pending: row?.pending ?? 0,
      paymentCount: row?.paymentCount ?? 0,
      collectionRate: totalBilled > 0 ? (collected / totalBilled) * 100 : 0,
    });
  } catch (error) {
    next(error);
  }
};
