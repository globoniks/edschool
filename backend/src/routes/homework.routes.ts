import { Router } from 'express';
import {
  createHomework,
  getHomeworks,
  getHomeworkSubmissions,
  submitHomework,
  evaluateHomework,
} from '../controllers/homework.controller.js';
import { authenticate, authorize, allowTeacherOrPermission } from '../middleware/auth.middleware.js';

export const homeworkRoutes = Router();

homeworkRoutes.use(authenticate);

homeworkRoutes.post('/', authorize('TEACHER'), createHomework);
homeworkRoutes.get('/', getHomeworks);
homeworkRoutes.get('/:id/submissions', allowTeacherOrPermission('hodViewSubmissions', 'manageAcademic'), getHomeworkSubmissions);
homeworkRoutes.patch('/submissions/:id', authorize('TEACHER'), evaluateHomework);

