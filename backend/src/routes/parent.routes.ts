import { Router } from 'express';
import {
  createParent,
  getParent,
  linkStudentToParent,
} from '../controllers/parent.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

export const parentRoutes = Router();

parentRoutes.post('/', createParent);
parentRoutes.get('/profile', authenticate, getParent);
parentRoutes.post('/link-student', authenticate, authorize('ADMIN', 'TEACHER'), linkStudentToParent);

