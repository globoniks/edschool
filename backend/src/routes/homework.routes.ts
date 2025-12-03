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

homeworkRoutes.post('/', authorize('ADMIN', 'TEACHER'), createHomework);
homeworkRoutes.get('/', getHomeworks);
homeworkRoutes.get('/:id/submissions', authorize('ADMIN', 'TEACHER'), getHomeworkSubmissions);
homeworkRoutes.post('/:id/submit', authorize('STUDENT'), submitHomework);
homeworkRoutes.patch('/submissions/:id', authorize('ADMIN', 'TEACHER'), evaluateHomework);

