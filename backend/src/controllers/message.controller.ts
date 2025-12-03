import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';

const createMessageSchema = z.object({
  receiverId: z.string(),
  subject: z.string().optional(),
  content: z.string(),
  attachments: z.array(z.string()).optional(),
});

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

