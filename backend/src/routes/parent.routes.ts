import { Router } from 'express';
import {
  createParent,
  getParent,
  linkStudentToParent,
  getParentDashboard,
  getParentHomework,
} from '../controllers/parent.controller.js';
import { authenticate, authorize, requireParentWithChildren } from '../middleware/auth.middleware.js';

export const parentRoutes = Router();

parentRoutes.post('/', createParent);
parentRoutes.get('/profile', authenticate, requireParentWithChildren, getParent);
parentRoutes.get('/dashboard', authenticate, requireParentWithChildren, getParentDashboard);
parentRoutes.get('/homework', authenticate, requireParentWithChildren, getParentHomework);
// Only SCHOOL_ADMIN and HR_ADMIN can link students to parents
parentRoutes.post('/link-student', authenticate, authorize('SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR_ADMIN'), linkStudentToParent);

