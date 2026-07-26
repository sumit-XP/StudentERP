import express from "express";
import {
  // Assignments
  createAssignment,
  getAssignments,
  getAssignmentDetails,
  updateAssignment,
  
  // Assignment Submissions
  submitAssignment,
  gradeSubmission,
  getMyAssignments,
  
  // Learning Resources
  uploadLearningResource,
  getLearningResources,
  updateLearningResource,
  deleteLearningResource
} from "../modules/assignments/assignments.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/role.middleware.js";

const router = express.Router();

// ==================== LEARNING RESOURCES (before /:id) ====================
router.post("/resources", verifyToken, checkRole(["admin", "teacher"]), uploadLearningResource);
router.get("/resources", verifyToken, getLearningResources);
router.put("/resources/:id", verifyToken, checkRole(["admin", "teacher"]), updateLearningResource);
router.delete("/resources/:id", verifyToken, checkRole(["admin", "teacher"]), deleteLearningResource);

// ==================== STUDENT / PARENT ROUTES (before /:id) ====================
// student & parent can both view assignments for their class
router.get("/my-assignments", verifyToken, checkRole(["student", "parent"]), getMyAssignments);

// ==================== ASSIGNMENT SUBMISSIONS ====================
router.post("/submit", verifyToken, checkRole(["student"]), submitAssignment);
router.put("/submissions/:submissionId/grade", verifyToken, checkRole(["admin", "teacher"]), gradeSubmission);

// ==================== ASSIGNMENTS ====================
router.post("/", verifyToken, checkRole(["admin", "teacher"]), createAssignment);
router.get("/", verifyToken, checkRole(["admin", "teacher"]), getAssignments);
// /:id MUST come last — it would swallow any named route above it
router.get("/:id", verifyToken, getAssignmentDetails);
router.put("/:id", verifyToken, checkRole(["admin", "teacher"]), updateAssignment);

export default router;
