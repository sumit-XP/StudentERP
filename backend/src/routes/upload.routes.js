import express from "express";
import {
  uploadProfileImage,
  uploadAssignmentFile,
  uploadSubmissionFile,
  uploadResourceFile,
  uploadMultipleFiles,
  handleUploadError,
  getFileUrl
} from "../middleware/upload.middleware.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/role.middleware.js";

const router = express.Router();

// Profile image upload
router.post("/profile-image", verifyToken, uploadProfileImage, handleUploadError, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileUrl = getFileUrl(req, req.file.filename);
    
    res.json({
      message: "Profile image uploaded successfully",
      fileUrl: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error("Profile image upload error:", error);
    res.status(500).json({ error: "Failed to upload profile image" });
  }
});

// Assignment file upload (for teachers)
router.post("/assignment-file", verifyToken, checkRole(["admin", "teacher"]), uploadAssignmentFile, handleUploadError, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileUrl = getFileUrl(req, req.file.filename);
    
    res.json({
      message: "Assignment file uploaded successfully",
      fileUrl: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error("Assignment file upload error:", error);
    res.status(500).json({ error: "Failed to upload assignment file" });
  }
});

// Submission file upload (for students)
router.post("/submission-file", verifyToken, checkRole(["student"]), uploadSubmissionFile, handleUploadError, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileUrl = getFileUrl(req, req.file.filename);
    
    res.json({
      message: "Submission file uploaded successfully",
      fileUrl: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error("Submission file upload error:", error);
    res.status(500).json({ error: "Failed to upload submission file" });
  }
});

// Learning resource file upload (for teachers and admins)
router.post("/resource-file", verifyToken, checkRole(["admin", "teacher"]), uploadResourceFile, handleUploadError, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileUrl = getFileUrl(req, req.file.filename);
    
    res.json({
      message: "Resource file uploaded successfully",
      fileUrl: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error("Resource file upload error:", error);
    res.status(500).json({ error: "Failed to upload resource file" });
  }
});

// Multiple files upload (general purpose)
router.post("/multiple-files", verifyToken, uploadMultipleFiles, handleUploadError, (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const uploadedFiles = req.files.map(file => ({
      fileUrl: getFileUrl(req, file.filename),
      filename: file.filename,
      originalName: file.originalname,
      size: file.size
    }));
    
    res.json({
      message: `${req.files.length} files uploaded successfully`,
      files: uploadedFiles
    });
  } catch (error) {
    console.error("Multiple files upload error:", error);
    res.status(500).json({ error: "Failed to upload files" });
  }
});

export default router;
