import { Router } from 'express';
import {
  createTimetable,
  getTimetables,
  updateTimetable,
  deleteTimetable,
} from '../controllers/timetable.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

export const timetableRoutes = Router();

timetableRoutes.use(authenticate);

timetableRoutes.post('/', authorize('ADMIN', 'TEACHER'), createTimetable);
timetableRoutes.get('/', getTimetables);
timetableRoutes.patch('/:id', authorize('ADMIN', 'TEACHER'), updateTimetable);
timetableRoutes.delete('/:id', authorize('ADMIN', 'TEACHER'), deleteTimetable);

