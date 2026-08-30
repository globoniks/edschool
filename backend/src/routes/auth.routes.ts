import { Router } from 'express';
import { register, login, getProfile, changePassword } from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

export const authRoutes = Router();

// Admin-only account creation — not a public sign-up. See register() for why.
authRoutes.post('/register', authenticate, authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'), register);
authRoutes.post('/login', login);
authRoutes.get('/profile', authenticate, getProfile);
authRoutes.post('/change-password', authenticate, changePassword);

