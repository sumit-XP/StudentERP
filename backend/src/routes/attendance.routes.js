import express from "express";
import {
  markAttendance,
  getAttendanceByClassAndDate,
  getStudentAttendanceSummary,
  getClassAttendanceSummary,
  getAttendanceReport,
  getMyAttendance,
  markNonWorkingDay
} from "../modules/attendance/attendance.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/role.middleware.js";

const router = express.Router();

// Mark attendance (teachers and admins)
router.post("/mark", verifyToken, checkRole(["admin", "teacher"]), markAttendance);

// Mark non-working day
router.post("/non-working-day", verifyToken, checkRole(["admin", "teacher"]), markNonWorkingDay);

// Get attendance by class and date
router.get("/class", verifyToken, checkRole(["admin", "teacher"]), getAttendanceByClassAndDate);

// Get student attendance summary
router.get("/student", verifyToken, checkRole(["admin", "teacher", "parent"]), getStudentAttendanceSummary);

// Get class attendance summary
router.get("/class-summary", verifyToken, checkRole(["admin", "teacher"]), getClassAttendanceSummary);

// Get attendance report
router.get("/report", verifyToken, checkRole(["admin", "teacher"]), getAttendanceReport);

// Get my attendance (for students and parents)
router.get("/my-attendance", verifyToken, checkRole(["student", "parent"]), getMyAttendance);

export default router;
