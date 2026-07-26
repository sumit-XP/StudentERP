import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/role.middleware.js";
import {
  applyLeave,
  getMyLeaves,
  getPendingLeaves,
  getAllLeaves,
  approveLeave,
  rejectLeave,
  getLeaveStats
} from "../modules/leaves/leaves.controller.js";

const router = express.Router();

/**
 * Leave Management Routes
 * 
 * Teacher endpoints:
 * - POST /api/leaves/apply - Submit leave request
 * - GET /api/leaves/my-leaves - View own leaves
 * 
 * Admin endpoints:
 * - GET /api/leaves/pending - View all pending leaves
 * - GET /api/leaves - View all leaves with filters
 * - PATCH /api/leaves/:id/approve - Approve a leave
 * - PATCH /api/leaves/:id/reject - Reject a leave
 * - GET /api/leaves/stats - Get leave statistics
 */

// Teacher routes
router.post("/apply", verifyToken, checkRole(["teacher"]), applyLeave);
router.get("/my-leaves", verifyToken, checkRole(["teacher"]), getMyLeaves);

// Admin routes
router.get("/pending", verifyToken, checkRole(["admin"]), getPendingLeaves);
router.get("/stats", verifyToken, checkRole(["admin"]), getLeaveStats);
router.get("/", verifyToken, checkRole(["admin"]), getAllLeaves);
router.patch("/:id/approve", verifyToken, checkRole(["admin"]), approveLeave);
router.patch("/:id/reject", verifyToken, checkRole(["admin"]), rejectLeave);

export default router;
