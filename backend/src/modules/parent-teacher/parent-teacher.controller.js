import pool from "../../config/db.js";

// ==================== PARENT-TEACHER MEETINGS ====================

// Schedule Parent-Teacher Meeting
export const scheduleMeeting = async (req, res) => {
    try {
        const { studentId, teacherId, scheduledAt, topic } = req.body;
        const { uid } = req.user;

        if (!studentId || !teacherId || !scheduledAt) {
            return res.status(400).json({
                error: "Student ID, Teacher ID, and Scheduled time are required"
            });
        }

        // Get the requesting user's ID
        const userResult = await pool.query(
            "SELECT id FROM users WHERE uid = $1",
            [uid]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        // Get student's class
        const studentResult = await pool.query(
            "SELECT class_id FROM students WHERE id = $1",
            [studentId]
        );

        if (studentResult.rows.length === 0) {
            return res.status(404).json({ error: "Student not found" });
        }

        const classId = studentResult.rows[0].class_id;

        // Insert meeting
        const result = await pool.query(
            `INSERT INTO parent_teacher_meetings 
       (class_id, student_id, teacher_id, scheduled_at, topic, status) 
       VALUES ($1, $2, $3, $4, $5, 'scheduled') 
       RETURNING *`,
            [classId, studentId, teacherId, scheduledAt, topic]
        );

        res.status(201).json({
            message: "Meeting scheduled successfully",
            meeting: result.rows[0]
        });
    } catch (error) {
        console.error("Schedule meeting error:", error);
        res.status(500).json({ error: "Failed to schedule meeting" });
    }
};

// Get Meetings
export const getMeetings = async (req, res) => {
    try {
        const { studentId, teacherId, status, startDate, endDate } = req.query;
        const { uid, role } = req.user;

        let query = `
      SELECT 
        ptm.*,
        s.student_id as student_number,
        us.name as student_name,
        ut.name as teacher_name,
        c.name as class_name,
        c.section
      FROM parent_teacher_meetings ptm
      JOIN students s ON ptm.student_id = s.id
      JOIN users us ON s.user_id = us.id
      JOIN users ut ON ptm.teacher_id = ut.id
      LEFT JOIN classes c ON ptm.class_id = c.id
      WHERE 1=1
    `;

        const queryParams = [];
        let paramCount = 0;

        // Filter by role
        if (role === "parent") {
            paramCount++;
            query += ` AND s.parent_id = (SELECT id FROM users WHERE uid = $${paramCount})`;
            queryParams.push(uid);
        } else if (role === "teacher") {
            paramCount++;
            query += ` AND ptm.teacher_id = (SELECT id FROM users WHERE uid = $${paramCount})`;
            queryParams.push(uid);
        }

        if (studentId) {
            paramCount++;
            query += ` AND ptm.student_id = $${paramCount}`;
            queryParams.push(studentId);
        }

        if (teacherId) {
            paramCount++;
            query += ` AND ptm.teacher_id = $${paramCount}`;
            queryParams.push(teacherId);
        }

        if (status) {
            paramCount++;
            query += ` AND ptm.status = $${paramCount}`;
            queryParams.push(status);
        }

        if (startDate) {
            paramCount++;
            query += ` AND ptm.scheduled_at >= $${paramCount}`;
            queryParams.push(startDate);
        }

        if (endDate) {
            paramCount++;
            query += ` AND ptm.scheduled_at <= $${paramCount}`;
            queryParams.push(endDate);
        }

        query += ` ORDER BY ptm.scheduled_at DESC`;

        const result = await pool.query(query, queryParams);

        res.json({
            meetings: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error("Get meetings error:", error);
        res.status(500).json({ error: "Failed to fetch meetings" });
    }
};

// Get Meeting by ID
export const getMeetingById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT 
        ptm.*,
        s.student_id as student_number,
        us.name as student_name,
        us.email as student_email,
        ut.name as teacher_name,
        ut.email as teacher_email,
        c.name as class_name,
        c.section
      FROM parent_teacher_meetings ptm
      JOIN students s ON ptm.student_id = s.id
      JOIN users us ON s.user_id = us.id
      JOIN users ut ON ptm.teacher_id = ut.id
      LEFT JOIN classes c ON ptm.class_id = c.id
      WHERE ptm.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Meeting not found" });
        }

        res.json({ meeting: result.rows[0] });
    } catch (error) {
        console.error("Get meeting by ID error:", error);
        res.status(500).json({ error: "Failed to fetch meeting" });
    }
};

