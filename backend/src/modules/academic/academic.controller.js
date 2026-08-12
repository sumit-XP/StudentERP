import pool from "../../config/db.js";
import crypto from "crypto";
import bcrypt from "bcrypt";

// ==================== ACADEMIC YEARS ====================

// Create Academic Year
export const createAcademicYear = async (req, res) => {
  try {
    const { yearName, startDate, endDate, isCurrent = false } = req.body;

    if (!yearName || !startDate || !endDate) {
      return res.status(400).json({ error: "Year name, start date, and end date are required" });
    }

    // If setting as current, update all others to false
    if (isCurrent) {
      await pool.query("UPDATE academic_years SET is_current = false WHERE school_id = $1", [req.tenantId]);
    }

    const result = await pool.query(
      "INSERT INTO academic_years (year_name, start_date, end_date, is_current, school_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [yearName, startDate, endDate, isCurrent, req.tenantId]
    );

    res.status(201).json({
      message: "Academic year created successfully",
      academicYear: result.rows[0]
    });
  } catch (error) {
    console.error("Create academic year error:", error);
    res.status(500).json({ error: "Failed to create academic year" });
  }
};

// Get All Academic Years
export const getAcademicYears = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM academic_years WHERE school_id = $1 ORDER BY start_date DESC", [req.tenantId]);
    res.json({ academicYears: result.rows });
  } catch (error) {
    console.error("Get academic years error:", error);
    res.status(500).json({ error: "Failed to fetch academic years" });
  }
};

// Get Current Academic Year
export const getCurrentAcademicYear = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM academic_years WHERE is_current = true AND school_id = $1", [req.tenantId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No current academic year set" });
    }
    res.json({ academicYear: result.rows[0] });
  } catch (error) {
    console.error("Get current academic year error:", error);
    res.status(500).json({ error: "Failed to fetch current academic year" });
  }
};

// ==================== SUBJECTS ====================

// Create Subject
export const createSubject = async (req, res) => {
  try {
    const { name, description, classId, teacherId } = req.body;

    if (!name || !classId) {
      return res.status(400).json({ error: "Subject name and classId are required" });
    }

    const result = await pool.query(
      "INSERT INTO subjects (name, description, class_id, teacher_id, school_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [name, description, classId, teacherId || null, req.tenantId]
    );

    res.status(201).json({
      message: "Subject created successfully",
      subject: result.rows[0]
    });
  } catch (error) {
    console.error("Create subject error:", error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: "Subject code already exists" });
    } else {
      res.status(500).json({ error: "Failed to create subject" });
    }
  }
};

// Get All Subjects
export const getSubjects = async (req, res) => {
  try {
    const { classId } = req.query;
    let query = `
      SELECT s.*, u.name as teacher_name 
      FROM subjects s 
      LEFT JOIN users u ON s.teacher_id = u.id 
      WHERE s.school_id = $1
    `;
    const params = [req.tenantId];
    
    if (classId) {
      query += " AND s.class_id = $2";
      params.push(classId);
    }
    
    query += " ORDER BY s.name";

    const result = await pool.query(query, params);
    res.json({ subjects: result.rows });
  } catch (error) {
    console.error("Get subjects error:", error);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
};

// Update Subject
export const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, teacherId } = req.body;

    const result = await pool.query(
      `UPDATE subjects 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           teacher_id = COALESCE($3, teacher_id)
       WHERE id = $4 AND school_id = $5 RETURNING *`,
      [name, description, teacherId, id, req.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Subject not found" });
    }

    res.json({
      message: "Subject updated successfully",
      subject: result.rows[0]
    });
  } catch (error) {
    console.error("Update subject error:", error);
    res.status(500).json({ error: "Failed to update subject" });
  }
};

// ==================== CLASSES ====================

