# StudentERP - Comprehensive Dashboard Feature Catalog

This document details all features, capabilities, and workflows available across the **Super Admin**, **Admin**, **Teacher**, **Student**, and **Parent** dashboards in the **StudentERP** system (Web Application & Mobile App).

---

## Table of Contents
1. [Overview & Role-Based Access Control (RBAC)](#1-overview--role-based-access-control-rbac)
2. [Super Admin Dashboard Features](#2-super-admin-dashboard-features)
3. [Admin Dashboard Features (Web & Mobile)](#3-admin-dashboard-features-web--mobile)
4. [Teacher Dashboard Features (Web & Mobile)](#4-teacher-dashboard-features-web--mobile)
5. [Student Dashboard Features (Web & Mobile)](#5-student-dashboard-features-web--mobile)
6. [Parent Dashboard Features (Web & Mobile)](#6-parent-dashboard-features-web--mobile)
7. [Cross-Dashboard Services & Technical Modules](#7-cross-dashboard-services--technical-modules)

---

## 1. Overview & Role-Based Access Control (RBAC)

The **StudentERP** application provides dedicated interfaces designed for distinct stakeholder roles. Features are accessible via the React-based Web Admin portal (`webadmin`) and the React Native Mobile Application (`mobileapp`), synchronized with the Node.js/PostgreSQL backend API.

| Dashboard Role | Primary Objectives | Platform Availability |
| :--- | :--- | :--- |
| **Super Admin** | Multi-school management, tenant provisioning, global administrative setup | Web Admin |
| **School Admin** | Institution-wide oversight, financial operations, staff & student management | Web Admin & Mobile App |
| **Teacher** | Class management, daily attendance, homework assignment, grading, student communication | Web Admin & Mobile App |
| **Student** | Timetable, attendance records, homework submissions, fee payments, results, resources | Web Admin & Mobile App |
| **Parent** | Ward tracking, fee payments (Razorpay), attendance alerts, PTM scheduling, school notices | Web Admin & Mobile App |

---

## 2. Super Admin Dashboard Features

*Source Files: `webadmin/src/pages/SuperAdmin.jsx`, `backend/src/modules/super-admin/`*

### Tenant & School Provisioning
- **School Creation & Code Assignment**: Register new schools with unique 5-digit school codes (`school_code`), owner details, subscription tenure, and renewal dates.
- **Service Plan Configuration**: Select service plans (`Basic`, `Premium`, `Enterprise`) and toggle enabled module features (`services_taken`).
- **School Status Control**: Instantly activate, deactivate, or suspend school tenants.

### Administrator & System Setup
- **School Admin Provisioning**: Create primary School Administrator credentials tied directly to specific school tenants.
- **Global Academic Year Setup**: Initialize academic sessions, start/end dates, and set active academic years per school.
- **Multi-Tenant System Analytics**: Monitor total active schools, registered administrators, and subscription renewals.

---

## 3. Admin Dashboard Features (Web & Mobile)

*Source Files: `webadmin/src/pages/Dashboard.jsx`, `Analytics.jsx`, `Reports.jsx`, `mobileapp/src/screens/dashboards/AdminDashboard.tsx`*

### A. Real-Time Overview & Analytics
- **KPI Summary Cards**: Real-time stats for Total Students, Total Teachers, Active Classes, Today's Attendance %, and Fee Collection summary.
- **Interactive Revenue & Attendance Charts**: Dynamic visual charts (Recharts) showing month-over-month revenue trends, fee collection status, and daily/monthly attendance percentages.
- **System Health Monitor**: Status indicators for Database connection, API server latency, and Firebase Auth services (Mobile & Web).

### B. Academic & Class Structure Management
- **Academic Year Management**: Create, view, and transition between academic sessions with designated current status.
- **Class & Section Setup**: Define grade levels (e.g., Grade 1-12), sections (A, B, C), and assign Class Teachers.
- **Subject-Class Mapping**: Link core & elective subjects to specific classes with custom subject codes and credit points.
- **Student Promotions & Transfers**: Bulk promote students between academic years/classes, handle stay-back decisions, or issue Transfer Certificates (TC) with historical logging.

### C. Student & Staff (Teacher) Administration
- **Single & Batch Student Registration**:
  - Single student creation with auto-generated Roll Numbers and auto-calculated admission numbers.
  - Quick Batch Student Creator for adding multiple students into a class at once.
- **Student Profile Management**: Manage student bio, emergency contact details, blood group, guardian mapping, and digital document uploads (birth certificates, transfer forms).
- **Staff / Teacher Directory**:
  - Register new teachers with Employee IDs, qualifications, departments, and phone credentials.
  - Upload staff verification documents and track teacher status.
- **Staff Payroll & Salary Setup**: Configure base salary, allowances, tax deductions (PF/TDS), net pay, and generate monthly payslips (`Payroll.jsx`).
- **Leave Approval Workflow**: Review, approve, or reject staff leave requests with balance adjustments (`Leaves.jsx`).

### D. Fee & Financial Management
- **Class-Wise Fee Structure Configuration**: Define custom fee categories (Tuition, Transport, Lab, Admission) per class per academic session (`Fees.jsx`).
- **Invoice Generation**: Bulk generate invoices class-wide or create individual student invoices with line-item breakdowns.
- **Payment Processing**:
  - Record manual payments via Cash, Cheque, Bank Transfer, or Credit/Debit Cards.
  - Auto-generate downloadable PDF payment receipts via `PDFKit`.
  - Process partial payments, refund negative entries, and track refundable Security Deposits.
- **Defaulters & Collection Reports**: Generate daily collection summaries, payment method breakdowns, and unpaid fee defaulter lists.

### E. Attendance & Academic Overviews
- **School-Wide Attendance Overview**: View daily class-by-class attendance compliance, high/low attendance warnings, and CSV export tools (`AttendanceReports.jsx`, `AdminAttendanceOverviewScreen.tsx`).
- **Results & Performance Analytics**: Overview of school exam performance, subject pass/fail ratios, grade distribution, and batch report cards (`AdminResultsOverviewScreen.tsx`).

### F. Communication & Broadcast Control
- **Targeted Announcements**: Publish school-wide announcements targeting All, Teachers, Students, Parents, or specific classes (`Announcements.jsx`).
- **Broadcast System Notifications**: Trigger real-time notifications with unread badges.

---

## 4. Teacher Dashboard Features (Web & Mobile)

*Source Files: `mobileapp/src/screens/dashboards/TeacherDashboard.tsx`, `webadmin/src/pages/Staff.jsx`, `Attendance.jsx`, `Assignments.jsx`*

### A. Teaching Schedule & Overview
- **Daily Class Schedule**: View today's lecture schedule, period timings, room numbers, and subject badges.
- **Live Lecture Indicator**: Real-time highlight for ongoing classes.
- **Course Completion Tracker**: Interactive percentage bar tracking syllabus completion progress.

### B. Attendance Marking Portal
- **Class Attendance Marking**: Mark daily attendance (Present, Absent, Late, Excused) for assigned classes or subject slots.
- **Bulk & Student Remarks**: Enter individual remarks for absent/late students.
- **Attendance History Review**: Edit previous attendance records within permitted date windows.

### C. Homework & Assignment Management
- **Create & Assign Homework**: Create assignments with subject tagging, due dates, max marks, description, and file attachment uploads (`AssignHomeworkScreen.tsx`).
- **Submission Portal & Review**: View student submission lists, file attachments, submission timestamps, and late indicators (`AssignmentDetailScreen.tsx`).
- **Grading & Feedback**: Award marks, grade submissions, and provide custom feedback to individual students (`GradingResultsScreen.tsx`).

### D. Communication & Parent Engagement
- **Class Announcements**: Broadcast announcements directly to students and parents of assigned classes (`CreateAnnouncementScreen.tsx`).
- **1:1 Messaging & Chat**: Direct messaging threads with parents and students (`MessagingScreen.tsx`, `ChatScreen.tsx`).
- **Parent-Teacher Meeting (PTM)**: View, schedule, and confirm PTM appointments with parents (`PTMScreen.tsx`).

### E. Personal Portal (Staff Services)
- **Leave Request Submission**: Apply for Casual, Sick, or Earned leaves with date pickers and reason notes (`Leaves.jsx`).
- **Payslip & Salary View**: View monthly salary receipts, allowances, and tax deductions.

---

## 5. Student Dashboard Features (Web & Mobile)

*Source Files: `webadmin/src/pages/StudentDashboard.jsx`, `mobileapp/src/screens/dashboards/StudentDashboard.tsx`*

### A. Academic Overview & Timetable
- **Personalized Student Profile**: Display Class, Section, Roll Number, Student ID, and Class Teacher details.
- **Today's Class Schedule**: Interactive timetable showing upcoming periods, subjects, teachers, and timings.

### B. Attendance Analytics & History
- **Attendance Percentage Ring**: Visual gauge displaying current attendance percentage with color coding.
- **Low Attendance Warning Alert**: Automated alert warning when attendance falls below 75%.
- **Detailed Attendance Log**: Filterable list of daily attendance statuses (Present, Absent, Late, Excused) with subject breakdown.

### C. Assignments & Learning Resources
- **Active Homework List**: View pending, submitted, graded, and overdue assignments with countdown due dates.
- **File Submission**: Upload completed homework files and add submission notes (`SubmitAssignmentScreen.tsx`).
- **Grades & Feedback View**: Review teacher scores, max marks, and feedback on graded assignments.
- **Study Material & Learning Resources**: Download teacher-uploaded study notes, syllabus PDFs, and reference resources.

### D. Fee Portal & Receipts
- **Fee Summary & Due Counter**: View total outstanding fees, upcoming due dates, and invoice breakdowns.
- **Online Razorpay Payment**: Secure online fee payment via Razorpay integration (`OnlinePaymentScreen.tsx`).
- **Payment History & Receipts**: View past payment transactions and download PDF payment receipts.

### E. Examination & Results
- **Report Card Viewer**: Access term exam results, subject-wise marks, grades, total score, and teacher remarks.

### F. Communication & Notices
- **Announcements Feed**: Read school and class announcements with push notifications.
- **Notifications Center**: Instant alerts for newly posted assignments, graded papers, and attendance status.

---

## 6. Parent Dashboard Features (Web & Mobile)

*Source Files: `webadmin/src/pages/ParentDashboard.jsx`, `mobileapp/src/screens/dashboards/ParentDashboard.tsx`, `ParentPortalScreen.tsx`*

### A. Multi-Child (Ward) Selection
- **Child Switcher**: Easily switch between multiple enrolled children/wards from a single parent account.
- **Ward Profile & Overview**: Quick view of child's grade, section, school ID, roll number, and primary teacher contact.

### B. Ward Attendance Tracking
- **Real-Time Attendance Monitoring**: View monthly attendance percentage, present count, absent count, and late records.
- **Absence Notifications**: Real-time alerts when the child is marked absent or late.

### C. Fee Payments & Financial Desk
- **Outstanding Fee Summary**: Direct view of total unpaid dues across all fee invoices.
- **One-Click Online Checkout**: Pay pending school fees instantly via Razorpay payment gateway integration (`ParentPayments.jsx`).
- **Fee Transaction History & PDF Download**: Access and download digital PDF fee receipts for tax/record purposes.

### D. Academic Performance Monitoring
- **Assignment Tracker**: Track child's pending assignments, submission status, and received grades.
- **Term Report Cards**: Download examination report cards, subject scores, and progress trends.

### E. School Noticeboard & Direct Teacher Communication
- **Parent Notices & Circulars**: View targeted circulars, holiday notices, and event announcements.
- **1:1 Chat with Class Teacher**: Private messaging interface to communicate directly with class teachers.
- **Parent-Teacher Meeting (PTM) Desk**: Schedule PTM sessions and submit parent feedback.

---

## 7. Cross-Dashboard Services & Technical Modules

| Module | Core Functionality | Supported Dashboards |
| :--- | :--- | :--- |
| **Authentication & RBAC** | Firebase Auth + JWT, Role-based route protection, session management | All Dashboards |
| **Razorpay Payment Gateway** | Order creation, HMAC SHA256 signature verification, auto payment recording | Admin, Student, Parent |
| **PDFKit Receipt Generator** | Server-side PDF invoice and receipt rendering for instant download | Admin, Student, Parent |
| **Messaging & Notifications** | Socket/Database backed 1:1 chat, unread message badges, system notifications | All Dashboards |
| **File Storage & Uploads** | Multer disk/cloud file upload handling for documents and assignments | Admin, Teacher, Student |
