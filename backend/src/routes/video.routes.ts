import { Router } from 'express';
import { getVideos } from '../controllers/video.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

export const videoRoutes = Router();

videoRoutes.use(authenticate);
videoRoutes.get('/', getVideos);

