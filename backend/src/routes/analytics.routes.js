import express from "express";
import {
  getDashboardOverview,
  getAttendanceAnalytics,
  getAcademicPerformanceAnalytics,
  getClassPerformanceComparison,
  getStudentProgressTracking,
  getAssignmentAnalytics
} from "../modules/analytics/analytics.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/role.middleware.js";

const router = express.Router();

// Dashboard overview (role-based)
router.get("/dashboard", verifyToken, getDashboardOverview);

// Attendance analytics
router.get("/attendance", verifyToken, checkRole(["admin", "teacher"]), getAttendanceAnalytics);

// Academic performance analytics
router.get("/performance", verifyToken, checkRole(["admin", "teacher", "parent"]), getAcademicPerformanceAnalytics);

// Class performance comparison
router.get("/class-comparison", verifyToken, checkRole(["admin", "teacher"]), getClassPerformanceComparison);

// Student progress tracking
router.get("/student-progress", verifyToken, checkRole(["admin", "teacher", "parent", "student"]), getStudentProgressTracking);

// Assignment analytics
router.get("/assignments", verifyToken, checkRole(["admin", "teacher"]), getAssignmentAnalytics);

export default router;
