import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';

/**
 * GET /api/downloads
 *
 * NOT IMPLEMENTED. There is no document model in the schema yet, so there is
 * nothing real to list.
 *
 * This previously returned three invented documents — including a "Report Card
 * - Term 1" — to real parents, whose links 404'd. Telling a parent their
 * child's report card is ready when no such record exists is worse than showing
 * nothing, so it returns an empty list and the UI shows "Documents will appear
 * here once uploaded".
 *
 * To implement: add a Document model (schoolId, studentId?, category, fileUrl,
 * uploadedBy) and list from it, scoped to the caller's children.
 */
export const getDownloads = async (
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
