-- ============================================================
-- StudentERP Migration 001: Add Multi-Tenant Support
-- Adds schools table and school_id FK to all existing tables
-- ============================================================

-- -------------------------------------------------------
-- 1. Create schools table (root tenant entity)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_code CHAR(5) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) UNIQUE,
  address TEXT,
  place VARCHAR(255),
  owner_name VARCHAR(255),
  tenure VARCHAR(100),
  renewal_date DATE,
  services_taken JSONB DEFAULT '[]',
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  logo_url TEXT,
  plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'pro', 'enterprise')),
  is_active BOOLEAN DEFAULT true,
  max_students INTEGER DEFAULT 500,
  max_teachers INTEGER DEFAULT 50,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE schools ADD COLUMN IF NOT EXISTS school_code CHAR(5) UNIQUE;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS place VARCHAR(255);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS tenure VARCHAR(100);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS renewal_date DATE;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS services_taken JSONB DEFAULT '[]';

-- -------------------------------------------------------
-- 2. Add school_id to USERS table
-- -------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- -------------------------------------------------------
-- 3. Add school_id to ACADEMIC_YEARS table
-- -------------------------------------------------------
ALTER TABLE academic_years ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- -------------------------------------------------------
-- 4. Add school_id to CLASSES table
-- -------------------------------------------------------
ALTER TABLE classes ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- -------------------------------------------------------
-- 5. Add school_id to SUBJECTS table
-- -------------------------------------------------------
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- -------------------------------------------------------
-- 6. Add school_id to CLASS_SUBJECTS table
-- -------------------------------------------------------
ALTER TABLE class_subjects ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- -------------------------------------------------------
-- 7. Add school_id to STUDENTS table
-- -------------------------------------------------------
ALTER TABLE students ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- -------------------------------------------------------
-- 8. Add school_id to TEACHERS table
-- -------------------------------------------------------
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- -------------------------------------------------------
-- 9. Add school_id to TIMETABLE table
-- -------------------------------------------------------
ALTER TABLE timetable ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- -------------------------------------------------------
-- 10. Add school_id to ATTENDANCE table
-- -------------------------------------------------------
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- -------------------------------------------------------
-- 11. Add school_id to ASSIGNMENTS table
-- -------------------------------------------------------
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- -------------------------------------------------------
-- 12. Add school_id to ASSIGNMENT_SUBMISSIONS table
-- -------------------------------------------------------
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- -------------------------------------------------------
-- 13. Add school_id to LEARNING_RESOURCES table
-- -------------------------------------------------------
ALTER TABLE learning_resources ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- -------------------------------------------------------
-- 14. Add school_id to GRADES table
-- -------------------------------------------------------
ALTER TABLE grades ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- -------------------------------------------------------
-- 15. Add school_id to ANNOUNCEMENTS table
-- -------------------------------------------------------
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- -------------------------------------------------------
-- 16. Add school_id to FEE_STRUCTURE table
-- -------------------------------------------------------
ALTER TABLE fee_structure ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- -------------------------------------------------------
-- 17. Add school_id to FEE_INVOICES table
-- -------------------------------------------------------
ALTER TABLE fee_invoices ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- -------------------------------------------------------
-- 18. Add school_id to FEE_PAYMENTS table
-- -------------------------------------------------------
ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- -------------------------------------------------------
-- 19. Add school_id to MESSAGES table
-- -------------------------------------------------------
ALTER TABLE messages ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- -------------------------------------------------------
-- 20. Add school_id to NOTIFICATIONS table
-- -------------------------------------------------------
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- -------------------------------------------------------
-- 21. Add school_id to PARENT_TEACHER_MEETINGS
-- -------------------------------------------------------
ALTER TABLE parent_teacher_meetings ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- -------------------------------------------------------
-- 22. Add school_id to PARENT_FEEDBACK
-- -------------------------------------------------------
ALTER TABLE parent_feedback ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- -------------------------------------------------------
-- 23. Add school_id to STAFF
-- -------------------------------------------------------
ALTER TABLE staff ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- -------------------------------------------------------
-- 24. Add school_id to LEAVE_APPLICATIONS
-- -------------------------------------------------------
ALTER TABLE leave_applications ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- -------------------------------------------------------
-- 25. Add school_id to PAYROLL_RECORDS
-- -------------------------------------------------------
ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- -------------------------------------------------------
-- 26. School invitations (for admin onboarding)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------
-- 27. School settings
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  setting_key VARCHAR(100) NOT NULL,
  setting_value JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(school_id, setting_key)
);

-- -------------------------------------------------------
-- 28. Add super_admin role to roles table
-- -------------------------------------------------------
INSERT INTO roles (name, description) VALUES 
  ('super_admin', 'Platform Super Administrator')
ON CONFLICT (name) DO NOTHING;

-- -------------------------------------------------------
-- 29. Indexes for tenant isolation performance
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_schools_subdomain ON schools(subdomain);
CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_school_code ON schools(school_code);
CREATE INDEX IF NOT EXISTS idx_schools_is_active ON schools(is_active);
CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_teachers_school_id ON teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_attendance_school_id ON attendance(school_id);
CREATE INDEX IF NOT EXISTS idx_assignments_school_id ON assignments(school_id);
CREATE INDEX IF NOT EXISTS idx_grades_school_id ON grades(school_id);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_school_id ON fee_invoices(school_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_school_id ON fee_payments(school_id);
CREATE INDEX IF NOT EXISTS idx_announcements_school_id ON announcements(school_id);
CREATE INDEX IF NOT EXISTS idx_notifications_school_id ON notifications(school_id);
CREATE INDEX IF NOT EXISTS idx_staff_school_id ON staff(school_id);
CREATE INDEX IF NOT EXISTS idx_payroll_school_id ON payroll_records(school_id);
CREATE INDEX IF NOT EXISTS idx_school_invitations_token ON school_invitations(token);
