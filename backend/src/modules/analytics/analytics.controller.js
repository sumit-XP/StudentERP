import pool from "../../config/db.js";

// ==================== DASHBOARD OVERVIEW ====================

// Get Dashboard Overview
export const getDashboardOverview = async (req, res) => {
  try {
    const { uid } = req.user;

    // Get user role
    const userResult = await pool.query(
      "SELECT u.id, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.uid = $1",
      [uid]
    );
    
    // Check if user exists
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found in database" });
    }
    
    const user = userResult.rows[0];

    let overview = {};

    if (user.role === 'admin') {
      overview = await getAdminDashboard(req.user.school_id);
    } else if (user.role === 'teacher') {
      overview = await getTeacherDashboard(user.id);
    } else if (user.role === 'student') {
      overview = await getStudentDashboard(user.id);
    } else if (user.role === 'parent') {
      overview = await getParentDashboard(user.id);
    } else {
      return res.status(400).json({ error: "Invalid user role" });
    }

    res.json({ overview });
  } catch (error) {
    console.error("Get dashboard overview error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard overview", details: error.message });
  }
};

// Admin Dashboard
async function getAdminDashboard(schoolId) {
  const stats = {};
  
  if (!schoolId) {
     throw new Error("Admin user is missing school_id");
  }

  // Total counts
  const totalUsers = await pool.query("SELECT COUNT(*) as count FROM users WHERE is_active = true AND school_id = $1", [schoolId]);
  const totalStudents = await pool.query("SELECT COUNT(*) as count FROM students WHERE school_id = $1", [schoolId]);
  const totalTeachers = await pool.query("SELECT COUNT(*) as count FROM teachers WHERE school_id = $1", [schoolId]);
  const totalClasses = await pool.query("SELECT COUNT(*) as count FROM classes WHERE school_id = $1", [schoolId]);

  stats.totalUsers = parseInt(totalUsers.rows[0].count);
  stats.totalStudents = parseInt(totalStudents.rows[0].count);
  stats.totalTeachers = parseInt(totalTeachers.rows[0].count);
  stats.totalClasses = parseInt(totalClasses.rows[0].count);

  // Recent activities
  const recentAnnouncements = await pool.query(`
    SELECT COUNT(*) as count FROM announcements 
    WHERE created_at >= CURRENT_DATE - INTERVAL '7 days' AND school_id = $1
  `, [schoolId]);
  stats.recentAnnouncements = parseInt(recentAnnouncements.rows[0].count);

  // Attendance overview (last 7 days)
  const attendanceStats = await pool.query(`
    SELECT 
      COUNT(*) as total_records,
      COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
      CASE 
        WHEN COUNT(*) > 0 THEN ROUND(COUNT(CASE WHEN status = 'present' THEN 1 END) * 100.0 / COUNT(*), 2)
        ELSE 0
      END as attendance_rate
    FROM attendance 
    WHERE date >= CURRENT_DATE - INTERVAL '7 days' AND school_id = $1
  `, [schoolId]);
  stats.weeklyAttendance = attendanceStats.rows[0];

  // Class-wise student distribution
  const classDistribution = await pool.query(`
    SELECT c.name, c.section, c.grade_level, COUNT(s.id) as student_count
    FROM classes c
    LEFT JOIN students s ON c.id = s.class_id
    WHERE c.school_id = $1
    GROUP BY c.id, c.name, c.section, c.grade_level
    ORDER BY c.grade_level, c.section
  `, [schoolId]);
  stats.classDistribution = classDistribution.rows;

  return stats;
}

