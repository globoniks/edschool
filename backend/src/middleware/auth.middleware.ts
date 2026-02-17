import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';
import { prisma } from '../lib/prisma.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    schoolId: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
      role: string;
      schoolId: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { school: true },
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
    };

    // If user is a parent, check if they have children linked
    if (user.role === 'PARENT') {
      const parent = await prisma.parent.findFirst({
        where: { userId: user.id },
        include: {
          students: {
            select: { id: true },
          },
        },
      });

      if (!parent) {
        throw new AppError('Parent profile not found', 404);
      }

      if (!parent.students || parent.students.length === 0) {
        throw new AppError('Access denied: No children linked to your account. Please contact the school administrator.', 403);
      }
    }

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};

/**
 * Check if user has any of the specified permissions
 */
export const hasPermission = (req: AuthRequest, ...allowedRoles: string[]): boolean => {
  if (!req.user) return false;
  return allowedRoles.includes(req.user.role);
};

/**
 * Middleware to check if user can access multi-school (SUPER_ADMIN only)
 */
export const requireSuperAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== 'SUPER_ADMIN') {
    return next(new AppError('Super admin access required', 403));
  }
  next();
};

/**
 * Middleware to check if a parent has children linked to their account
 * Parents without children should not have access to the system
 */
export const requireParentWithChildren = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (req.user.role !== 'PARENT') {
      // Not a parent, skip this check
      return next();
    }

    // Check if parent exists and has children
    const parent = await prisma.parent.findFirst({
      where: { userId: req.user.id },
      include: {
        students: {
          select: { id: true },
        },
      },
    });

    if (!parent) {
      return next(new AppError('Parent profile not found', 404));
    }

    if (!parent.students || parent.students.length === 0) {
      return next(new AppError('Access denied: No children linked to your account. Please contact the school administrator.', 403));
    }

    next();
  } catch (error) {
    next(error);
  }
};

