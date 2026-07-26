import pool from "../../config/db.js";

// Helper function to get all teachers and staff with their salaries
async function getUsersWithSalary() {
    const result = await pool.query(`
    SELECT u.id as user_id, u.name, t.salary, 'teacher' as user_type
    FROM users u
    JOIN teachers t ON u.id = t.user_id
    WHERE u.is_active = true AND t.salary IS NOT NULL
    UNION
    SELECT u.id as user_id, u.name, s.salary, 'staff' as user_type
    FROM users u
    JOIN staff s ON u.id = s.user_id
    WHERE u.is_active = true AND s.is_active = true AND s.salary IS NOT NULL
  `);
    return result.rows;
}

// ==================== PAYROLL GENERATION ====================

export const generatePayroll = async (req, res) => {
    try {
        const { month, year } = req.body;

        if (!month || !year) {
            return res.status(400).json({ error: "month and year are required" });
        }

        if (month < 1 || month > 12) {
            return res.status(400).json({ error: "month must be between 1 and 12" });
        }

        // Check if payroll already exists for this period
        const existing = await pool.query(
            `SELECT COUNT(*) as count FROM payroll_records WHERE month = $1 AND year = $2`,
            [month, year]
        );

        if (parseInt(existing.rows[0].count) > 0) {
            return res.status(400).json({
                error: `Payroll for ${month}/${year} already exists. Delete existing records first.`
            });
        }

        // Get all users with salaries
        const users = await getUsersWithSalary();

        if (users.length === 0) {
            return res.json({
                message: "No users with salary found",
                records: []
            });
        }

        const records = [];

        // Generate payroll for each user
        for (const user of users) {
            const basicSalary = parseFloat(user.salary) || 0;

            // Demo: Random deductions between 5-15% of basic salary
            const deductionPercent = 0.05 + Math.random() * 0.10; // 5% to 15%
            const deductions = parseFloat((basicSalary * deductionPercent).toFixed(2));
            const netSalary = parseFloat((basicSalary - deductions).toFixed(2));

            const result = await pool.query(
                `INSERT INTO payroll_records (user_id, month, year, basic_salary, deductions, net_salary, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'generated') RETURNING *`,
                [user.user_id, month, year, basicSalary, deductions, netSalary]
            );

            records.push(result.rows[0]);
        }

        res.status(201).json({
            message: `Payroll generated for ${records.length} users`,
            records
        });
    } catch (error) {
        console.error("Error generating payroll:", error);
        res.status(500).json({ error: "Failed to generate payroll" });
    }
};

// ==================== PAYROLL RETRIEVAL ====================

