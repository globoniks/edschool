import { Router } from 'express';
import {
  createClass,
  getClasses,
  getClassFull,
  updateClass,
  createSubject,
  getSubjects,
  assignClassSubject,
  getClassSubjects,
  removeClassSubject,
} from '../controllers/academic.controller.js';
import { authenticate, authorizeByPermission } from '../middleware/auth.middleware.js';

export const academicRoutes = Router();

academicRoutes.use(authenticate);

academicRoutes.post('/classes', authorizeByPermission('manageAcademic'), createClass);
academicRoutes.get('/classes', getClasses);
academicRoutes.get('/classes/:classId/full', getClassFull);
academicRoutes.patch('/classes/:id', authorizeByPermission('manageAcademic'), updateClass);
academicRoutes.post('/subjects', authorizeByPermission('manageAcademic'), createSubject);
academicRoutes.get('/subjects', getSubjects);
academicRoutes.post('/class-subjects', authorizeByPermission('manageAcademic'), assignClassSubject);
academicRoutes.delete('/class-subjects', authorizeByPermission('manageAcademic'), removeClassSubject);
academicRoutes.get('/classes/:classId/subjects', getClassSubjects);

