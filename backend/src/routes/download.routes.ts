import { Router } from 'express';
import { getDownloads } from '../controllers/download.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

export const downloadRoutes = Router();

downloadRoutes.use(authenticate);
downloadRoutes.get('/', getDownloads);

