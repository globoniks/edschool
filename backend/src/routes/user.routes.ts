import { Router } from 'express';
import { getUsers, getUserById, updateUserTags } from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

export const userRoutes = Router();

userRoutes.use(authenticate);

// Only SCHOOL_ADMIN and SUPER_ADMIN can list/read/update users and tags
userRoutes.get('/', authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'), getUsers);
userRoutes.get('/:id', authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'), getUserById);
userRoutes.patch('/:id/tags', authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'), updateUserTags);