// Teacher Dashboard
async function getTeacherDashboard(teacherId) {
  const stats = {};

  // Classes taught
  const myClasses = await pool.query(`
    SELECT DISTINCT c.id, c.name, c.section, COUNT(s.id) as student_count
    FROM subjects sub
    JOIN classes c ON sub.class_id = c.id
    LEFT JOIN students s ON c.id = s.class_id
    WHERE sub.teacher_id = $1
    GROUP BY c.id, c.name, c.section
  `, [teacherId]);
  stats.myClasses = myClasses.rows;

  // Assignments created
  const assignmentStats = await pool.query(`
    SELECT 
      COUNT(*) as total_assignments,
      COUNT(CASE WHEN due_date > CURRENT_TIMESTAMP THEN 1 END) as active_assignments,
      COUNT(CASE WHEN due_date <= CURRENT_TIMESTAMP THEN 1 END) as past_assignments
    FROM assignments 
    WHERE teacher_id = $1 AND is_active = true
  `, [teacherId]);
  stats.assignments = assignmentStats.rows[0];

  // Recent submissions
  const recentSubmissions = await pool.query(`
    SELECT COUNT(*) as count
    FROM assignment_submissions asub
    JOIN assignments a ON asub.assignment_id = a.id
    WHERE a.teacher_id = $1 AND asub.submitted_at >= CURRENT_DATE - INTERVAL '7 days'
  `, [teacherId]);
  stats.recentSubmissions = parseInt(recentSubmissions.rows[0].count);

  // Pending grading
  const pendingGrading = await pool.query(`
    SELECT COUNT(*) as count
    FROM assignment_submissions asub
    JOIN assignments a ON asub.assignment_id = a.id
    WHERE a.teacher_id = $1 AND asub.status = 'submitted'
  `, [teacherId]);
  stats.pendingGrading = parseInt(pendingGrading.rows[0].count);

  return stats;
}

// Student Dashboard
async function getStudentDashboard(userId) {
  const stats = {};

  // Get student info
  const studentInfo = await pool.query(`
    SELECT s.*, c.name as class_name, c.section
    FROM students s
    JOIN classes c ON s.class_id = c.id
    WHERE s.user_id = $1
  `, [userId]);
  
  if (studentInfo.rows.length === 0) {
    return { error: "Student record not found" };
  }

  const student = studentInfo.rows[0];
  stats.studentInfo = student;

  // Attendance summary (current month)
  const attendanceSummary = await pool.query(`
    SELECT 
      COUNT(*) as total_days,
      COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
      CASE 
        WHEN COUNT(*) > 0 THEN ROUND(COUNT(CASE WHEN status = 'present' THEN 1 END) * 100.0 / COUNT(*), 2)
        ELSE 0
      END as attendance_percentage
    FROM attendance 
    WHERE student_id = $1 AND date >= DATE_TRUNC('month', CURRENT_DATE)
  `, [student.id]);
  stats.attendance = attendanceSummary.rows[0];

  // Assignment summary
  const assignmentSummary = await pool.query(`
    SELECT 
      COUNT(a.id) as total_assignments,
      COUNT(asub.id) as submitted_assignments,
      COUNT(CASE WHEN asub.status = 'graded' THEN 1 END) as graded_assignments,
      COUNT(CASE WHEN a.due_date > CURRENT_TIMESTAMP AND asub.id IS NULL THEN 1 END) as pending_assignments
    FROM assignments a
    LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND asub.student_id = $1
    WHERE a.class_id = $2 AND a.is_active = true
  `, [student.id, student.class_id]);
  stats.assignments = assignmentSummary.rows[0];

  // Recent grades
  const recentGrades = await pool.query(`
    SELECT g.*, s.name as subject_name, s.code as subject_code
    FROM grades g
    JOIN subjects s ON g.subject_id = s.id
    WHERE g.student_id = $1
    ORDER BY g.exam_date DESC, g.created_at DESC
    LIMIT 5
  `, [student.id]);
  stats.recentGrades = recentGrades.rows;

  return stats;
}

