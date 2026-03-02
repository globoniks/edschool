import { Router } from 'express';
import {
  listCurricula,
  getCurriculaByClass,
  getCurriculum,
  createCurriculum,
  updateCurriculum,
  deleteCurriculum,
  createChapter,
  updateChapter,
  deleteChapter,
  reorderChapters,
} from '../controllers/curriculum.controller.js';
import { authenticate, authorizeByPermission } from '../middleware/auth.middleware.js';

export const curriculumRoutes = Router();

curriculumRoutes.use(authenticate);

curriculumRoutes.get('/', authorizeByPermission('manageAcademic'), listCurricula);
curriculumRoutes.get('/class/:classId', authorizeByPermission('manageAcademic'), getCurriculaByClass);
curriculumRoutes.get('/:id', authorizeByPermission('manageAcademic'), getCurriculum);
curriculumRoutes.post('/', authorizeByPermission('manageAcademic'), createCurriculum);
curriculumRoutes.patch('/:id', authorizeByPermission('manageAcademic'), updateCurriculum);
curriculumRoutes.delete('/:id', authorizeByPermission('manageAcademic'), deleteCurriculum);

curriculumRoutes.post('/chapters', authorizeByPermission('manageAcademic'), createChapter);
curriculumRoutes.post('/chapters/reorder', authorizeByPermission('manageAcademic'), reorderChapters);
curriculumRoutes.patch('/chapters/:id', authorizeByPermission('manageAcademic'), updateChapter);
curriculumRoutes.delete('/chapters/:id', authorizeByPermission('manageAcademic'), deleteChapter);
