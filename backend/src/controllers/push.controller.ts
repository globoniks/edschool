import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export const subscribe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = subscribeSchema.parse(req.body);
    const userId = req.user!.id;

    await prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: { userId, endpoint: data.endpoint },
      },
      create: {
        userId,
        endpoint: data.endpoint,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
      },
      update: {
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
      },
    });

    res.status(201).json({ message: 'Subscribed' });
  } catch (error) {
    next(error);
  }
};

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export const unsubscribe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { endpoint } = unsubscribeSchema.parse(req.body);
    const userId = req.user!.id;

    await prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });

    res.json({ message: 'Unsubscribed' });
  } catch (error) {
    next(error);
  }
};

export const getVapidKey = (_req: Request, res: Response) => {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    res.status(503).json({ error: 'Push notifications not configured' });
    return;
  }
  res.json({ vapidPublicKey: key });
};
