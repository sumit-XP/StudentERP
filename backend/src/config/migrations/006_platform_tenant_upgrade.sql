-- Platform tenant upgrade: 5 digit school codes, school metadata, and super admin role.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_code CHAR(5) UNIQUE,
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
  plan VARCHAR(50) DEFAULT 'basic',
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
ALTER TABLE schools ALTER COLUMN services_taken SET DEFAULT '[]';

UPDATE schools
SET school_code = LPAD((10000 + floor(random() * 90000))::int::text, 5, '0')
WHERE school_code IS NULL;

ALTER TABLE schools ALTER COLUMN school_code SET NOT NULL;

ALTER TABLE users ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE academic_years ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE class_subjects ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE learning_resources ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE fee_structure ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE fee_invoices ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE leave_applications ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

INSERT INTO roles (name, description) VALUES
  ('super_admin', 'Platform Super Administrator')
ON CONFLICT (name) DO NOTHING;

CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_school_code ON schools(school_code);
CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_teachers_school_id ON teachers(school_id);
