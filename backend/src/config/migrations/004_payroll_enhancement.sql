-- Payroll Module Enhancement Migration
-- Creates salary_structures, payroll_runs, and payslips tables

-- Salary Structures for Teachers
CREATE TABLE IF NOT EXISTS salary_structures (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES teachers(id) ON DELETE CASCADE,
    basic_salary DECIMAL(10,2) NOT NULL,
    hra DECIMAL(10,2) DEFAULT 0, -- House Rent Allowance
    other_allowances DECIMAL(10,2) DEFAULT 0,
    deductions DECIMAL(10,2) DEFAULT 0,
    effective_from DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(teacher_id, effective_from)
);

-- Payroll Runs (monthly payroll generation batches)
CREATE TABLE IF NOT EXISTS payroll_runs (
    id SERIAL PRIMARY KEY,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- draft, processed, closed
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    closed_at TIMESTAMP,
    UNIQUE(month, year)
);

-- Payslips (individual payslip records)
CREATE TABLE IF NOT EXISTS payslips (
    id SERIAL PRIMARY KEY,
    payroll_run_id INTEGER REFERENCES payroll_runs(id) ON DELETE CASCADE,
    teacher_id INTEGER REFERENCES teachers(id) ON DELETE CASCADE,
    basic_salary DECIMAL(10,2) NOT NULL,
    hra DECIMAL(10,2) DEFAULT 0,
    other_allowances DECIMAL(10,2) DEFAULT 0,
    gross DECIMAL(10,2) NOT NULL,
    leave_deductions DECIMAL(10,2) DEFAULT 0,
    other_deductions DECIMAL(10,2) DEFAULT 0,
    total_deductions DECIMAL(10,2) NOT NULL,
    net DECIMAL(10,2) NOT NULL,
    unpaid_leave_days INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'generated', -- generated, paid
    paid_at TIMESTAMP,
    payment_mode VARCHAR(50), -- bank_transfer, cash, cheque
    payment_reference VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(payroll_run_id, teacher_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_salary_structures_teacher_id ON salary_structures(teacher_id);
CREATE INDEX IF NOT EXISTS idx_salary_structures_active ON salary_structures(teacher_id, is_active);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_period ON payroll_runs(year, month);
CREATE INDEX IF NOT EXISTS idx_payslips_run_id ON payslips(payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_payslips_teacher_id ON payslips(teacher_id);
CREATE INDEX IF NOT EXISTS idx_payslips_status ON payslips(status);

-- Update trigger for salary_structures
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_salary_structures_updated_at BEFORE UPDATE ON salary_structures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
