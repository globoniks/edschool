import { Router } from 'express';
import { listLeave, createLeave, updateLeaveStatus } from '../controllers/leave.controller.js';
import { authenticate, authorizeByPermission, allowTeacherOrPermission } from '../middleware/auth.middleware.js';

export const leaveRoutes = Router();

leaveRoutes.use(authenticate);

leaveRoutes.get('/', allowTeacherOrPermission('manageHR'), listLeave);
leaveRoutes.post('/', allowTeacherOrPermission('manageHR'), createLeave);
leaveRoutes.patch('/:id', authorizeByPermission('manageHR'), updateLeaveStatus);
