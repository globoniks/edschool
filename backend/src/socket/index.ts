import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { setupBusTracking } from './busTracking.js';

export interface SocketUser {
  id: string;
  email: string;
  role: string;
  schoolId: string;
}

export interface AuthSocket extends Socket {
  user?: SocketUser;
}

let io: Server | null = null;

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

export function initSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
        : '*',
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.use((socket: AuthSocket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as SocketUser;
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  setupBusTracking(io);

  io.on('connection', (socket: AuthSocket) => {
    const user = socket.user!;
    socket.join(`school:${user.schoolId}`);

    socket.on('disconnect', () => {
      // cleanup handled in busTracking module
    });
  });

  console.log('Socket.io server initialized');
  return io;
}
