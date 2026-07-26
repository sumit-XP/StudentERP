import express from "express";
import {
    // Staff Management
    createStaff,
    getStaff,
    updateStaff,

    // Leave Management
    applyLeave,
    getLeaves,
    approveLeave,
    getMyLeaves
} from "../modules/hr/hr.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/role.middleware.js";

const router = express.Router();

// ==================== STAFF MANAGEMENT ====================
router.post("/staff", verifyToken, checkRole(["admin"]), createStaff);
router.get("/staff", verifyToken, checkRole(["admin"]), getStaff);
router.put("/staff/:id", verifyToken, checkRole(["admin"]), updateStaff);

// ==================== LEAVE MANAGEMENT ====================
router.post("/leaves", verifyToken, applyLeave); // Any authenticated user can apply
router.get("/leaves", verifyToken, checkRole(["admin"]), getLeaves); // Admin can view all
router.put("/leaves/:id/approve", verifyToken, checkRole(["admin"]), approveLeave);
router.get("/my-leaves", verifyToken, getMyLeaves); // View own leaves

export default router;
