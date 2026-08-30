import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';

/**
 * GET /api/gallery/events and /api/gallery/events/:eventId/photos
 *
 * NOT IMPLEMENTED. There is no event/photo model in the schema yet — note the
 * existing ClassMoment model covers class photos, but not school events.
 *
 * These previously returned invented events ("Annual Day Celebration") and
 * photo URLs that 404'd. Empty lists let the page show its real empty state.
 *
 * To implement: add Event and EventPhoto models, or extend ClassMoment with an
 * event scope, and serve uploaded files through the existing /uploads route.
 */
export const getEvents = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    res.json([]);
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
    res.json([]);
  } catch (error) {
    next(error);
  }
};
