import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { generateToken } from '../utils/jwt.util.js';
import { hashPassword, comparePassword } from '../utils/password.util.js';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { getUserPermissions } from '../utils/permissions.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { recordAudit } from '../utils/auditLog.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum([
    'SUPER_ADMIN',
    'SCHOOL_ADMIN',
    'SUB_ADMIN',
    'TEACHER',
    'PARENT',
    'DRIVER',
  ]),
  schoolId: z.string().optional(),
  profile: z.object({
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string().optional(),
  }).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

/**
 * Create a user account.
 *
 * This is an administrative endpoint, never a public sign-up: the role and
 * schoolId come from the request body, so leaving it unauthenticated would let
 * anyone mint a SUPER_ADMIN in any tenant. The route requires an authenticated
 * admin, and a SCHOOL_ADMIN is further confined to non-super roles inside their
 * own school. The very first SUPER_ADMIN is created by `prisma db seed`.
 */
export const register = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = registerSchema.parse(req.body);
    const actor = req.user;

    if (!actor) {
      throw new AppError('Authentication required', 401);
    }

    const isSuperAdmin = actor.role === 'SUPER_ADMIN';

    if (!isSuperAdmin) {
      if (actor.role !== 'SCHOOL_ADMIN') {
        throw new AppError('Insufficient permissions', 403);
      }
      if (data.role === 'SUPER_ADMIN') {
        throw new AppError('Only a super admin can create super admin accounts', 403);
      }
      if (data.schoolId && data.schoolId !== actor.schoolId) {
        throw new AppError('Access denied to this school', 403);
      }
    }

    // A school admin always creates inside their own tenant; a super admin must
    // say which tenant, rather than silently creating an orphaned ('') user.
    const schoolId = isSuperAdmin ? data.schoolId : actor.schoolId;
    if (!schoolId && data.role !== 'SUPER_ADMIN') {
      throw new AppError('schoolId is required', 400);
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('User already exists', 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: data.role,
        schoolId: schoolId || '',
        // The admin chose this password, so the owner must set their own.
        mustChangePassword: true,
        profile: data.profile ? {
          create: data.profile,
        } : undefined,
      },
      include: {
        profile: true,
        school: true,
      },
    });

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
    });

    await recordAudit(req, {
      action: 'user.created',
      entity: 'User',
      entityId: user.id,
      summary: `Created ${user.role} account ${user.email}`,
      schoolId: user.schoolId || undefined,
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        profile: true,
        school: true,
        userTags: { include: { tag: true } },
      },
    });

    if (!user || !user.isActive) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isValid = await comparePassword(data.password, user.password);

    if (!isValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
    });

    const permissions = getUserPermissions(user);
    const tags = (user.userTags ?? []).map((ut) => ut.tag.slug);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        school: user.school,
        tags,
        permissions,
        mustChangePassword: user.mustChangePassword,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        school: true,
        teacher: true,
        parent: true,
        student: true,
        userTags: { include: { tag: true } },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const permissions = getUserPermissions(user);
    const tags = (user.userTags ?? []).map((ut) => ut.tag.slug);

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      profile: user.profile,
      school: user.school,
      teacher: user.teacher,
      parent: user.parent,
      student: user.student,
      tags,
      permissions,
      mustChangePassword: user.mustChangePassword,
    });
  } catch (error) {
    next(error);
  }
};


const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .max(128, 'New password is too long'),
});

/**
 * POST /api/auth/change-password — the signed-in user rotates their own password.
 *
 * Stamping `passwordChangedAt` invalidates every token issued before now (see
 * authenticate()), so a rotation after a suspected compromise actually ends the
 * attacker's session instead of leaving it valid for the rest of the 7 days.
 */
export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = changePasswordSchema.parse(req.body);
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isValid = await comparePassword(data.currentPassword, user.password);
    if (!isValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    if (data.currentPassword === data.newPassword) {
      throw new AppError('New password must be different from the current one', 400);
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: await hashPassword(data.newPassword),
        mustChangePassword: false,
        passwordChangedAt: new Date(),
      },
    });

    await recordAudit(req, {
      action: 'user.password_changed',
      entity: 'User',
      entityId: userId,
      summary: `${user.email} changed their own password`,
    });

    // The caller's current token is now invalid, so they need a fresh login.
    res.json({
      message: 'Password changed. Please sign in again with your new password.',
      reauthenticate: true,
    });
  } catch (error) {
    next(error);
  }
};
