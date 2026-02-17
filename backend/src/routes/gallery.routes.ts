import { Router } from 'express';
import { getEvents, getEventPhotos } from '../controllers/gallery.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

export const galleryRoutes = Router();

galleryRoutes.use(authenticate);
galleryRoutes.get('/events', getEvents);
galleryRoutes.get('/events/:eventId/photos', getEventPhotos);

