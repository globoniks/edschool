import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';

/**
 * GET /api/videos
 *
 * NOT IMPLEMENTED. There is no video model in the schema yet.
 *
 * This previously returned invented lesson videos whose URLs 404'd. Returning
 * an empty list lets the page show its "Subject videos will appear here once
 * uploaded" state instead of advertising lessons that do not exist.
 *
 * To implement: add a Video model (schoolId, classId, subjectId, title, url,
 * thumbnail) and filter by the search/classId/subjectId query params.
 */
export const getVideos = async (
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
