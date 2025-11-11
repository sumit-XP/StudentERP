import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/role.middleware.js";
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
  listDeposits
} from "../modules/fees/fees.controller.js";

const router = express.Router();

// Fee Structure
router.post("/structure", verifyToken, checkRole(["admin"]), createFeeStructure);
router.get("/structure", verifyToken, checkRole(["admin"]), listFeeStructure);

// Invoices
router.post("/invoices/generate", verifyToken, checkRole(["admin"]), generateInvoices);
router.get("/invoices", verifyToken, checkRole(["admin"]), listInvoices);
router.get("/invoices/:id", verifyToken, checkRole(["admin"]), getInvoiceById);

// Payments & Receipts
router.post("/payments", verifyToken, checkRole(["admin"]), recordPayment);
router.get("/receipts/:paymentId.pdf", verifyToken, checkRole(["admin"]), generateReceiptPdf);

// Razorpay
router.post("/razorpay/create-order", verifyToken, checkRole(["admin"]), createRazorpayOrder);
router.post("/razorpay/verify", verifyToken, checkRole(["admin"]), verifyRazorpayPayment);

// Reports
router.get("/reports/collections", verifyToken, checkRole(["admin"]), collectionReport);
router.get("/reports/dues", verifyToken, checkRole(["admin"]), duesReport);
router.get("/reports/defaulters", verifyToken, checkRole(["admin"]), defaultersReport);

// Refunds
router.post("/refunds", verifyToken, checkRole(["admin"]), createRefund);

// Security Deposits
router.post("/deposits", verifyToken, checkRole(["admin"]), createDeposit);
router.put("/deposits/:id/refund", verifyToken, checkRole(["admin"]), refundDeposit);
router.get("/deposits", verifyToken, checkRole(["admin"]), listDeposits);

export default router;
