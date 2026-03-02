# EdSchool – School Management System – Overview for Schools

Multi-tenant school management with admin dashboard, teacher tools, parent portal, fees, attendance, exams, homework, transport, and communication – all in one platform.

---

## Executive Summary

- One platform for administration, academics, fees, transport, and parent engagement.
- Role-based access: Super Admin, School Admin, Academic/Finance/HR/Transport roles, Teachers, Parents, Students.
- Parent portal: single place for fees, attendance, homework, exams, timetable, messages, alerts.
- Mobile-friendly web app (PWA-ready); works on phones and tablets.
- Deploy on your own server (VPS) or use hosted deployment; PostgreSQL + Node.js stack.

---

## Who Uses EdSchool (Roles)

| Role | Purpose |
|------|--------|
| Super Admin | Multi-school / platform oversight |
| School Admin | Full school-level access |
| Academic Admin | Classes, subjects, timetable, exams, homework |
| Finance Admin | Fee structures, payments, receipts |
| HR Admin | Students, teachers, staff |
| Transport Manager | Buses, routes, student transport assignments |
| Teacher | Attendance, homework, exam marks, messages |
| Parent | Parent portal (fees, attendance, homework, exams, timetable, messages, alerts) |
| Student | View own attendance, homework, grades, timetable |

- **Super Admin** and **School Admin** have full access (school-level for School Admin; platform-level for Super Admin).
- **Academic, Finance, HR, Transport** roles have access to their respective areas; School Admin can create and manage these users.
- **Teachers** manage classes, mark attendance, create homework, enter exam marks, and communicate with parents.
- **Parents** use the parent portal only; **Students** log in to view their own attendance, homework, grades, and timetable.

---

## Feature Bullets by Module

### Student Management

- Student registration and profiles; admission numbers; class/section assignment; parent–student linking; photo and details.
- Transfer certificate generation ready.

### Attendance

- Daily class-wise attendance (Present/Absent/Late/Excused); teacher attendance; monthly stats and reports; ready for SMS/WhatsApp integration.

### Fees

- Fee structures; multiple types (Tuition, Transport, Hostel, etc.); monthly/quarterly/yearly cycles; discounts and scholarships; payment status and receipts; due reminders; online payment support ready.

### Teachers and Staff (HR)

- Teacher profiles, qualifications, employee ID; subject assignment; salary and leave ready; teacher attendance.

### Exams and Marks

- Exam schedules; subject-wise marks; grades and report cards; analytics; passing-marks configuration.

### Timetable

- Class-wise timetable; subject and teacher assignment; day and time slots; room allocation.

### Homework

- Create by teacher; attachments; submission tracking; evaluation and grading; status (Pending/Submitted/Evaluated/Overdue); due dates.

### Transport

- Buses, routes, student assignments (who travels on which bus/route); Transport Manager role; parent bus view in the portal.

### Holidays and Calendar

- Holiday and event dates; types (Holiday/Exam/Other); visibility to parents and timetable.

### Communication

- School and class announcements; parent–teacher messaging; attachments; in-app alerts (bell icon) for parents.

### Parent Portal (Detail)

- Multi-child dashboard; attendance tracking; fee dues and history; academic performance and report cards; homework view; timetable; messages; alerts; student info; print/export.
- “Pay Fees” may show “Contact school for payment” when online payment is not configured.

### Reports and Export

- Export students, teachers, attendance, fee payments (CSV/Excel); report cards; role-based filtering (admin/teacher/parent). Print attendance, receipts, report cards.

### PWA / Mobile

- Responsive UI; installable PWA (optional). See PWA_QUICKSTART.md for “install on phone”.

---

## Technical Necessities and Deployment Options

- **Server:** VPS (e.g. Hostinger) or any Linux server with Node.js 18+, PostgreSQL 14+, Nginx (optional but recommended).
- **Ports:** Backend (e.g. 3001), Nginx 80/443; no conflict with existing app (e.g. edumapping on 5000).
- **Database:** PostgreSQL; create DB and user; run Prisma migrations and seed (seed creates first admin/parent/transport users).
- **Environment:** Backend: `DATABASE_URL`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN`. Frontend: `VITE_API_URL` if API is on another host.
- **Post-deploy:** Build backend and frontend; run backend with PM2; serve frontend via Nginx (subdirectory e.g. `/edschool` and `/edschool/api`); SSL recommended for production.
- **Necessities in short:** Server, PostgreSQL, domain (optional), SSL (recommended), initial admin credentials (from seed or custom).

See **DEPLOYMENT.md** for step-by-step server setup.

---

## What the School Needs to Provide

- **Data:** List of classes, sections, subjects; student and teacher data (or plan for bulk import); fee structure; academic year.
- **Decisions:** Who gets which role (School Admin, Academic, Finance, HR, Transport Manager); whether online payment will be enabled (affects parent “Pay Fees” messaging).
- **Access:** If self-hosted: server and DB access for deployment; if hosted by you: agreement on who manages backups and updates.
- **Optional:** School logo, branding; domain and SSL for production URL.

---

## Security and Compliance

- JWT authentication; password hashing (bcrypt); role-based access; multi-tenant data isolation; input validation (Zod); CORS and security headers (Helmet). When self-hosted, data is stored in the school’s own database.

---

## Go-Live Checklist

- Database created and migrated; seed run (or custom first users).
- Backend and frontend built and deployed; health check OK.
- First login (e.g. schooladmin@school.com) and password change.
- Roles created for Academic, Finance, HR, Transport as needed.
- Parent credentials shared (or parent signup flow if enabled).
- Brief note on support/contact (placeholder if needed).

---

## Next Steps

We can schedule a demo, set up a trial instance, or prepare a custom deployment plan. Contact [your contact details].
