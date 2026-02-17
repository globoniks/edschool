import { Router } from 'express';
import {
  createAnnouncement,
  getAnnouncements,
  getAnnouncement,
} from '../controllers/announcement.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

export const announcementRoutes = Router();

announcementRoutes.use(authenticate);

// SCHOOL_ADMIN and TEACHER can create announcements
announcementRoutes.post('/', authorize('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), createAnnouncement);
announcementRoutes.get('/', getAnnouncements);
announcementRoutes.get('/:id', getAnnouncement);

