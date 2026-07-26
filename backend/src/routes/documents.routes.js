import express from "express";
import {
    // Student Documents
    uploadStudentDocumentWithFile,

    // Teacher Documents
    uploadTeacherDocumentWithFile,
    getTeacherDocuments,
    deleteTeacherDocument,
    addTeacherDocument,

    // Parent Documents
    uploadParentDocumentWithFile,
    getParentDocuments,
    deleteParentDocument,
    addParentDocument
} from "../modules/documents/documents.controller.js";
import { uploadDocumentFile, handleUploadError } from "../middleware/upload.middleware.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/role.middleware.js";

const router = express.Router();

// ==================== STUDENT DOCUMENTS ====================
// Unified upload endpoint (file + metadata)
router.post(
    "/students/:studentId/upload",
    verifyToken,
    checkRole(["admin"]),
    uploadDocumentFile,
    handleUploadError,
    uploadStudentDocumentWithFile
);

// ==================== TEACHER DOCUMENTS ====================
// Unified upload endpoint (file + metadata)
router.post(
    "/teachers/:teacherId/upload",
    verifyToken,
    checkRole(["admin"]),
    uploadDocumentFile,
    handleUploadError,
    uploadTeacherDocumentWithFile
);

// Get all teacher documents
router.get(
    "/teachers/:teacherId",
    verifyToken,
    checkRole(["admin", "teacher"]),
    getTeacherDocuments
);

// Delete teacher document
router.delete(
    "/teachers/:teacherId/:documentId",
    verifyToken,
    checkRole(["admin"]),
    deleteTeacherDocument
);

// Add teacher document (metadata only - for backward compatibility)
router.post(
    "/teachers/:teacherId",
    verifyToken,
    checkRole(["admin"]),
    addTeacherDocument
);

// ==================== PARENT DOCUMENTS ====================
// Unified upload endpoint (file + metadata)
router.post(
    "/parents/:userId/upload",
    verifyToken,
    checkRole(["admin"]),
    uploadDocumentFile,
    handleUploadError,
    uploadParentDocumentWithFile
);

// Get all parent documents
router.get(
    "/parents/:userId",
    verifyToken,
    checkRole(["admin", "parent"]),
    getParentDocuments
);

// Delete parent document
router.delete(
    "/parents/:userId/:documentId",
    verifyToken,
    checkRole(["admin"]),
    deleteParentDocument
);

// Add parent document (metadata only - for backward compatibility)
router.post(
    "/parents/:userId",
    verifyToken,
    checkRole(["admin"]),
    addParentDocument
);

export default router;
