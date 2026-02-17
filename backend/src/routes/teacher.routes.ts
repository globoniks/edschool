import { Router } from 'express';
import {
  createTeacher,
  getTeachers,
  getTeacher,
  updateTeacher,
  deleteTeacher,
  getTeacherDashboard,
} from '../controllers/teacher.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

export const teacherRoutes = Router();

teacherRoutes.use(authenticate);

// Only SCHOOL_ADMIN and HR_ADMIN can manage teachers
teacherRoutes.post('/', authorize('SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR_ADMIN'), createTeacher);
teacherRoutes.get('/', getTeachers);
teacherRoutes.get('/dashboard', getTeacherDashboard);
teacherRoutes.get('/:id', getTeacher);
teacherRoutes.patch('/:id', authorize('SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR_ADMIN'), updateTeacher);
teacherRoutes.delete('/:id', authorize('SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR_ADMIN'), deleteTeacher);

