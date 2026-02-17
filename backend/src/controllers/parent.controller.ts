import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';

const createParentSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string(),
  email: z.string().email().optional(),
  occupation: z.string().optional(),
  address: z.string().optional(),
  userId: z.string().optional(),
});

export const createParent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = createParentSchema.parse(req.body);

    // Check if phone exists
    const existing = await prisma.parent.findUnique({
      where: { phone: data.phone },
    });

    if (existing) {
      throw new AppError('Phone number already exists', 400);
    }

    const parent = await prisma.parent.create({
      data,
      include: {
        user: {
          include: {
            profile: true,
          },
        },
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

    res.status(201).json(parent);
  } catch (error) {
    next(error);
  }
};

export const getParent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const parent = await prisma.parent.findFirst({
      where: { userId },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        students: {
          include: {
            student: {
              include: {
                class: true,
                attendances: {
                  take: 30,
                  orderBy: { date: 'desc' },
                },
                examMarks: {
                  include: {
                    exam: true,
                    subject: true,
                  },
                  take: 10,
                  orderBy: { createdAt: 'desc' },
                },
                feePayments: {
                  where: {
                    status: {
                      in: ['PENDING', 'PARTIAL'],
                    },
                  },
                  include: {
                    feeStructure: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!parent) {
      throw new AppError('Parent not found', 404);
    }

    // Additional check: ensure parent has children
    if (!parent.students || parent.students.length === 0) {
      throw new AppError('Access denied: No children linked to your account. Please contact the school administrator.', 403);
    }

    res.json(parent);
  } catch (error) {
    next(error);
  }
};

export const linkStudentToParent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { parentId, studentId, relationship, isPrimary } = req.body;

    const link = await prisma.parentStudent.create({
      data: {
        parentId,
        studentId,
        relationship: relationship || 'Parent',
        isPrimary: isPrimary || false,
      },
      include: {
        parent: true,
        student: true,
      },
    });

    res.status(201).json(link);
  } catch (error) {
    next(error);
  }
};

export const getParentDashboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

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
                      gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of current month
                    },
                  },
                  orderBy: { date: 'desc' },
                },
                examMarks: {
                  include: {
                    exam: true,
                    subject: true,
                  },
                  orderBy: { createdAt: 'desc' },
                  take: 10,
                },
                feePayments: {
                  where: {
                    status: {
                      in: ['PENDING', 'PARTIAL'],
                    },
                  },
                  include: {
                    feeStructure: true,
                  },
                  orderBy: { dueDate: 'asc' },
                },
                homeworkSubmissions: {
                  include: {
                    homework: {
                      include: {
                        class: true,
                        teacher: {
                          select: {
                            firstName: true,
                            lastName: true,
                          },
                        },
                      },
                    },
                  },
                  orderBy: { createdAt: 'desc' },
                  take: 50, // Get more to filter later
                },
              },
            },
          },
        },
      },
    });

    if (!parent) {
      throw new AppError('Parent not found', 404);
    }

    // Additional check: ensure parent has children
    if (!parent.students || parent.students.length === 0) {
      throw new AppError('Access denied: No children linked to your account. Please contact the school administrator.', 403);
    }

    // Calculate attendance statistics for each child
    const childrenData = parent.students
      .filter((ps) => ps.student !== null) // Filter out any null students
      .map((ps) => {
        try {
          const student = ps.student!;
          if (!student || !student.id) {
            console.warn('Invalid student data:', ps);
            return null;
          }
          const attendances = student.attendances || [];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthAttendances = attendances.filter((att) => {
        const attDate = new Date(att.date);
        return attDate.getMonth() === currentMonth && attDate.getFullYear() === currentYear;
      });

      const presentCount = monthAttendances.filter((att) => att.status === 'PRESENT').length;
      const totalCount = monthAttendances.length;
      const attendancePercentage = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;

      // Get recent attendance (last 7 days)
      const recentAttendances = attendances
        .filter((att) => {
          const attDate = new Date(att.date);
          const daysDiff = Math.floor((Date.now() - attDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysDiff <= 7;
        })
        .slice(0, 7)
        .reverse();

      // Count pending fees
      const pendingFees = student.feePayments || [];
      const totalPending = pendingFees.reduce((sum, fee) => {
        if (fee.status === 'PAID') return sum;
        const remaining = fee.finalAmount - (fee.amount || 0);
        return sum + Math.max(0, remaining);
      }, 0);

      // Get upcoming homework - filter for active homework with due date in future
      const upcomingHomework = (student.homeworkSubmissions || [])
        .filter((sub) => {
          const homework = sub.homework;
          if (!homework) return false;
          const dueDate = new Date(homework.dueDate);
          const now = new Date();
          return (
            homework.status === 'ACTIVE' &&
            dueDate >= now &&
            sub.status !== 'SUBMITTED' &&
            sub.status !== 'EVALUATED'
          );
        })
        .sort((a, b) => {
          const dateA = new Date(a.homework.dueDate).getTime();
          const dateB = new Date(b.homework.dueDate).getTime();
          return dateA - dateB;
        })
        .slice(0, 5);

      return {
        studentId: student.id,
        admissionNumber: student.admissionNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        class: student.class ? {
          id: student.class.id,
          name: student.class.name,
          section: student.class.section,
        } : null,
        attendance: {
          percentage: Math.round(attendancePercentage),
          presentCount,
          totalCount,
          recent: recentAttendances.map((att) => ({
            date: att.date,
            status: att.status,
          })),
        },
        fees: {
          pendingCount: pendingFees.length,
          totalPending,
          dues: pendingFees.map((fee) => {
            const paid = fee.status === 'PAID' ? fee.finalAmount : (fee.amount || 0);
            const due = fee.finalAmount - paid;
            return {
              id: fee.id,
              feeStructureName: fee.feeStructure?.name || 'Unknown',
              amount: fee.finalAmount,
              paid: paid,
              due: Math.max(0, due),
              dueDate: fee.dueDate,
              status: fee.status,
            };
          }),
        },
        exams: {
          recent: (student.examMarks || [])
            .filter((mark) => mark.exam && mark.subject) // Filter out any null exams or subjects
            .slice(0, 5)
            .map((mark) => ({
              examName: mark.exam?.name || 'Unknown',
              subject: mark.subject?.name || 'Unknown',
              marksObtained: mark.marksObtained,
              maxMarks: mark.maxMarks,
              grade: mark.grade,
              date: mark.createdAt,
            })),
        },
        homework: {
          upcoming: upcomingHomework.map((sub) => ({
            id: sub.homework.id,
            title: sub.homework.title,
            subject: sub.homework.subjectId || 'General', // subjectId is a string field, not a relation
            dueDate: sub.homework.dueDate,
            status: sub.status,
            submitted: sub.status === 'SUBMITTED' || sub.status === 'EVALUATED',
          })),
        },
      };
        } catch (err) {
          console.error('Error processing student data:', err, 'Student ID:', ps.student?.id);
          return null;
        }
      })
      .filter((child) => child !== null) as any[]; // Remove any null entries

    res.json({
      parent: {
        id: parent.id,
        firstName: parent.firstName,
        lastName: parent.lastName,
        phone: parent.phone,
        email: parent.email,
      },
      children: childrenData,
    });
  } catch (error) {
    console.error('Error in getParentDashboard:', error);
    next(error);
  }
};

