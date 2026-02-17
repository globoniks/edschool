import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export const getEvents = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const schoolId = req.user!.schoolId;

    // For now, return mock data structure
    // TODO: Implement actual event gallery when schema is updated
    const events = [
      {
        id: '1',
        name: 'Annual Day Celebration',
        date: new Date().toISOString(),
        description: 'School annual day celebration with performances',
      },
      {
        id: '2',
        name: 'Sports Day',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Annual sports day event',
      },
    ];

    res.json(events);
  } catch (error) {
    next(error);
  }
};

export const getEventPhotos = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { eventId } = req.params;

    // For now, return mock data structure
    // TODO: Implement actual event photos when schema is updated
    const photos = [
      {
        id: '1',
        url: '/uploads/events/photo1.jpg',
        caption: 'Event photo 1',
      },
      {
        id: '2',
        url: '/uploads/events/photo2.jpg',
        caption: 'Event photo 2',
      },
    ];

    res.json(photos);
  } catch (error) {
    next(error);
  }
};

