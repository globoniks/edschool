import { Router } from 'express';
import {
  listBuses,
  createBus,
  updateBus,
  deleteBus,
  listRoutes,
  createRoute,
  updateRoute,
  deleteRoute,
  listAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from '../controllers/transport.controller.js';
import { authenticate, authorizePermissions } from '../middleware/auth.middleware.js';

export const transportRoutes = Router();

transportRoutes.use(authenticate);

// STEP 6: Transport routes require manageTransport permission
transportRoutes.get('/buses', authorizePermissions('manageTransport'), listBuses);
transportRoutes.post('/buses', authorizePermissions('manageTransport'), createBus);
transportRoutes.patch('/buses/:id', authorizePermissions('manageTransport'), updateBus);
transportRoutes.delete('/buses/:id', authorizePermissions('manageTransport'), deleteBus);

transportRoutes.get('/routes', authorizePermissions('manageTransport'), listRoutes);
transportRoutes.post('/routes', authorizePermissions('manageTransport'), createRoute);
transportRoutes.patch('/routes/:id', authorizePermissions('manageTransport'), updateRoute);
transportRoutes.delete('/routes/:id', authorizePermissions('manageTransport'), deleteRoute);

transportRoutes.get('/assignments', authorizePermissions('manageTransport'), listAssignments);
transportRoutes.post('/assignments', authorizePermissions('manageTransport'), createAssignment);
transportRoutes.patch('/assignments/:id', authorizePermissions('manageTransport'), updateAssignment);
transportRoutes.delete('/assignments/:id', authorizePermissions('manageTransport'), deleteAssignment);
