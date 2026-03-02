import { Router } from 'express';
import {
  createTeacher,
  getTeachers,
  getTeacher,
  updateTeacher,
  deleteTeacher,
  getTeacherDashboard,
} from '../controllers/teacher.controller.js';
import { authenticate, authorizeByPermission } from '../middleware/auth.middleware.js';

export const teacherRoutes = Router();

teacherRoutes.use(authenticate);

teacherRoutes.post('/', authorizeByPermission('manageHR'), createTeacher);
teacherRoutes.get('/', getTeachers);
teacherRoutes.get('/dashboard', getTeacherDashboard);
teacherRoutes.get('/:id', getTeacher);
teacherRoutes.patch('/:id', authorizeByPermission('manageHR'), updateTeacher);
teacherRoutes.delete('/:id', authorizeByPermission('manageHR'), deleteTeacher);

