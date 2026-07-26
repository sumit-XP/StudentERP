import pool from "../../config/db.js";
import { notificationService } from "../../utils/notification.service.js";

/**
 * Leave Management Controller
 * Handles teacher leave applications, approvals, and rejections
 */

/**
 * Apply for leave (Teachers only)
 * POST /api/leaves/apply
 */
export const applyLeave = async (req, res) => {
  try {
    const { leave_type, start_date, end_date, reason } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!leave_type || !start_date || !end_date) {
      return res.status(400).json({
        error: "leave_type, start_date, and end_date are required"
      });
    }

    // Validate dates
    const start = new Date(start_date);
    const end = new Date(end_date);
    if (start > end) {
      return res.status(400).json({ error: "start_date must be before or equal to end_date" });
    }

    // Validate leave type
    const validLeaveTypes = ['sick', 'casual', 'medical', 'earned', 'unpaid', 'other'];
    if (!validLeaveTypes.includes(leave_type)) {
      return res.status(400).json({
        error: `leave_type must be one of: ${validLeaveTypes.join(', ')}`
      });
    }

    // Check if user is a teacher
    const teacherCheck = await pool.query(
      `SELECT t.id, u.name, u.email FROM teachers t 
       JOIN users u ON t.user_id = u.id 
       WHERE t.user_id = $1`,
      [userId]
    );

    if (teacherCheck.rows.length === 0) {
      return res.status(403).json({ error: "Only teachers can apply for leave" });
    }

    const result = await pool.query(
      `INSERT INTO leave_applications (user_id, leave_type, from_date, to_date, reason, status)
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
      [userId, leave_type, start_date, end_date, reason || null]
    );

    res.status(201).json({
      message: "Leave application submitted successfully",
      leave: result.rows[0]
    });
  } catch (error) {
    console.error("Error applying for leave:", error);
    res.status(500).json({ error: "Failed to apply for leave" });
  }
};

/**
 * Get my leaves (Teacher views their own leaves)
 * GET /api/leaves/my-leaves
 */
export const getMyLeaves = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT la.*, 
              approver.name as approved_by_name,
              approver.email as approved_by_email
       FROM leave_applications la
       LEFT JOIN users approver ON la.approved_by = approver.id
       WHERE la.user_id = $1
       ORDER BY la.created_at DESC`,
      [userId]
    );

    res.json({
      message: "Leave applications retrieved successfully",
      leaves: result.rows
    });
  } catch (error) {
    console.error("Error fetching my leaves:", error);
    res.status(500).json({ error: "Failed to fetch your leave applications" });
  }
};

/**
 * Get pending leaves (Admin views all pending leaves)
 * GET /api/leaves/pending
 */
export const getPendingLeaves = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT la.*, 
              u.name as teacher_name,
              u.email as teacher_email,
              t.employee_id
       FROM leave_applications la
       JOIN users u ON la.user_id = u.id
       LEFT JOIN teachers t ON t.user_id = u.id
       WHERE la.status = 'pending'
       ORDER BY la.created_at DESC`
    );

    res.json({
      message: "Pending leave applications retrieved successfully",
      count: result.rows.length,
      leaves: result.rows
    });
  } catch (error) {
    console.error("Error fetching pending leaves:", error);
    res.status(500).json({ error: "Failed to fetch pending leave applications" });
  }
};

/**
 * Get all leaves with filters (Admin only)
 * GET /api/leaves
 */
export const getAllLeaves = async (req, res) => {
  try {
    const { status, teacher_id, from_date, to_date } = req.query;

    let query = `
      SELECT la.*, 
             u.name as teacher_name,
             u.email as teacher_email,
             t.employee_id,
             approver.name as approved_by_name
      FROM leave_applications la
      JOIN users u ON la.user_id = u.id
      LEFT JOIN teachers t ON t.user_id = u.id
      LEFT JOIN users approver ON la.approved_by = approver.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND la.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (teacher_id) {
      query += ` AND la.user_id = $${paramIndex}`;
      params.push(teacher_id);
      paramIndex++;
    }

    if (from_date) {
      query += ` AND la.from_date >= $${paramIndex}`;
      params.push(from_date);
      paramIndex++;
    }

    if (to_date) {
      query += ` AND la.to_date <= $${paramIndex}`;
      params.push(to_date);
      paramIndex++;
    }

    query += ` ORDER BY la.created_at DESC`;

    const result = await pool.query(query, params);

    res.json({
      message: "Leave applications retrieved successfully",
      count: result.rows.length,
      leaves: result.rows
    });
  } catch (error) {
    console.error("Error fetching leaves:", error);
    res.status(500).json({ error: "Failed to fetch leave applications" });
  }
};

