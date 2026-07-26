import express from "express";
import {
    // Legacy payroll endpoints
    generatePayroll,
    getPayroll,
    getMyPayroll,
    updatePayrollStatus,
    deletePayroll,
    // Enhanced payroll endpoints (Task 4)
    setSalaryStructure,
    getSalaryStructure,
    getAllSalaryStructures,
    generatePayrollRun,
    getPayrollRuns,
    getPayslipsByRun,
    getMyPayslips,
    markPayslipPaid,
    getPayslipDetail
} from "../modules/payroll/payroll.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/role.middleware.js";

const router = express.Router();

// ==================== LEGACY PAYROLL (kept for backward compatibility) ====================
router.post("/generate", verifyToken, checkRole(["admin"]), generatePayroll);
router.get("/legacy", verifyToken, checkRole(["admin"]), getPayroll);
router.get("/my-payroll", verifyToken, getMyPayroll);
router.put("/:id/status", verifyToken, checkRole(["admin"]), updatePayrollStatus);
router.delete("/legacy", verifyToken, checkRole(["admin"]), deletePayroll);

// ==================== ENHANCED PAYROLL MODULE (Task 4) ====================

// Salary Structures
router.post("/salary-structure", verifyToken, checkRole(["admin"]), setSalaryStructure);
router.get("/salary-structure/:id", verifyToken, checkRole(["admin", "teacher"]), getSalaryStructure);
router.get("/salary-structures", verifyToken, checkRole(["admin"]), getAllSalaryStructures);

// Payroll Runs
router.post("/run", verifyToken, checkRole(["admin"]), generatePayrollRun);
router.get("/runs", verifyToken, checkRole(["admin"]), getPayrollRuns);

// Payslips
router.get("/payslips/:runId", verifyToken, checkRole(["admin"]), getPayslipsByRun);
router.get("/payslips/detail/:id", verifyToken, checkRole(["admin", "teacher"]), getPayslipDetail);
router.patch("/payslips/:id/mark-paid", verifyToken, checkRole(["admin"]), markPayslipPaid);
router.get("/my-payslips", verifyToken, checkRole(["teacher"]), getMyPayslips);

export default router;