// Create Class
export const createClass = async (req, res) => {
  try {
    const { name, gradeLevel, section, academicYearId, classTeacherId, maxStudents = 40 } = req.body;

    if (!name || !gradeLevel || !academicYearId) {
      return res.status(400).json({ error: "Class name, grade level, and academic year are required" });
    }

    const result = await pool.query(
      `INSERT INTO classes (name, grade_level, section, academic_year_id, class_teacher_id, max_students, school_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, gradeLevel, section, academicYearId, classTeacherId, maxStudents, req.tenantId]
    );

    res.status(201).json({
      message: "Class created successfully",
      class: result.rows[0]
    });
  } catch (error) {
    console.error("Create class error:", error);
    res.status(500).json({ error: "Failed to create class" });
  }
};

// Get All Classes
export const getClasses = async (req, res) => {
  try {
    const { academicYearId } = req.query;
    
    let query = `
      SELECT c.*, 
             ay.year_name,
             u.name as class_teacher_name,
             COUNT(s.id) as student_count
      FROM classes c
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
      LEFT JOIN users u ON c.class_teacher_id = u.id
      LEFT JOIN students s ON c.id = s.class_id
    `;
    
    const queryParams = [req.tenantId];
    query += " WHERE c.school_id = $1";
    if (academicYearId) {
      query += " AND c.academic_year_id = $2";
      queryParams.push(academicYearId);
    }
    
    query += " GROUP BY c.id, ay.year_name, u.name ORDER BY c.grade_level, c.section";

    const result = await pool.query(query, queryParams);
    res.json({ classes: result.rows });
  } catch (error) {
    console.error("Get classes error:", error);
    res.status(500).json({ error: "Failed to fetch classes" });
  }
};

// Get Class Details
export const getClassDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Get class info
    const classResult = await pool.query(
      `SELECT c.*, 
              ay.year_name,
              u.name as class_teacher_name,
              u.email as class_teacher_email
       FROM classes c
       LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
       LEFT JOIN users u ON c.class_teacher_id = u.id
       WHERE c.id = $1 AND c.school_id = $2`,
      [id, req.tenantId]
    );

    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: "Class not found" });
    }

    // Get class subjects and teachers
    const subjectsResult = await pool.query(
      `SELECT s.*, s.name as subject_name, 
              u.name as teacher_name, u.email as teacher_email
       FROM subjects s
       LEFT JOIN users u ON s.teacher_id = u.id
       WHERE s.class_id = $1 AND s.school_id = $2`,
      [id, req.tenantId]
    );

    // Get students in class
    const studentsResult = await pool.query(
      `SELECT s.*, u.name, u.email, u.phone
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.class_id = $1 AND s.school_id = $2
       ORDER BY s.roll_number`,
      [id, req.tenantId]
    );

    res.json({
      class: classResult.rows[0],
      subjects: subjectsResult.rows,
      students: studentsResult.rows
    });
  } catch (error) {
    console.error("Get class details error:", error);
    res.status(500).json({ error: "Failed to fetch class details" });
  }
};

// Update Class
export const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, gradeLevel, section, academicYearId, classTeacherId, maxStudents } = req.body;

    const existingRes = await pool.query(
      `SELECT * FROM classes WHERE id = $1 AND school_id = $2`,
      [id, req.tenantId]
    );

    if (existingRes.rows.length === 0) {
      return res.status(404).json({ error: "Class not found" });
    }

    const existing = existingRes.rows[0];

    const targetClassTeacherId = classTeacherId !== undefined
      ? (classTeacherId === null || classTeacherId === '' ? null : Number(classTeacherId))
      : existing.class_teacher_id;

    const result = await pool.query(
      `UPDATE classes 
       SET name = COALESCE($1, name),
           grade_level = COALESCE($2, grade_level),
           section = COALESCE($3, section),
           academic_year_id = COALESCE($4, academic_year_id),
           class_teacher_id = $5,
           max_students = COALESCE($6, max_students)
       WHERE id = $7 AND school_id = $8 RETURNING *`,
      [
        name || null,
        gradeLevel ? Number(gradeLevel) : null,
        section !== undefined && section !== null ? section : null,
        academicYearId ? Number(academicYearId) : null,
        targetClassTeacherId,
        maxStudents ? Number(maxStudents) : null,
        id,
        req.tenantId
      ]
    );

    res.json({
      message: "Class updated successfully",
      class: result.rows[0]
    });
  } catch (error) {
    console.error("Update class error:", error);
    res.status(500).json({ error: "Failed to update class" });
  }
};

// ==================== STUDENTS ====================

// Create Student
export const createStudent = async (req, res) => {
  try {
    const { 
      userId, 
      studentId, 
      classId, 
      admissionDate, 
      rollNumber, 
      parentId, 
      emergencyContact, 
      bloodGroup 
    } = req.body;

    if (!userId || !studentId || !classId) {
      return res.status(400).json({ error: "User ID, Student ID, and Class ID are required" });
    }

    const result = await pool.query(
      `INSERT INTO students (user_id, student_id, class_id, admission_date, roll_number, parent_id, emergency_contact, blood_group, school_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [userId, studentId, classId, admissionDate, rollNumber, parentId, emergencyContact, bloodGroup, req.tenantId]
    );

    res.status(201).json({
      message: "Student created successfully",
      student: result.rows[0]
    });
  } catch (error) {
    console.error("Create student error:", error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: "Student ID already exists" });
    } else {
      res.status(500).json({ error: "Failed to create student" });
    }
  }
};

