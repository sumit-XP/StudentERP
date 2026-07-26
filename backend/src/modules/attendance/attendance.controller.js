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
    const userResult = await pool.query("SELECT id FROM users WHERE uid = $1", [uid]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const markedBy = userResult.rows[0].id;

    if (attendanceData.length > 0) {
      const sample = attendanceData[0];
      if (sample.classId && sample.date) {
        const existingCheck = await pool.query(
          "SELECT id FROM attendance WHERE class_id = $1 AND date = $2 LIMIT 1",
          [sample.classId, sample.date]
        );
        if (existingCheck.rows.length > 0) {
          return res.status(400).json({ error: "Attendance already marked for this class on this date" });
        }
      }
    }

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

    // Check if it's marked as non-working day
    const nwd = await pool.query(
      "SELECT id FROM non_working_days WHERE class_id = $1 AND date = $2",
      [classId, date]
    );

    res.json({ 
      attendance: result.rows,
      isNonWorkingDay: nwd.rows.length > 0
    });
  } catch (error) {
    console.error("Get attendance error:", error);
    res.status(500).json({ error: "Failed to fetch attendance" });
  }
};

// Helper to calculate total working days between dates
const getWorkingDays = async (classId, schoolId, startDate, endDate) => {
  // 1. Get base weekdays (excluding Sunday = 7 in isodow)
  const weekdaysRes = await pool.query(`
    SELECT count(*) as days 
    FROM generate_series($1::date, $2::date, '1 day') AS gs(d) 
    WHERE extract(isodow from d) < 7
  `, [startDate, endDate]);
  
  const baseDays = parseInt(weekdaysRes.rows[0].days, 10);

  // 2. Subtract marked non-working days for this class that fell on weekdays
  const nwdRes = await pool.query(`
    SELECT count(*) as nwd
    FROM non_working_days
    WHERE class_id = $1 AND date >= $2 AND date <= $3
      AND extract(isodow from date) < 7
  `, [classId, startDate, endDate]);

  const nwdDays = parseInt(nwdRes.rows[0].nwd, 10);
  
  return baseDays - nwdDays;
};