export const getPayroll = async (req, res) => {
    try {
        const { month, year, userId, status } = req.query;

        let query = `
      SELECT pr.*, u.name as user_name, u.email
      FROM payroll_records pr
      JOIN users u ON pr.user_id = u.id
      WHERE 1=1
    `;
        const params = [];
        let paramIndex = 1;

        if (month) {
            query += ` AND pr.month = $${paramIndex}`;
            params.push(month);
            paramIndex++;
        }

        if (year) {
            query += ` AND pr.year = $${paramIndex}`;
            params.push(year);
            paramIndex++;
        }

        if (userId) {
            query += ` AND pr.user_id = $${paramIndex}`;
            params.push(userId);
            paramIndex++;
        }

        if (status) {
            query += ` AND pr.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        query += ` ORDER BY pr.year DESC, pr.month DESC, u.name`;

        const result = await pool.query(query, params);
        res.json({ payroll: result.rows });
    } catch (error) {
        console.error("Error fetching payroll:", error);
        res.status(500).json({ error: "Failed to fetch payroll records" });
    }
};

export const getMyPayroll = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const result = await pool.query(
            `SELECT * FROM payroll_records 
       WHERE user_id = $1 
       ORDER BY year DESC, month DESC`,
            [userId]
        );

        res.json({ payroll: result.rows });
    } catch (error) {
        console.error("Error fetching my payroll:", error);
        res.status(500).json({ error: "Failed to fetch your payroll records" });
    }
};

// ==================== PAYROLL UPDATE ====================

export const updatePayrollStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, paymentDate } = req.body;

        if (!status) {
            return res.status(400).json({ error: "status is required" });
        }

        if (!['generated', 'paid'].includes(status)) {
            return res.status(400).json({ error: "status must be 'generated' or 'paid'" });
        }

        const result = await pool.query(
            `UPDATE payroll_records 
       SET status = $1, payment_date = $2
       WHERE id = $3
       RETURNING *`,
            [status, paymentDate || null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Payroll record not found" });
        }

        res.json({ payroll: result.rows[0] });
    } catch (error) {
        console.error("Error updating payroll:", error);
        res.status(500).json({ error: "Failed to update payroll status" });
    }
};

// ==================== PAYROLL DELETE ====================

export const deletePayroll = async (req, res) => {
    try {
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({ error: "month and year are required" });
        }

        const result = await pool.query(
            `DELETE FROM payroll_records WHERE month = $1 AND year = $2 RETURNING id`,
            [month, year]
        );

        res.json({
            message: `Deleted ${result.rowCount} payroll records for ${month}/${year}`,
            deletedCount: result.rowCount
        });
    } catch (error) {
        console.error("Error deleting payroll:", error);
        res.status(500).json({ error: "Failed to delete payroll records" });
    }
};

// ==================== ENHANCED PAYROLL MODULE (Task 4) ====================

import { notificationService } from "../../utils/notification.service.js";

/**
 * Create or update salary structure for a teacher
 * POST /api/payroll/salary-structure
 */
export const setSalaryStructure = async (req, res) => {
    try {
        const { teacher_id, basic_salary, hra, other_allowances, deductions, effective_from } = req.body;

        if (!teacher_id || !basic_salary || !effective_from) {
            return res.status(400).json({
                error: "teacher_id, basic_salary, and effective_from are required"
            });
        }

        // Deactivate existing active salary structure for this teacher
        await pool.query(
            `UPDATE salary_structures SET is_active = false WHERE teacher_id = $1 AND is_active = true`,
            [teacher_id]
        );

        // Create new salary structure
        const result = await pool.query(
            `INSERT INTO salary_structures (teacher_id, basic_salary, hra, other_allowances, deductions, effective_from, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING *`,
            [teacher_id, basic_salary, hra || 0, other_allowances || 0, deductions || 0, effective_from]
        );

        res.status(201).json({
            message: "Salary structure created successfully",
            salaryStructure: result.rows[0]
        });
    } catch (error) {
        console.error("Error creating salary structure:", error);
        res.status(500).json({ error: "Failed to create salary structure" });
    }
};

/**
 * Get salary structure for a teacher
 * GET /api/payroll/salary-structure/:id
 */
export const getSalaryStructure = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT ss.*, t.employee_id, u.name as teacher_name, u.email
             FROM salary_structures ss
             JOIN teachers t ON ss.teacher_id = t.id
             JOIN users u ON t.user_id = u.id
             WHERE ss.teacher_id = $1
             ORDER BY ss.effective_from DESC`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "No salary structure found for this teacher" });
        }

        res.json({
            message: "Salary structure retrieved successfully",
            salaryStructures: result.rows
        });
    } catch (error) {
        console.error("Error fetching salary structure:", error);
        res.status(500).json({ error: "Failed to fetch salary structure" });
    }
};

/**
 * Get all salary structures
 * GET /api/payroll/salary-structures
 */
export const getAllSalaryStructures = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT ss.*, t.employee_id, u.name as teacher_name, u.email
             FROM salary_structures ss
             JOIN teachers t ON ss.teacher_id = t.id
             JOIN users u ON t.user_id = u.id
             WHERE ss.is_active = true
             ORDER BY u.name`
        );

        res.json({
            message: "Salary structures retrieved successfully",
            count: result.rows.length,
            salaryStructures: result.rows
        });
    } catch (error) {
        console.error("Error fetching salary structures:", error);
        res.status(500).json({ error: "Failed to fetch salary structures" });
    }
};

/**
 * Calculate unpaid leave days for a teacher in a given month/year
 */
async function calculateUnpaidLeaveDays(teacherId, month, year) {
    try {
        const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
        const endOfMonth = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(endOfMonth).padStart(2, '0')}`;

        const result = await pool.query(
            `SELECT COUNT(*) as unpaid_days
             FROM leave_applications la
             JOIN teachers t ON la.user_id = t.user_id
             WHERE t.id = $1
               AND la.status = 'approved'
               AND la.leave_type = 'unpaid'
               AND la.from_date <= $3
               AND la.to_date >= $2`,
            [teacherId, startOfMonth, endDate]
        );

        return parseInt(result.rows[0]?.unpaid_days || 0);
    } catch (error) {
        console.error("Error calculating unpaid leave days:", error);
        return 0;
    }
}

