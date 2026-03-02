import { Router } from 'express';
import {
  createTimetable,
  getTimetables,
  updateTimetable,
  deleteTimetable,
} from '../controllers/timetable.controller.js';
import { authenticate, authorizeByPermission } from '../middleware/auth.middleware.js';

export const timetableRoutes = Router();

timetableRoutes.use(authenticate);

timetableRoutes.post('/', authorizeByPermission('manageAcademic'), createTimetable);
timetableRoutes.get('/', getTimetables);
timetableRoutes.patch('/:id', authorizeByPermission('manageAcademic'), updateTimetable);
timetableRoutes.delete('/:id', authorizeByPermission('manageAcademic'), deleteTimetable);

