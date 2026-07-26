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
  updateClass,
  
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
  getTeacherSchedule,
  batchCreateStudents,
  getStudentGrades,
  getClassGrades,
  saveClassGrades
} from "../modules/academic/academic.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/role.middleware.js";
import { scopeToSchool, requireActiveSchool } from "../middleware/tenant.middleware.js";

const router = express.Router();

// Apply tenant scoping to ALL academic routes
router.use(verifyToken, checkRole(["admin", "teacher", "student", "super_admin"]), scopeToSchool, requireActiveSchool);

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
router.put("/classes/:id", verifyToken, checkRole(["admin"]), updateClass);

// ==================== STUDENTS ====================
router.post("/students", verifyToken, checkRole(["admin", "teacher"]), createStudent);
router.post("/students/batch", verifyToken, checkRole(["admin", "teacher"]), batchCreateStudents);
router.get("/students", verifyToken, checkRole(["admin", "teacher"]), getStudents);
router.get("/students/:studentId/grades", verifyToken, checkRole(["admin", "teacher", "student"]), getStudentGrades);

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

// ==================== GRADES ====================
router.get("/classes/:classId/subjects/:subjectId/grades", verifyToken, checkRole(["admin", "teacher"]), getClassGrades);
router.post("/classes/:classId/subjects/:subjectId/grades", verifyToken, checkRole(["admin", "teacher"]), saveClassGrades);

export default router;