// Update Meeting
export const updateMeeting = async (req, res) => {
    try {
        const { id } = req.params;
        const { scheduledAt, topic, notes } = req.body;

        const result = await pool.query(
            `UPDATE parent_teacher_meetings 
       SET scheduled_at = COALESCE($1, scheduled_at),
           topic = COALESCE($2, topic),
           notes = COALESCE($3, notes)
       WHERE id = $4 AND status = 'scheduled'
       RETURNING *`,
            [scheduledAt, topic, notes, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Meeting not found or cannot be updated"
            });
        }

        res.json({
            message: "Meeting updated successfully",
            meeting: result.rows[0]
        });
    } catch (error) {
        console.error("Update meeting error:", error);
        res.status(500).json({ error: "Failed to update meeting" });
    }
};

// Update Meeting Status
export const updateMeetingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        if (!status || !["scheduled", "completed", "cancelled"].includes(status)) {
            return res.status(400).json({
                error: "Valid status is required (scheduled, completed, cancelled)"
            });
        }

        const result = await pool.query(
            `UPDATE parent_teacher_meetings 
       SET status = $1,
           notes = COALESCE($2, notes)
       WHERE id = $3
       RETURNING *`,
            [status, notes, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Meeting not found" });
        }

        res.json({
            message: "Meeting status updated successfully",
            meeting: result.rows[0]
        });
    } catch (error) {
        console.error("Update meeting status error:", error);
        res.status(500).json({ error: "Failed to update meeting status" });
    }
};

// Cancel Meeting
export const cancelMeeting = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE parent_teacher_meetings 
       SET status = 'cancelled'
       WHERE id = $1
       RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Meeting not found" });
        }

        res.json({
            message: "Meeting cancelled successfully",
            meeting: result.rows[0]
        });
    } catch (error) {
        console.error("Cancel meeting error:", error);
        res.status(500).json({ error: "Failed to cancel meeting" });
    }
};

// ==================== PARENT FEEDBACK ====================

// Submit Feedback
export const submitFeedback = async (req, res) => {
    try {
        const { studentId, feedbackType, subject, message } = req.body;
        const { uid } = req.user;

        if (!studentId || !feedbackType || !message) {
            return res.status(400).json({
                error: "Student ID, Feedback Type, and Message are required"
            });
        }

        if (!["feedback", "complaint", "suggestion"].includes(feedbackType)) {
            return res.status(400).json({
                error: "Feedback type must be 'feedback', 'complaint', or 'suggestion'"
            });
        }

        // Get parent user ID
        const userResult = await pool.query(
            "SELECT id FROM users WHERE uid = $1",
            [uid]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const parentId = userResult.rows[0].id;

        // Insert feedback
        const result = await pool.query(
            `INSERT INTO parent_feedback 
       (student_id, parent_id, feedback_type, subject, message, status) 
       VALUES ($1, $2, $3, $4, $5, 'open') 
       RETURNING *`,
            [studentId, parentId, feedbackType, subject, message]
        );

        res.status(201).json({
            message: "Feedback submitted successfully",
            feedback: result.rows[0]
        });
    } catch (error) {
        console.error("Submit feedback error:", error);
        res.status(500).json({ error: "Failed to submit feedback" });
    }
};

// Get Feedback
export const getFeedback = async (req, res) => {
    try {
        const { studentId, feedbackType, status } = req.query;
        const { uid, role } = req.user;

        let query = `
      SELECT 
        pf.*,
        s.student_id as student_number,
        us.name as student_name,
        up.name as parent_name,
        up.email as parent_email,
        c.name as class_name,
        c.section
      FROM parent_feedback pf
      JOIN students s ON pf.student_id = s.id
      JOIN users us ON s.user_id = us.id
      JOIN users up ON pf.parent_id = up.id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE 1=1
    `;

        const queryParams = [];
        let paramCount = 0;

        // Filter by role
        if (role === "parent") {
            paramCount++;
            query += ` AND pf.parent_id = (SELECT id FROM users WHERE uid = $${paramCount})`;
            queryParams.push(uid);
        }

        if (studentId) {
            paramCount++;
            query += ` AND pf.student_id = $${paramCount}`;
            queryParams.push(studentId);
        }

        if (feedbackType) {
            paramCount++;
            query += ` AND pf.feedback_type = $${paramCount}`;
            queryParams.push(feedbackType);
        }

        if (status) {
            paramCount++;
            query += ` AND pf.status = $${paramCount}`;
            queryParams.push(status);
        }

        query += ` ORDER BY pf.created_at DESC`;

        const result = await pool.query(query, queryParams);

        res.json({
            feedback: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error("Get feedback error:", error);
        res.status(500).json({ error: "Failed to fetch feedback" });
    }
};

// Get Feedback by ID
export const getFeedbackById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT 
        pf.*,
        s.student_id as student_number,
        us.name as student_name,
        up.name as parent_name,
        up.email as parent_email,
        c.name as class_name,
        c.section
      FROM parent_feedback pf
      JOIN students s ON pf.student_id = s.id
      JOIN users us ON s.user_id = us.id
      JOIN users up ON pf.parent_id = up.id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE pf.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Feedback not found" });
        }

        res.json({ feedback: result.rows[0] });
    } catch (error) {
        console.error("Get feedback by ID error:", error);
        res.status(500).json({ error: "Failed to fetch feedback" });
    }
};

