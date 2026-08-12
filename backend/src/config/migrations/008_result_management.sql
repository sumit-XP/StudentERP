-- =====================================================================
-- Migration 008: Result Management & Publishing System
-- Creates: exams, exam_subject_submissions, exam_class_publications
-- Modifies: grades (adds exam_id)
-- =====================================================================

-- Exams table: Admin defines formal exams (Unit Test 1, Midterm, Final etc.)
CREATE TABLE IF NOT EXISTS exams (
    id SERIAL PRIMARY KEY,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    exam_type VARCHAR(50) NOT NULL,  -- 'unit_test', 'midterm', 'final', 'term'
    academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE SET NULL,
    start_date DATE,
    end_date DATE,
    max_marks DECIMAL(5,2) DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exam Subject Submissions: Tracks each teacher's submission status per exam+class+subject
CREATE TABLE IF NOT EXISTS exam_subject_submissions (
    id SERIAL PRIMARY KEY,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- 'pending', 'draft', 'submitted'
    submitted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exam_id, class_id, subject_id)
);

-- Exam Class Publications: Tracks whether Admin has published results for a class+exam
CREATE TABLE IF NOT EXISTS exam_class_publications (
    id SERIAL PRIMARY KEY,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP,
    published_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exam_id, class_id)
);

-- Add exam_id to grades table to link grades to formal exams
ALTER TABLE grades ADD COLUMN IF NOT EXISTS exam_id INTEGER REFERENCES exams(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_exams_school_id ON exams(school_id);
CREATE INDEX IF NOT EXISTS idx_exams_academic_year ON exams(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_exam_submissions_exam_id ON exam_subject_submissions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_submissions_class_id ON exam_subject_submissions(class_id);
CREATE INDEX IF NOT EXISTS idx_exam_submissions_teacher_id ON exam_subject_submissions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_exam_publications_exam_id ON exam_class_publications(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_publications_class_id ON exam_class_publications(class_id);
CREATE INDEX IF NOT EXISTS idx_grades_exam_id ON grades(exam_id);
