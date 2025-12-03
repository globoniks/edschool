# EdSchool - Multi-Tenant School Management System

A comprehensive, modern school management system built with Node.js, TypeScript, React, and PostgreSQL. Features multi-tenant architecture, role-based access control, and all essential school management features.

## Features

### Core Features

1. **Multi-tenant SaaS Architecture**
   - Support for multiple schools on one platform
   - Isolated data per school
   - Scalable infrastructure

2. **Role-based Access Control**
   - Admin: Full system access
   - Teacher: Class management, attendance, marks
   - Parent: Child monitoring, fee tracking
   - Student: View grades, homework, attendance

3. **Student Management**
   - Student registration and profiles
   - Admission number tracking
   - Class/section assignment
   - Parent-student linking
   - Transfer certificate generation ready
   - Student photo and details management

4. **Attendance Management**
   - Daily class-wise attendance marking
   - Student attendance tracking (Present/Absent/Late/Excused)
   - Teacher attendance tracking
   - Attendance reports and analytics
   - Monthly percentage calculations
   - Ready for SMS/WhatsApp notifications

5. **Fees Management**
   - Flexible fee structure creation
   - Multiple fee types (Tuition, Transport, Hostel, etc.)
   - Monthly/Quarterly/Yearly billing cycles
   - Discounts and scholarships
   - Payment tracking (Pending/Paid/Failed)
   - Online payment support ready (UPI/Net Banking)
   - Automatic receipt generation
   - Due date reminders

6. **Teachers & Staff Management**
   - Teacher profiles with qualifications
   - Employee ID tracking
   - Subject assignment
   - Salary management ready
   - Leave management system ready
   - Teacher attendance tracking

7. **Exams & Marks Management**
   - Exam schedule creation
   - Subject-wise marks entry
   - Grade calculation
   - Report card generation
   - Exam analytics and performance tracking
   - Passing marks configuration

8. **Timetable Management**
   - Class-wise timetable creation
   - Subject scheduling
   - Teacher assignment to classes
   - Day-wise and time-wise scheduling
   - Room allocation

9. **Homework & Assignments**
   - Homework creation by teachers
   - File attachments support
   - Student submission tracking
   - Evaluation and grading
   - Status tracking (Pending/Submitted/Evaluated/Overdue)
   - Due date management

10. **Parent Portal**
    - Real-time fee dues tracking
    - Child attendance monitoring
    - Marks and grades viewing
    - Homework assignments visibility
    - School announcements
    - Direct messaging with teachers

11. **Communication**
    - School-wide announcements
    - Targeted announcements (All/Parents/Teachers/Students)
    - Parent-Teacher messaging system
    - Class-specific announcements
    - File attachments in announcements

12. **Academic Management**
    - Class and section management
    - Subject management
    - Class-subject mapping
    - Teacher-subject assignment
    - Student-class assignment

## Tech Stack

### Backend
- Node.js with Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Zod for validation

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Query
- React Router
- Zustand for state management

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd edschool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Backend (`backend/.env`):
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/edschool?schema=public"
   JWT_SECRET="your-super-secret-jwt-key"
   JWT_EXPIRES_IN="7d"
   PORT=3001
   NODE_ENV=development
   ```

4. **Set up database**
   ```bash
   cd backend
   npx prisma generate
   npx prisma migrate dev
   ```

5. **Run the application**

   Development mode (runs both backend and frontend):
   ```bash
   npm run dev
   ```

   Or run separately:
   ```bash
   # Backend
   npm run dev:backend

   # Frontend (in another terminal)
   npm run dev:frontend
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Project Structure

```
edschool/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── routes/         # API routes
│   │   ├── middleware/    # Auth, error handling
│   │   ├── utils/          # Utilities
│   │   └── index.ts        # Entry point
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── store/          # State management
│   │   ├── lib/            # Utilities, API client
│   │   └── App.tsx         # Main app component
│   └── package.json
└── package.json           # Root package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get user profile

### Students
- `GET /api/students` - List students
- `POST /api/students` - Create student
- `GET /api/students/:id` - Get student details
- `PATCH /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Attendance
- `POST /api/attendance` - Mark attendance
- `POST /api/attendance/bulk` - Bulk mark attendance
- `GET /api/attendance` - Get attendance records
- `GET /api/attendance/stats` - Get attendance statistics

### Fees
- `GET /api/fees/structures` - List fee structures
- `POST /api/fees/structures` - Create fee structure
- `GET /api/fees/payments` - List payments
- `POST /api/fees/payments` - Create payment
- `GET /api/fees/dues/:studentId` - Get fee dues

### Exams
- `GET /api/exams` - List exams
- `POST /api/exams` - Create exam
- `POST /api/exams/marks` - Add exam marks
- `GET /api/exams/report-card/:studentId/:examId` - Get report card

And many more...

## Database Schema

The system uses Prisma ORM with PostgreSQL. Key models include:
- School (multi-tenant)
- User (authentication)
- Student, Teacher, Parent
- Class, Subject, ClassSubject
- Attendance, TeacherAttendance
- FeeStructure, FeePayment
- Exam, ExamMark
- Timetable
- Homework, HomeworkSubmission
- Announcement, Message

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Multi-tenant data isolation
- Input validation with Zod
- CORS and Helmet for security headers

## Future Enhancements

- SMS/WhatsApp integration
- Online payment gateway integration
- Mobile app (React Native)
- Advanced analytics and reporting
- Document management system
- Video conferencing integration
- Library management
- Transport management
- Hostel management

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.

