import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler.js';
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
import { parentRoutes } from './routes/parent.routes.js';
import { holidayRoutes } from './routes/holiday.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - flexible for IP-based or domain-based access
const corsOptions = {
  origin: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : process.env.NODE_ENV === 'production' 
      ? true // Allow all origins in production if not specified (for IP-based access)
      : '*', // Allow all in development
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Adjust if needed for your setup
}));
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
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
app.use('/api/parents', parentRoutes);
app.use('/api/holidays', holidayRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

