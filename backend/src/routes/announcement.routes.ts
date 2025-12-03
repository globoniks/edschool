import { Router } from 'express';
import {
  createAnnouncement,
  getAnnouncements,
  getAnnouncement,
} from '../controllers/announcement.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

export const announcementRoutes = Router();

announcementRoutes.use(authenticate);

announcementRoutes.post('/', authorize('ADMIN', 'TEACHER'), createAnnouncement);
announcementRoutes.get('/', getAnnouncements);
announcementRoutes.get('/:id', getAnnouncement);

