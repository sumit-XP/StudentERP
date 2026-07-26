-- Migration: Add multi-tenant support (schools table + school_id on users)
-- Run with: node migrate.js

-- 1) Add super_admin role if missing
INSERT INTO roles (name, description) VALUES 
('super_admin', 'Super Administrator with full access')
ON CONFLICT (name) DO NOTHING;

-- 2) Create schools table
CREATE TABLE IF NOT EXISTS schools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3) Insert a default school so registrations work immediately
INSERT INTO schools (id, name, address, email, is_active)
VALUES (1, 'Default School', 'Main Campus', 'admin@school.com', true)
ON CONFLICT (id) DO NOTHING;

-- 4) Add school_id to users if it doesn't exist
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN school_id INTEGER REFERENCES schools(id);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- 5) Add school_id to classes if it doesn't exist
DO $$ BEGIN
  ALTER TABLE classes ADD COLUMN school_id INTEGER REFERENCES schools(id);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- 6) Add school_id to students if it doesn't exist
DO $$ BEGIN
  ALTER TABLE students ADD COLUMN school_id INTEGER REFERENCES schools(id);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- 7) Indexes
CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_schools_is_active ON schools(is_active);