// Update Feedback Status
export const updateFeedbackStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !["open", "resolved", "dismissed"].includes(status)) {
            return res.status(400).json({
                error: "Valid status is required (open, resolved, dismissed)"
            });
        }

        const resolvedAt = status === "resolved" ? new Date() : null;

        const result = await pool.query(
            `UPDATE parent_feedback 
       SET status = $1,
           resolved_at = $2
       WHERE id = $3
       RETURNING *`,
            [status, resolvedAt, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Feedback not found" });
        }

        res.json({
            message: "Feedback status updated successfully",
            feedback: result.rows[0]
        });
    } catch (error) {
        console.error("Update feedback status error:", error);
        res.status(500).json({ error: "Failed to update feedback status" });
    }
};

// Resolve Feedback
export const resolveFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const { resolutionNotes } = req.body;

        const result = await pool.query(
            `UPDATE parent_feedback 
       SET status = 'resolved',
           resolved_at = CURRENT_TIMESTAMP,
           message = CASE 
             WHEN $1 IS NOT NULL THEN message || E'\n\nResolution: ' || $1 
             ELSE message 
           END
       WHERE id = $2
       RETURNING *`,
            [resolutionNotes, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Feedback not found" });
        }

        res.json({
            message: "Feedback resolved successfully",
            feedback: result.rows[0]
        });
    } catch (error) {
        console.error("Resolve feedback error:", error);
        res.status(500).json({ error: "Failed to resolve feedback" });
    }
};

// ==================== TASK 5: PARENT-TEACHER MEETING APIS ====================

import { notificationService } from "../../utils/notification.service.js";

/**
 * Schedule PTM (Admin only)
 * POST /api/ptm/schedule
 */
export const schedulePTM = async (req, res) => {
    try {
        const { teacher_id, parent_id, student_id, slot_time, topic, notes } = req.body;
        const { userId } = req.user;

        if (!teacher_id || !parent_id || !slot_time) {
            return res.status(400).json({
                error: "teacher_id, parent_id, and slot_time are required"
            });
        }

        // Get student's class
        const studentResult = await pool.query(
            "SELECT class_id FROM students WHERE id = $1",
            [student_id]
        );

        const classId = studentResult.rows[0]?.class_id;

        // Create meeting
        const result = await pool.query(
            `INSERT INTO parent_teacher_meetings 
             (class_id, student_id, teacher_id, scheduled_at, topic, notes, status) 
             VALUES ($1, $2, $3, $4, $5, $6, 'scheduled') 
             RETURNING *`,
            [classId, student_id, teacher_id, slot_time, topic, notes]
        );

        const meeting = result.rows[0];

        // Get teacher and parent details for notifications
        const teacherResult = await pool.query(
            `SELECT name, email FROM users WHERE id = $1`,
            [teacher_id]
        );

        const parentResult = await pool.query(
            `SELECT name, email FROM users WHERE id = $1`,
            [parent_id]
        );

        // Send notifications
        if (teacherResult.rows.length > 0) {
            await notificationService.sendPTMNotification(
                teacherResult.rows[0],
                meeting,
                'scheduled'
            );
        }

        if (parentResult.rows.length > 0) {
            await notificationService.sendPTMNotification(
                parentResult.rows[0],
                meeting,
                'scheduled'
            );
        }

        res.status(201).json({
            message: "Meeting scheduled successfully",
            meeting
        });
    } catch (error) {
        console.error("Schedule PTM error:", error);
        res.status(500).json({ error: "Failed to schedule meeting" });
    }
};

