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

// Only ACADEMIC_ADMIN and SCHOOL_ADMIN can manage academic setup
academicRoutes.post('/classes', authorize('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN'), createClass);
academicRoutes.get('/classes', getClasses);
academicRoutes.post('/subjects', authorize('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN'), createSubject);
academicRoutes.get('/subjects', getSubjects);
academicRoutes.post('/class-subjects', authorize('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACADEMIC_ADMIN'), assignClassSubject);
academicRoutes.get('/classes/:classId/subjects', getClassSubjects);

