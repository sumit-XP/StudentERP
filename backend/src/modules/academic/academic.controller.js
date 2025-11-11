import pool from "../../config/db.js";

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
      await pool.query("UPDATE academic_years SET is_current = false");
    }

    const result = await pool.query(
      "INSERT INTO academic_years (year_name, start_date, end_date, is_current) VALUES ($1, $2, $3, $4) RETURNING *",
      [yearName, startDate, endDate, isCurrent]
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
    const result = await pool.query("SELECT * FROM academic_years ORDER BY start_date DESC");
    res.json({ academicYears: result.rows });
  } catch (error) {
    console.error("Get academic years error:", error);
    res.status(500).json({ error: "Failed to fetch academic years" });
  }
};

// Get Current Academic Year
export const getCurrentAcademicYear = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM academic_years WHERE is_current = true");
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
    const { name, code, description, credits = 1 } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: "Subject name and code are required" });
    }

    const result = await pool.query(
      "INSERT INTO subjects (name, code, description, credits) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, code, description, credits]
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
    const result = await pool.query("SELECT * FROM subjects ORDER BY name");
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
    const { name, code, description, credits } = req.body;

    const result = await pool.query(
      `UPDATE subjects 
       SET name = COALESCE($1, name),
           code = COALESCE($2, code),
           description = COALESCE($3, description),
           credits = COALESCE($4, credits)
       WHERE id = $5 RETURNING *`,
      [name, code, description, credits, id]
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
      `INSERT INTO classes (name, grade_level, section, academic_year_id, class_teacher_id, max_students) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, gradeLevel, section, academicYearId, classTeacherId, maxStudents]
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
    
    const queryParams = [];
    if (academicYearId) {
      query += " WHERE c.academic_year_id = $1";
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
       WHERE c.id = $1`,
      [id]
    );

    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: "Class not found" });
    }

    // Get class subjects and teachers
    const subjectsResult = await pool.query(
      `SELECT cs.*, s.name as subject_name, s.code as subject_code,
              u.name as teacher_name, u.email as teacher_email
       FROM class_subjects cs
       JOIN subjects s ON cs.subject_id = s.id
       LEFT JOIN users u ON cs.teacher_id = u.id
       WHERE cs.class_id = $1`,
      [id]
    );

    // Get students in class
    const studentsResult = await pool.query(
      `SELECT s.*, u.name, u.email, u.phone
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.class_id = $1
       ORDER BY s.roll_number`,
      [id]
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

// Assign Subject to Class
export const assignSubjectToClass = async (req, res) => {
  try {
    const { classId, subjectId, teacherId } = req.body;

    if (!classId || !subjectId) {
      return res.status(400).json({ error: "Class ID and Subject ID are required" });
    }

    const result = await pool.query(
      "INSERT INTO class_subjects (class_id, subject_id, teacher_id) VALUES ($1, $2, $3) RETURNING *",
      [classId, subjectId, teacherId]
    );

    res.status(201).json({
      message: "Subject assigned to class successfully",
      assignment: result.rows[0]
    });
  } catch (error) {
    console.error("Assign subject error:", error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: "Subject already assigned to this class" });
    } else {
      res.status(500).json({ error: "Failed to assign subject to class" });
    }
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
      `INSERT INTO students (user_id, student_id, class_id, admission_date, roll_number, parent_id, emergency_contact, blood_group) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [userId, studentId, classId, admissionDate, rollNumber, parentId, emergencyContact, bloodGroup]
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
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

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
      WHERE 1=1
    `;
    const countParams = [];
    let countParamCount = 0;

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
      `INSERT INTO teachers (user_id, employee_id, qualification, experience_years, joining_date, salary, department) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [userId, employeeId, qualification, experienceYears, joiningDate, salary, department]
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
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

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
      WHERE 1=1
    `;
    const countParams = [];
    let countParamCount = 0;

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
