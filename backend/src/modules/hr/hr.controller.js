import pool from "../../config/db.js";

// ==================== STAFF MANAGEMENT ====================

export const createStaff = async (req, res) => {
    try {
        const { userId, employeeId, designation, department, joiningDate, salary } = req.body;

        if (!userId || !employeeId) {
            return res.status(400).json({ error: "userId and employeeId are required" });
        }

        const result = await pool.query(
            `INSERT INTO staff (user_id, employee_id, designation, department, joining_date, salary)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [userId, employeeId, designation, department, joiningDate || null, salary || null]
        );

        res.status(201).json({ staff: result.rows[0] });
    } catch (error) {
        console.error("Error creating staff:", error);
        res.status(500).json({ error: "Failed to create staff member" });
    }
};

export const getStaff = async (req, res) => {
    try {
        const { id, isActive } = req.query;

        let query = `
      SELECT s.*, u.name, u.email, u.phone 
      FROM staff s
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
        const params = [];
        let paramIndex = 1;

        if (id) {
            query += ` AND s.id = $${paramIndex}`;
            params.push(id);
            paramIndex++;
        }

        if (isActive !== undefined) {
            query += ` AND s.is_active = $${paramIndex}`;
            params.push(isActive === 'true');
            paramIndex++;
        }

        query += ` ORDER BY s.created_at DESC`;

        const result = await pool.query(query, params);
        res.json({ staff: result.rows });
    } catch (error) {
        console.error("Error fetching staff:", error);
        res.status(500).json({ error: "Failed to fetch staff" });
    }
};

export const updateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const { designation, department, salary, isActive } = req.body;

        const result = await pool.query(
            `UPDATE staff 
       SET designation = COALESCE($1, designation),
           department = COALESCE($2, department),
           salary = COALESCE($3, salary),
           is_active = COALESCE($4, is_active)
       WHERE id = $5
       RETURNING *`,
            [designation, department, salary, isActive, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Staff member not found" });
        }

        res.json({ staff: result.rows[0] });
    } catch (error) {
        console.error("Error updating staff:", error);
        res.status(500).json({ error: "Failed to update staff member" });
    }
};

// ==================== LEAVE MANAGEMENT ====================

export const applyLeave = async (req, res) => {
    try {
        const { userId, leaveType, fromDate, toDate, reason } = req.body;

        if (!userId || !leaveType || !fromDate || !toDate) {
            return res.status(400).json({
                error: "userId, leaveType, fromDate, and toDate are required"
            });
        }

        // Validate dates
        const from = new Date(fromDate);
        const to = new Date(toDate);
        if (from > to) {
            return res.status(400).json({ error: "fromDate must be before or equal to toDate" });
        }

        const result = await pool.query(
            `INSERT INTO leave_applications (user_id, leave_type, from_date, to_date, reason)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [userId, leaveType, fromDate, toDate, reason || null]
        );

        res.status(201).json({ leaveApplication: result.rows[0] });
    } catch (error) {
        console.error("Error applying for leave:", error);
        res.status(500).json({ error: "Failed to apply for leave" });
    }
};

export const getLeaves = async (req, res) => {
    try {
        const { userId, status, leaveType } = req.query;

        let query = `
      SELECT la.*, u.name as user_name, u.email,
             approver.name as approved_by_name
      FROM leave_applications la
      JOIN users u ON la.user_id = u.id
      LEFT JOIN users approver ON la.approved_by = approver.id
      WHERE 1=1
    `;
        const params = [];
        let paramIndex = 1;

        if (userId) {
            query += ` AND la.user_id = $${paramIndex}`;
            params.push(userId);
            paramIndex++;
        }

        if (status) {
            query += ` AND la.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (leaveType) {
            query += ` AND la.leave_type = $${paramIndex}`;
            params.push(leaveType);
            paramIndex++;
        }

        query += ` ORDER BY la.created_at DESC`;

        const result = await pool.query(query, params);
        res.json({ leaves: result.rows });
    } catch (error) {
        console.error("Error fetching leaves:", error);
        res.status(500).json({ error: "Failed to fetch leave applications" });
    }
};

export const approveLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, approverId } = req.body; // status: 'approved' or 'rejected'

        if (!status || !approverId) {
            return res.status(400).json({ error: "status and approverId are required" });
        }

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: "status must be 'approved' or 'rejected'" });
        }

        const result = await pool.query(
            `UPDATE leave_applications 
       SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
            [status, approverId, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Leave application not found" });
        }

        res.json({ leaveApplication: result.rows[0] });
    } catch (error) {
        console.error("Error approving leave:", error);
        res.status(500).json({ error: "Failed to approve/reject leave" });
    }
};

export const getMyLeaves = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const result = await pool.query(
            `SELECT la.*, approver.name as approved_by_name
       FROM leave_applications la
       LEFT JOIN users approver ON la.approved_by = approver.id
       WHERE la.user_id = $1
       ORDER BY la.created_at DESC`,
            [userId]
        );

        res.json({ leaves: result.rows });
    } catch (error) {
        console.error("Error fetching my leaves:", error);
        res.status(500).json({ error: "Failed to fetch your leave applications" });
    }
};