/**
 * Generate payroll run for a given month/year
 * POST /api/payroll/run
 */
export const generatePayrollRun = async (req, res) => {
    try {
        const { month, year } = req.body;
        const createdBy = req.user.userId;

        if (!month || !year) {
            return res.status(400).json({ error: "month and year are required" });
        }

        if (month < 1 || month > 12) {
            return res.status(400).json({ error: "month must be between 1 and 12" });
        }

        // Check if payroll run already exists
        const existingRun = await pool.query(
            `SELECT id, status FROM payroll_runs WHERE month = $1 AND year = $2`,
            [month, year]
        );

        if (existingRun.rows.length > 0 && existingRun.rows[0].status !== 'draft') {
            return res.status(400).json({
                error: `Payroll for ${month}/${year} is already ${existingRun.rows[0].status}`
            });
        }

        // Create or get payroll run
        let payrollRunId;
        if (existingRun.rows.length > 0) {
            payrollRunId = existingRun.rows[0].id;
            // Delete existing payslips to regenerate
            await pool.query(`DELETE FROM payslips WHERE payroll_run_id = $1`, [payrollRunId]);
        } else {
            const runResult = await pool.query(
                `INSERT INTO payroll_runs (month, year, status, created_by)
                 VALUES ($1, $2, 'draft', $3) RETURNING id`,
                [month, year, createdBy]
            );
            payrollRunId = runResult.rows[0].id;
        }

        // Get all active teachers with their latest salary structures
        const teachersResult = await pool.query(
            `SELECT t.id as teacher_id, t.user_id, t.employee_id, u.name, u.email,
                    ss.basic_salary, ss.hra, ss.other_allowances, ss.deductions
             FROM teachers t
             JOIN users u ON t.user_id = u.id
             LEFT JOIN salary_structures ss ON t.id = ss.teacher_id AND ss.is_active = true
             WHERE u.is_active = true`
        );

        const payslips = [];
        const notifications = [];

        for (const teacher of teachersResult.rows) {
            const basicSalary = parseFloat(teacher.basic_salary || 0);
            const hra = parseFloat(teacher.hra || 0);
            const otherAllowances = parseFloat(teacher.other_allowances || 0);
            const standardDeductions = parseFloat(teacher.deductions || 0);

            // Calculate gross
            const gross = basicSalary + hra + otherAllowances;

            // Calculate unpaid leave deductions
            const unpaidLeaveDays = await calculateUnpaidLeaveDays(teacher.teacher_id, month, year);
            const dailyRate = gross / 30; // Assuming 30 days month
            const leaveDeductions = parseFloat((unpaidLeaveDays * dailyRate).toFixed(2));

            // Calculate total deductions and net
            const totalDeductions = standardDeductions + leaveDeductions;
            const net = parseFloat((gross - totalDeductions).toFixed(2));

            // Create payslip
            const payslipResult = await pool.query(
                `INSERT INTO payslips (payroll_run_id, teacher_id, basic_salary, hra, other_allowances,
                 gross, leave_deductions, other_deductions, total_deductions, net, unpaid_leave_days, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'generated') RETURNING *`,
                [payrollRunId, teacher.teacher_id, basicSalary, hra, otherAllowances,
                 gross, leaveDeductions, standardDeductions, totalDeductions, net, unpaidLeaveDays]
            );

            payslips.push(payslipResult.rows[0]);

            // Queue notification
            const teacherData = {
                name: teacher.name,
                email: teacher.email
            };
            const payslipData = { gross, deductions: totalDeductions, net };
            const monthYear = `${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`;

            notifications.push(
                notificationService.sendPayslipNotification(teacherData, payslipData, monthYear)
            );
        }

        // Update payroll run status to processed
        await pool.query(
            `UPDATE payroll_runs SET status = 'processed', processed_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [payrollRunId]
        );

        // Send notifications in background
        Promise.all(notifications).catch(err => console.error("Error sending notifications:", err));

        res.status(201).json({
            message: `Payroll generated successfully for ${month}/${year}`,
            payrollRunId,
            payslipsGenerated: payslips.length,
            payslips
        });
    } catch (error) {
        console.error("Error generating payroll run:", error);
        res.status(500).json({ error: "Failed to generate payroll run" });
    }
};

/**
 * Get all payroll runs
 * GET /api/payroll/runs
 */
export const getPayrollRuns = async (req, res) => {
    try {
        const { status } = req.query;

        let query = `
            SELECT pr.*, u.name as created_by_name
            FROM payroll_runs pr
            LEFT JOIN users u ON pr.created_by = u.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ` AND pr.status = $1`;
            params.push(status);
        }

        query += ` ORDER BY pr.year DESC, pr.month DESC`;

        const result = await pool.query(query, params);

        res.json({
            message: "Payroll runs retrieved successfully",
            count: result.rows.length,
            payrollRuns: result.rows
        });
    } catch (error) {
        console.error("Error fetching payroll runs:", error);
        res.status(500).json({ error: "Failed to fetch payroll runs" });
    }
};

