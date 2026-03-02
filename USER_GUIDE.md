# EdSchool — User Guide & Platform Documentation

**Version 1.0**  
Multi-tenant school management system for administration, academics, fees, attendance, transport, and parent engagement.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [User Roles & Access](#3-user-roles--access)
4. [Admin & Staff Guide](#4-admin--staff-guide)
5. [Teacher Guide](#5-teacher-guide)
6. [Parent Portal Guide](#6-parent-portal-guide)
7. [Using the App on Mobile](#7-using-the-app-on-mobile)
8. [Tips & Best Practices](#8-tips--best-practices)
9. [Support & Troubleshooting](#9-support--troubleshooting)
10. [Appendix](#10-appendix)

---

## 1. Introduction

### 1.1 What is EdSchool?

EdSchool is a web-based school management platform that brings together:

- **Administration** — Students, teachers, classes, subjects, academic setup  
- **Attendance** — Daily student and teacher attendance with reports  
- **Fees** — Fee structures, payments, receipts, and dues  
- **Exams & Marks** — Exam schedules, marks entry, report cards  
- **Timetable** — Class-wise schedules and room allocation  
- **Homework** — Assignments, submissions, and grading  
- **Leave** — Teacher leave applications and approval  
- **Transport** — Buses, routes, and student transport assignment  
- **Communication** — Announcements, messages, and parent alerts  
- **Parent Portal** — One place for parents to see fees, attendance, homework, and messages

The platform is **role-based**: what you see and can do depends on your role (Admin, Academic, Finance, HR, Transport, Teacher, or Parent).

### 1.2 Who This Guide Is For

- **School administrators** — Full setup and day-to-day management  
- **Academic / Finance / HR / Transport staff** — Role-specific tasks  
- **Teachers** — Attendance, homework, marks, leave, and messages  
- **Parents** — Using the Parent Portal to track your child’s progress and fees  

---

## 2. Getting Started

### 2.1 Logging In

1. Open the EdSchool URL (e.g. `https://yourschool.com/edschool` or the link provided by your school).  
2. Enter your **email** and **password**.  
3. Click **Login**.  
4. You will be taken to:
   - **Admins/Staff** — Main dashboard  
   - **Teachers** — Teacher dashboard  
   - **Parents** — Parent Portal home  

**First-time users:** Use the credentials given by your school. If you don’t have them, contact the school admin.

### 2.2 Forgot Password

If your school has enabled password reset, use the “Forgot password?” link on the login page. Otherwise, contact the school administrator to reset your password.

### 2.3 After Login

- **Desktop:** Use the **sidebar** (left) to open Dashboard, Students, Attendance, Fees, etc.  
- **Mobile:** Use the **menu icon** (top-left) to open the sidebar, or the **bottom navigation** (Dashboard, Students, Messages, etc.).  
- **Profile & logout:** Click your **name/avatar** (top-right) for **Account** and **Logout**.  

---

## 3. User Roles & Access

| Role | Description | Typical access |
|------|-------------|----------------|
| **Super Admin** | Platform-level oversight (multi-school) | Full access across schools |
| **School Admin** | Full school-level access | Dashboard, all modules, users & permissions, holidays |
| **Sub-Admin (Academic)** | Academic tag | Classes, subjects, timetable, exams, homework |
| **Sub-Admin (Finance)** | Finance tag | Fee structures, payments, receipts |
| **Sub-Admin (HR)** | HR tag | Students, teachers, attendance, leave |
| **Sub-Admin (Transport)** | Transport tag | Buses, routes, student transport |
| **Teacher** | Teaching staff | Teacher dashboard, attendance, homework, leave, marks, class photos, messages |
| **Parent** | Parent/guardian | Parent Portal only (fees, attendance, homework, timetable, messages, alerts) |

- **School Admin** can create and manage Sub-Admins and assign tags (Academic, Finance, HR, Transport).  
- **Teachers** see only what they need for their classes and subjects.  
- **Parents** see only the Parent Portal; they cannot access admin or teacher areas.  

---

## 4. Admin & Staff Guide

This section applies to **Super Admin**, **School Admin**, and **Sub-Admins** (depending on permissions).

### 4.1 Dashboard

- **Purpose:** Overview of school activity.  
- **Use:** View summaries (e.g. students, attendance, fees). Use as your home base after login.  
- **Navigation:** **Dashboard** in the sidebar or bottom nav.

### 4.2 Academic Setup

- **Path:** **Academic** in the sidebar.  
- **Purpose:** Manage classes, sections, subjects, and class–subject–teacher mapping.  
- **Typical tasks:**
  - Create **classes** (e.g. Class 1, Class 2) and sections (A, B, C).  
  - Create **subjects** and optionally link them to **classes**.  
  - Assign **teachers** to class–subject combinations.  
- **Who:** Usually Academic Admin or School Admin.  

### 4.3 Students

- **Path:** **Students** in the sidebar.  
- **Purpose:** Register and manage student profiles, admission numbers, class/section, and parent linking.  
- **Typical tasks:**
  - Add a new student (name, DOB, class, section, parent contact).  
  - Edit student details or class/section.  
  - Search/filter by class, name, or admission number.  
- **Who:** HR Admin or School Admin.  

### 4.4 Teachers

- **Path:** **Teachers** in the sidebar.  
- **Purpose:** Manage teacher profiles, employee IDs, qualifications, and subject assignments.  
- **Typical tasks:**
  - Add a new teacher and link to a user account.  
  - Edit qualifications, contact info, and subject/class assignments.  
- **Who:** HR Admin or School Admin.  

### 4.5 Attendance

- **Path:** **Attendance** in the sidebar.  
- **Purpose:** Daily student attendance and teacher attendance, with reports and stats.  
- **Features:**
  - **Student attendance:** Mark by class/date (Present, Absent, Late, Excused). Bulk marking supported.  
  - **Teacher attendance:** Mark check-in/check-out and status.  
  - **Reports:** View and filter by date range, class, or teacher.  
- **Who:** Teachers (for their classes), HR/Academic Admin (for full reports).  

### 4.6 Leave

- **Path:** **Leave** in the sidebar.  
- **Purpose:** Teachers apply for leave; HR/Admin approve or reject.  
- **Admin/HR tasks:**
  - View all leave applications (filter by teacher, status, date).  
  - **Approve** or **Reject** with optional remarks.  
- **Who:** HR Admin or School Admin. (Teachers use the same **Leave** menu to apply; see [Teacher Guide – Leave](#55-leave).)  

### 4.7 Fees

- **Path:** **Fees** in the sidebar.  
- **Purpose:** Define fee structures, record payments, issue receipts, and track dues.  
- **Typical tasks:**
  - Create **fee structures** (e.g. Tuition, Transport) with amount, billing cycle (monthly/quarterly/yearly), and due day.  
  - **Record payments** for students (amount, method, transaction ID).  
  - View **dues** and payment history; generate/print receipts.  
- **Who:** Finance Admin or School Admin.  

### 4.8 Exams

- **Path:** **Exams** in the sidebar.  
- **Purpose:** Create exams, enter marks, and view report cards.  
- **Typical tasks:**
  - Create an **exam** (name, dates, passing marks, optional class).  
  - **Enter marks** by student and subject.  
  - View **report cards** per student/exam.  
- **Who:** Academic Admin or users with exam permissions.  

### 4.9 Timetable

- **Path:** **Timetable** in the sidebar.  
- **Purpose:** Build class-wise timetables (subjects, teachers, time slots, rooms).  
- **Typical tasks:**
  - Add slots by class, day, subject, teacher, time, and room.  
  - Edit or remove slots.  
- **Who:** Academic Admin.  

### 4.10 Homework

- **Path:** **Homework** in the sidebar.  
- **Purpose:** Create homework, view submissions, and evaluate/grade.  
- **Admin/Academic tasks:**
  - View all homework and submission status.  
  - Evaluate submissions and enter marks (if permitted).  
- **Who:** Teachers create and evaluate their own homework; Academic Admin may have broader view.  

### 4.11 Announcements

- **Path:** **Announcements** in the sidebar.  
- **Purpose:** Publish school-wide or targeted announcements (All, Parents, Teachers, Students).  
- **Typical tasks:**
  - Create an announcement (title, content, target audience, optional expiry).  
  - Edit or remove announcements.  
- **Who:** School Admin, Academic Admin, or Teachers (depending on permissions).  

### 4.12 Class Photos (Class Moments)

- **Path:** **Class photos** in the sidebar.  
- **Purpose:** View photos shared by teachers for a class.  
- **Who:** Teachers upload; Admin/Academic can view.  

### 4.13 Transport

- **Path:** **Transport** in the sidebar.  
- **Purpose:** Manage buses, routes, and which students use which bus/route.  
- **Typical tasks:**
  - Add **buses** (number, driver, capacity).  
  - Add **routes** (pickup/drop points, link to bus).  
  - Assign **students** to a route or “Parent pickup”.  
- **Who:** Transport Manager or School Admin.  

### 4.14 Users & Permissions

- **Path:** **Users & permissions** in the sidebar.  
- **Purpose:** Create and manage user accounts and assign roles/tags.  
- **Typical tasks:**
  - Create users (email, password, role).  
  - Assign **tags** (e.g. Academic, Finance, HR, Transport) to Sub-Admins.  
  - Activate/deactivate users.  
- **Who:** School Admin or Super Admin only.  

### 4.15 Holidays

- **Path:** **Holidays** in the sidebar.  
- **Purpose:** Maintain school calendar (holidays, exam dates, events).  
- **Typical tasks:**
  - Add a holiday or event (date, title, type).  
  - Edit or delete entries.  
- **Who:** School Admin or Super Admin.  

### 4.16 Messages

- **Path:** **Messages** in the sidebar.  
- **Purpose:** Send and receive messages (e.g. with parents or teachers).  
- **Use:** Compose, read, and manage conversations. Available to all logged-in users with message access.  

---

## 5. Teacher Guide

Teachers land on the **Teacher dashboard** and use **Attendance**, **Homework**, **Leave**, **Exams**, **Class photos**, and **Messages**.

### 5.1 Teacher Dashboard

- **Path:** **Teacher dashboard** (or **Dashboard** in the teacher context).  
- **Purpose:** Quick access to today’s tasks: attendance, homework, and recent activity.  
- **Use:** Use as your home after login; use bottom nav on mobile (Home, Attendance, Homework, Photos, Messages).  

### 5.2 Attendance

- **Path:** **Attendance** in the sidebar or bottom nav.  
- **Purpose:** Mark daily student attendance for your classes and view teacher attendance.  
- **Typical tasks:**
  - Select **date** and **class**.  
  - Mark each student as **Present**, **Absent**, **Late**, or **Excused** (bulk actions where available).  
  - View or edit **teacher attendance** (check-in/check-out) if applicable.  

### 5.3 Homework

- **Path:** **Homework** in the sidebar or bottom nav.  
- **Purpose:** Create homework, track submissions, and evaluate/grade.  
- **Typical tasks:**
  - **Create** homework (class, subject, title, description, due date, optional attachments).  
  - **View submissions** (Pending, Submitted, Evaluated, Overdue).  
  - **Evaluate** and enter marks/remarks.  

### 5.4 Exams & Marks

- **Path:** **Exams** in the sidebar.  
- **Purpose:** Enter marks for exams (if you have permission).  
- **Use:** Open the relevant exam, select class/students, enter subject-wise marks. Report cards are generated from this data.  

### 5.5 Leave

- **Path:** **Leave** in the sidebar.  
- **Purpose:** Apply for leave and track status.  
- **Typical tasks:**
  - **Apply:** Choose date range, leave type (Sick, Casual, Earned, Unpaid, Other), and reason.  
  - **View** your applications (Pending, Approved, Rejected).  
- **Note:** Only HR/Admin can approve or reject.  

### 5.6 Class Photos (Class Moments)

- **Path:** **Class photos** in the sidebar or bottom nav.  
- **Purpose:** Share photos with a class (e.g. activity or event).  
- **Use:** Upload image, select class, add optional caption. Parents can see these in the portal.  

### 5.7 Messages

- **Path:** **Messages** in the sidebar or bottom nav.  
- **Purpose:** Communicate with parents or staff.  
- **Use:** Open **Messages**, compose or reply to conversations.  

---

## 6. Parent Portal Guide

Parents see only the **Parent Portal**: a single dashboard for all linked children.

### 6.1 Parent Portal Home

- **Path:** **Parent Portal** (first screen after parent login).  
- **Purpose:** Overview of your children: quick links to attendance, fees, homework, timetable, and messages.  
- **Use:** Select a child to see their details or jump to a section (Attendance, Fees, Homework, etc.).  

### 6.2 Attendance

- **Path:** **Parent Portal → Attendance** (or via home links).  
- **Purpose:** View your child’s attendance (daily status and summaries).  
- **Use:** Select child and date range; view present/absent/late/excused and monthly percentage if shown.  

### 6.3 Fees & Payments

- **Path:** **Parent Portal → Fees** (or Fees/Payments).  
- **Purpose:** View fee dues, payment history, and receipts.  
- **Use:** See pending dues and paid amounts; download or print receipts if available. “Pay fees” may direct you to contact the school when online payment is not configured.  

### 6.4 Homework

- **Path:** **Parent Portal → Homework**.  
- **Purpose:** View homework assigned to your child and submission status.  
- **Use:** See due dates, descriptions, and whether the child has submitted or been evaluated.  

### 6.5 Timetable

- **Path:** **Parent Portal → Timetable**.  
- **Purpose:** View your child’s class timetable.  
- **Use:** Check daily schedule by class.  

### 6.6 Academic Performance

- **Path:** **Parent Portal → Academic performance** (or similar).  
- **Purpose:** View report cards and exam marks.  
- **Use:** Select child and exam to see subject-wise marks and grades.  

### 6.7 Syllabus

- **Path:** **Parent Portal → Syllabus** (if available).  
- **Purpose:** View curriculum/syllabus for your child’s class and subjects.  

### 6.8 Bus / Transport

- **Path:** **Parent Portal → Bus** (or Transport).  
- **Purpose:** View bus/route assignment and pickup/drop details for your child.  

### 6.9 Messages

- **Path:** **Parent Portal → Messages** or **Messages** in the bottom nav.  
- **Purpose:** Communicate with teachers or school.  
- **Use:** Read and reply to messages.  

### 6.10 Alerts

- **Path:** **Alerts** (bell icon in the header) or **Parent → Alerts**.  
- **Purpose:** View important notices and updates from the school.  
- **Use:** Check regularly for announcements and due dates.  

### 6.11 Profile

- **Path:** **Profile** in the user menu or bottom nav.  
- **Purpose:** View and update your contact details (phone, email, address).  
- **Use:** Keep details current so the school can reach you.  

---

## 7. Using the App on Mobile

- EdSchool is **responsive**: use the same URL on a phone or tablet.  
- **Menu:** Tap the **menu icon** (top-left) to open the sidebar.  
- **Bottom navigation:** On mobile, key links (e.g. Dashboard, Students, Messages) appear at the bottom for quick access.  
- **PWA (optional):** If your school enables it, you can **install** the app on your home screen for an app-like experience. Follow any on-screen “Install” prompt or browser instructions.  

---

## 8. Tips & Best Practices

- **Admins:** Set up **Academic** (classes, subjects) and **Users & permissions** before adding students and teachers.  
- **Teachers:** Mark **attendance** daily and create **homework** with clear due dates so parents and students see accurate data.  
- **Parents:** Check **Alerts** and **Messages** regularly; keep **Profile** contact info up to date.  
- **All users:** Use **Logout** when leaving a shared device.  
- **Passwords:** Change the default password after first login if your school allows it.  

---

## 9. Support & Troubleshooting

### 9.1 Login Issues

- **Invalid credentials:** Confirm email and password; check Caps Lock. Use “Forgot password?” if available.  
- **Account locked/disabled:** Contact the school administrator.  

### 9.2 “I don’t see a menu item”

- Visibility is **role-based**. If you don’t see e.g. Fees or Transport, your role or permissions may not include it. Contact the school admin to request access.  

### 9.3 Page not loading or errors

- Refresh the page; try another browser or device.  
- Clear browser cache if the app was recently updated.  
- If the issue continues, note the exact message or screen and contact your school’s IT or support.  

### 9.4 Contact

- For **account, permissions, or data** questions: contact your **school administrator**.  
- For **technical or deployment** issues: contact the person or team who set up EdSchool for your school (see also **DEPLOYMENT.md** and **TROUBLESHOOTING.md** in the project).  

---

## 10. Appendix

### 10.1 Test / Demo Credentials (if seed data is used)

After a fresh setup with database seed, the following demo users are often available. **Passwords should be changed in production.**

| Role | Email | Password (example) |
|------|--------|---------------------|
| School Admin | schooladmin@school.com | password123 |
| Super Admin | superadmin@school.com | password123 |
| Academic | academic@school.com | password123 |
| Finance | finance@school.com | password123 |
| HR | hr@school.com | password123 |
| Transport | transport@school.com | password123 |
| Teacher | teacher@school.com | password123 |
| Parent | parent@school.com | password123 |

*(Your school may use different emails or passwords; use the credentials provided by your school.)*

### 10.2 Glossary

| Term | Meaning |
|------|--------|
| **Academic setup** | Classes, sections, subjects, and class–subject–teacher mapping. |
| **Class moments** | Photos shared by teachers with a class (visible in Parent Portal). |
| **Fee structure** | Definition of a fee type (e.g. Tuition, Transport) with amount and billing cycle. |
| **Parent Portal** | The area where parents see attendance, fees, homework, timetable, and messages for their children. |
| **Sub-Admin** | Admin user with limited access via tags (Academic, Finance, HR, Transport). |
| **Tag** | Permission label assigned to Sub-Admins (e.g. manageAcademic, manageTransport). |

---

*EdSchool User Guide — © Your School / EdSchool. For technical deployment details, see README.md and DEPLOYMENT.md.*
