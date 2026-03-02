# EdSchool — Features & User Flows  
**Document for School Administration**

This document outlines platform **features** and **user flows** for school leadership and administration. Use it for presentations, stakeholder meetings, or as a handout.

---

## 1. At a Glance

| | |
|---|---|
| **What** | Single platform for school administration, academics, fees, attendance, transport, and parent engagement |
| **Who** | School Admin, Academic/Finance/HR/Transport staff, Teachers, Parents |
| **How** | Role-based web app; mobile-friendly; one login per user |
| **Where** | Your server (VPS) or hosted; data stays with the school |

---

## 2. Features Overview

### 2.1 By Module

| Module | Key features | Who uses it |
|--------|--------------|-------------|
| **Dashboard** | Overview of students, attendance, fees; quick links | Admin, Staff |
| **Academic setup** | Classes, sections, subjects, class–subject–teacher mapping | School Admin, Academic |
| **Students** | Registration, admission numbers, class/section, parent linking, photos | HR, Admin |
| **Teachers** | Profiles, employee ID, qualifications, subject assignment | HR, Admin |
| **Attendance** | Daily student & teacher attendance; status (P/A/L/E); reports & stats | Teachers, HR, Academic |
| **Leave** | Teacher leave application; HR/Admin approve or reject | Teachers (apply), HR/Admin (approve) |
| **Fees** | Fee structures, payments, receipts, dues, discounts/scholarships | Finance, Admin |
| **Exams** | Exam schedules, marks entry, report cards, passing marks | Academic, Teachers |
| **Timetable** | Class-wise timetable; subjects, teachers, time, room | Academic |
| **Homework** | Create assignments, track submissions, evaluate & grade | Teachers, Academic |
| **Announcements** | School-wide or targeted (All / Parents / Teachers / Students) | Admin, Teachers |
| **Class photos** | Teachers share photos with a class; parents see in portal | Teachers, Parents |
| **Transport** | Buses, routes, student assignment (bus/parent pickup) | Transport Manager, Admin |
| **Holidays** | Holiday & event calendar | Admin |
| **Messages** | In-app messaging (admin, teachers, parents) | All |
| **Users & permissions** | Create users, assign roles and tags (Academic, Finance, HR, Transport) | School Admin only |
| **Parent portal** | Single place for parents: fees, attendance, homework, timetable, messages, alerts | Parents |

### 2.2 By Role (What each role can do)

- **Super Admin** — Multi-school oversight; full access.
- **School Admin** — Full school access: setup, all modules, users, holidays.
- **Academic** — Classes, subjects, timetable, exams, homework visibility.
- **Finance** — Fee structures, payments, receipts, dues.
- **HR** — Students, teachers, attendance, leave approval.
- **Transport** — Buses, routes, student transport.
- **Teacher** — Dashboard, mark attendance, create/evaluate homework, enter marks, apply for leave, share class photos, messages.
- **Parent** — Portal only: view fees, attendance, homework, timetable, messages, alerts; no access to admin/teacher areas.

### 2.3 Benefits for the School

- **Single system** for academics, fees, HR, and transport — fewer tools to maintain.
- **Role-based access** — staff see only what they need; clear accountability.
- **Parent engagement** — one portal for dues, attendance, homework, and messages; fewer “where is my child’s information?” calls.
- **Audit trail** — attendance, payments, and leave in one place; easier reporting.
- **Mobile-friendly** — teachers and parents can use phones/tablets.
- **Your data** — when self-hosted, data stays on your server.

---

## 3. User Flows

### 3.1 School Admin — Initial setup (go-live)

```
1. First login (credentials from deployment/seed)
   ↓
2. Users & permissions
   → Create users for Academic, Finance, HR, Transport (assign tags)
   → Create teacher and parent accounts (or plan for bulk import)
   ↓
3. Academic setup
   → Create classes & sections (e.g. Class 1A, 1B)
   → Create subjects
   → Map class–subject–teacher
   ↓
4. Optional: Timetable
   → Build class-wise timetable (subject, teacher, time, room)
   ↓
5. Optional: Fee structures (Finance)
   → Create fee types (Tuition, Transport, etc.), amounts, cycles
   ↓
6. Optional: Transport (Transport Manager)
   → Add buses and routes; assign students
   ↓
7. Students & Teachers (HR)
   → Add students (class, section, parent linking)
   → Add teachers and link to user accounts
   ↓
8. Holidays
   → Add holiday/event calendar
   ↓
9. Share parent credentials / inform staff
   → Parents use Parent Portal; teachers use Teacher dashboard
```

**Outcome:** School is ready for daily use: attendance, homework, fees, and messages.

---

### 3.2 School Admin / HR — Daily & periodic operations