/**
 * Get payslips for a payroll run
 * GET /api/payroll/payslips/:runId
 */
export const getPayslipsByRun = async (req, res) => {
    try {
        const { runId } = req.params;

        const result = await pool.query(
            `SELECT p.*, t.employee_id, u.name as teacher_name, u.email
             FROM payslips p
             JOIN teachers t ON p.teacher_id = t.id
             JOIN users u ON t.user_id = u.id
             WHERE p.payroll_run_id = $1
             ORDER BY u.name`,
            [runId]
        );

        res.json({
            message: "Payslips retrieved successfully",
            count: result.rows.length,
            payslips: result.rows
        });
    } catch (error) {
        console.error("Error fetching payslips:", error);
        res.status(500).json({ error: "Failed to fetch payslips" });
    }
};

/**
 * Get my payslips (for teachers)
 * GET /api/payroll/my-payslips
 */
export const getMyPayslips = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get teacher_id from user_id
        const teacherResult = await pool.query(
            `SELECT id FROM teachers WHERE user_id = $1`,
            [userId]
        );

        if (teacherResult.rows.length === 0) {
            return res.status(404).json({ error: "Teacher record not found" });
        }

        const teacherId = teacherResult.rows[0].id;

        const result = await pool.query(
            `SELECT p.*, pr.month, pr.year
             FROM payslips p
             JOIN payroll_runs pr ON p.payroll_run_id = pr.id
             WHERE p.teacher_id = $1
             ORDER BY pr.year DESC, pr.month DESC`,
            [teacherId]
        );

        res.json({
            message: "Payslips retrieved successfully",
            payslips: result.rows
        });
    } catch (error) {
        console.error("Error fetching my payslips:", error);
        res.status(500).json({ error: "Failed to fetch payslips" });
    }
};

/**
 * Mark payslip as paid
 * PATCH /api/payroll/payslips/:id/mark-paid
 */
export const markPayslipPaid = async (req, res) => {
    try {
        const { id } = req.params;
        const { payment_mode, payment_reference } = req.body;

        const result = await pool.query(
            `UPDATE payslips
             SET status = 'paid', paid_at = CURRENT_TIMESTAMP, payment_mode = $2, payment_reference = $3
             WHERE id = $1
             RETURNING *`,
            [id, payment_mode || 'bank_transfer', payment_reference || null]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Payslip not found" });
        }

        res.json({
            message: "Payslip marked as paid",
            payslip: result.rows[0]
        });
    } catch (error) {
        console.error("Error marking payslip paid:", error);
        res.status(500).json({ error: "Failed to mark payslip as paid" });
    }
};

/**
 * Get detailed payslip by ID
 * GET /api/payroll/payslips/detail/:id
 */
export const getPayslipDetail = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT p.*, pr.month, pr.year, t.employee_id, u.name as teacher_name, u.email
             FROM payslips p
             JOIN payroll_runs pr ON p.payroll_run_id = pr.id
             JOIN teachers t ON p.teacher_id = t.id
             JOIN users u ON t.user_id = u.id
             WHERE p.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Payslip not found" });
        }

        res.json({
            message: "Payslip retrieved successfully",
            payslip: result.rows[0]
        });
    } catch (error) {
        console.error("Error fetching payslip detail:", error);
        res.status(500).json({ error: "Failed to fetch payslip" });
    }
};

