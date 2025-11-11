import pool from "../../config/db.js";

// Mark Attendance
export const markAttendance = async (req, res) => {
  try {
    const { attendanceData } = req.body; // Array of attendance records
    const { uid } = req.user;

    if (!attendanceData || !Array.isArray(attendanceData)) {
      return res.status(400).json({ error: "Attendance data must be an array" });
    }

    // Get teacher/admin user ID
    const userResult = await pool.query("SELECT id FROM users WHERE firebase_uid = $1", [uid]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const markedBy = userResult.rows[0].id;

    const results = [];
    
    for (const record of attendanceData) {
      const { studentId, classId, subjectId, date, status, remarks } = record;

      if (!studentId || !classId || !date || !status) {
        results.push({ 
          studentId, 
          error: "Student ID, Class ID, Date, and Status are required" 
        });
        continue;
      }

      try {
        // Check if attendance already exists for this student, class, subject, and date
        const existingAttendance = await pool.query(
          "SELECT id FROM attendance WHERE student_id = $1 AND class_id = $2 AND subject_id = $3 AND date = $4",
          [studentId, classId, subjectId, date]
        );

        let result;
        if (existingAttendance.rows.length > 0) {
          // Update existing attendance
          result = await pool.query(
            `UPDATE attendance 
             SET status = $1, remarks = $2, marked_by = $3 
             WHERE student_id = $4 AND class_id = $5 AND subject_id = $6 AND date = $7 
             RETURNING *`,
            [status, remarks, markedBy, studentId, classId, subjectId, date]
          );
        } else {
          // Insert new attendance record
          result = await pool.query(
            `INSERT INTO attendance (student_id, class_id, subject_id, date, status, marked_by, remarks) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [studentId, classId, subjectId, date, status, markedBy, remarks]
          );
        }

        results.push({ 
          studentId, 
          success: true, 
          attendance: result.rows[0] 
        });
      } catch (error) {
        console.error(`Error marking attendance for student ${studentId}:`, error);
        results.push({ 
          studentId, 
          error: "Failed to mark attendance for this student" 
        });
      }
    }

    res.json({
      message: "Attendance marking completed",
      results: results
    });
  } catch (error) {
    console.error("Mark attendance error:", error);
    res.status(500).json({ error: "Failed to mark attendance" });
  }
};

// Get Attendance by Class and Date
export const getAttendanceByClassAndDate = async (req, res) => {
  try {
    const { classId, date, subjectId } = req.query;

    if (!classId || !date) {
      return res.status(400).json({ error: "Class ID and Date are required" });
    }

    let query = `
      SELECT a.*, s.student_id, u.name as student_name, s.roll_number,
             sub.name as subject_name, sub.code as subject_code
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN subjects sub ON a.subject_id = sub.id
      WHERE a.class_id = $1 AND a.date = $2
    `;
    
    const queryParams = [classId, date];
    
    if (subjectId) {
      query += " AND a.subject_id = $3";
      queryParams.push(subjectId);
    }
    
    query += " ORDER BY s.roll_number, u.name";

    const result = await pool.query(query, queryParams);

    res.json({ attendance: result.rows });
  } catch (error) {
    console.error("Get attendance error:", error);
    res.status(500).json({ error: "Failed to fetch attendance" });
  }
};

// Get Student Attendance Summary
export const getStudentAttendanceSummary = async (req, res) => {
  try {
    const { studentId, startDate, endDate, subjectId } = req.query;

    if (!studentId) {
      return res.status(400).json({ error: "Student ID is required" });
    }

    let query = `
      SELECT 
        COUNT(*) as total_days,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_days,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late_days,
        COUNT(CASE WHEN status = 'excused' THEN 1 END) as excused_days,
        ROUND(
          (COUNT(CASE WHEN status = 'present' THEN 1 END) * 100.0 / 
           NULLIF(COUNT(*), 0)), 2
        ) as attendance_percentage
      FROM attendance 
      WHERE student_id = $1
    `;
    
    const queryParams = [studentId];
    let paramCount = 1;

    if (startDate) {
      paramCount++;
      query += ` AND date >= $${paramCount}`;
      queryParams.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND date <= $${paramCount}`;
      queryParams.push(endDate);
    }

    if (subjectId) {
      paramCount++;
      query += ` AND subject_id = $${paramCount}`;
      queryParams.push(subjectId);
    }

    const summaryResult = await pool.query(query, queryParams);

    // Get detailed attendance records
    let detailQuery = `
      SELECT a.*, sub.name as subject_name, sub.code as subject_code
      FROM attendance a
      LEFT JOIN subjects sub ON a.subject_id = sub.id
      WHERE a.student_id = $1
    `;
    
    const detailParams = [studentId];
    let detailParamCount = 1;

    if (startDate) {
      detailParamCount++;
      detailQuery += ` AND a.date >= $${detailParamCount}`;
      detailParams.push(startDate);
    }

    if (endDate) {
      detailParamCount++;
      detailQuery += ` AND a.date <= $${detailParamCount}`;
      detailParams.push(endDate);
    }

    if (subjectId) {
      detailParamCount++;
      detailQuery += ` AND a.subject_id = $${detailParamCount}`;
      detailParams.push(subjectId);
    }

    detailQuery += " ORDER BY a.date DESC, sub.name";

    const detailResult = await pool.query(detailQuery, detailParams);

    res.json({
      summary: summaryResult.rows[0],
      records: detailResult.rows
    });
  } catch (error) {
    console.error("Get student attendance summary error:", error);
    res.status(500).json({ error: "Failed to fetch attendance summary" });
  }
};

// Get Class Attendance Summary
export const getClassAttendanceSummary = async (req, res) => {
  try {
    const { classId, startDate, endDate, subjectId } = req.query;

    if (!classId) {
      return res.status(400).json({ error: "Class ID is required" });
    }

    let query = `
      SELECT 
        s.id as student_id,
        s.student_id as student_number,
        u.name as student_name,
        s.roll_number,
        COUNT(a.id) as total_days,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
        COUNT(CASE WHEN a.status = 'excused' THEN 1 END) as excused_days,
        ROUND(
          (COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / 
           NULLIF(COUNT(a.id), 0)), 2
        ) as attendance_percentage
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN attendance a ON s.id = a.student_id AND a.class_id = s.class_id
      WHERE s.class_id = $1
    `;
    
    const queryParams = [classId];
    let paramCount = 1;

    if (startDate) {
      paramCount++;
      query += ` AND (a.date IS NULL OR a.date >= $${paramCount})`;
      queryParams.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND (a.date IS NULL OR a.date <= $${paramCount})`;
      queryParams.push(endDate);
    }

    if (subjectId) {
      paramCount++;
      query += ` AND (a.subject_id IS NULL OR a.subject_id = $${paramCount})`;
      queryParams.push(subjectId);
    }

    query += `
      GROUP BY s.id, s.student_id, u.name, s.roll_number
      ORDER BY s.roll_number, u.name
    `;

    const result = await pool.query(query, queryParams);

    res.json({ attendanceSummary: result.rows });
  } catch (error) {
    console.error("Get class attendance summary error:", error);
    res.status(500).json({ error: "Failed to fetch class attendance summary" });
  }
};

// Get Attendance Report
export const getAttendanceReport = async (req, res) => {
  try {
    const { classId, startDate, endDate, format = 'summary' } = req.query;

    if (!classId || !startDate || !endDate) {
      return res.status(400).json({ error: "Class ID, start date, and end date are required" });
    }

    if (format === 'detailed') {
      // Detailed day-by-day report
      const result = await pool.query(`
        SELECT 
          a.date,
          s.student_id,
          u.name as student_name,
          s.roll_number,
          a.status,
          a.remarks,
          sub.name as subject_name
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        JOIN users u ON s.user_id = u.id
        LEFT JOIN subjects sub ON a.subject_id = sub.id
        WHERE a.class_id = $1 AND a.date BETWEEN $2 AND $3
        ORDER BY a.date, s.roll_number
      `, [classId, startDate, endDate]);

      res.json({ attendanceReport: result.rows });
    } else {
      // Summary report (default)
      const result = await pool.query(`
        SELECT 
          s.student_id,
          u.name as student_name,
          s.roll_number,
          COUNT(a.id) as total_days,
          COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
          COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
          COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
          COUNT(CASE WHEN a.status = 'excused' THEN 1 END) as excused_days,
          ROUND(
            (COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / 
             NULLIF(COUNT(a.id), 0)), 2
          ) as attendance_percentage
        FROM students s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN attendance a ON s.id = a.student_id 
          AND a.class_id = s.class_id 
          AND a.date BETWEEN $2 AND $3
        WHERE s.class_id = $1
        GROUP BY s.id, s.student_id, u.name, s.roll_number
        ORDER BY s.roll_number
      `, [classId, startDate, endDate]);

      res.json({ attendanceReport: result.rows });
    }
  } catch (error) {
    console.error("Get attendance report error:", error);
    res.status(500).json({ error: "Failed to generate attendance report" });
  }
};

// Get My Attendance (for students)
export const getMyAttendance = async (req, res) => {
  try {
    const { uid } = req.user;
    const { startDate, endDate, subjectId } = req.query;

    // Get student ID from user
    const studentResult = await pool.query(
      "SELECT id FROM students WHERE user_id = (SELECT id FROM users WHERE firebase_uid = $1)",
      [uid]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: "Student record not found" });
    }

    const studentId = studentResult.rows[0].id;

    // Use existing function logic
    req.query.studentId = studentId;
    return getStudentAttendanceSummary(req, res);
  } catch (error) {
    console.error("Get my attendance error:", error);
    res.status(500).json({ error: "Failed to fetch attendance" });
  }
};