// Get Student Attendance Summary
export const getStudentAttendanceSummary = async (req, res) => {
  try {
    const { studentId, startDate, endDate, subjectId } = req.query;

    if (!studentId) {
      return res.status(400).json({ error: "Student ID is required" });
    }

    const stRes = await pool.query("SELECT class_id, school_id FROM students WHERE id = $1", [studentId]);
    if (stRes.rows.length === 0) return res.status(404).json({ error: "Student not found" });
    const { class_id: classId, school_id: schoolId } = stRes.rows[0];

    // Determine calculation range
    let calcStart = startDate;
    let calcEnd = endDate || new Date().toISOString().slice(0, 10);

    if (!calcStart) {
      const ayRes = await pool.query("SELECT start_date FROM academic_years WHERE school_id = $1 AND is_current = true", [schoolId]);
      if (ayRes.rows.length > 0) {
        calcStart = new Date(ayRes.rows[0].start_date).toISOString().slice(0, 10);
      } else {
        const minAtt = await pool.query("SELECT min(date) as min_date FROM attendance WHERE class_id = $1", [classId]);
        calcStart = minAtt.rows[0].min_date ? new Date(minAtt.rows[0].min_date).toISOString().slice(0, 10) : calcEnd;
      }
    }

    let query = `
      SELECT 
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_days,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late_days,
        COUNT(CASE WHEN status = 'excused' THEN 1 END) as excused_days
      FROM attendance 
      WHERE student_id = $1
    `;
    
    const queryParams = [studentId];
    let paramCount = 1;

    if (calcStart) {
      paramCount++;
      query += ` AND date >= $${paramCount}`;
      queryParams.push(calcStart);
    }

    if (calcEnd) {
      paramCount++;
      query += ` AND date <= $${paramCount}`;
      queryParams.push(calcEnd);
    }

    if (subjectId) {
      paramCount++;
      query += ` AND subject_id = $${paramCount}`;
      queryParams.push(subjectId);
    }

    const summaryResult = await pool.query(query, queryParams);
    
    // Calculate total working days and percentage
    let total_days = await getWorkingDays(classId, schoolId, calcStart, calcEnd);
    if (total_days < 0) total_days = 0;
    
    let dbResult = summaryResult.rows[0];
    let present = parseInt(dbResult.present_days, 10) || 0;
    let attendance_percentage = total_days > 0 ? ((present / total_days) * 100).toFixed(2) : "0.00";

    const formattedSummary = {
      total_days,
      present_days: dbResult.present_days,
      absent_days: dbResult.absent_days,
      late_days: dbResult.late_days,
      excused_days: dbResult.excused_days,
      attendance_percentage
    };

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
      summary: formattedSummary,
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

    const clRes = await pool.query("SELECT school_id FROM classes WHERE id = $1", [classId]);
    if (clRes.rows.length === 0) return res.status(404).json({ error: "Class not found" });
    const schoolId = clRes.rows[0].school_id;

    let calcStart = startDate;
    let calcEnd = endDate || new Date().toISOString().slice(0, 10);

    if (!calcStart) {
      const ayRes = await pool.query("SELECT start_date FROM academic_years WHERE school_id = $1 AND is_current = true", [schoolId]);
      if (ayRes.rows.length > 0) {
        calcStart = new Date(ayRes.rows[0].start_date).toISOString().slice(0, 10);
      } else {
        const minAtt = await pool.query("SELECT min(date) as min_date FROM attendance WHERE class_id = $1", [classId]);
        calcStart = minAtt.rows[0].min_date ? new Date(minAtt.rows[0].min_date).toISOString().slice(0, 10) : calcEnd;
      }
    }

    let query = `
      SELECT 
        s.id as student_id,
        s.student_id as student_number,
        u.name as student_name,
        s.roll_number,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
        COUNT(CASE WHEN a.status = 'excused' THEN 1 END) as excused_days
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN attendance a ON s.id = a.student_id AND a.class_id = s.class_id
    `;
    
    // Add left join conditions for dates to ensure we only count attendance in range
    if (calcStart) {
      query += ` AND a.date >= '${calcStart}'`;
    }
    if (calcEnd) {
      query += ` AND a.date <= '${calcEnd}'`;
    }
    if (subjectId) {
      query += ` AND a.subject_id = ${parseInt(subjectId, 10)}`;
    }

    query += `
      WHERE s.class_id = $1
      GROUP BY s.id, s.student_id, u.name, s.roll_number
      ORDER BY s.roll_number, u.name
    `;

    const result = await pool.query(query, [classId]);
    
    let total_days = await getWorkingDays(classId, schoolId, calcStart, calcEnd);
    if (total_days < 0) total_days = 0;

    const formattedSummary = result.rows.map(row => {
      let present = parseInt(row.present_days, 10) || 0;
      let attendance_percentage = total_days > 0 ? ((present / total_days) * 100).toFixed(2) : "0.00";
      return {
        ...row,
        total_days,
        attendance_percentage
      };
    });

    res.json({ attendanceSummary: formattedSummary });
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
    const { uid, role } = req.user;

    let studentResult;

    if (role === "parent") {
      // Parent: find the student linked to this parent user
      studentResult = await pool.query(
        `SELECT s.id FROM students s
         JOIN users u ON u.uid = $1
         WHERE s.parent_id = u.id
         LIMIT 1`,
        [uid]
      );
    } else {
      // Student: find own record
      studentResult = await pool.query(
        "SELECT id FROM students WHERE user_id = (SELECT id FROM users WHERE uid = $1)",
        [uid]
      );
    }

    if (studentResult.rows.length === 0) {
      // Return empty rather than 404 so the dashboard doesn't crash
      return res.json({ attendance: [], records: [], summary: null });
    }

    const studentId = studentResult.rows[0].id;
    req.query.studentId = studentId;
    return getStudentAttendanceSummary(req, res);
  } catch (error) {
    console.error("Get my attendance error:", error);
    res.status(500).json({ error: "Failed to fetch attendance" });
  }
};

export const markNonWorkingDay = async (req, res) => {
  try {
    const { classId, date } = req.body;
    if (!classId || !date) return res.status(400).json({ error: "Class ID and date are required" });

    // Ensure it's not already marked
    await pool.query(
      `INSERT INTO non_working_days (class_id, date, school_id) VALUES ($1, $2, $3)
       ON CONFLICT (class_id, date) DO NOTHING`,
      [classId, date, req.tenantId]
    );

    // Delete any attendance records for this date and class
    await pool.query(
      "DELETE FROM attendance WHERE class_id = $1 AND date = $2",
      [classId, date]
    );

    res.json({ message: "Marked as non-working day successfully" });
  } catch (error) {
    console.error("markNonWorkingDay error:", error);
    res.status(500).json({ error: "Failed to mark non-working day" });
  }
};