// Get Students
export const getStudents = async (req, res) => {
  try {
    const { classId, page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT s.*, u.name, u.email, u.phone, u.address,
             c.name as class_name, c.section,
             p.name as parent_name, p.email as parent_email
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN users p ON s.parent_id = p.id
      WHERE s.school_id = $1
    `;
    
    const queryParams = [req.tenantId];
    let paramCount = 1;

    if (classId) {
      paramCount++;
      query += ` AND s.class_id = $${paramCount}`;
      queryParams.push(classId);
    }

    if (search) {
      paramCount++;
      query += ` AND (u.name ILIKE $${paramCount} OR s.student_id ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    query += ` ORDER BY s.roll_number, u.name LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.school_id = $1
    `;
    const countParams = [req.tenantId];
    let countParamCount = 1;

    if (classId) {
      countParamCount++;
      countQuery += ` AND s.class_id = $${countParamCount}`;
      countParams.push(classId);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (u.name ILIKE $${countParamCount} OR s.student_id ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalStudents = parseInt(countResult.rows[0].count);

    res.json({
      students: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalStudents / limit),
        totalStudents: totalStudents,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
};

// ==================== TEACHERS ====================

// Create Teacher
export const createTeacher = async (req, res) => {
  try {
    const { 
      userId, 
      employeeId, 
      qualification, 
      experienceYears, 
      joiningDate, 
      salary, 
      department 
    } = req.body;

    if (!userId || !employeeId) {
      return res.status(400).json({ error: "User ID and Employee ID are required" });
    }

    const result = await pool.query(
      `INSERT INTO teachers (user_id, employee_id, qualification, experience_years, joining_date, salary, department, school_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [userId, employeeId, qualification, experienceYears, joiningDate, salary, department, req.tenantId]
    );

    res.status(201).json({
      message: "Teacher created successfully",
      teacher: result.rows[0]
    });
  } catch (error) {
    console.error("Create teacher error:", error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: "Employee ID already exists" });
    } else {
      res.status(500).json({ error: "Failed to create teacher" });
    }
  }
};

// Get Teachers
export const getTeachers = async (req, res) => {
  try {
    const { department, page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT t.*, u.name, u.email, u.phone, u.address
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      WHERE t.school_id = $1
    `;
    
    const queryParams = [req.tenantId];
    let paramCount = 1;

    if (department) {
      paramCount++;
      query += ` AND t.department = $${paramCount}`;
      queryParams.push(department);
    }

    if (search) {
      paramCount++;
      query += ` AND (u.name ILIKE $${paramCount} OR t.employee_id ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    query += ` ORDER BY u.name LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) FROM teachers t
      JOIN users u ON t.user_id = u.id
      WHERE t.school_id = $1
    `;
    const countParams = [req.tenantId];
    let countParamCount = 1;

    if (department) {
      countParamCount++;
      countQuery += ` AND t.department = $${countParamCount}`;
      countParams.push(department);
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (u.name ILIKE $${countParamCount} OR t.employee_id ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalTeachers = parseInt(countResult.rows[0].count);

    res.json({
      teachers: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalTeachers / limit),
        totalTeachers: totalTeachers,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Get teachers error:", error);
    res.status(500).json({ error: "Failed to fetch teachers" });
  }
};

// Get Teacher's Classes and Subjects
export const getTeacherSchedule = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const result = await pool.query(
      `SELECT cs.*, c.name as class_name, c.section, s.name as subject_name, s.code as subject_code
       FROM class_subjects cs
       JOIN classes c ON cs.class_id = c.id
       JOIN subjects s ON cs.subject_id = s.id
       WHERE cs.teacher_id = $1
       ORDER BY c.grade_level, c.section, s.name`,
      [teacherId]
    );

    res.json({ schedule: result.rows });
  } catch (error) {
    console.error("Get teacher schedule error:", error);
    res.status(500).json({ error: "Failed to fetch teacher schedule" });
  }
};

// ==================== STUDENT GUARDIANS ====================

export const addStudentGuardian = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { name, relation, phone, email, isPrimary = false } = req.body;
    if (!name) return res.status(400).json({ error: "Guardian name is required" });
    if (isPrimary) {
      await pool.query("UPDATE student_guardians SET is_primary=false WHERE student_id=$1", [studentId]);
    }
    const r = await pool.query(
      `INSERT INTO student_guardians (student_id, name, relation, phone, email, is_primary)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [studentId, name, relation, phone, email, isPrimary]
    );
    res.status(201).json({ guardian: r.rows[0] });
  } catch (error) {
    console.error("Add guardian error:", error);
    res.status(500).json({ error: "Failed to add guardian" });
  }
};

export const getStudentGuardians = async (req, res) => {
  try {
    const { studentId } = req.params;
    const r = await pool.query(
      `SELECT * FROM student_guardians WHERE student_id=$1 ORDER BY is_primary DESC, id`,
      [studentId]
    );
    res.json({ guardians: r.rows });
  } catch (error) {
    console.error("Get guardians error:", error);
    res.status(500).json({ error: "Failed to fetch guardians" });
  }
};

export const deleteStudentGuardian = async (req, res) => {
  try {
    const { studentId, guardianId } = req.params;
    const r = await pool.query(
      `DELETE FROM student_guardians WHERE id=$1 AND student_id=$2 RETURNING *`,
      [guardianId, studentId]
    );
    if (!r.rows.length) return res.status(404).json({ error: "Guardian not found" });
    res.json({ message: "Guardian deleted" });
  } catch (error) {
    console.error("Delete guardian error:", error);
    res.status(500).json({ error: "Failed to delete guardian" });
  }
};

// ==================== STUDENT DOCUMENTS ====================

export const addStudentDocument = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { docType, fileUrl, notes } = req.body;
    if (!fileUrl) return res.status(400).json({ error: "fileUrl is required" });
    const r = await pool.query(
      `INSERT INTO student_documents (student_id, doc_type, file_url, notes)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [studentId, docType || null, fileUrl, notes || null]
    );
    res.status(201).json({ document: r.rows[0] });
  } catch (error) {
    console.error("Add document error:", error);
    res.status(500).json({ error: "Failed to add document" });
  }
};

export const getStudentDocuments = async (req, res) => {
  try {
    const { studentId } = req.params;
    const r = await pool.query(
      `SELECT * FROM student_documents WHERE student_id=$1 ORDER BY uploaded_at DESC, id DESC`,
      [studentId]
    );
    res.json({ documents: r.rows });
  } catch (error) {
    console.error("Get documents error:", error);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
};

export const deleteStudentDocument = async (req, res) => {
  try {
    const { studentId, documentId } = req.params;
    const r = await pool.query(
      `DELETE FROM student_documents WHERE id=$1 AND student_id=$2 RETURNING *`,
      [documentId, studentId]
    );
    if (!r.rows.length) return res.status(404).json({ error: "Document not found" });
    res.json({ message: "Document deleted" });
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({ error: "Failed to delete document" });
  }
};

// ==================== PROMOTIONS / DEMOTIONS ====================

export const promoteOrDemoteStudent = async (req, res) => {
  const client = await pool.connect();
  try {
    const { studentId } = req.params;
    const { action, toClassId, effectiveDate, remarks } = req.body; // action: 'promoted'|'demoted'
    if (!action || !toClassId) return res.status(400).json({ error: "action and toClassId are required" });

    const cur = await pool.query("SELECT class_id FROM students WHERE id=$1", [studentId]);
    if (!cur.rows.length) return res.status(404).json({ error: "Student not found" });
    const fromClassId = cur.rows[0].class_id;

    await client.query("BEGIN");
    const pr = await client.query(
      `INSERT INTO student_promotions (student_id, from_class_id, to_class_id, action, effective_date, remarks)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [studentId, fromClassId, toClassId, action, effectiveDate || new Date(), remarks || null]
    );
    await client.query("UPDATE students SET class_id=$1 WHERE id=$2", [toClassId, studentId]);
    await client.query("COMMIT");
    res.status(201).json({ promotion: pr.rows[0] });
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("Promote/Demote error:", error);
    res.status(500).json({ error: "Failed to update student class" });
  } finally { client.release(); }
};

export const getStudentPromotionHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    const r = await pool.query(
      `SELECT sp.*, cfrom.name as from_class_name, cto.name as to_class_name
       FROM student_promotions sp
       LEFT JOIN classes cfrom ON sp.from_class_id = cfrom.id
       LEFT JOIN classes cto ON sp.to_class_id = cto.id
       WHERE sp.student_id=$1
       ORDER BY sp.effective_date DESC, sp.id DESC`,
      [studentId]
    );
    res.json({ promotions: r.rows });
  } catch (error) {
    console.error("Get promotion history error:", error);
    res.status(500).json({ error: "Failed to fetch promotions" });
  }
};

// Bulk promote/stay/TC students for a class
export const bulkPromoteStudents = async (req, res) => {
  const client = await pool.connect();
  try {
    const { classId } = req.params; // from class
    const { toClassId, items = [], effectiveDate, remarks } = req.body;

    if (!classId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "classId and items are required" });
    }

    await client.query("BEGIN");
    const results = { promoted: 0, stayed: 0, tc: 0 };

    for (const it of items) {
      const sid = it.studentId; // students.id
      const action = (it.action || '').toLowerCase();

      // verify student belongs to from class
      const cur = await client.query("SELECT class_id FROM students WHERE id=$1", [sid]);
      if (!cur.rows.length || cur.rows[0].class_id != classId) {
        continue; // skip invalid
      }

      if (action === 'promote') {
        if (!toClassId) continue; // cannot promote without toClassId
        await client.query(
          `INSERT INTO student_promotions (student_id, from_class_id, to_class_id, action, effective_date, remarks)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [sid, classId, toClassId, 'promoted', effectiveDate || new Date(), remarks || null]
        );
        await client.query("UPDATE students SET class_id=$1 WHERE id=$2", [toClassId, sid]);
        results.promoted++;
      } else if (action === 'tc') {
        await client.query(
          `INSERT INTO student_promotions (student_id, from_class_id, to_class_id, action, effective_date, remarks)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [sid, classId, null, 'tc', effectiveDate || new Date(), remarks || null]
        );
        await client.query("UPDATE students SET class_id=NULL WHERE id=$1", [sid]);
        results.tc++;
      } else {
        results.stayed++;
      }
    }

    await client.query("COMMIT");
    res.json({ message: "Bulk class update completed", results });
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("Bulk promote students error:", error);
    res.status(500).json({ error: "Failed to bulk update class" });
  } finally { client.release(); }
};

