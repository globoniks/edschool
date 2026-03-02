import { Router } from 'express';
import {
  createParent,
  getParent,
  linkStudentToParent,
  getParentDashboard,
  getParentHomework,
} from '../controllers/parent.controller.js';
import { authenticate, authorizeByPermission, requireParentWithChildren } from '../middleware/auth.middleware.js';

export const parentRoutes = Router();

parentRoutes.post('/', createParent);
parentRoutes.get('/profile', authenticate, requireParentWithChildren, getParent);
parentRoutes.get('/dashboard', authenticate, requireParentWithChildren, getParentDashboard);
parentRoutes.get('/homework', authenticate, requireParentWithChildren, getParentHomework);
parentRoutes.post('/link-student', authenticate, authorizeByPermission('manageHR'), linkStudentToParent);

