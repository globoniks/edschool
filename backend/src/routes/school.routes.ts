import { Router } from 'express';
import {
  createSchool,
  getSchools,
  getSchool,
  updateSchool,
} from '../controllers/school.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

export const schoolRoutes = Router();

// Only SUPER_ADMIN can create schools
schoolRoutes.post('/', authenticate, authorize('SUPER_ADMIN'), createSchool);
schoolRoutes.get('/', authenticate, getSchools);
schoolRoutes.get('/:id', authenticate, getSchool);
// SUPER_ADMIN and SCHOOL_ADMIN can update their school
schoolRoutes.patch('/:id', authenticate, authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'), updateSchool);

