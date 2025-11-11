import pool from "../../config/db.js";

// ==================== ASSIGNMENTS ====================

// Create Assignment
export const createAssignment = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      classId, 
      subjectId, 
      dueDate, 
      maxMarks = 100, 
      fileUrl, 
      instructions 
    } = req.body;
    const { uid } = req.user;

    if (!title || !classId || !subjectId) {
      return res.status(400).json({ error: "Title, Class ID, and Subject ID are required" });
    }

    // Get teacher ID
    const userResult = await pool.query("SELECT id FROM users WHERE firebase_uid = $1", [uid]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const teacherId = userResult.rows[0].id;

    const result = await pool.query(
      `INSERT INTO assignments (title, description, class_id, subject_id, teacher_id, due_date, max_marks, file_url, instructions) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [title, description, classId, subjectId, teacherId, dueDate, maxMarks, fileUrl, instructions]
    );

    res.status(201).json({
      message: "Assignment created successfully",
      assignment: result.rows[0]
    });
  } catch (error) {
    console.error("Create assignment error:", error);
    res.status(500).json({ error: "Failed to create assignment" });
  }
};

// Get Assignments
export const getAssignments = async (req, res) => {
  try {
    const { classId, subjectId, teacherId, isActive = true, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT a.*, 
             c.name as class_name, c.section,
             s.name as subject_name, s.code as subject_code,
             u.name as teacher_name,
             COUNT(asub.id) as total_submissions,
             COUNT(CASE WHEN asub.status = 'graded' THEN 1 END) as graded_submissions
      FROM assignments a
      JOIN classes c ON a.class_id = c.id
      JOIN subjects s ON a.subject_id = s.id
      JOIN users u ON a.teacher_id = u.id
      LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id
      WHERE 1=1
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

    if (isActive !== undefined) {
      paramCount++;
      query += ` AND a.is_active = $${paramCount}`;
      queryParams.push(isActive === 'true');
    }

    query += ` 
      GROUP BY a.id, c.name, c.section, s.name, s.code, u.name
      ORDER BY a.created_at DESC 
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM assignments a WHERE 1=1`;
    const countParams = [];
    let countParamCount = 0;

    if (classId) {
      countParamCount++;
      countQuery += ` AND a.class_id = $${countParamCount}`;
      countParams.push(classId);
    }

    if (subjectId) {
      countParamCount++;
      countQuery += ` AND a.subject_id = $${countParamCount}`;
      countParams.push(subjectId);
    }

    if (teacherId) {
      countParamCount++;
      countQuery += ` AND a.teacher_id = $${countParamCount}`;
      countParams.push(teacherId);
    }

    if (isActive !== undefined) {
      countParamCount++;
      countQuery += ` AND a.is_active = $${countParamCount}`;
      countParams.push(isActive === 'true');
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalAssignments = parseInt(countResult.rows[0].count);

    res.json({
      assignments: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalAssignments / limit),
        totalAssignments: totalAssignments,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Get assignments error:", error);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
};

// Get Assignment Details
export const getAssignmentDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const assignmentResult = await pool.query(
      `SELECT a.*, 
              c.name as class_name, c.section,
              s.name as subject_name, s.code as subject_code,
              u.name as teacher_name, u.email as teacher_email
       FROM assignments a
       JOIN classes c ON a.class_id = c.id
       JOIN subjects s ON a.subject_id = s.id
       JOIN users u ON a.teacher_id = u.id
       WHERE a.id = $1`,
      [id]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    // Get submissions for this assignment
    const submissionsResult = await pool.query(
      `SELECT asub.*, 
              s.student_id, u.name as student_name,
              grader.name as graded_by_name
       FROM assignment_submissions asub
       JOIN students s ON asub.student_id = s.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN users grader ON asub.graded_by = grader.id
       WHERE asub.assignment_id = $1
       ORDER BY u.name`,
      [id]
    );

    res.json({
      assignment: assignmentResult.rows[0],
      submissions: submissionsResult.rows
    });
  } catch (error) {
    console.error("Get assignment details error:", error);
    res.status(500).json({ error: "Failed to fetch assignment details" });
  }
};

// Update Assignment
export const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      dueDate, 
      maxMarks, 
      fileUrl, 
      instructions, 
      isActive 
    } = req.body;

    const result = await pool.query(
      `UPDATE assignments 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           due_date = COALESCE($3, due_date),
           max_marks = COALESCE($4, max_marks),
           file_url = COALESCE($5, file_url),
           instructions = COALESCE($6, instructions),
           is_active = COALESCE($7, is_active)
       WHERE id = $8 RETURNING *`,
      [title, description, dueDate, maxMarks, fileUrl, instructions, isActive, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    res.json({
      message: "Assignment updated successfully",
      assignment: result.rows[0]
    });
  } catch (error) {
    console.error("Update assignment error:", error);
    res.status(500).json({ error: "Failed to update assignment" });
  }
};

// ==================== ASSIGNMENT SUBMISSIONS ====================

// Submit Assignment
export const submitAssignment = async (req, res) => {
  try {
    const { assignmentId, submissionText, fileUrl } = req.body;
    const { uid } = req.user;

    if (!assignmentId) {
      return res.status(400).json({ error: "Assignment ID is required" });
    }

    // Get student ID
    const studentResult = await pool.query(
      "SELECT s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.firebase_uid = $1",
      [uid]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: "Student record not found" });
    }

    const studentId = studentResult.rows[0].id;

    // Check if assignment exists and is active
    const assignmentResult = await pool.query(
      "SELECT * FROM assignments WHERE id = $1 AND is_active = true",
      [assignmentId]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ error: "Assignment not found or inactive" });
    }

    const assignment = assignmentResult.rows[0];

    // Check if due date has passed
    if (assignment.due_date && new Date() > new Date(assignment.due_date)) {
      // Allow late submission but mark as late
      const result = await pool.query(
        `INSERT INTO assignment_submissions (assignment_id, student_id, submission_text, file_url, status) 
         VALUES ($1, $2, $3, $4, 'late') 
         ON CONFLICT (assignment_id, student_id) 
         DO UPDATE SET 
           submission_text = $3, 
           file_url = $4, 
           submitted_at = CURRENT_TIMESTAMP,
           status = 'late'
         RETURNING *`,
        [assignmentId, studentId, submissionText, fileUrl]
      );

      return res.json({
        message: "Assignment submitted successfully (late submission)",
        submission: result.rows[0]
      });
    }

    // Normal submission
    const result = await pool.query(
      `INSERT INTO assignment_submissions (assignment_id, student_id, submission_text, file_url) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (assignment_id, student_id) 
       DO UPDATE SET 
         submission_text = $3, 
         file_url = $4, 
         submitted_at = CURRENT_TIMESTAMP,
         status = 'submitted'
       RETURNING *`,
      [assignmentId, studentId, submissionText, fileUrl]
    );

    res.json({
      message: "Assignment submitted successfully",
      submission: result.rows[0]
    });
  } catch (error) {
    console.error("Submit assignment error:", error);
    res.status(500).json({ error: "Failed to submit assignment" });
  }
};

// Grade Assignment Submission
export const gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { marksObtained, feedback } = req.body;
    const { uid } = req.user;

    if (marksObtained === undefined) {
      return res.status(400).json({ error: "Marks obtained is required" });
    }

    // Get grader ID
    const userResult = await pool.query("SELECT id FROM users WHERE firebase_uid = $1", [uid]);
    const gradedBy = userResult.rows[0].id;

    const result = await pool.query(
      `UPDATE assignment_submissions 
       SET marks_obtained = $1, 
           feedback = $2, 
           graded_by = $3, 
           graded_at = CURRENT_TIMESTAMP,
           status = 'graded'
       WHERE id = $4 RETURNING *`,
      [marksObtained, feedback, gradedBy, submissionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Submission not found" });
    }

    res.json({
      message: "Assignment graded successfully",
      submission: result.rows[0]
    });
  } catch (error) {
    console.error("Grade submission error:", error);
    res.status(500).json({ error: "Failed to grade submission" });
  }
};

// Get My Assignments (for students)
export const getMyAssignments = async (req, res) => {
  try {
    const { uid } = req.user;
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Get student info
    const studentResult = await pool.query(
      `SELECT s.id, s.class_id FROM students s 
       JOIN users u ON s.user_id = u.id 
       WHERE u.firebase_uid = $1`,
      [uid]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: "Student record not found" });
    }

    const { id: studentId, class_id: classId } = studentResult.rows[0];

    let query = `
      SELECT a.*, 
             s.name as subject_name, s.code as subject_code,
             u.name as teacher_name,
             asub.id as submission_id,
             asub.submitted_at,
             asub.marks_obtained,
             asub.feedback,
             asub.status as submission_status,
             CASE 
               WHEN asub.id IS NULL THEN 'not_submitted'
               ELSE asub.status
             END as overall_status
      FROM assignments a
      JOIN subjects s ON a.subject_id = s.id
      JOIN users u ON a.teacher_id = u.id
      LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND asub.student_id = $1
      WHERE a.class_id = $2 AND a.is_active = true
    `;
    
    const queryParams = [studentId, classId];
    let paramCount = 2;

    if (status) {
      paramCount++;
      if (status === 'not_submitted') {
        query += ` AND asub.id IS NULL`;
      } else {
        query += ` AND asub.status = $${paramCount}`;
        queryParams.push(status);
      }
    }

    query += ` ORDER BY a.due_date ASC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    res.json({ assignments: result.rows });
  } catch (error) {
    console.error("Get my assignments error:", error);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
};

// ==================== LEARNING RESOURCES ====================

// Upload Learning Resource
export const uploadLearningResource = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      resourceType, 
      fileUrl, 
      classId, 
      subjectId, 
      isPublic = false 
    } = req.body;
    const { uid } = req.user;

    if (!title || !resourceType || !fileUrl) {
      return res.status(400).json({ error: "Title, resource type, and file URL are required" });
    }

    // Get uploader ID
    const userResult = await pool.query("SELECT id FROM users WHERE firebase_uid = $1", [uid]);
    const uploadedBy = userResult.rows[0].id;

    const result = await pool.query(
      `INSERT INTO learning_resources (title, description, resource_type, file_url, class_id, subject_id, uploaded_by, is_public) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, description, resourceType, fileUrl, classId, subjectId, uploadedBy, isPublic]
    );

    res.status(201).json({
      message: "Learning resource uploaded successfully",
      resource: result.rows[0]
    });
  } catch (error) {
    console.error("Upload learning resource error:", error);
    res.status(500).json({ error: "Failed to upload learning resource" });
  }
};

// Get Learning Resources
export const getLearningResources = async (req, res) => {
  try {
    const { classId, subjectId, resourceType, isPublic, page = 1, limit = 20 } = req.query;
    const { uid } = req.user;
    const offset = (page - 1) * limit;

    // Get user info to check access rights
    const userResult = await pool.query(
      "SELECT id, role_id FROM users u JOIN roles r ON u.role_id = r.id WHERE u.firebase_uid = $1",
      [uid]
    );
    const user = userResult.rows[0];

    let query = `
      SELECT lr.*, 
             c.name as class_name, c.section,
             s.name as subject_name, s.code as subject_code,
             u.name as uploaded_by_name
      FROM learning_resources lr
      LEFT JOIN classes c ON lr.class_id = c.id
      LEFT JOIN subjects s ON lr.subject_id = s.id
      JOIN users u ON lr.uploaded_by = u.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    // Access control: students can only see public resources or resources for their class
    const studentResult = await pool.query(
      "SELECT class_id FROM students s JOIN users u ON s.user_id = u.id WHERE u.firebase_uid = $1",
      [uid]
    );

    if (studentResult.rows.length > 0) {
      // User is a student
      const studentClassId = studentResult.rows[0].class_id;
      paramCount++;
      query += ` AND (lr.is_public = true OR lr.class_id = $${paramCount})`;
      queryParams.push(studentClassId);
    }

    if (classId) {
      paramCount++;
      query += ` AND lr.class_id = $${paramCount}`;
      queryParams.push(classId);
    }

    if (subjectId) {
      paramCount++;
      query += ` AND lr.subject_id = $${paramCount}`;
      queryParams.push(subjectId);
    }

    if (resourceType) {
      paramCount++;
      query += ` AND lr.resource_type = $${paramCount}`;
      queryParams.push(resourceType);
    }

    if (isPublic !== undefined) {
      paramCount++;
      query += ` AND lr.is_public = $${paramCount}`;
      queryParams.push(isPublic === 'true');
    }

    query += ` ORDER BY lr.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    res.json({ resources: result.rows });
  } catch (error) {
    console.error("Get learning resources error:", error);
    res.status(500).json({ error: "Failed to fetch learning resources" });
  }
};

// Update Learning Resource
export const updateLearningResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, resourceType, fileUrl, isPublic } = req.body;

    const result = await pool.query(
      `UPDATE learning_resources 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           resource_type = COALESCE($3, resource_type),
           file_url = COALESCE($4, file_url),
           is_public = COALESCE($5, is_public)
       WHERE id = $6 RETURNING *`,
      [title, description, resourceType, fileUrl, isPublic, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Learning resource not found" });
    }

    res.json({
      message: "Learning resource updated successfully",
      resource: result.rows[0]
    });
  } catch (error) {
    console.error("Update learning resource error:", error);
    res.status(500).json({ error: "Failed to update learning resource" });
  }
};

// Delete Learning Resource
export const deleteLearningResource = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("DELETE FROM learning_resources WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Learning resource not found" });
    }

    res.json({ message: "Learning resource deleted successfully" });
  } catch (error) {
    console.error("Delete learning resource error:", error);
    res.status(500).json({ error: "Failed to delete learning resource" });
  }
};
