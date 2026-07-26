import pool from "../../config/db.js";
import { getFileUrl } from "../../middleware/upload.middleware.js";

// ==================== STUDENT DOCUMENTS ====================

// Upload student document (unified endpoint - file + metadata)
export const uploadStudentDocumentWithFile = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { docType, notes } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const fileUrl = getFileUrl(req, `documents/${req.file.filename}`);

        const result = await pool.query(
            `INSERT INTO student_documents (student_id, doc_type, file_url, notes)
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [studentId, docType || null, fileUrl, notes || null]
        );

        res.status(201).json({
            message: "Student document uploaded successfully",
            document: result.rows[0]
        });
    } catch (error) {
        console.error("Upload student document error:", error);
        res.status(500).json({ error: "Failed to upload student document" });
    }
};

// ==================== TEACHER DOCUMENTS ====================

// Upload teacher document (unified endpoint - file + metadata)
export const uploadTeacherDocumentWithFile = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { docType, notes } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // Verify teacher exists
        const teacherCheck = await pool.query(
            "SELECT id FROM teachers WHERE id = $1",
            [teacherId]
        );

        if (teacherCheck.rows.length === 0) {
            return res.status(404).json({ error: "Teacher not found" });
        }

        const fileUrl = getFileUrl(req, `documents/${req.file.filename}`);

        const result = await pool.query(
            `INSERT INTO teacher_documents (teacher_id, doc_type, file_url, notes)
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [teacherId, docType || null, fileUrl, notes || null]
        );

        res.status(201).json({
            message: "Teacher document uploaded successfully",
            document: result.rows[0]
        });
    } catch (error) {
        console.error("Upload teacher document error:", error);
        res.status(500).json({ error: "Failed to upload teacher document" });
    }
};

// Get teacher documents
export const getTeacherDocuments = async (req, res) => {
    try {
        const { teacherId } = req.params;

        const result = await pool.query(
            `SELECT * FROM teacher_documents WHERE teacher_id = $1 ORDER BY uploaded_at DESC`,
            [teacherId]
        );

        res.json({ documents: result.rows });
    } catch (error) {
        console.error("Get teacher documents error:", error);
        res.status(500).json({ error: "Failed to fetch teacher documents" });
    }
};

// Delete teacher document
export const deleteTeacherDocument = async (req, res) => {
    try {
        const { teacherId, documentId } = req.params;

        const result = await pool.query(
            `DELETE FROM teacher_documents WHERE id = $1 AND teacher_id = $2 RETURNING *`,
            [documentId, teacherId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Document not found" });
        }

        res.json({ message: "Teacher document deleted successfully" });
    } catch (error) {
        console.error("Delete teacher document error:", error);
        res.status(500).json({ error: "Failed to delete teacher document" });
    }
};

// Add teacher document (metadata only - for backward compatibility)
export const addTeacherDocument = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { docType, fileUrl, notes } = req.body;

        if (!fileUrl) {
            return res.status(400).json({ error: "fileUrl is required" });
        }

        const result = await pool.query(
            `INSERT INTO teacher_documents (teacher_id, doc_type, file_url, notes)
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [teacherId, docType || null, fileUrl, notes || null]
        );

        res.status(201).json({ document: result.rows[0] });
    } catch (error) {
        console.error("Add teacher document error:", error);
        res.status(500).json({ error: "Failed to add teacher document" });
    }
};

// ==================== PARENT DOCUMENTS ====================

// Upload parent document (unified endpoint - file + metadata)
export const uploadParentDocumentWithFile = async (req, res) => {
    try {
        const { userId } = req.params; // Parent user ID
        const { docType, notes } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // Verify user exists and has parent role
        const userCheck = await pool.query(
            `SELECT u.id, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = $1`,
            [userId]
        );

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        if (userCheck.rows[0].role_name !== 'parent') {
            return res.status(400).json({ error: "User is not a parent" });
        }

        const fileUrl = getFileUrl(req, `documents/${req.file.filename}`);

        const result = await pool.query(
            `INSERT INTO parent_documents (user_id, doc_type, file_url, notes)
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [userId, docType || null, fileUrl, notes || null]
        );

        res.status(201).json({
            message: "Parent document uploaded successfully",
            document: result.rows[0]
        });
    } catch (error) {
        console.error("Upload parent document error:", error);
        res.status(500).json({ error: "Failed to upload parent document" });
    }
};

// Get parent documents
export const getParentDocuments = async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await pool.query(
            `SELECT * FROM parent_documents WHERE user_id = $1 ORDER BY uploaded_at DESC`,
            [userId]
        );

        res.json({ documents: result.rows });
    } catch (error) {
        console.error("Get parent documents error:", error);
        res.status(500).json({ error: "Failed to fetch parent documents" });
    }
};

// Delete parent document
export const deleteParentDocument = async (req, res) => {
    try {
        const { userId, documentId } = req.params;

        const result = await pool.query(
            `DELETE FROM parent_documents WHERE id = $1 AND user_id = $2 RETURNING *`,
            [documentId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Document not found" });
        }

        res.json({ message: "Parent document deleted successfully" });
    } catch (error) {
        console.error("Delete parent document error:", error);
        res.status(500).json({ error: "Failed to delete parent document" });
    }
};

// Add parent document (metadata only - for backward compatibility)
export const addParentDocument = async (req, res) => {
    try {
        const { userId } = req.params;
        const { docType, fileUrl, notes } = req.body;

        if (!fileUrl) {
            return res.status(400).json({ error: "fileUrl is required" });
        }

        const result = await pool.query(
            `INSERT INTO parent_documents (user_id, doc_type, file_url, notes)
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [userId, docType || null, fileUrl, notes || null]
        );

        res.status(201).json({ document: result.rows[0] });
    } catch (error) {
        console.error("Add parent document error:", error);
        res.status(500).json({ error: "Failed to add parent document" });
    }
};
