import { Router } from 'express';
import {
  createHoliday,
  getHolidays,
  updateHoliday,
  deleteHoliday,
} from '../controllers/holiday.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

export const holidayRoutes = Router();

holidayRoutes.use(authenticate);

// Admin-only write access
holidayRoutes.post('/', authorize('ADMIN'), createHoliday);
holidayRoutes.patch('/:id', authorize('ADMIN'), updateHoliday);
holidayRoutes.delete('/:id', authorize('ADMIN'), deleteHoliday);

// All authenticated roles can read holidays for their school
holidayRoutes.get('/', getHolidays);



