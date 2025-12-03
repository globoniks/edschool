import { Router } from 'express';
import {
  createSchool,
  getSchools,
  getSchool,
  updateSchool,
} from '../controllers/school.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

export const schoolRoutes = Router();

schoolRoutes.post('/', authenticate, authorize('ADMIN'), createSchool);
schoolRoutes.get('/', authenticate, getSchools);
schoolRoutes.get('/:id', authenticate, getSchool);
schoolRoutes.patch('/:id', authenticate, authorize('ADMIN'), updateSchool);