// Batch Create Students
export const batchCreateStudents = async (req, res) => {
  const { classId, students } = req.body;
  if (!classId || !students || !Array.isArray(students)) {
    return res.status(400).json({ error: "classId and students array are required" });
  }

  const client = await pool.connect();
  let successCount = 0;
  let fails = [];

  try {
    const roleQuery = await client.query("SELECT id FROM roles WHERE name = $1", ['student']);
    if (roleQuery.rows.length === 0) {
      return res.status(500).json({ error: "Student role not found in DB" });
    }
    const roleId = roleQuery.rows[0].id;
    
    // Sort students alphabetically for roll number assignment
    const sortedStudents = [...students].sort((a, b) => a.name.localeCompare(b.name));

    for (const student of sortedStudents) {
      try {
        await client.query("BEGIN");

        const existingUser = await client.query("SELECT id FROM users WHERE email = $1", [student.email]);
        if (existingUser.rows.length > 0) {
          throw new Error("User with this email already registered");
        }

        const uid = crypto.randomUUID();
        const passwordHash = await bcrypt.hash(student.password || 'Welcome@123', 10);

        const userResult = await client.query(
          `INSERT INTO users (uid, password_hash, email, name, role_id, school_id, phone) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [uid, passwordHash, student.email, student.name, roleId, req.tenantId, student.phone || null]
        );
        const userId = userResult.rows[0].id;

        // Try to insert student record
        // Handle roll number if provided, else null (client logic handled it or we can auto-increment)
        // Wait, the client already passes the `rollNumber` and `studentId` in `batchCreateStudents` payload.
        await client.query(
          `INSERT INTO students (user_id, student_id, class_id, admission_date, roll_number, school_id) 
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [
             userId, 
             student.studentId, 
             classId, 
             student.admissionDate || new Date().toISOString().slice(0, 10), 
             student.rollNumber || null,
             req.tenantId
          ]
        );

        await client.query("COMMIT");
        successCount++;
      } catch (err) {
        await client.query("ROLLBACK");
        // Retry logic for duplicate student ID could be added here, but client provides studentId.
        // It's safer to just record the failure and let the client know.
        let reason = err.message;
        if (err.code === '23505') { // Unique constraint violation
          if (err.constraint && err.constraint.includes('student_id')) {
             reason = "Student ID already exists";
          } else if (err.constraint && err.constraint.includes('roll_number')) {
             reason = "Roll Number already exists in class";
          } else {
             reason = "Duplicate record error: " + err.constraint;
          }
        }
        fails.push({ email: student.email, reason });
      }
    }

    res.json({ success: successCount, fails });
  } catch (error) {
    console.error("Batch create students error:", error);
    res.status(500).json({ error: "Failed to process batch creation", details: error.message });
  } finally {
    client.release();
  }
};

