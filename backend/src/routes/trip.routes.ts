import { Router } from 'express';
import {
  startTrip,
  endTrip,
  getActiveTrip,
  getDriverBuses,
  getTripHistory,
  getLiveBusLocation,
  getAllLiveBuses,
  getStudentsOnBus,
  addBusStops,
  getRouteStops,
  assignDriverToBus,
  getETA,
} from '../controllers/trip.controller.js';
import {
  authenticate,
  authorize,
  authorizePermissions,
} from '../middleware/auth.middleware.js';

export const tripRoutes = Router();

tripRoutes.use(authenticate);

// Driver endpoints
tripRoutes.post('/start', authorize('DRIVER'), startTrip);
tripRoutes.patch('/:id/end', authorize('DRIVER'), endTrip);
tripRoutes.get('/active', authorize('DRIVER'), getActiveTrip);
tripRoutes.get('/my-buses', authorize('DRIVER'), getDriverBuses);
tripRoutes.get('/history', authorize('DRIVER'), getTripHistory);

// Admin endpoints: live tracking
tripRoutes.get('/live', authorizePermissions('manageTransport', 'viewBusTracking'), getAllLiveBuses);
tripRoutes.get('/live/:busId', getLiveBusLocation);
tripRoutes.get('/students/:busId', authorizePermissions('manageTransport'), getStudentsOnBus);
tripRoutes.get('/eta/:busId', getETA);

// Admin endpoints: stops and driver assignment
tripRoutes.put('/routes/:routeId/stops', authorizePermissions('manageTransport'), addBusStops);
tripRoutes.get('/routes/:routeId/stops', getRouteStops);
tripRoutes.patch('/buses/:busId/driver', authorizePermissions('manageTransport'), assignDriverToBus);