/**
 * Get upcoming meetings
 * GET /api/ptm/upcoming
 */
export const getUpcomingMeetings = async (req, res) => {
    try {
        const { role, userId } = req.user;

        let query = `
            SELECT 
                ptm.*,
                s.student_id as student_number,
                us.name as student_name,
                ut.name as teacher_name,
                ut.email as teacher_email,
                up.name as parent_name,
                up.email as parent_email,
                c.name as class_name,
                c.section
            FROM parent_teacher_meetings ptm
            JOIN students s ON ptm.student_id = s.id
            JOIN users us ON s.user_id = us.id
            JOIN users ut ON ptm.teacher_id = ut.id
            LEFT JOIN users up ON s.parent_id = up.id
            LEFT JOIN classes c ON ptm.class_id = c.id
            WHERE ptm.scheduled_at >= CURRENT_TIMESTAMP
              AND ptm.status = 'scheduled'
        `;

        const params = [];

        // Filter by role
        if (role === 'teacher') {
            query += ` AND ptm.teacher_id = $1`;
            params.push(userId);
        } else if (role === 'parent') {
            query += ` AND s.parent_id = $1`;
            params.push(userId);
        }

        query += ` ORDER BY ptm.scheduled_at ASC`;

        const result = await pool.query(query, params);

        res.json({
            message: "Upcoming meetings retrieved successfully",
            count: result.rows.length,
            meetings: result.rows
        });
    } catch (error) {
        console.error("Get upcoming meetings error:", error);
        res.status(500).json({ error: "Failed to fetch upcoming meetings" });
    }
};

/**
 * Cancel PTM
 * PATCH /api/ptm/:id/cancel
 */
export const cancelPTM = async (req, res) => {
    try {
        const { id } = req.params;
        const { cancellation_reason } = req.body;

        // Get meeting details before cancelling
        const meetingResult = await pool.query(
            `SELECT ptm.*, 
                    ut.name as teacher_name, ut.email as teacher_email,
                    up.name as parent_name, up.email as parent_email
             FROM parent_teacher_meetings ptm
             JOIN users ut ON ptm.teacher_id = ut.id
             LEFT JOIN students s ON ptm.student_id = s.id
             LEFT JOIN users up ON s.parent_id = up.id
             WHERE ptm.id = $1`,
            [id]
        );

        if (meetingResult.rows.length === 0) {
            return res.status(404).json({ error: "Meeting not found" });
        }

        const meeting = meetingResult.rows[0];

        // Update status to cancelled
        const result = await pool.query(
            `UPDATE parent_teacher_meetings 
             SET status = 'cancelled',
                 notes = COALESCE(notes, '') || E'\n\nCancellation reason: ' || $2
             WHERE id = $1
             RETURNING *`,
            [id, cancellation_reason || 'No reason provided']
        );

        // Send cancellation notifications
        if (meeting.teacher_email) {
            await notificationService.sendPTMNotification(
                { name: meeting.teacher_name, email: meeting.teacher_email },
                meeting,
                'cancelled'
            );
        }

        if (meeting.parent_email) {
            await notificationService.sendPTMNotification(
                { name: meeting.parent_name, email: meeting.parent_email },
                meeting,
                'cancelled'
            );
        }

        res.json({
            message: "Meeting cancelled successfully",
            meeting: result.rows[0]
        });
    } catch (error) {
        console.error("Cancel PTM error:", error);
        res.status(500).json({ error: "Failed to cancel meeting" });
    }
};
