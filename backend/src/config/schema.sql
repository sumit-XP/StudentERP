-- School ERP Database Schema
-- Run this script to create all necessary tables

-- Create database (run this separately if needed)
-- CREATE DATABASE student_erp;

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES 
('admin', 'System Administrator'),
('teacher', 'Teaching Staff'),
('student', 'Student'),
('parent', 'Parent/Guardian')
ON CONFLICT (name) DO NOTHING;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    gender VARCHAR(10),
    profile_image_url TEXT,
    role_id INTEGER REFERENCES roles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Academic Years table
CREATE TABLE IF NOT EXISTS academic_years (
    id SERIAL PRIMARY KEY,
    year_name VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    grade_level INTEGER NOT NULL,
    section VARCHAR(10),
    academic_year_id INTEGER REFERENCES academic_years(id),
    class_teacher_id INTEGER REFERENCES users(id),
    max_students INTEGER DEFAULT 40,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    credits INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Class Subjects (Many-to-Many relationship)
CREATE TABLE IF NOT EXISTS class_subjects (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_id, subject_id)
);

-- Students table (extends users for student-specific data)
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    class_id INTEGER REFERENCES classes(id),
    admission_date DATE,
    roll_number INTEGER,
    parent_id INTEGER REFERENCES users(id),
    emergency_contact VARCHAR(20),
    blood_group VARCHAR(5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teachers table (extends users for teacher-specific data)
CREATE TABLE IF NOT EXISTS teachers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    qualification TEXT,
    experience_years INTEGER,
    joining_date DATE,
    salary DECIMAL(10,2),
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Timetable table
CREATE TABLE IF NOT EXISTS timetable (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id),
    subject_id INTEGER REFERENCES subjects(id),
    teacher_id INTEGER REFERENCES users(id),
    day_of_week INTEGER NOT NULL, -- 1=Monday, 7=Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_number VARCHAR(20),
    academic_year_id INTEGER REFERENCES academic_years(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    class_id INTEGER REFERENCES classes(id),
    subject_id INTEGER REFERENCES subjects(id),
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL, -- present, absent, late, excused
    marked_by INTEGER REFERENCES users(id),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, class_id, subject_id, date)
);

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    class_id INTEGER REFERENCES classes(id),
    subject_id INTEGER REFERENCES subjects(id),
    teacher_id INTEGER REFERENCES users(id),
    due_date TIMESTAMP,
    max_marks INTEGER DEFAULT 100,
    file_url TEXT,
    instructions TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assignment Submissions table
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER REFERENCES assignments(id),
    student_id INTEGER REFERENCES students(id),
    submission_text TEXT,
    file_url TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    marks_obtained INTEGER,
    feedback TEXT,
    graded_by INTEGER REFERENCES users(id),
    graded_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'submitted', -- submitted, graded, late
    UNIQUE(assignment_id, student_id)
);

-- Learning Resources table
CREATE TABLE IF NOT EXISTS learning_resources (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    resource_type VARCHAR(50) NOT NULL, -- document, video, link, image
    file_url TEXT,
    class_id INTEGER REFERENCES classes(id),
    subject_id INTEGER REFERENCES subjects(id),
    uploaded_by INTEGER REFERENCES users(id),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Grades table
CREATE TABLE IF NOT EXISTS grades (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    subject_id INTEGER REFERENCES subjects(id),
    class_id INTEGER REFERENCES classes(id),
    exam_type VARCHAR(50) NOT NULL, -- quiz, midterm, final, assignment
    exam_name VARCHAR(100),
    marks_obtained DECIMAL(5,2),
    max_marks DECIMAL(5,2),
    grade_letter VARCHAR(5),
    exam_date DATE,
    academic_year_id INTEGER REFERENCES academic_years(id),
    entered_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    announcement_type VARCHAR(50) DEFAULT 'general', -- general, urgent, academic, event
    target_audience VARCHAR(50) NOT NULL, -- all, students, teachers, parents, class_specific
    class_id INTEGER REFERENCES classes(id), -- null if for all
    created_by INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    scheduled_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages/Chat table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id),
    receiver_id INTEGER REFERENCES users(id),
    message_text TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- text, file, image
    file_url TEXT,
    is_read BOOLEAN DEFAULT false,
    parent_message_id INTEGER REFERENCES messages(id), -- for replies
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) DEFAULT 'general',
    reference_id INTEGER, -- ID of related entity (assignment, announcement, etc.)
    reference_type VARCHAR(50), -- assignment, announcement, grade, etc.
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fee Structure table
CREATE TABLE IF NOT EXISTS fee_structure (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id),
    fee_type VARCHAR(100) NOT NULL, -- tuition, transport, library, etc.
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE,
    academic_year_id INTEGER REFERENCES academic_years(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fee Payments table
CREATE TABLE IF NOT EXISTS fee_payments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    fee_structure_id INTEGER REFERENCES fee_structure(id),
    invoice_id INTEGER,
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50), -- cash, online, cheque
    transaction_id VARCHAR(100),
    receipt_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fee Invoices (per student)
