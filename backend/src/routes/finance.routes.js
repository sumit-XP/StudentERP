import express from "express";
import {
  importBankTransactions,
  getBankTransactions,
  reconcileTransactions,
  manualMatchTransaction,
  disputeTransaction,
  getReconciliationReport
} from "../modules/finance/finance.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/role.middleware.js";

const router = express.Router();

// ==================== BANK RECONCILIATION (Task 7) ====================
router.post("/bank-transactions", verifyToken, checkRole(["admin"]), importBankTransactions);
router.get("/bank-transactions", verifyToken, checkRole(["admin"]), getBankTransactions);
router.post("/reconcile", verifyToken, checkRole(["admin"]), reconcileTransactions);
router.post("/bank-transactions/:id/match", verifyToken, checkRole(["admin"]), manualMatchTransaction);
router.post("/bank-transactions/:id/dispute", verifyToken, checkRole(["admin"]), disputeTransaction);
router.get("/reconciliation-report", verifyToken, checkRole(["admin"]), getReconciliationReport);

export default router;
