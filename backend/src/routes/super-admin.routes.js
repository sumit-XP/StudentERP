import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { scopeToSchool } from "../middleware/tenant.middleware.js";
import {
  createSchool,
  listSchools,
  getSchool,
  updateSchool,
  createSchoolAdmin,
  deleteSchool,
  toggleSchoolStatus,
  getPlatformStats,
  listAllUsers,
  registerSchool,
  getSchoolBySubdomain,
  createSchoolAcademicYear,
} from "../modules/super-admin/super-admin.controller.js";

const router = express.Router();

// ─── Public endpoints (no auth required) ──────────────────────────
// School self-registration
router.post("/register", registerSchool);

// School lookup by subdomain (login page branding)
router.get("/by-subdomain/:subdomain", getSchoolBySubdomain);

// ─── Super-Admin only endpoints ───────────────────────────────────
const superAdminOnly = [verifyToken, requireRole("super_admin")];

// Platform overview stats
router.get("/stats", ...superAdminOnly, getPlatformStats);

// School (tenant) management
router.post("/schools", ...superAdminOnly, createSchool);
router.get("/schools", ...superAdminOnly, listSchools);
router.get("/schools/:id", ...superAdminOnly, getSchool);
router.put("/schools/:id", ...superAdminOnly, updateSchool);
router.post("/schools/:id/admins", ...superAdminOnly, createSchoolAdmin);
router.delete("/schools/:id", ...superAdminOnly, deleteSchool);
router.patch("/schools/:id/status", ...superAdminOnly, toggleSchoolStatus);
router.post("/schools/:school_id/academic-years", ...superAdminOnly, createSchoolAcademicYear);

// Global user management
router.get("/users", ...superAdminOnly, listAllUsers);

export default router;
