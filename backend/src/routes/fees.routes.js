import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/role.middleware.js";
import { scopeToSchool, requireActiveSchool } from "../middleware/tenant.middleware.js";
import {
  createFeeStructure,
  listFeeStructure,
  generateInvoices,
  listInvoices,
  getInvoiceById,
  recordPayment,
  generateReceiptPdf,
  createRazorpayOrder,
  verifyRazorpayPayment,
  collectionReport,
  duesReport,
  defaultersReport,
  createRefund,
  createDeposit,
  refundDeposit,
  listDeposits,
  // Task 8: GST Reports
  getGSTReport,
  getGSTReportCSV,
  // Student
  getMyInvoices
} from "../modules/fees/fees.controller.js";

const router = express.Router();

// Apply tenant scoping to ALL fee routes
router.use(verifyToken, checkRole(["admin", "teacher", "student", "super_admin"]), scopeToSchool, requireActiveSchool);

// Fee Structure
router.post("/structure", checkRole(["admin"]), createFeeStructure);
router.get("/structure", checkRole(["admin"]), listFeeStructure);

// Invoices
router.post("/invoices/generate", checkRole(["admin"]), generateInvoices);
router.get("/invoices", checkRole(["admin"]), listInvoices);
router.get("/invoices/:id", checkRole(["admin"]), getInvoiceById);

// Payments & Receipts
router.post("/payments", checkRole(["admin"]), recordPayment);
router.get("/receipts/:paymentId.pdf", checkRole(["admin"]), generateReceiptPdf);

// Razorpay
router.post("/razorpay/create-order", checkRole(["admin", "parent", "student"]), createRazorpayOrder);
router.post("/razorpay/verify", checkRole(["admin", "parent", "student"]), verifyRazorpayPayment);

// Reports
router.get("/reports/collections", checkRole(["admin"]), collectionReport);
router.get("/reports/dues", checkRole(["admin"]), duesReport);
router.get("/reports/defaulters", checkRole(["admin"]), defaultersReport);

// Refunds
router.post("/refunds", checkRole(["admin"]), createRefund);

// Security Deposits
router.post("/deposits", checkRole(["admin"]), createDeposit);
router.put("/deposits/:id/refund", checkRole(["admin"]), refundDeposit);
router.get("/deposits", checkRole(["admin"]), listDeposits);

// Task 8: GST/Tax Reports
router.get("/reports/gst", checkRole(["admin"]), getGSTReport);
router.get("/reports/gst/csv", checkRole(["admin"]), getGSTReportCSV);

// Student / Parent: view own invoices
router.get("/my-invoices", checkRole(["student", "parent"]), getMyInvoices);

export default router;
