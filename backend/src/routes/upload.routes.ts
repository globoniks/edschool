import { Router } from 'express';
import { uploadFile, uploadMultiple, deleteFile, upload } from '../controllers/upload.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

export const uploadRoutes = Router();

uploadRoutes.post('/single', authenticate, upload.single('file'), uploadFile);
uploadRoutes.post('/multiple', authenticate, upload.array('files', 10), uploadMultiple);
uploadRoutes.delete('/:filename', authenticate, deleteFile);





