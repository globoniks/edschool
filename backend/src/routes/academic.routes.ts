import { Router } from 'express';
import {
  createClass,
  getClasses,
  createSubject,
  getSubjects,
  assignClassSubject,
  getClassSubjects,
} from '../controllers/academic.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

export const academicRoutes = Router();

academicRoutes.use(authenticate);

academicRoutes.post('/classes', authorize('ADMIN'), createClass);
academicRoutes.get('/classes', getClasses);
academicRoutes.post('/subjects', authorize('ADMIN'), createSubject);
academicRoutes.get('/subjects', getSubjects);
academicRoutes.post('/class-subjects', authorize('ADMIN', 'TEACHER'), assignClassSubject);
academicRoutes.get('/classes/:classId/subjects', getClassSubjects);

