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

studentRoutes.post('/', authorize('ADMIN', 'TEACHER'), createStudent);
studentRoutes.get('/', getStudents);
studentRoutes.get('/:id', getStudent);
studentRoutes.patch('/:id', authorize('ADMIN', 'TEACHER'), updateStudent);
studentRoutes.delete('/:id', authorize('ADMIN'), deleteStudent);