export const getParentHomework = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { studentId } = req.query;

    const parent = await prisma.parent.findFirst({
      where: { userId },
      include: {
        students: {
          include: {
            student: {
              include: {
                homeworkSubmissions: {
                  include: {
                    homework: {
                      include: {
                        class: true,
                        teacher: {
                          select: {
                            firstName: true,
                            lastName: true,
                          },
                        },
                      },
                    },
                  },
                  orderBy: { createdAt: 'desc' },
                },
              },
            },
          },
        },
      },
    });

    if (!parent) {
      throw new AppError('Parent not found', 404);
    }

    // Get all homework submissions for all children or specific child
    const allHomework: any[] = [];
    
    parent.students.forEach((ps) => {
      const student = ps.student;
      if (!student) return;
      
      // Filter by studentId if provided
      if (studentId && student.id !== studentId) return;

      student.homeworkSubmissions?.forEach((sub) => {
        const homework = sub.homework;
        if (!homework) return;

        allHomework.push({
          id: sub.id,
          homeworkId: homework.id,
          title: homework.title,
          description: homework.description,
          subjectId: homework.subjectId,
          dueDate: homework.dueDate,
          createdAt: homework.createdAt,
          status: sub.status,
          submitted: sub.status === 'SUBMITTED' || sub.status === 'EVALUATED',
          submittedAt: sub.submittedAt,
          marks: sub.marks,
          remarks: sub.remarks,
          attachments: sub.attachments || [],
          student: {
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
            admissionNumber: student.admissionNumber,
            class: student.class ? {
              name: student.class.name,
              section: student.class.section,
            } : null,
          },
          teacher: {
            firstName: homework.teacher?.firstName || '',
            lastName: homework.teacher?.lastName || '',
          },
          class: homework.class ? {
            name: homework.class.name,
            section: homework.class.section,
          } : null,
        });
      });
    });

    // Sort by due date (ascending - earliest first)
    allHomework.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    res.json(allHomework);
  } catch (error) {
    next(error);
  }
};
