import { Router } from 'express';
import {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  bulkCreateStudents,
  bulkAssignClass,
  importStudentsCSV,
} from '../controllers/student.controller.js';
import { authenticate, authorizeByPermission } from '../middleware/auth.middleware.js';

export const studentRoutes = Router();

studentRoutes.use(authenticate);

studentRoutes.post('/', authorizeByPermission('manageHR'), createStudent);
studentRoutes.post('/bulk', authorizeByPermission('manageHR'), bulkCreateStudents);
studentRoutes.post('/import', authorizeByPermission('manageHR'), importStudentsCSV);
studentRoutes.patch('/bulk-class', authorizeByPermission('manageHR'), bulkAssignClass);
studentRoutes.get('/', getStudents);
studentRoutes.get('/:id', getStudent);
studentRoutes.patch('/:id', authorizeByPermission('manageHR'), updateStudent);
studentRoutes.delete('/:id', authorizeByPermission('manageHR'), deleteStudent);