// ==========================================
// GRADES & REPORTS
// ==========================================

export const getStudentGrades = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Verify student belongs to this tenant
    const studentCheck = await pool.query(
      `SELECT s.id, u.name as full_name, c.name as class_name, c.section as class_section 
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE s.id = $1 AND s.school_id = $2`,
      [studentId, req.tenantId]
    );

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    const student = studentCheck.rows[0];

    // Fetch grades with subject details
    const gradesResult = await pool.query(
      `SELECT g.*, sub.name as subject_name, sub.code as subject_code
       FROM grades g
       JOIN subjects sub ON g.subject_id = sub.id
       WHERE g.student_id = $1
       ORDER BY sub.name ASC`,
      [studentId]
    );

    res.json({
      student: {
        id: student.id,
        name: student.full_name,
        class_name: student.class_name,
        class_section: student.class_section
      },
      grades: gradesResult.rows
    });
  } catch (err) {
    console.error("Error in getStudentGrades:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getClassGrades = async (req, res) => {
  try {
    const { classId, subjectId } = req.params;
    const { examType } = req.query;

    if (!examType) {
      return res.status(400).json({ error: "examType is required" });
    }

    const result = await pool.query(
      `SELECT g.id as grade_id, g.marks_obtained, g.max_marks, g.grade_letter, 
              s.id as student_id, u.name as student_name, s.roll_number
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN grades g ON s.id = g.student_id AND g.subject_id = $1 AND g.exam_type = $2
       WHERE s.class_id = $3 AND s.school_id = $4
       ORDER BY s.roll_number ASC, u.name ASC`,
      [subjectId, examType, classId, req.tenantId]
    );

    res.json({ grades: result.rows });
  } catch (err) {
    console.error("Error in getClassGrades:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const saveClassGrades = async (req, res) => {
  const client = await pool.connect();
  try {
    const { classId, subjectId } = req.params;
    const { examType, grades } = req.body; // grades = [{ studentId, marksObtained, maxMarks, gradeLetter }, ...]

    if (!examType || !grades || !Array.isArray(grades)) {
      return res.status(400).json({ error: "examType and grades array are required" });
    }

    await client.query("BEGIN");

    for (const g of grades) {
      const { studentId, marksObtained, maxMarks, gradeLetter } = g;
      
      const parsedMarksObtained = marksObtained === '' ? null : marksObtained;

      // Upsert grade
      const existing = await client.query(
        `SELECT id FROM grades WHERE student_id = $1 AND subject_id = $2 AND exam_type = $3`,
        [studentId, subjectId, examType]
      );

      if (existing.rows.length > 0) {
        await client.query(
          `UPDATE grades 
           SET marks_obtained = $1, max_marks = $2, grade_letter = $3, entered_by = $4, exam_date = CURRENT_DATE
           WHERE id = $5`,
          [parsedMarksObtained, maxMarks || 100, gradeLetter, req.user.id, existing.rows[0].id]
        );
      } else {
        await client.query(
          `INSERT INTO grades (student_id, subject_id, class_id, exam_type, marks_obtained, max_marks, grade_letter, entered_by, exam_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE)`,
          [studentId, subjectId, classId, examType, parsedMarksObtained, maxMarks || 100, gradeLetter, req.user.id]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ message: "Grades saved successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error in saveClassGrades:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
};

// ==========================================
// RESULT MANAGEMENT - EXAMS (ADMIN)
// ==========================================

// Create Exam
export const createExam = async (req, res) => {
  try {
    const { title, examType, academicYearId, startDate, endDate, maxMarks = 100 } = req.body;
    if (!title || !examType) {
      return res.status(400).json({ error: 'title and examType are required' });
    }
    const result = await pool.query(
      `INSERT INTO exams (school_id, title, exam_type, academic_year_id, start_date, end_date, max_marks, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.tenantId, title, examType, academicYearId || null, startDate || null, endDate || null, maxMarks, req.user.id]
    );
    res.status(201).json({ message: 'Exam created successfully', exam: result.rows[0] });
  } catch (err) {
    console.error('Create exam error:', err);
    res.status(500).json({ error: 'Failed to create exam' });
  }
};

// Get All Exams
export const getExams = async (req, res) => {
  try {
    const { academicYearId, isActive } = req.query;
    let query = `
      SELECT e.*, ay.year_name,
             u.name as created_by_name
      FROM exams e
      LEFT JOIN academic_years ay ON e.academic_year_id = ay.id
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.school_id = $1
    `;
    const params = [req.tenantId];
    let idx = 2;
    if (academicYearId) {
      query += ` AND e.academic_year_id = $${idx++}`;
      params.push(academicYearId);
    }
    if (isActive !== undefined) {
      query += ` AND e.is_active = $${idx++}`;
      params.push(isActive === 'true');
    }
    query += ' ORDER BY e.created_at DESC';
    const result = await pool.query(query, params);
    res.json({ exams: result.rows });
  } catch (err) {
    console.error('Get exams error:', err);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
};

// Update Exam
export const updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, examType, academicYearId, startDate, endDate, maxMarks, isActive } = req.body;
    const result = await pool.query(
      `UPDATE exams
       SET title = COALESCE($1, title),
           exam_type = COALESCE($2, exam_type),
           academic_year_id = COALESCE($3, academic_year_id),
           start_date = COALESCE($4, start_date),
           end_date = COALESCE($5, end_date),
           max_marks = COALESCE($6, max_marks),
           is_active = COALESCE($7, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND school_id = $9 RETURNING *`,
      [title, examType, academicYearId, startDate, endDate, maxMarks, isActive, id, req.tenantId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Exam not found' });
    res.json({ message: 'Exam updated', exam: result.rows[0] });
  } catch (err) {
    console.error('Update exam error:', err);
    res.status(500).json({ error: 'Failed to update exam' });
  }
};

// ==========================================
// RESULT MANAGEMENT - TEACHER FLOW
// ==========================================

// Get Teacher's Assigned Subjects & Classes
export const getTeacherAssignedSubjects = async (req, res) => {
  try {
    // A teacher is assigned to subjects via subjects.teacher_id
    const result = await pool.query(
      `SELECT s.id as subject_id, s.name as subject_name,
              c.id as class_id, c.name as class_name, c.section as class_section,
              c.grade_level
       FROM subjects s
       JOIN classes c ON s.class_id = c.id
       WHERE s.teacher_id = $1 AND s.school_id = $2
       ORDER BY c.grade_level, c.section, s.name`,
      [req.user.id, req.tenantId]
    );
    res.json({ assignments: result.rows });
  } catch (err) {
    console.error('Get teacher assigned subjects error:', err);
    res.status(500).json({ error: 'Failed to fetch assigned subjects' });
  }
};

// Get Grades for specific Exam + Class + Subject (for teacher to fill / admin to review)
export const getExamGrades = async (req, res) => {
  try {
    const { examId, classId, subjectId } = req.params;

    // Get all students in class with their existing grades for this exam+subject
    const result = await pool.query(
      `SELECT s.id as student_id, u.name as student_name, s.roll_number,
              g.id as grade_id, g.marks_obtained, g.max_marks, g.grade_letter,
              g.exam_id
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN grades g ON s.id = g.student_id
           AND g.subject_id = $1
           AND g.exam_id = $2
       WHERE s.class_id = $3 AND s.school_id = $4
       ORDER BY s.roll_number ASC, u.name ASC`,
      [subjectId, examId, classId, req.tenantId]
    );

    // Get submission status
    const submissionResult = await pool.query(
      `SELECT status, submitted_at, teacher_id FROM exam_subject_submissions
       WHERE exam_id = $1 AND class_id = $2 AND subject_id = $3`,
      [examId, classId, subjectId]
    );
    const submission = submissionResult.rows[0] || { status: 'pending' };

    res.json({ grades: result.rows, submission });
  } catch (err) {
    console.error('Get exam grades error:', err);
    res.status(500).json({ error: 'Failed to fetch exam grades' });
  }
};

// Save Exam Grades (Teacher) — supports 'draft' and 'submit' actions
export const saveExamGrades = async (req, res) => {
  const client = await pool.connect();
  try {
    const { examId, classId, subjectId } = req.params;
    const { grades, action = 'draft' } = req.body;
    // action: 'draft' | 'submit'

    if (!grades || !Array.isArray(grades)) {
      return res.status(400).json({ error: 'grades array is required' });
    }

    // Verify the exam belongs to this school
    const examCheck = await client.query(
      'SELECT id, max_marks FROM exams WHERE id = $1 AND school_id = $2',
      [examId, req.tenantId]
    );
    if (!examCheck.rows.length) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    const examMaxMarks = examCheck.rows[0].max_marks;

    await client.query('BEGIN');

    for (const g of grades) {
      const { studentId, marksObtained, maxMarks, gradeLetter } = g;
      const parsedMarks = marksObtained === '' ? null : marksObtained;
      const parsedMax = maxMarks || examMaxMarks || 100;

      // Check if grade record already exists
      const existing = await client.query(
        `SELECT id FROM grades WHERE student_id = $1 AND subject_id = $2 AND exam_id = $3`,
        [studentId, subjectId, examId]
      );

      if (existing.rows.length > 0) {
        await client.query(
          `UPDATE grades
           SET marks_obtained = $1, max_marks = $2, grade_letter = $3,
               entered_by = $4, exam_date = CURRENT_DATE
           WHERE id = $5`,
          [parsedMarks, parsedMax, gradeLetter || null, req.user.id, existing.rows[0].id]
        );
      } else {
        await client.query(
          `INSERT INTO grades (student_id, subject_id, class_id, exam_type, exam_id, marks_obtained, max_marks, grade_letter, entered_by, exam_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE)`,
          [studentId, subjectId, classId, 'exam', examId, parsedMarks, parsedMax, gradeLetter || null, req.user.id]
        );
      }
    }

    // Upsert submission record
    const newStatus = action === 'submit' ? 'submitted' : 'draft';
    const submittedAt = action === 'submit' ? 'CURRENT_TIMESTAMP' : 'NULL';

    await client.query(
      `INSERT INTO exam_subject_submissions (school_id, exam_id, class_id, subject_id, teacher_id, status, submitted_at)
       VALUES ($1, $2, $3, $4, $5, $6, ${action === 'submit' ? 'CURRENT_TIMESTAMP' : 'NULL'})
       ON CONFLICT (exam_id, class_id, subject_id)
       DO UPDATE SET
         status = $6,
         teacher_id = $5,
         submitted_at = ${action === 'submit' ? 'CURRENT_TIMESTAMP' : 'exam_subject_submissions.submitted_at'},
         updated_at = CURRENT_TIMESTAMP`,
      [req.tenantId, examId, classId, subjectId, req.user.id, newStatus]
    );

    await client.query('COMMIT');
    res.json({ message: action === 'submit' ? 'Marks submitted to admin successfully' : 'Draft saved successfully', status: newStatus });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Save exam grades error:', err);
    res.status(500).json({ error: 'Failed to save grades' });
  } finally {
    client.release();
  }
};

// ==========================================
// RESULT MANAGEMENT - ADMIN FLOW
// ==========================================

// Get Submission Matrix for a Class + Exam (Admin view: which subjects submitted, which pending)
export const getExamClassMatrix = async (req, res) => {
  try {
    const { examId, classId } = req.params;

    // Get all subjects for this class along with their submission status
    const result = await pool.query(
      `SELECT s.id as subject_id, s.name as subject_name,
              u.name as teacher_name, u.id as teacher_id,
              COALESCE(ess.status, 'pending') as submission_status,
              ess.submitted_at
       FROM subjects s
       LEFT JOIN users u ON s.teacher_id = u.id
       LEFT JOIN exam_subject_submissions ess
         ON ess.subject_id = s.id AND ess.exam_id = $1 AND ess.class_id = $2
       WHERE s.class_id = $2 AND s.school_id = $3
       ORDER BY s.name`,
      [examId, classId, req.tenantId]
    );

    // Get publication status for this class+exam
    const pubResult = await pool.query(
      `SELECT is_published, published_at FROM exam_class_publications
       WHERE exam_id = $1 AND class_id = $2`,
      [examId, classId]
    );
    const publication = pubResult.rows[0] || { is_published: false };

    // Summary counts
    const subjects = result.rows;
    const submittedCount = subjects.filter(s => s.submission_status === 'submitted').length;
    const totalCount = subjects.length;

    res.json({
      subjects,
      publication,
      summary: { submitted: submittedCount, total: totalCount, pending: totalCount - submittedCount }
    });
  } catch (err) {
    console.error('Get exam class matrix error:', err);
    res.status(500).json({ error: 'Failed to fetch submission matrix' });
  }
};

// Publish Class Result (Admin) — make results visible to students/parents
export const publishClassResult = async (req, res) => {
  const client = await pool.connect();
  try {
    const { examId, classId } = req.params;

    // Verify exam belongs to school
    const examCheck = await client.query(
      'SELECT id, title FROM exams WHERE id = $1 AND school_id = $2',
      [examId, req.tenantId]
    );
    if (!examCheck.rows.length) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    await client.query('BEGIN');

    // Check constraint: All subjects for this class must be submitted by teachers
    const totalSubjRes = await client.query(
      `SELECT COUNT(*) FROM subjects WHERE class_id = $1 AND school_id = $2`,
      [classId, req.tenantId]
    );
    const totalSubjects = parseInt(totalSubjRes.rows[0].count, 10);

    if (totalSubjects === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cannot publish result: No subjects defined for this class.' });
    }

    const submittedSubjRes = await client.query(
      `SELECT COUNT(*) FROM exam_subject_submissions WHERE exam_id = $1 AND class_id = $2 AND status = 'submitted'`,
      [examId, classId]
    );
    const submittedSubjects = parseInt(submittedSubjRes.rows[0].count, 10);

    if (submittedSubjects < totalSubjects) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Cannot publish result yet. Only ${submittedSubjects} of ${totalSubjects} subject marksheets have been submitted by teachers. All subject marks must be submitted before publishing.`
      });
    }

    // Upsert publication record
    await client.query(
      `INSERT INTO exam_class_publications (school_id, exam_id, class_id, is_published, published_at, published_by)
       VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP, $4)
       ON CONFLICT (exam_id, class_id)
       DO UPDATE SET
         is_published = true,
         published_at = CURRENT_TIMESTAMP,
         published_by = $4`,
      [req.tenantId, examId, classId, req.user.id]
    );

    // Send notifications to all students in this class
    const studentsResult = await client.query(
      `SELECT s.user_id, u.name as student_name, u2.id as parent_user_id
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN users u2 ON s.parent_id = u2.id
       WHERE s.class_id = $1 AND s.school_id = $2`,
      [classId, req.tenantId]
    );

    const examTitle = examCheck.rows[0].title;
    for (const row of studentsResult.rows) {
      // Notify student
      await client.query(
        `INSERT INTO notifications (user_id, title, message, notification_type, reference_type)
         VALUES ($1, $2, $3, 'result', 'exam')`,
        [row.user_id, `Result Published: ${examTitle}`, `Your results for ${examTitle} have been published. Check your report card.`, ]
      );
      // Notify parent
      if (row.parent_user_id) {
        await client.query(
          `INSERT INTO notifications (user_id, title, message, notification_type, reference_type)
           VALUES ($1, $2, $3, 'result', 'exam')`,
          [row.parent_user_id, `Ward's Result Published: ${examTitle}`, `Results for ${examTitle} have been published for ${row.student_name}. View the report card.`]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Result published successfully and notifications sent' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Publish class result error:', err);
    res.status(500).json({ error: 'Failed to publish result' });
  } finally {
    client.release();
  }
};

// ==========================================
// RESULT MANAGEMENT - STUDENT / PARENT VIEW
// ==========================================

// Get Published Results for a student (used by student, parent, admin)
export const getStudentPublishedResults = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { examId } = req.query;

    // Verify student belongs to this school
    const studentCheck = await pool.query(
      `SELECT s.id, s.class_id, u.name as student_name, s.student_id as enrollment_number,
              s.roll_number, c.name as class_name, c.section as class_section
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE s.id = $1 AND s.school_id = $2`,
      [studentId, req.tenantId]
    );
    if (!studentCheck.rows.length) {
      return res.status(404).json({ error: 'Student not found' });
    }
    const student = studentCheck.rows[0];

    // Get all published exams for student's class
    let examQuery = `
      SELECT e.id as exam_id, e.title, e.exam_type, e.max_marks,
             e.start_date, e.end_date,
             ecp.published_at, ecp.is_published,
             ay.year_name
      FROM exams e
      JOIN exam_class_publications ecp ON ecp.exam_id = e.id AND ecp.class_id = $1
      LEFT JOIN academic_years ay ON e.academic_year_id = ay.id
      WHERE e.school_id = $2 AND ecp.is_published = true
    `;
    const params = [student.class_id, req.tenantId];
    if (examId) {
      examQuery += ` AND e.id = $3`;
      params.push(examId);
    }
    examQuery += ' ORDER BY e.created_at DESC';
    const examsResult = await pool.query(examQuery, params);

    // If specific exam requested, also fetch grades
    let grades = [];
    let selectedExam = null;
    if (examId && examsResult.rows.length > 0) {
      selectedExam = examsResult.rows[0];
      const gradesResult = await pool.query(
        `SELECT g.marks_obtained, g.max_marks, g.grade_letter,
                sub.name as subject_name, sub.id as subject_id,
                u.name as entered_by_name
         FROM grades g
         JOIN subjects sub ON g.subject_id = sub.id
         LEFT JOIN users u ON g.entered_by = u.id
         WHERE g.student_id = $1 AND g.exam_id = $2
         ORDER BY sub.name`,
        [studentId, examId]
      );
      grades = gradesResult.rows;
    }

    // Calculate summary if grades available
    let summary = null;
    if (grades.length > 0) {
      const totalMax = grades.reduce((s, g) => s + Number(g.max_marks || 0), 0);
      const totalObtained = grades.reduce((s, g) => s + Number(g.marks_obtained || 0), 0);
      const percentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(2) : '0';
      const passed = grades.every(g => g.marks_obtained !== null && Number(g.marks_obtained) >= (Number(g.max_marks) * 0.33));
      summary = { totalMax, totalObtained, percentage, passed };
    }

    res.json({
      student,
      publishedExams: examsResult.rows,
      selectedExam,
      grades,
      summary
    });
  } catch (err) {
    console.error('Get student published results error:', err);
    res.status(500).json({ error: 'Failed to fetch published results' });
  }
};

// Get student's own published results (for student/parent self-service)
export const getMyPublishedResults = async (req, res) => {
  try {
    const userId = req.user.id;
    const { examId } = req.query;

    // Find student record for this user
    const studentQuery = await pool.query(
      `SELECT s.id, s.class_id, u.name as student_name, s.student_id as enrollment_number,
              s.roll_number, c.name as class_name, c.section as class_section
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE s.user_id = $1 AND s.school_id = $2`,
      [userId, req.tenantId]
    );

    // If parent, find their ward
    let student = studentQuery.rows[0];
    if (!student && req.user.role === 'parent') {
      const wardQuery = await pool.query(
        `SELECT s.id, s.class_id, u.name as student_name, s.student_id as enrollment_number,
                s.roll_number, c.name as class_name, c.section as class_section
         FROM students s
         JOIN users u ON s.user_id = u.id
         LEFT JOIN classes c ON s.class_id = c.id
         WHERE s.parent_id = $1 AND s.school_id = $2
         LIMIT 1`,
        [userId, req.tenantId]
      );
      student = wardQuery.rows[0];
    }

    if (!student) return res.status(404).json({ error: 'Student record not found' });

    req.params = { ...req.params, studentId: student.id };
    return getStudentPublishedResults(req, res);
  } catch (err) {
    console.error('Get my published results error:', err);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
};