/**
 * Approve leave application (Admin only)
 * PATCH /api/leaves/:id/approve
 */
export const approveLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const approverId = req.user.userId;

    // Check if leave exists and is pending
    const leaveCheck = await pool.query(
      `SELECT la.*, u.name as teacher_name, u.email as teacher_email
       FROM leave_applications la
       JOIN users u ON la.user_id = u.id
       WHERE la.id = $1`,
      [id]
    );

    if (leaveCheck.rows.length === 0) {
      return res.status(404).json({ error: "Leave application not found" });
    }

    const leave = leaveCheck.rows[0];

    if (leave.status !== 'pending') {
      return res.status(400).json({ error: `Leave is already ${leave.status}` });
    }

    // Update leave status
    const result = await pool.query(
      `UPDATE leave_applications 
       SET status = 'approved', approved_by = $1, approved_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [approverId, id]
    );

    // Send notification to teacher
    const teacher = {
      name: leave.teacher_name,
      email: leave.teacher_email
    };

    await notificationService.sendLeaveStatusNotification(teacher, leave, "Approved");

    res.json({
      message: "Leave application approved successfully",
      leave: result.rows[0]
    });
  } catch (error) {
    console.error("Error approving leave:", error);
    res.status(500).json({ error: "Failed to approve leave" });
  }
};

/**
 * Reject leave application (Admin only)
 * PATCH /api/leaves/:id/reject
 */
export const rejectLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const approverId = req.user.userId;
    const { rejection_reason } = req.body;

    // Check if leave exists and is pending
    const leaveCheck = await pool.query(
      `SELECT la.*, u.name as teacher_name, u.email as teacher_email
       FROM leave_applications la
       JOIN users u ON la.user_id = u.id
       WHERE la.id = $1`,
      [id]
    );

    if (leaveCheck.rows.length === 0) {
      return res.status(404).json({ error: "Leave application not found" });
    }

    const leave = leaveCheck.rows[0];

    if (leave.status !== 'pending') {
      return res.status(400).json({ error: `Leave is already ${leave.status}` });
    }

    // Update leave status
    const result = await pool.query(
      `UPDATE leave_applications 
       SET status = 'rejected', approved_by = $1, approved_at = CURRENT_TIMESTAMP, reason = COALESCE($3, reason)
       WHERE id = $2
       RETURNING *`,
      [approverId, id, rejection_reason]
    );

    // Send notification to teacher
    const teacher = {
      name: leave.teacher_name,
      email: leave.teacher_email
    };

    await notificationService.sendLeaveStatusNotification(teacher, leave, "Rejected");

    res.json({
      message: "Leave application rejected",
      leave: result.rows[0]
    });
  } catch (error) {
    console.error("Error rejecting leave:", error);
    res.status(500).json({ error: "Failed to reject leave" });
  }
};

/**
 * Get leave statistics (Admin only)
 * GET /api/leaves/stats
 */
export const getLeaveStats = async (req, res) => {
  try {
    const { year, month } = req.query;

    let dateFilter = '';
    const params = [];

    if (year) {
      dateFilter = 'AND EXTRACT(YEAR FROM from_date) = $1';
      params.push(year);
    }

    if (month && year) {
      dateFilter += ' AND EXTRACT(MONTH FROM from_date) = $2';
      params.push(month);
    }

    const statsQuery = `
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        leave_type,
        COUNT(*) as count_by_type
      FROM leave_applications
      WHERE 1=1 ${dateFilter}
      GROUP BY leave_type
    `;

    const result = await pool.query(statsQuery, params);

    res.json({
      message: "Leave statistics retrieved successfully",
      stats: result.rows
    });
  } catch (error) {
    console.error("Error fetching leave stats:", error);
    res.status(500).json({ error: "Failed to fetch leave statistics" });
  }
};