// Parent Dashboard
async function getParentDashboard(userId) {
  const stats = {};

  // Get children info
  const children = await pool.query(`
    SELECT s.*, u.name, c.name as class_name, c.section
    FROM students s
    JOIN users u ON s.user_id = u.id
    JOIN classes c ON s.class_id = c.id
    WHERE s.parent_id = $1
  `, [userId]);
  
  stats.children = children.rows;

  // For each child, get summary stats
  for (let child of stats.children) {
    // Attendance summary
    const attendanceSummary = await pool.query(`
      SELECT 
        COUNT(*) as total_days,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
        CASE 
          WHEN COUNT(*) > 0 THEN ROUND(COUNT(CASE WHEN status = 'present' THEN 1 END) * 100.0 / COUNT(*), 2)
          ELSE 0
        END as attendance_percentage
      FROM attendance 
      WHERE student_id = $1 AND date >= DATE_TRUNC('month', CURRENT_DATE)
    `, [child.id]);
    child.attendance = attendanceSummary.rows[0];

    // Recent grades
    const recentGrades = await pool.query(`
      SELECT g.*, s.name as subject_name
      FROM grades g
      JOIN subjects s ON g.subject_id = s.id
      WHERE g.student_id = $1
      ORDER BY g.exam_date DESC
      LIMIT 3
    `, [child.id]);
    child.recentGrades = recentGrades.rows;
  }

  return stats;
}

// ==================== ATTENDANCE ANALYTICS ====================

// Get Attendance Analytics
export const getAttendanceAnalytics = async (req, res) => {
  try {
    const { classId, startDate, endDate, groupBy = 'day' } = req.query;

    let query = `
      SELECT 
        DATE_TRUNC($1, date) as period,
        COUNT(*) as total_records,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count,
        ROUND(COUNT(CASE WHEN status = 'present' THEN 1 END) * 100.0 / COUNT(*), 2) as attendance_rate
      FROM attendance
      WHERE 1=1
    `;
    
    const queryParams = [groupBy];
    let paramCount = 1;

    if (classId) {
      paramCount++;
      query += ` AND class_id = $${paramCount}`;
      queryParams.push(classId);
    }

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

    query += ` GROUP BY period ORDER BY period`;

    const result = await pool.query(query, queryParams);

    res.json({ attendanceAnalytics: result.rows });
  } catch (error) {
    console.error("Get attendance analytics error:", error);
    res.status(500).json({ error: "Failed to fetch attendance analytics" });
  }
};

// ==================== ACADEMIC PERFORMANCE ANALYTICS ====================

// Get Academic Performance Analytics
export const getAcademicPerformanceAnalytics = async (req, res) => {
  try {
    const { classId, subjectId, studentId, examType } = req.query;

    let query = `
      SELECT 
        s.name as subject_name,
        AVG(g.marks_obtained) as average_marks,
        MAX(g.marks_obtained) as highest_marks,
        MIN(g.marks_obtained) as lowest_marks,
        COUNT(g.id) as total_exams,
        AVG(g.max_marks) as average_max_marks
      FROM grades g
      JOIN subjects s ON g.subject_id = s.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (classId) {
      paramCount++;
      query += ` AND g.class_id = $${paramCount}`;
      queryParams.push(classId);
    }

    if (subjectId) {
      paramCount++;
      query += ` AND g.subject_id = $${paramCount}`;
      queryParams.push(subjectId);
    }

    if (studentId) {
      paramCount++;
      query += ` AND g.student_id = $${paramCount}`;
      queryParams.push(studentId);
    }

    if (examType) {
      paramCount++;
      query += ` AND g.exam_type = $${paramCount}`;
      queryParams.push(examType);
    }

    query += ` GROUP BY s.id, s.name ORDER BY s.name`;

    const result = await pool.query(query, queryParams);

    res.json({ performanceAnalytics: result.rows });
  } catch (error) {
    console.error("Get academic performance analytics error:", error);
    res.status(500).json({ error: "Failed to fetch academic performance analytics" });
  }
};

// ==================== CLASS PERFORMANCE COMPARISON ====================

// Get Class Performance Comparison
export const getClassPerformanceComparison = async (req, res) => {
  try {
    const { academicYearId, subjectId } = req.query;

    let query = `
      SELECT 
        c.name as class_name,
        c.section,
        c.grade_level,
        AVG(g.marks_obtained) as average_marks,
        COUNT(DISTINCT g.student_id) as student_count,
        COUNT(g.id) as total_exams
      FROM classes c
      LEFT JOIN grades g ON c.id = g.class_id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (academicYearId) {
      paramCount++;
      query += ` AND g.academic_year_id = $${paramCount}`;
      queryParams.push(academicYearId);
    }

    if (subjectId) {
      paramCount++;
      query += ` AND g.subject_id = $${paramCount}`;
      queryParams.push(subjectId);
    }

    query += ` GROUP BY c.id, c.name, c.section, c.grade_level ORDER BY c.grade_level, c.section`;

    const result = await pool.query(query, queryParams);

    res.json({ classComparison: result.rows });
  } catch (error) {
    console.error("Get class performance comparison error:", error);
    res.status(500).json({ error: "Failed to fetch class performance comparison" });
  }
};

