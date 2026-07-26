-- Compatibility migration for older StudentERP databases whose schools table
-- predates the tenant metadata columns used by the current auth queries.

ALTER TABLE schools ADD COLUMN IF NOT EXISTS school_code CHAR(5) UNIQUE;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS place VARCHAR(255);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS tenure VARCHAR(100);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS renewal_date DATE;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS services_taken JSONB DEFAULT '[]';
ALTER TABLE schools ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS subdomain VARCHAR(100) UNIQUE;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'basic';
ALTER TABLE schools ADD COLUMN IF NOT EXISTS max_students INTEGER DEFAULT 500;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS max_teachers INTEGER DEFAULT 50;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

UPDATE schools
SET school_code = LPAD((10000 + id)::text, 5, '0')
WHERE school_code IS NULL;

ALTER TABLE schools ALTER COLUMN school_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_school_code ON schools(school_code);

ALTER TABLE academic_years ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id);
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id);
ALTER TABLE class_subjects ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id);
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id);
ALTER TABLE learning_resources ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id);
DO $$ BEGIN
  IF to_regclass('public.fee_structure') IS NOT NULL THEN
    ALTER TABLE fee_structure ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id);
  END IF;

  IF to_regclass('public.fee_invoices') IS NOT NULL THEN
    ALTER TABLE fee_invoices ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id);
  END IF;

  IF to_regclass('public.fee_payments') IS NOT NULL THEN
    ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id);
  END IF;
END $$;

UPDATE academic_years SET school_id = 1 WHERE school_id IS NULL;
UPDATE subjects SET school_id = 1 WHERE school_id IS NULL;
UPDATE classes SET school_id = 1 WHERE school_id IS NULL;
UPDATE students SET school_id = 1 WHERE school_id IS NULL;
UPDATE teachers SET school_id = 1 WHERE school_id IS NULL;
UPDATE users
SET school_id = 1
WHERE school_id IS NULL
  AND role_id IN (SELECT id FROM roles WHERE name <> 'super_admin');

CREATE INDEX IF NOT EXISTS idx_academic_years_school_id ON academic_years(school_id);
CREATE INDEX IF NOT EXISTS idx_subjects_school_id ON subjects(school_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_school_id ON class_subjects(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_teachers_school_id ON teachers(school_id);
