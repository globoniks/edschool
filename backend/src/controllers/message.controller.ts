import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { sendPushToUser } from '../utils/pushNotification.js';
import { getTeacherAccessibleClasses } from '../utils/permissions.js';

const createMessageSchema = z.object({
  receiverId: z.string(),
  subject: z.string().optional(),
  content: z.string(),
  attachments: z.array(z.string()).optional(),
});

const sendToClassSchema = z.object({
  classId: z.string(),
  subject: z.string().optional(),
  content: z.string(),
});

/** GET /messages/recipients - list users the current user can message (teachers + parents) */
export const getRecipients = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const schoolId = req.user!.schoolId;
    const currentUserId = req.user!.id;
    const role = req.user!.role;

    const recipients: { userId: string; label: string; type: 'teacher' | 'parent' }[] = [];

    // Teachers in school (exclude self)
    const teachers = await prisma.teacher.findMany({
      where: { schoolId, isActive: true },
      include: { user: { select: { id: true } } },
    });
    for (const t of teachers) {
      if (t.user?.id && t.user.id !== currentUserId) {
        recipients.push({
          userId: t.user.id,
          label: `${t.firstName} ${t.lastName} (Teacher)`,
          type: 'teacher',
        });
      }
    }

    // Parents in school (with User account) - parents of students in this school
    const parents = await prisma.parent.findMany({
      where: {
        students: {
          some: {
            student: { schoolId },
          },
        },
        userId: { not: null },
      },
      include: {
        user: { select: { id: true } },
        students: {
          include: {
            student: {
              select: { firstName: true, lastName: true, class: { select: { name: true, section: true } } },
            },
          },
        },
      },
    });

    const seenParentIds = new Set<string>();
    for (const p of parents) {
      if (!p.user?.id || p.user.id === currentUserId) continue;
      if (seenParentIds.has(p.user.id)) continue;
      seenParentIds.add(p.user.id);
      const childNames = p.students
        .slice(0, 2)
        .map((ps) => ps.student.firstName + ' ' + ps.student.lastName)
        .join(', ');
      const suffix = childNames ? ` – ${childNames}` : '';
      recipients.push({
        userId: p.user.id,
        label: `${p.firstName} ${p.lastName} (Parent)${suffix}`,
        type: 'parent',
      });
    }

    res.json(recipients);
  } catch (error) {
    next(error);
  }
};

/** GET /messages/recipient-classes - classes the current user can send a message to (for "Send to class") */
export const getRecipientClasses = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const schoolId = req.user!.schoolId;
    let classIds: string[] | null = null;

    if (req.user!.role === 'TEACHER') {
      const teacher = await prisma.teacher.findFirst({
        where: { userId: req.user!.id },
        select: { id: true },
      });
      if (teacher) {
        classIds = await getTeacherAccessibleClasses(teacher.id);
      }
    }

    const where: { schoolId: string; id?: { in: string[] } } = { schoolId };
    if (classIds !== null && classIds.length > 0) {
      where.id = { in: classIds };
    } else if (classIds !== null && classIds.length === 0) {
      res.json([]);
      return;
    }

    const classes = await prisma.class.findMany({
      where,
      orderBy: [{ name: 'asc' }, { section: 'asc' }],
      select: { id: true, name: true, section: true },
    });

    res.json(classes);
  } catch (error) {
    next(error);
  }
};

/** POST /messages/send-to-class - send one message per parent of students in the class (teachers: own classes only) */
export const sendToClass = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = sendToClassSchema.parse(req.body);
    const senderId = req.user!.id;
    const schoolId = req.user!.schoolId;

    // If teacher, restrict to their classes
    if (req.user!.role === 'TEACHER') {
      const teacher = await prisma.teacher.findFirst({
        where: { userId: senderId },
        select: { id: true },
      });
      if (teacher) {
        const allowedClasses = await getTeacherAccessibleClasses(teacher.id);
        if (!allowedClasses.includes(data.classId)) {
          throw new AppError('You do not have access to this class', 403);
        }
      }
    }

    const studentsInClass = await prisma.student.findMany({
      where: { classId: data.classId, schoolId },
      select: { id: true },
    });
    const studentIds = studentsInClass.map((s) => s.id);
    if (studentIds.length === 0) {
      throw new AppError('No students in this class', 400);
    }

    const parentLinks = await prisma.parentStudent.findMany({
      where: { studentId: { in: studentIds } },
      include: { parent: { select: { userId: true } } },
    });
    const parentUserIds = [...new Set(
      parentLinks.map((pl) => pl.parent.userId).filter((id): id is string => !!id)
    )];
    if (parentUserIds.length === 0) {
      throw new AppError('No parents linked to students in this class', 400);
    }

    const created = await prisma.$transaction(
      parentUserIds.map((receiverId) =>
        prisma.message.create({
          data: {
            senderId,
            receiverId,
            subject: data.subject,
            content: data.content,
            attachments: [],
          },
        })
      )
    );

    // Push to each parent (fire-and-forget)
    try {
      const payload = {
        title: 'New Message (Class)',
        body: (data.subject || data.content).slice(0, 80) + ((data.subject || data.content).length > 80 ? '…' : ''),
        url: '/edschool/app/messages',
      };
      const { sendPushToUsers } = await import('../utils/pushNotification.js');
      sendPushToUsers(parentUserIds, payload);
    } catch (_) {}

    res.status(201).json({ count: created.length, message: `Message sent to ${created.length} parent(s)` });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = createMessageSchema.parse(req.body);
    const senderId = req.user!.id;

    const message = await prisma.message.create({
      data: {
        ...data,
        senderId,
        attachments: data.attachments || [],
      },
    });

    // Fire-and-forget push to receiver
    try {
      sendPushToUser(data.receiverId, {
        title: 'New Message',
        body: (data.subject || data.content).slice(0, 80) + ((data.subject || data.content).length > 80 ? '…' : ''),
        url: '/edschool/app/messages',
      });
    } catch (_) {}

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { type = 'received' } = req.query;

    const where: any = type === 'sent' ? { senderId: userId } : { receiverId: userId };

    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(messages);
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const message = await prisma.message.findUnique({
      where: { id },
    });

    if (!message || message.receiverId !== userId) {
      throw new AppError('Message not found', 404);
    }

    const updated = await prisma.message.update({
      where: { id },
      data: { isRead: true },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