// ==================== STUDENT PROGRESS TRACKING ====================

// Get Student Progress Tracking
export const getStudentProgressTracking = async (req, res) => {
  try {
    const { studentId, subjectId, startDate, endDate } = req.query;

    if (!studentId) {
      return res.status(400).json({ error: "Student ID is required" });
    }

    let query = `
      SELECT 
        g.*,
        s.name as subject_name,
        s.code as subject_code,
        ROUND((g.marks_obtained * 100.0 / g.max_marks), 2) as percentage
      FROM grades g
      JOIN subjects s ON g.subject_id = s.id
      WHERE g.student_id = $1
    `;
    
    const queryParams = [studentId];
    let paramCount = 1;

    if (subjectId) {
      paramCount++;
      query += ` AND g.subject_id = $${paramCount}`;
      queryParams.push(subjectId);
    }

    if (startDate) {
      paramCount++;
      query += ` AND g.exam_date >= $${paramCount}`;
      queryParams.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND g.exam_date <= $${paramCount}`;
      queryParams.push(endDate);
    }

    query += ` ORDER BY g.exam_date, s.name`;

    const result = await pool.query(query, queryParams);

    // Calculate trends
    const trends = {};
    result.rows.forEach(grade => {
      if (!trends[grade.subject_name]) {
        trends[grade.subject_name] = [];
      }
      trends[grade.subject_name].push({
        date: grade.exam_date,
        percentage: parseFloat(grade.percentage),
        examType: grade.exam_type
      });
    });

    res.json({ 
      progressData: result.rows,
      trends: trends
    });
  } catch (error) {
    console.error("Get student progress tracking error:", error);
    res.status(500).json({ error: "Failed to fetch student progress tracking" });
  }
};

// ==================== ASSIGNMENT ANALYTICS ====================

// Get Assignment Analytics
export const getAssignmentAnalytics = async (req, res) => {
  try {
    const { classId, subjectId, teacherId, startDate, endDate } = req.query;

    let query = `
      SELECT 
        a.title,
        a.max_marks,
        COUNT(asub.id) as total_submissions,
        COUNT(CASE WHEN asub.status = 'graded' THEN 1 END) as graded_submissions,
        AVG(CASE WHEN asub.status = 'graded' THEN asub.marks_obtained END) as average_marks,
        MAX(CASE WHEN asub.status = 'graded' THEN asub.marks_obtained END) as highest_marks,
        MIN(CASE WHEN asub.status = 'graded' THEN asub.marks_obtained END) as lowest_marks
      FROM assignments a
      LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id
      WHERE a.is_active = true
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (classId) {
      paramCount++;
      query += ` AND a.class_id = $${paramCount}`;
      queryParams.push(classId);
    }

    if (subjectId) {
      paramCount++;
      query += ` AND a.subject_id = $${paramCount}`;
      queryParams.push(subjectId);
    }

    if (teacherId) {
      paramCount++;
      query += ` AND a.teacher_id = $${paramCount}`;
      queryParams.push(teacherId);
    }

    if (startDate) {
      paramCount++;
      query += ` AND a.created_at >= $${paramCount}`;
      queryParams.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND a.created_at <= $${paramCount}`;
      queryParams.push(endDate);
    }

    query += ` GROUP BY a.id, a.title, a.max_marks ORDER BY a.created_at DESC`;

    const result = await pool.query(query, queryParams);

    res.json({ assignmentAnalytics: result.rows });
  } catch (error) {
    console.error("Get assignment analytics error:", error);
    res.status(500).json({ error: "Failed to fetch assignment analytics" });
  }
};
