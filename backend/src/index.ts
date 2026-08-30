import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { initSocketServer } from './socket/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { validateEnv } from './utils/validateEnv.js';
import { authRoutes } from './routes/auth.routes.js';
import { schoolRoutes } from './routes/school.routes.js';
import { studentRoutes } from './routes/student.routes.js';
import { teacherRoutes } from './routes/teacher.routes.js';
import { attendanceRoutes } from './routes/attendance.routes.js';
import { feeRoutes } from './routes/fee.routes.js';
import { examRoutes } from './routes/exam.routes.js';
import { timetableRoutes } from './routes/timetable.routes.js';
import { homeworkRoutes } from './routes/homework.routes.js';
import { announcementRoutes } from './routes/announcement.routes.js';
import { messageRoutes } from './routes/message.routes.js';
import { academicRoutes } from './routes/academic.routes.js';
import { curriculumRoutes } from './routes/curriculum.routes.js';
import { leaveRoutes } from './routes/leave.routes.js';
import { parentRoutes } from './routes/parent.routes.js';
import { holidayRoutes } from './routes/holiday.routes.js';
import { uploadRoutes } from './routes/upload.routes.js';
import { exportRoutes } from './routes/export.routes.js';
import { syllabusRoutes } from './routes/syllabus.routes.js';
import { busRoutes } from './routes/bus.routes.js';
import { transportRoutes } from './routes/transport.routes.js';
import { videoRoutes } from './routes/video.routes.js';
import { galleryRoutes } from './routes/gallery.routes.js';
import { downloadRoutes } from './routes/download.routes.js';
import { alertRoutes } from './routes/alert.routes.js';
import { classMomentRoutes } from './routes/classMoment.routes.js';
import { pushRoutes } from './routes/push.routes.js';
import { tagRoutes } from './routes/tag.routes.js';
import { userRoutes } from './routes/user.routes.js';
import { auditRoutes } from './routes/audit.routes.js';
import { tripRoutes } from './routes/trip.routes.js';
import driverRoutes from './routes/driver.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Before anything binds a port: refuse to run in production with a
// placeholder JWT secret or a missing database URL.
validateEnv();

const app = express();
const httpServer = createServer(app);
const PORT = parseInt(process.env.PORT || '3001', 10);

// CORS configuration - flexible for IP-based or domain-based access.
// Credentials are only enabled for an explicit allowlist: reflecting an arbitrary
// origin back with `Access-Control-Allow-Credentials: true` would let any site
// drive the API using a logged-in browser's ambient credentials.
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : null;

if (!allowedOrigins && process.env.NODE_ENV === 'production') {
  console.warn(
    '[cors] CORS_ORIGIN is not set — accepting every origin without credentials. ' +
    'Set CORS_ORIGIN to your frontend URL(s) in production.'
  );
}

const corsOptions = {
  origin: allowedOrigins ?? '*',
  credentials: Boolean(allowedOrigins),
  optionsSuccessStatus: 200
};

// Behind nginx/a load balancer, so req.ip reflects the real client rather than
// the proxy — without this every request shares one IP and rate limiting is useless.
app.set('trust proxy', 1);

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Adjust if needed for your setup
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiting. Auth endpoints get a much tighter budget because they are the
// ones worth brute-forcing; successful logins don't count against it.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down and try again shortly.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
});

// Serve uploaded files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/timetables', timetableRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/syllabus', syllabusRoutes);
app.use('/api/bus', busRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/downloads', downloadRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/class-moments', classMomentRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/drivers', driverRoutes);

// 404 handler — must be registered before the error handler so unmatched
// routes fall through to it rather than past it.
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling
app.use(errorHandler);

initSocketServer(httpServer);

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

