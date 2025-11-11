import express from "express";
import {
  markAttendance,
  getAttendanceByClassAndDate,
  getStudentAttendanceSummary,
  getClassAttendanceSummary,
  getAttendanceReport,
  getMyAttendance
} from "../modules/attendance/attendance.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/role.middleware.js";

const router = express.Router();

// Mark attendance (teachers and admins)
router.post("/mark", verifyToken, checkRole(["admin", "teacher"]), markAttendance);

// Get attendance by class and date
router.get("/class", verifyToken, checkRole(["admin", "teacher"]), getAttendanceByClassAndDate);

// Get student attendance summary
router.get("/student", verifyToken, checkRole(["admin", "teacher", "parent"]), getStudentAttendanceSummary);

// Get class attendance summary
router.get("/class-summary", verifyToken, checkRole(["admin", "teacher"]), getClassAttendanceSummary);

// Get attendance report
router.get("/report", verifyToken, checkRole(["admin", "teacher"]), getAttendanceReport);

// Get my attendance (for students)
router.get("/my-attendance", verifyToken, checkRole(["student"]), getMyAttendance);

export default router;
