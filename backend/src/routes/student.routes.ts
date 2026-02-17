import { Router } from 'express';
import {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
} from '../controllers/student.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

export const studentRoutes = Router();

studentRoutes.use(authenticate);

// Only SCHOOL_ADMIN and HR_ADMIN can create/edit students
studentRoutes.post('/', authorize('SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR_ADMIN'), createStudent);
studentRoutes.get('/', getStudents);
studentRoutes.get('/:id', getStudent);
studentRoutes.patch('/:id', authorize('SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR_ADMIN'), updateStudent);
studentRoutes.delete('/:id', authorize('SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR_ADMIN'), deleteStudent);