CREATE TABLE IF NOT EXISTS fee_invoices (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    invoice_number VARCHAR(50) UNIQUE,
    invoice_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    late_fee DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'unpaid', -- unpaid, partial, paid, cancelled
    academic_year_id INTEGER REFERENCES academic_years(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fee Invoice Items (line items of fees)
CREATE TABLE IF NOT EXISTS fee_invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES fee_invoices(id) ON DELETE CASCADE,
    fee_type VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL
);

-- Razorpay Orders mapping to invoices
CREATE TABLE IF NOT EXISTS razorpay_orders (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES fee_invoices(id) ON DELETE CASCADE,
    razorpay_order_id VARCHAR(100) UNIQUE NOT NULL,
    amount_paise INTEGER NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(30) DEFAULT 'created', -- created, paid, failed
    razorpay_payment_id VARCHAR(100),
    razorpay_signature VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fee Refunds
CREATE TABLE IF NOT EXISTS fee_refunds (
    id SERIAL PRIMARY KEY,
    payment_id INTEGER REFERENCES fee_payments(id),
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT,
    refunded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Security Deposits
CREATE TABLE IF NOT EXISTS security_deposits (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    amount DECIMAL(10,2) NOT NULL,
    received_at DATE DEFAULT CURRENT_DATE,
    refunded_amount DECIMAL(10,2) DEFAULT 0
);

-- ==================== PARENT-TEACHER ENGAGEMENT ====================

-- Parent-Teacher Meetings
CREATE TABLE IF NOT EXISTS parent_teacher_meetings (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id),
    student_id INTEGER REFERENCES students(id),
    teacher_id INTEGER REFERENCES users(id),
    scheduled_at TIMESTAMP NOT NULL,
    topic VARCHAR(255),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, completed, cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parent Feedback / Complaints / Suggestions
CREATE TABLE IF NOT EXISTS parent_feedback (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    parent_id INTEGER REFERENCES users(id),
    feedback_type VARCHAR(20) NOT NULL, -- feedback, complaint, suggestion
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'open', -- open, resolved, dismissed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- ==================== Constraints & Indexes (Post-creation) ====================

-- Add FK for fee_payments.invoice_id after fee_invoices exists (ignore if present)
DO $$ BEGIN
  ALTER TABLE fee_payments
    ADD CONSTRAINT fk_fee_payments_invoice
    FOREIGN KEY (invoice_id) REFERENCES fee_invoices(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Helpful indexes for new tables
CREATE INDEX IF NOT EXISTS idx_student_guardians_student_id ON student_guardians(student_id);
CREATE INDEX IF NOT EXISTS idx_student_documents_student_id ON student_documents(student_id);
CREATE INDEX IF NOT EXISTS idx_student_promotions_student_id ON student_promotions(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_student_id ON fee_invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_invoice_items_invoice_id ON fee_invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_invoice_id ON fee_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_razorpay_orders_invoice_id ON razorpay_orders(invoice_id);
CREATE INDEX IF NOT EXISTS idx_ptm_student_id ON parent_teacher_meetings(student_id);
CREATE INDEX IF NOT EXISTS idx_ptm_class_id ON parent_teacher_meetings(class_id);
CREATE INDEX IF NOT EXISTS idx_parent_feedback_student_id ON parent_feedback(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_feedback_parent_id ON parent_feedback(parent_id);

CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades(student_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== EXTENSIONS FOR STUDENT MANAGEMENT ====================

-- Student Guardians (multiple contacts)
CREATE TABLE IF NOT EXISTS student_guardians (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    relation VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(255),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Documents (digital storage)
CREATE TABLE IF NOT EXISTS student_documents (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    doc_type VARCHAR(50), -- birth_cert, id_proof, photo, other
    file_url TEXT NOT NULL,
    notes TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Promotions / Demotions history
CREATE TABLE IF NOT EXISTS student_promotions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    from_class_id INTEGER REFERENCES classes(id),
    to_class_id INTEGER REFERENCES classes(id),
    action VARCHAR(20) NOT NULL, -- promoted, demoted
    effective_date DATE NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== FEES & FINANCIAL OPERATIONS ====================

-- Fee Invoices (per student)
CREATE TABLE IF NOT EXISTS fee_invoices (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    invoice_number VARCHAR(50) UNIQUE,
    invoice_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    late_fee DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'unpaid', -- unpaid, partial, paid, cancelled
    academic_year_id INTEGER REFERENCES academic_years(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fee Invoice Items (line items of fees)
CREATE TABLE IF NOT EXISTS fee_invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES fee_invoices(id) ON DELETE CASCADE,
    fee_type VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL
);

-- Fee Refunds
CREATE TABLE IF NOT EXISTS fee_refunds (
    id SERIAL PRIMARY KEY,
    payment_id INTEGER REFERENCES fee_payments(id),
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT,
    refunded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Security Deposits
CREATE TABLE IF NOT EXISTS security_deposits (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    amount DECIMAL(10,2) NOT NULL,
    received_at DATE DEFAULT CURRENT_DATE,
    refunded_amount DECIMAL(10,2) DEFAULT 0
);

-- ==================== PARENT-TEACHER ENGAGEMENT ====================

-- Parent-Teacher Meetings
CREATE TABLE IF NOT EXISTS parent_teacher_meetings (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id),
    student_id INTEGER REFERENCES students(id),
    teacher_id INTEGER REFERENCES users(id),
    scheduled_at TIMESTAMP NOT NULL,
    topic VARCHAR(255),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, completed, cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parent Feedback / Complaints / Suggestions
CREATE TABLE IF NOT EXISTS parent_feedback (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    parent_id INTEGER REFERENCES users(id),
    feedback_type VARCHAR(20) NOT NULL, -- feedback, complaint, suggestion
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'open', -- open, resolved, dismissed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);
