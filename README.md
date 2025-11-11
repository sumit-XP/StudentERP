# Student ERP (Webadmin + Backend)

A full-stack School ERP with modules for authentication, academics, attendance, assignments/resources, communication, analytics, and a comprehensive fees system with Razorpay integration.

This README summarizes the implemented features across backend and the React-based webadmin (Vite + TailwindCSS), plus setup and typical workflows.

## Features Implemented

- **Authentication & RBAC**
  - Firebase email/password login → Backend JWT.
  - Role-based access (admin, teacher, student, parent) on API routes.

- **Academic Management**
  - Academic years, subjects, classes, class-subject mapping.
  - Students CRUD (backend), list/search UI in webadmin.
  - Student Guardians (multiple contacts).
  - Student Documents (digital storage via uploads).
  - Student Promotion/Demotion with history.

- **Attendance**
  - Class-wise marking (present/absent/late/excused).
  - Reports API: class/students summaries; detailed/summary reports by date range.
  - Webadmin Attendance Reports page with CSV exports (summary/detailed).

- **Assignments & Learning Resources**
  - Create/list assignments (teachers), file uploads, due dates.
  - Learning resources upload and controlled access.

- **Communication & Parent Engagement**
  - Announcements (target audience: all/students/parents/teachers/class-specific) with notifications.
  - Messaging (1:1 conversations) with Notifications.
  - Notifications center (list, unread count, mark read/mark all read).

- **Fees & Financial Operations**
  - Fee Structure (class-wise, type-wise, amount, academic year).
  - Invoice generation (per class or per student) with line items and status (unpaid/partial/paid).
  - Record payments (cash/cheque/card/bank), PDF receipt generation.
  - Online payments via Razorpay (create order + server-side signature verification → auto-record payment).
  - Refunds (records negative payment) and Security Deposits (receive/refund tracking).
  - Reports: Daily collections, by payment method, dues, defaulters.

- **Analytics**
  - Dashboard metrics and attendance analytics.

## Tech Stack

- **Frontend (webadmin)**: React 18, Vite, TailwindCSS, Axios, React Router.
- **Backend**: Node.js (Express 5), PostgreSQL (pg), Firebase Admin, JWT, Multer, PDFKit, node-cron (available), Razorpay SDK.

## Project Structure (relevant)

- `webadmin/src/pages/`
  - `Students.jsx` — Students list/detail (guardians, documents upload, promotions).
  - `Attendance.jsx` — Daily marking.
  - `AttendanceReports.jsx` — Reports (detailed/summary) + CSV export.
  - `Assignments.jsx`, `Announcements.jsx`, `Analytics.jsx`, `Fees.jsx`, `Messaging.jsx`, `Notifications.jsx`.
- `webadmin/src/services/`
  - `api.js` (Axios instance), `academic.js`, `attendance.js`, `fees.js`, `communication.js`.
- `backend/src/modules/`
  - `academic/academic.controller.js` — includes guardians, documents, promotions endpoints.
  - `attendance/attendance.controller.js` — marking + reports.
  - `assignments/assignments.controller.js`.
  - `communication/communication.controller.js` — announcements, messages, notifications.
  - `fees/fees.controller.js` — structure/invoices/payments/refunds/deposits/reports + Razorpay.
- `backend/src/routes/`
  - `academic.routes.js`, `attendance.routes.js`, `communication.routes.js`, `fees.routes.js`, `upload.routes.js`, `auth.routes.js`, `analytics.routes.js`.
- `backend/src/config/schema.sql` — full DB schema, including new tables and post-create FK/indexes.

## Setup

1) Backend
- Create `.env` in `backend/`:
  - `PORT=5000`
  - `DATABASE_URL=postgresql://postgres:1234@localhost:5432/student_erp`
  - `JWT_SECRET=<your-long-secret>`
  - `RAZORPAY_KEY_ID=<your_key_id>`
  - `RAZORPAY_KEY_SECRET=<your_key_secret>`
- Install dependencies: `npm install`
- Apply schema and sample data: `npm run setup`
- Start server: `npm run dev`

2) Webadmin
- Create `.env` in `webadmin/`:
  - `VITE_API_BASE_URL=http://localhost:5000/api`
  - `VITE_FIREBASE_API_KEY=...` (and other Firebase configs)
  - `VITE_RAZORPAY_KEY_ID=<your_key_id>`
- Install dependencies: `npm install`
- Start dev server: `npm run dev`

## Core Workflows

- Login: Firebase email/password → JWT stored → all API requests authenticated.
- Students:
  - Navigate to Students → filter/search → select student → manage guardians, upload documents, apply promotion/demotion (with class change recorded in history).
- Attendance:
  - Mark: Attendance page (daily marking by class/subject).
  - Reports: Attendance Reports page → choose class + date range → view/export summary/detailed CSV. Class summary also available.
- Communication:
  - Announcements: Create/list/update (Admins/Teachers) with notifications.
  - Messaging: Conversations list → open thread → send messages; notifications created for receiver.
  - Notifications: View list, unread count, mark read/all read.
- Fees:
  - Configure fee structure (class-wise types and amounts).
  - Generate invoices (class/student), track status, view items & payments.
  - Record payments (cash/bank/cheque/card), download PDF receipts.
  - Online payment: From invoice detail → “Pay Online (Razorpay)” → complete payment → backend verifies signature and records payment.
  - Refunds: Record refund (negative payment). Security Deposits: receive + partial refunds tracking.
  - Reports: Daily collections, by method, dues, defaulters.

## Database Notes

- `fee_payments.invoice_id` FK added post-creation to avoid create-order dependency issues.
- Helpful indexes added for new tables (guardians, documents, promotions, invoices/items/payments, razorpay_orders, PT meetings, parent feedback).

## Testing

- Backend: `npm run dev` and use provided routes. `backend/test-api.js` has simple examples.
- Webadmin: Start dev and walk through pages listed above.
- Razorpay: Use test keys; verify order creation and signature verification; confirm invoice status updates.

## Future Enhancements

- Parent-Teacher meetings and Parent Feedback UI (DB tables are present).
- Automated absence notifications scheduler with configurable rules.
- Financial reports: month/year revenue, GST/tax reports, bank reconciliation, audit trail.

## Troubleshooting

- If Razorpay online pay button is disabled, ensure `VITE_RAZORPAY_KEY_ID` is set and the script is loaded.
- Verify DB URL and that `schema.sql` ran successfully (`npm run setup`).
- Ensure Firebase admin service account is correctly configured for backend auth.
