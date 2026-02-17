import { Router } from 'express';
import {
  createHomework,
  getHomeworks,
  getHomeworkSubmissions,
  submitHomework,
  evaluateHomework,
} from '../controllers/homework.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

export const homeworkRoutes = Router();

homeworkRoutes.use(authenticate);

// Only TEACHER can create homework (not ADMIN)
homeworkRoutes.post('/', authorize('TEACHER'), createHomework);
homeworkRoutes.get('/', getHomeworks);
homeworkRoutes.get('/:id/submissions', authorize('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN', 'HOD', 'TEACHER'), getHomeworkSubmissions);
homeworkRoutes.post('/:id/submit', authorize('STUDENT'), submitHomework);
homeworkRoutes.patch('/submissions/:id', authorize('TEACHER'), evaluateHomework);