| Flow | Steps |
|------|--------|
| **New student** | Students → Add → Fill details, class, section, parent → Save |
| **New teacher** | Teachers → Add → Profile + link user account → Save |
| **Leave approval** | Leave → View list → Approve/Reject with remarks |
| **Fee structure change** | Fees → Fee structures → Edit/Create (Finance or Admin) |
| **New exam** | Exams → Create exam (name, dates) → Later: enter marks (Academic/Teacher) |
| **Announcement** | Announcements → Create → Title, content, audience (All/Parents/Teachers) → Publish |
| **User/role change** | Users & permissions → Edit user → Change role or tags → Save |

---

### 3.3 Teacher — Typical day

```
1. Login → Teacher dashboard
   ↓
2. Attendance
   → Select date & class → Mark Present/Absent/Late/Excused (bulk where available) → Save
   ↓
3. Homework (if needed)
   → Create new OR view submissions → Evaluate & grade
   ↓
4. Exams (when applicable)
   → Exams → Select exam → Enter marks by student/subject → Save
   ↓
5. Optional: Class photos
   → Class photos → Upload image → Select class, caption → Share
   ↓
6. Messages
   → Messages → Read/reply to parents or staff
   ↓
7. Leave (when needed)
   → Leave → Apply → Date range, type, reason → Submit
   → Later: check status (Approved/Rejected)
```

**Outcome:** Attendance recorded, homework and marks up to date, parents can see progress and messages.

---

### 3.4 Parent — Journey in the portal

```
1. Login (credentials from school)
   ↓
2. Parent Portal home
   → See list of linked children; quick links to Attendance, Fees, Homework, etc.
   ↓
3. View attendance
   → Select child → See daily status and/or monthly summary
   ↓
4. View fees
   → See dues and payment history; download receipts; “Pay” may direct to contact school if online payment not set
   ↓
5. View homework
   → See assigned homework, due dates, submission/evaluation status
   ↓
6. View timetable
   → See child’s class timetable
   ↓
7. View academic performance
   → Report cards / exam marks by exam
   ↓
8. Messages
   → Read and reply to messages from teachers/school
   ↓
9. Alerts (bell icon)
   → Important notices and announcements from school
   ↓
10. Profile
    → Update contact details (phone, email)
```

**Outcome:** Parent has one place for all information and communication; fewer calls to the office.

---

### 3.5 Finance — Fee cycle

```
1. Fee structures already created (one-time/semester)
   ↓
2. When payments come in
   → Fees → Record payment → Select student, amount, method, transaction ID → Save
   ↓
3. Receipts
   → Generate/print receipt for parent
   ↓
4. Dues & reports
   → View dues by student/class; export for reconciliation
```

---

### 3.6 Transport Manager — Setup & updates

```
1. Buses
   → Transport → Add bus (number, driver, capacity)
   ↓
2. Routes
   → Add route (pickup/drop points, link to bus if needed)
   ↓
3. Assign students
   → Per student: assign route OR “Parent pickup”
   ↓
4. Parents see bus/route in Parent Portal (Bus / Transport section)
```

---

## 4. Flow Summary Diagram (text)

```
                    ┌─────────────────┐
                    │   School Admin  │
                    │  (first setup)  │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
  │ Academic /   │   │ Finance /    │   │ HR /         │
  │ Timetable /  │   │ Fees /       │   │ Students /  │
  │ Exams        │   │ Receipts     │   │ Teachers /   │
  └──────┬───────┘   └──────┬───────┘   │ Leave        │
         │                  │            └──────┬───────┘
         │                  │                   │
         └──────────────────┼───────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   Teachers    │
                    │ Attendance,   │
                    │ Homework,     │
                    │ Marks, Leave, │
                    │ Messages      │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   Parents     │
                    │ Portal: fees, │
                    │ attendance,   │
                    │ homework,     │
                    │ messages      │
                    └───────────────┘
```

---

## 5. What the School Needs to Provide (reminder)

- **Data:** Classes, sections, subjects; student and teacher list; fee structure; academic year.
- **Decisions:** Who is School Admin, Academic, Finance, HR, Transport; whether to enable online payments.
- **Access:** Server/DB access if self-hosted; or agreement with hoster for backups and updates.
- **Optional:** Logo, domain, SSL for production URL.

---

## 6. Next Steps

- **Demo:** Schedule a live walkthrough for your admin team.
- **Trial:** Request a trial instance with sample data.
- **Deployment:** Use DEPLOYMENT.md and USER_GUIDE.md for technical setup and training.

*For detailed how-to steps for each role, see **USER_GUIDE.md**.*

---

*EdSchool — Features & User Flows. Document for School Administration.*
