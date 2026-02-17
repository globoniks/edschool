import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';

/** Build raw alerts for a parent (no read state). */
async function buildAlertsForParent(userId: string) {
  const parent = await prisma.parent.findFirst({
      where: { userId },
      include: {
        students: {
          include: {
            student: {
              include: {
                class: true,
                attendances: {
                  where: {
                    date: {
                      gte: new Date(new Date().setDate(new Date().getDate() - 7)), // Last 7 days
                    },
                  },
                  orderBy: { date: 'desc' },
                  take: 1,
                },
                feePayments: {
                  where: {
                    status: {
                      in: ['PENDING', 'PARTIAL'],
                    },
                    dueDate: {
                      lte: new Date(new Date().setDate(new Date().getDate() + 7)), // Due in next 7 days
                    },
                  },
                  orderBy: { dueDate: 'asc' },
                  take: 5,
                },
                homeworkSubmissions: {
                  include: {
                    homework: {
                      include: {
                        class: true,
                      },
                    },
                  },
                  where: {
                    status: {
                      in: ['PENDING', 'OVERDUE'],
                    },
                  },
                  orderBy: { createdAt: 'desc' },
                  take: 5,
                },
                examMarks: {
                  include: {
                    exam: true,
                    subject: true,
                  },
                  orderBy: { createdAt: 'desc' },
                  take: 5,
                },
              },
            },
          },
        },
      },
    });

  if (!parent) return [];

  const alerts: any[] = [];

  parent.students.forEach((ps) => {
    const student = ps.student;
    if (!student) return;

    student.feePayments?.forEach((fee) => {
      const daysUntilDue = Math.ceil(
        (new Date(fee.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      alerts.push({
        id: `fee-${fee.id}`,
        title: 'Fee Payment Due',
        message: `Fee payment of ₹${fee.finalAmount - (fee.amount || 0)} is due ${daysUntilDue <= 0 ? 'today' : `in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`} for ${student.firstName} ${student.lastName}`,
        type: daysUntilDue <= 0 ? 'urgent' : 'warning',
        createdAt: fee.dueDate,
      });
    });
  });

  parent.students.forEach((ps) => {
    const student = ps.student;
    if (!student) return;

    student.homeworkSubmissions?.forEach((sub) => {
      if (sub.status === 'OVERDUE') {
        alerts.push({
          id: `homework-overdue-${sub.id}`,
          title: 'Homework Overdue',
          message: `${sub.homework.title} is overdue for ${student.firstName} ${student.lastName}`,
          type: 'urgent',
          createdAt: sub.homework.dueDate,
        });
      } else if (sub.status === 'PENDING') {
        const daysUntilDue = Math.ceil(
          (new Date(sub.homework.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilDue <= 2) {
          alerts.push({
            id: `homework-due-${sub.id}`,
            title: 'Homework Due Soon',
            message: `${sub.homework.title} is due ${daysUntilDue <= 0 ? 'today' : `in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`} for ${student.firstName} ${student.lastName}`,
            type: daysUntilDue <= 0 ? 'urgent' : 'warning',
            createdAt: sub.homework.dueDate,
          });
        }
      }
    });
  });

  parent.students.forEach((ps) => {
    const student = ps.student;
    if (!student) return;

    student.examMarks?.forEach((mark) => {
      const daysSinceResult = Math.floor(
        (Date.now() - new Date(mark.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceResult <= 7) {
        alerts.push({
          id: `exam-result-${mark.id}`,
          title: 'New Exam Result',
          message: `Exam result for ${mark.exam?.name || 'Exam'} - ${mark.subject?.name || 'Subject'} is available for ${student.firstName} ${student.lastName}`,
          type: 'info',
          createdAt: mark.createdAt,
        });
      }
    });
  });

  parent.students.forEach((ps) => {
    const student = ps.student;
    if (!student) return;

    const recentAttendance = student.attendances?.[0];
    if (recentAttendance && recentAttendance.status === 'ABSENT') {
      alerts.push({
        id: `attendance-${recentAttendance.id}`,
        title: 'Absence Recorded',
        message: `${student.firstName} ${student.lastName} was marked absent on ${new Date(recentAttendance.date).toLocaleDateString()}`,
        type: 'warning',
        createdAt: recentAttendance.date,
      });
    }
  });

  alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return alerts;
}

export const getAlerts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const [alerts, readRecords] = await Promise.all([
      buildAlertsForParent(userId),
      prisma.alertRead.findMany({ where: { userId }, select: { alertId: true } }),
    ]);

    const parent = await prisma.parent.findFirst({ where: { userId } });
    if (!parent) {
      throw new AppError('Parent not found', 404);
    }

    const readSet = new Set(readRecords.map((r) => r.alertId));
    const alertsWithRead = alerts.map((a) => ({ ...a, read: readSet.has(a.id) }));

    res.json(alertsWithRead);
  } catch (error) {
    next(error);
  }
};

export const markAlertAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { id: alertId } = req.params;

    await prisma.alertRead.upsert({
      where: {
        userId_alertId: { userId, alertId },
      },
      create: { userId, alertId },
      update: {},
    });

    res.json({ message: 'Alert marked as read', id: alertId });
  } catch (error) {
    next(error);
  }
};

export const markAllAlertsAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const alerts = await buildAlertsForParent(userId);

    await prisma.alertRead.createMany({
      data: alerts.map((a) => ({ userId, alertId: a.id })),
      skipDuplicates: true,
    });

    res.json({ message: 'All alerts marked as read' });
  } catch (error) {
    next(error);
  }
};

