import express from "express";
import {
  // Academic Years
  createAcademicYear,
  getAcademicYears,
  getCurrentAcademicYear,
  
  // Subjects
  createSubject,
  getSubjects,
  updateSubject,
  
  // Classes
  createClass,
  getClasses,
  getClassDetails,
  assignSubjectToClass,
  
  // Students
  createStudent,
  getStudents,
  // Student Guardians
  addStudentGuardian,
  getStudentGuardians,
  deleteStudentGuardian,
  // Student Documents
  addStudentDocument,
  getStudentDocuments,
  deleteStudentDocument,
  // Promotions
  promoteOrDemoteStudent,
  getStudentPromotionHistory,
  bulkPromoteStudents,
  
  // Teachers
  createTeacher,
  getTeachers,
  getTeacherSchedule
} from "../modules/academic/academic.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/role.middleware.js";

const router = express.Router();

// ==================== ACADEMIC YEARS ====================
router.post("/academic-years", verifyToken, checkRole(["admin"]), createAcademicYear);
router.get("/academic-years", verifyToken, getAcademicYears);
router.get("/academic-years/current", verifyToken, getCurrentAcademicYear);

// ==================== SUBJECTS ====================
router.post("/subjects", verifyToken, checkRole(["admin"]), createSubject);
router.get("/subjects", verifyToken, getSubjects);
router.put("/subjects/:id", verifyToken, checkRole(["admin"]), updateSubject);

// ==================== CLASSES ====================
router.post("/classes", verifyToken, checkRole(["admin"]), createClass);
router.get("/classes", verifyToken, getClasses);
router.get("/classes/:id", verifyToken, getClassDetails);
router.post("/classes/assign-subject", verifyToken, checkRole(["admin", "teacher"]), assignSubjectToClass);

// ==================== STUDENTS ====================
router.post("/students", verifyToken, checkRole(["admin"]), createStudent);
router.get("/students", verifyToken, checkRole(["admin", "teacher"]), getStudents);

// ==================== STUDENT GUARDIANS ====================
router.get("/students/:studentId/guardians", verifyToken, checkRole(["admin", "teacher"]), getStudentGuardians);
router.post("/students/:studentId/guardians", verifyToken, checkRole(["admin"]), addStudentGuardian);
router.delete("/students/:studentId/guardians/:guardianId", verifyToken, checkRole(["admin"]), deleteStudentGuardian);

// ==================== STUDENT DOCUMENTS ====================
router.get("/students/:studentId/documents", verifyToken, checkRole(["admin", "teacher"]), getStudentDocuments);
router.post("/students/:studentId/documents", verifyToken, checkRole(["admin"]), addStudentDocument);
router.delete("/students/:studentId/documents/:documentId", verifyToken, checkRole(["admin"]), deleteStudentDocument);

// ==================== PROMOTIONS / DEMOTIONS ====================
router.post("/students/:studentId/promotions", verifyToken, checkRole(["admin"]), promoteOrDemoteStudent);
router.get("/students/:studentId/promotions", verifyToken, checkRole(["admin", "teacher"]), getStudentPromotionHistory);
router.post("/classes/:classId/bulk-promote", verifyToken, checkRole(["admin"]), bulkPromoteStudents);

// ==================== TEACHERS ====================
router.post("/teachers", verifyToken, checkRole(["admin"]), createTeacher);
router.get("/teachers", verifyToken, checkRole(["admin"]), getTeachers);
router.get("/teachers/:teacherId/schedule", verifyToken, checkRole(["admin", "teacher"]), getTeacherSchedule);

export default router;
