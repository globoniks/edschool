import { Router } from 'express';
import {
  createTeacher,
  getTeachers,
  getTeacher,
  updateTeacher,
} from '../controllers/teacher.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

export const teacherRoutes = Router();

teacherRoutes.use(authenticate);

teacherRoutes.post('/', authorize('ADMIN'), createTeacher);
teacherRoutes.get('/', getTeachers);
teacherRoutes.get('/:id', getTeacher);
teacherRoutes.patch('/:id', authorize('ADMIN'), updateTeacher);

