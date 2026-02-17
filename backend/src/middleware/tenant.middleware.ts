import { Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';
import { AuthRequest } from './auth.middleware.js';

// Middleware to ensure user can only access their school's data
export const tenantGuard = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  // Extract schoolId from params or body
  const requestedSchoolId = req.params.schoolId || req.body.schoolId;

  // SUPER_ADMIN can access any school, others only their own
  if (req.user.role !== 'SUPER_ADMIN' && requestedSchoolId && requestedSchoolId !== req.user.schoolId) {
    return next(new AppError('Access denied to this school', 403));
  }

  // Set schoolId from user if not provided
  if (!req.params.schoolId && !req.body.schoolId) {
    req.body.schoolId = req.user.schoolId;
  }

  next();
};

