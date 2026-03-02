import { Router } from 'express';
import { listTags, createTag, updateTag, deleteTag } from '../controllers/tag.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

export const tagRoutes = Router();

tagRoutes.use(authenticate);
tagRoutes.get('/', authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'), listTags);
tagRoutes.post('/', authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'), createTag);
tagRoutes.patch('/:id', authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'), updateTag);
tagRoutes.delete('/:id', authorize('SUPER_ADMIN', 'SCHOOL_ADMIN'), deleteTag);
