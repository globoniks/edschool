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
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const transportRoles = ['TRANSPORT_MANAGER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'];

export const transportRoutes = Router();

transportRoutes.use(authenticate);

// Buses
transportRoutes.get('/buses', authorize(...transportRoles), listBuses);
transportRoutes.post('/buses', authorize(...transportRoles), createBus);
transportRoutes.patch('/buses/:id', authorize(...transportRoles), updateBus);
transportRoutes.delete('/buses/:id', authorize(...transportRoles), deleteBus);

// Routes
transportRoutes.get('/routes', authorize(...transportRoles), listRoutes);
transportRoutes.post('/routes', authorize(...transportRoles), createRoute);
transportRoutes.patch('/routes/:id', authorize(...transportRoles), updateRoute);
transportRoutes.delete('/routes/:id', authorize(...transportRoles), deleteRoute);

// Student transport assignments
transportRoutes.get('/assignments', authorize(...transportRoles), listAssignments);
transportRoutes.post('/assignments', authorize(...transportRoles), createAssignment);
transportRoutes.patch('/assignments/:id', authorize(...transportRoles), updateAssignment);
transportRoutes.delete('/assignments/:id', authorize(...transportRoles), deleteAssignment);
