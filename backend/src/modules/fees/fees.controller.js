import pool from "../../config/db.js";
import PDFDocument from "pdfkit";
import crypto from "crypto";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const Razorpay = require("razorpay");

const LATE_FEE_AMOUNT = 50; // ₹50 flat late fee if payment is delayed

function parseNumber(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

async function updateInvoiceStatus(invoiceId) {
  const invRes = await pool.query(
    "SELECT total_amount, COALESCE(late_fee,0) as late_fee FROM fee_invoices WHERE id=$1",
    [invoiceId]
  );
  if (invRes.rows.length === 0) return null;
  const total =
    parseNumber(invRes.rows[0].total_amount) +
    parseNumber(invRes.rows[0].late_fee);
  const payRes = await pool.query(
    "SELECT COALESCE(SUM(amount_paid),0) as paid FROM fee_payments WHERE invoice_id=$1",
    [invoiceId]
  );
  const paid = parseNumber(payRes.rows[0].paid);
  let status = "unpaid";
  if (paid <= 0) status = "unpaid";
  else if (paid < total) status = "partial";
  else status = "paid";
  await pool.query("UPDATE fee_invoices SET status=$1 WHERE id=$2", [
    status,
    invoiceId,
  ]);
  return status;
}

// ── Fee Structure ────────────────────────────────────────────
export const createFeeStructure = async (req, res) => {
  try {
    const { classId, feeType, amount, dueDate, academicYearId } = req.body;
    const schoolId = req.tenantId || null;
    if (!classId || !feeType || amount === undefined)
      return res
        .status(400)
        .json({ error: "classId, feeType, amount are required" });
    const result = await pool.query(
      `INSERT INTO fee_structure (class_id, fee_type, amount, due_date, academic_year_id, school_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [classId, feeType, amount, dueDate, academicYearId, schoolId]
    );
    res.status(201).json({ feeStructure: result.rows[0] });
  } catch (e) {
    console.error("createFeeStructure:", e);
    res.status(500).json({ error: "Failed to create fee structure" });
  }
};

export const listFeeStructure = async (req, res) => {
  try {
    const { classId, academicYearId } = req.query;
    const schoolId = req.tenantId || null;
    let q = `SELECT fs.*, c.name as class_name, c.section FROM fee_structure fs LEFT JOIN classes c ON fs.class_id=c.id WHERE 1=1`;
    const p = [];
    let i = 0;
    if (schoolId) {
      i++;
      q += ` AND fs.school_id=$${i}`;
      p.push(schoolId);
    }
    if (classId) {
      i++;
      q += ` AND fs.class_id=$${i}`;
      p.push(classId);
    }
    if (academicYearId) {
      i++;
      q += ` AND fs.academic_year_id=$${i}`;
      p.push(academicYearId);
    }
    q += ` ORDER BY fs.class_id, fs.fee_type`;
    const r = await pool.query(q, p);
    res.json({ feeStructure: r.rows });
  } catch (e) {
    console.error("listFeeStructure:", e);
    res.status(500).json({ error: "Failed to list fee structure" });
  }
};

export const deleteFeeStructure = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM fee_structure WHERE id=$1", [id]);
    res.json({ success: true });
  } catch (e) {
    console.error("deleteFeeStructure:", e);
    res.status(500).json({ error: "Failed to delete fee structure" });
  }
};

// ── Invoice Generation ───────────────────────────────────────
async function getTargets({ classId, studentId }) {
  if (studentId) {
    const r = await pool.query("SELECT id FROM students WHERE id=$1", [
      studentId,
    ]);
    return r.rows.map((x) => x.id);
  }
  const r = await pool.query("SELECT id FROM students WHERE class_id=$1", [
    classId,
  ]);
  return r.rows.map((x) => x.id);
}

export const generateInvoices = async (req, res) => {
  const client = await pool.connect();
  try {
    const { classId, studentId, academicYearId, dueDate } = req.body;
    const schoolId = req.tenantId || null;
    if (!classId && !studentId)
      return res
        .status(400)
        .json({ error: "classId or studentId is required" });
    const sids = await getTargets({ classId, studentId });
    if (!sids.length) return res.json({ invoices: [] });

    await client.query("BEGIN");
    const fp = [];
    let fq = `SELECT * FROM fee_structure WHERE 1=1`;
    let i = 0;
    if (classId) {
      i++;
      fq += ` AND class_id=$${i}`;
      fp.push(classId);
    }
    if (academicYearId) {
      i++;
      fq += ` AND academic_year_id=$${i}`;
      fp.push(academicYearId);
    }
    const fs = await client.query(fq, fp);

    // Determine late fee: if dueDate is provided and is in the past, add ₹50
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let lateFee = 0;
    if (dueDate) {
      const due = new Date(dueDate);
      due.setHours(0, 0, 0, 0);
      if (due < today) {
        lateFee = LATE_FEE_AMOUNT;
      }
    }

    const created = [];
    for (const sid of sids) {
      let total = 0;
      for (const row of fs.rows) total += parseNumber(row.amount);
      const invRes = await client.query(
        `INSERT INTO fee_invoices (student_id, invoice_number, invoice_date, due_date, total_amount, late_fee, academic_year_id, status, school_id)
         VALUES ($1, CONCAT('INV-', to_char(NOW(),'YYYYMMDD'), '-', floor(random()*100000)::text), CURRENT_DATE, $2, $3, $4, $5, 'unpaid', $6) RETURNING *`,
        [sid, dueDate || null, total, lateFee, academicYearId || null, schoolId]
      );
      const inv = invRes.rows[0];
      for (const row of fs.rows) {
        await client.query(
          `INSERT INTO fee_invoice_items (invoice_id, fee_type, amount) VALUES ($1, $2, $3)`,
          [inv.id, row.fee_type, row.amount]
        );
      }
      // Add late fee line item if applicable
      if (lateFee > 0) {
        await client.query(
          `INSERT INTO fee_invoice_items (invoice_id, fee_type, amount) VALUES ($1, $2, $3)`,
          [inv.id, "Late Fine", lateFee]
        );
      }
      created.push(inv);
    }

    await client.query("COMMIT");
    res.json({ invoices: created });
  } catch (e) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    console.error("generateInvoices:", e);
    res.status(500).json({ error: "Failed to generate invoices" });
  } finally {
    client.release();
  }
};

export const listInvoices = async (req, res) => {
  try {
    const { studentId, classId, status, search } = req.query;
    const schoolId = req.tenantId || null;
    let q = `SELECT fi.*, s.student_id as student_number, s.roll_number, u.name as student_name, c.name as class_name, c.section,
             COALESCE((SELECT SUM(amount_paid) FROM fee_payments WHERE invoice_id=fi.id AND amount_paid > 0),0) as amount_paid
             FROM fee_invoices fi
             JOIN students s ON fi.student_id=s.id
             JOIN users u ON s.user_id=u.id
             LEFT JOIN classes c ON s.class_id=c.id
             WHERE 1=1`;
    const p = [];
    let i = 0;
    if (schoolId) {
      i++;
      q += ` AND fi.school_id=$${i}`;
      p.push(schoolId);
    }
    if (studentId) {
      i++;
      q += ` AND fi.student_id=$${i}`;
      p.push(studentId);
    }
    if (classId) {
      i++;
      q += ` AND s.class_id=$${i}`;
      p.push(classId);
    }
    if (status && status !== "all") {
      i++;
      q += ` AND fi.status=$${i}`;
      p.push(status);
    }
    if (search) {
      i++;
      q += ` AND (u.name ILIKE $${i} OR s.student_id ILIKE $${i} OR fi.invoice_number ILIKE $${i})`;
      p.push(`%${search}%`);
    }
    q += ` ORDER BY fi.invoice_date DESC`;
    const r = await pool.query(q, p);
    res.json({ invoices: r.rows });
  } catch (e) {
    console.error("listInvoices:", e);
    res.status(500).json({ error: "Failed to list invoices" });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const inv = await pool.query(
      `SELECT fi.*, s.student_id as student_number, u.name as student_name, u.email as student_email,
              c.name as class_name, c.section
       FROM fee_invoices fi
       JOIN students s ON fi.student_id=s.id
       JOIN users u ON s.user_id=u.id
       LEFT JOIN classes c ON s.class_id=c.id
       WHERE fi.id=$1`,
      [id]
    );
    if (!inv.rows.length)
      return res.status(404).json({ error: "Invoice not found" });
    const items = await pool.query(
      "SELECT * FROM fee_invoice_items WHERE invoice_id=$1",
      [id]
    );
    const pays = await pool.query(
      "SELECT * FROM fee_payments WHERE invoice_id=$1 AND amount_paid > 0 ORDER BY payment_date DESC, id DESC",
      [id]
    );
    const totalPaid = pays.rows.reduce(
      (sum, p) => sum + parseNumber(p.amount_paid),
      0
    );
    const totalDue =
      parseNumber(inv.rows[0].total_amount) +
      parseNumber(inv.rows[0].late_fee) -
      totalPaid;
    res.json({
      invoice: inv.rows[0],
      items: items.rows,
      payments: pays.rows,
      totalPaid,
      totalDue: Math.max(0, totalDue),
    });
  } catch (e) {
    console.error("getInvoiceById:", e);
    res.status(500).json({ error: "Failed to get invoice" });
  }
};

// ── Payments ─────────────────────────────────────────────────
export const recordPayment = async (req, res) => {
  try {
    const {
      invoiceId,
      amountPaid,
      paymentMethod,
      transactionId,
      remarks,
      collectedBy,
    } = req.body;
    if (!invoiceId || !amountPaid)
      return res
        .status(400)
        .json({ error: "invoiceId and amountPaid are required" });
    const inv = await pool.query(
      "SELECT id, student_id FROM fee_invoices WHERE id=$1",
      [invoiceId]
    );
    if (!inv.rows.length)
      return res.status(404).json({ error: "Invoice not found" });
    const receipt = `RCPT-${new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "")}-${Math.floor(Math.random() * 100000)}`;
    const r = await pool.query(
      `INSERT INTO fee_payments (student_id, fee_structure_id, invoice_id, amount_paid, payment_method, transaction_id, receipt_number, remarks, collected_by)
       VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        inv.rows[0].student_id,
        invoiceId,
        amountPaid,
        paymentMethod || "cash",
        transactionId || null,
        receipt,
        remarks || null,
        collectedBy || null,
      ]
    );
    const status = await updateInvoiceStatus(invoiceId);
    res.status(201).json({ payment: r.rows[0], invoiceStatus: status });
  } catch (e) {
    console.error("recordPayment:", e);
    res.status(500).json({ error: "Failed to record payment" });
  }
};

// ── PDF Receipt ───────────────────────────────────────────────
export const generateReceiptPdf = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const pay = await pool.query(
      `SELECT p.*, fi.invoice_number, fi.student_id as inv_student_id, fi.total_amount,
              fi.late_fee, u.name as student_name, s.student_id as student_number,
              c.name as class_name, c.section
       FROM fee_payments p
       LEFT JOIN fee_invoices fi ON p.invoice_id=fi.id
       LEFT JOIN students s ON fi.student_id=s.id
       LEFT JOIN users u ON s.user_id=u.id
       LEFT JOIN classes c ON s.class_id=c.id
       WHERE p.id=$1`,
      [paymentId]
    );
    if (!pay.rows.length)
      return res.status(404).json({ error: "Payment not found" });
    const row = pay.rows[0];

    // Fetch items for the invoice
    const items = await pool.query(
      "SELECT * FROM fee_invoice_items WHERE invoice_id=$1",
      [row.invoice_id]
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=receipt-${row.receipt_number || paymentId}.pdf`
    );
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Header
    doc.fontSize(20).font("Helvetica-Bold").text("FEE RECEIPT", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica").text("School ERP Management System", { align: "center" });
    doc.moveDown(1);

    // Divider
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Details grid
    const left = 50, right = 310;
    const addRow = (label, value) => {
      const y = doc.y;
      doc.fontSize(10).font("Helvetica-Bold").text(label + ":", left, y);
      doc.fontSize(10).font("Helvetica").text(String(value || "—"), right, y);
      doc.moveDown(0.4);
    };

    addRow("Receipt No", row.receipt_number || paymentId);
    addRow("Invoice No", row.invoice_number || "—");
    addRow("Student", `${row.student_name || ""} (${row.student_number || ""})`);
    addRow("Class", row.class_name ? `${row.class_name} ${row.section || ""}` : "—");
    addRow("Payment Date", row.payment_date ? String(row.payment_date).slice(0, 10) : "—");
    addRow("Payment Method", (row.payment_method || "").toUpperCase());
    if (row.transaction_id) addRow("Transaction ID", row.transaction_id);
    if (row.collected_by) addRow("Collected By", row.collected_by);
    if (row.remarks) addRow("Remarks", row.remarks);

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Fee items
    if (items.rows.length > 0) {
      doc.fontSize(11).font("Helvetica-Bold").text("Fee Breakdown:");
      doc.moveDown(0.3);
      items.rows.forEach((item) => {
        doc
          .fontSize(10)
          .font("Helvetica")
          .text(`  ${item.fee_type}`, left, doc.y)
          .text(`₹${parseNumber(item.amount).toFixed(2)}`, right, doc.y - 12);
        doc.moveDown(0.3);
      });
    }

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Amount paid
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(`Amount Paid: ₹${parseNumber(row.amount_paid).toFixed(2)}`, {
        align: "right",
      });

    doc.moveDown(1);
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#666666")
      .text(
        "This is a computer-generated receipt and does not require a signature.",
        { align: "center" }
      );

    doc.end();
  } catch (e) {
    console.error("generateReceiptPdf:", e);
    res.status(500).json({ error: "Failed to generate receipt" });
  }
};

// ── Razorpay ─────────────────────────────────────────────────
function getRazor() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) return null;
  return new Razorpay({ key_id, key_secret });
}

export const createRazorpayOrder = async (req, res) => {
  try {
    const { invoiceId } = req.body;
    const rz = getRazor();
    if (!rz)
      return res
        .status(400)
        .json({ error: "Razorpay not configured — check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env" });
    const inv = await pool.query(
      "SELECT id, total_amount, COALESCE(late_fee,0) as late_fee, student_id FROM fee_invoices WHERE id=$1",
      [invoiceId]
    );
    if (!inv.rows.length)
      return res.status(404).json({ error: "Invoice not found" });
    const paidRes = await pool.query(
      "SELECT COALESCE(SUM(amount_paid),0) as paid FROM fee_payments WHERE invoice_id=$1 AND amount_paid > 0",
      [invoiceId]
    );
    const due = Math.max(
      0,
      parseNumber(inv.rows[0].total_amount) +
        parseNumber(inv.rows[0].late_fee) -
        parseNumber(paidRes.rows[0].paid)
    );
    const amount = Math.round(due * 100);
    if (amount <= 0)
      return res
        .status(400)
        .json({ error: "No dues for this invoice — already fully paid" });
    const order = await rz.orders.create({
      amount,
      currency: "INR",
      receipt: `INV-${invoiceId}`,
      notes: { invoiceId: String(invoiceId) },
    });
    await pool.query(
      `INSERT INTO razorpay_orders (invoice_id, razorpay_order_id, amount_paise, currency, status)
       VALUES ($1, $2, $3, $4, 'created') ON CONFLICT (razorpay_order_id) DO NOTHING`,
      [invoiceId, order.id, amount, "INR"]
    );
    res.json({
      orderId: order.id,
      amount,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (e) {
    console.error("createRazorpayOrder:", e);
    res
      .status(500)
      .json({ error: "Failed to create Razorpay order: " + (e.message || "") });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      invoiceId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret)
      return res.status(400).json({ error: "Razorpay not configured" });
    const h = crypto.createHmac("sha256", secret);
    h.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const expected = h.digest("hex");
    if (expected !== razorpaySignature)
      return res.status(400).json({ error: "Invalid payment signature — verification failed" });

    const ord = await pool.query(
      "SELECT amount_paise FROM razorpay_orders WHERE razorpay_order_id=$1",
      [razorpayOrderId]
    );
    const amount = ord.rows.length ? ord.rows[0].amount_paise : null;
    await pool.query(
      `UPDATE razorpay_orders SET status='paid', razorpay_payment_id=$1, razorpay_signature=$2 WHERE razorpay_order_id=$3`,
      [razorpayPaymentId, razorpaySignature, razorpayOrderId]
    );

    const inv = await pool.query(
      "SELECT id, student_id FROM fee_invoices WHERE id=$1",
      [invoiceId]
    );
    if (!inv.rows.length)
      return res.status(404).json({ error: "Invoice not found" });
    const receipt = `RCPT-${new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "")}-${Math.floor(Math.random() * 100000)}`;
    const paidAmt = amount ? amount / 100 : null;
    const payRes = await pool.query(
      `INSERT INTO fee_payments (student_id, fee_structure_id, invoice_id, amount_paid, payment_method, transaction_id, receipt_number)
       VALUES ($1, NULL, $2, $3, 'online', $4, $5) RETURNING *`,
      [
        inv.rows[0].student_id,
        invoiceId,
        paidAmt,
        razorpayPaymentId,
        receipt,
      ]
    );
    const status = await updateInvoiceStatus(invoiceId);
    res.json({ payment: payRes.rows[0], invoiceStatus: status });
  } catch (e) {
    console.error("verifyRazorpayPayment:", e);
    res.status(500).json({ error: "Failed to verify Razorpay payment" });
  }
};

// ── Reports ───────────────────────────────────────────────────
export const collectionReport = async (req, res) => {
  try {
    const { startDate, endDate, by = "day" } = req.query;
    const schoolId = req.tenantId || null;
    if (!startDate || !endDate)
      return res
        .status(400)
        .json({ error: "startDate and endDate are required" });
    const schoolFilter = schoolId ? ` AND fp.school_id='${schoolId}'` : "";
    if (by === "method") {
      const r = await pool.query(
        `SELECT payment_method, SUM(amount_paid) as total FROM fee_payments fp WHERE payment_date BETWEEN $1 AND $2${schoolFilter} AND amount_paid > 0 GROUP BY payment_method`,
        [startDate, endDate]
      );
      return res.json({ data: r.rows });
    }
    const r = await pool.query(
      `SELECT payment_date::date as date, SUM(amount_paid) as total FROM fee_payments fp WHERE payment_date BETWEEN $1 AND $2${schoolFilter} AND amount_paid > 0 GROUP BY payment_date::date ORDER BY date`,
      [startDate, endDate]
    );
    res.json({ data: r.rows });
  } catch (e) {
    console.error("collectionReport:", e);
    res.status(500).json({ error: "Failed to get collection report" });
  }
};

export const duesReport = async (req, res) => {
  try {
    const { classId } = req.query;
    const schoolId = req.tenantId || null;
    const schoolFilter = schoolId ? ` AND s.school_id='${schoolId}'` : "";
    const r = await pool.query(
      `WITH inv AS (
         SELECT fi.student_id, SUM(fi.total_amount + COALESCE(fi.late_fee,0)) AS total
         FROM fee_invoices fi
         GROUP BY fi.student_id
       )
       SELECT s.id as student_id, u.name as student_name, s.student_id as student_number, c.name as class_name, c.section,
              COALESCE(inv.total,0) - COALESCE((SELECT SUM(amount_paid) FROM fee_payments p JOIN fee_invoices fi ON p.invoice_id=fi.id WHERE fi.student_id=s.id AND p.amount_paid > 0),0) AS due
       FROM students s
       JOIN users u ON s.user_id=u.id
       LEFT JOIN classes c ON s.class_id=c.id
       LEFT JOIN inv ON inv.student_id=s.id
       WHERE ($1::int IS NULL OR s.class_id=$1)${schoolFilter}
       ORDER BY due DESC`,
      [classId || null]
    );
    res.json({ data: r.rows });
  } catch (e) {
    console.error("duesReport:", e);
    res.status(500).json({ error: "Failed to get dues report" });
  }
};

export const defaultersReport = async (req, res) => {
  try {
    const { classId } = req.query;
    const r = await pool.query(
      `WITH inv AS (
         SELECT fi.student_id, SUM(fi.total_amount + COALESCE(fi.late_fee,0)) AS total
         FROM fee_invoices fi
         GROUP BY fi.student_id
       ), paid AS (
         SELECT fi.student_id, COALESCE(SUM(fp.amount_paid),0) AS paid
         FROM fee_payments fp
         JOIN fee_invoices fi ON fp.invoice_id = fi.id
         WHERE fp.amount_paid > 0
         GROUP BY fi.student_id
       )
       SELECT s.id as student_id, u.name as student_name, s.student_id as student_number, c.name as class_name, c.section,
              (COALESCE(inv.total,0) - COALESCE(paid.paid,0)) AS due
       FROM students s
       JOIN users u ON s.user_id=u.id
       LEFT JOIN classes c ON s.class_id=c.id
       LEFT JOIN inv ON inv.student_id=s.id
       LEFT JOIN paid ON paid.student_id=s.id
       WHERE ($1::int IS NULL OR s.class_id=$1)
         AND (COALESCE(inv.total,0) - COALESCE(paid.paid,0)) > 0
       ORDER BY due DESC`,
      [classId || null]
    );
    res.json({ data: r.rows });
  } catch (e) {
    console.error("defaultersReport:", e);
    res.status(500).json({ error: "Failed to get defaulters report" });
  }
};

// ── Refunds ───────────────────────────────────────────────────
export const createRefund = async (req, res) => {
  try {
    const { paymentId, amount, reason } = req.body;
    if (!paymentId || !amount)
      return res
        .status(400)
        .json({ error: "paymentId and amount are required" });
    const pay = await pool.query(
      "SELECT * FROM fee_payments WHERE id=$1",
      [paymentId]
    );
    if (!pay.rows.length)
      return res.status(404).json({ error: "Payment not found" });
    const row = pay.rows[0];
    if (amount <= 0 || amount > Number(row.amount_paid))
      return res.status(400).json({ error: "Invalid refund amount" });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const ref = await client.query(
        `INSERT INTO fee_refunds (payment_id, amount, reason) VALUES ($1, $2, $3) RETURNING *`,
        [paymentId, amount, reason || null]
      );
      const receipt = `RCPT-RF-${new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "")}-${Math.floor(Math.random() * 100000)}`;
      await client.query(
        `INSERT INTO fee_payments (student_id, fee_structure_id, invoice_id, amount_paid, payment_method, transaction_id, receipt_number)
         VALUES ($1, NULL, $2, $3, 'refund', $4, $5)`,
        [
          row.student_id,
          row.invoice_id,
          -Math.abs(Number(amount)),
          `refund:${ref.rows[0].id}`,
          receipt,
        ]
      );
      await client.query("COMMIT");
      await updateInvoiceStatus(row.invoice_id);
      res.status(201).json({ refund: ref.rows[0] });
    } catch (err) {
      try {
        await client.query("ROLLBACK");
      } catch {}
      throw err;
    } finally {
      client.release();
    }
  } catch (e) {
    console.error("createRefund:", e);
    res.status(500).json({ error: "Failed to create refund" });
  }
};

// ── Security Deposits ─────────────────────────────────────────
export const createDeposit = async (req, res) => {
  try {
    const { studentId, amount, receivedAt } = req.body;
    if (!studentId || !amount)
      return res
        .status(400)
        .json({ error: "studentId and amount are required" });
    const r = await pool.query(
      `INSERT INTO security_deposits (student_id, amount, received_at) VALUES ($1, $2, $3) RETURNING *`,
      [studentId, amount, receivedAt || null]
    );
    res.status(201).json({ deposit: r.rows[0] });
  } catch (e) {
    console.error("createDeposit:", e);
    res.status(500).json({ error: "Failed to create deposit" });
  }
};

export const refundDeposit = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    if (!amount) return res.status(400).json({ error: "amount is required" });
    const dep = await pool.query(
      "SELECT * FROM security_deposits WHERE id=$1",
      [id]
    );
    if (!dep.rows.length)
      return res.status(404).json({ error: "Deposit not found" });
    const row = dep.rows[0];
    if (Number(row.refunded_amount) + Number(amount) > Number(row.amount)) {
      return res
        .status(400)
        .json({ error: "Refund exceeds deposit amount" });
    }
    const r = await pool.query(
      `UPDATE security_deposits SET refunded_amount = refunded_amount + $1 WHERE id=$2 RETURNING *`,
      [amount, id]
    );
    res.json({ deposit: r.rows[0] });
  } catch (e) {
    console.error("refundDeposit:", e);
    res.status(500).json({ error: "Failed to refund deposit" });
  }
};

export const listDeposits = async (req, res) => {
  try {
    const { studentId } = req.query;
    let q = `SELECT sd.*, u.name as student_name, s.student_id as student_number
             FROM security_deposits sd
             JOIN students s ON sd.student_id=s.id
             JOIN users u ON s.user_id=u.id
             WHERE 1=1`;
    const p = [];
    if (studentId) {
      q += ` AND sd.student_id=$1`;
      p.push(studentId);
    }
    q += ` ORDER BY sd.received_at DESC, sd.id DESC`;
    const r = await pool.query(q, p);
    res.json({ deposits: r.rows });
  } catch (e) {
    console.error("listDeposits:", e);
    res.status(500).json({ error: "Failed to list deposits" });
  }
};

// ── GST Reports ───────────────────────────────────────────────
export const getGSTReport = async (req, res) => {
  try {
    const { year } = req.query;
    if (!year)
      return res.status(400).json({ error: "year parameter is required" });
    const gstRate = parseFloat(process.env.GST_RATE || 18);
    const startDate = `${year}-04-01`;
    const endDate = `${parseInt(year) + 1}-03-31`;
    const result = await pool.query(
      `SELECT EXTRACT(MONTH FROM payment_date) as month, EXTRACT(YEAR FROM payment_date) as payment_year, SUM(amount_paid) as total_collected, COUNT(*) as transaction_count FROM fee_payments WHERE payment_date >= $1 AND payment_date <= $2 AND amount_paid > 0 GROUP BY EXTRACT(YEAR FROM payment_date), EXTRACT(MONTH FROM payment_date) ORDER BY payment_year, month`,
      [startDate, endDate]
    );
    const months = [
      "April","May","June","July","August","September","October","November","December","January","February","March",
    ];
    const report = result.rows.map((row) => {
      const totalCollected = parseFloat(row.total_collected);
      const gstAmount = parseFloat((totalCollected * gstRate / 100).toFixed(2));
      const netAmount = parseFloat((totalCollected - gstAmount).toFixed(2));
      const monthIndex = (parseInt(row.month) - 4 + 12) % 12;
      return {
        month: months[monthIndex],
        month_number: parseInt(row.month),
        year: parseInt(row.payment_year),
        total_collected: totalCollected,
        gst_rate: gstRate,
        gst_amount: gstAmount,
        net_amount: netAmount,
        transaction_count: parseInt(row.transaction_count),
      };
    });
    const totals = report.reduce(
      (acc, row) => {
        acc.total_collected += row.total_collected;
        acc.gst_amount += row.gst_amount;
        acc.net_amount += row.net_amount;
        acc.transaction_count += row.transaction_count;
        return acc;
      },
      { total_collected: 0, gst_amount: 0, net_amount: 0, transaction_count: 0 }
    );
    res.json({
      financial_year: `${year}-${parseInt(year) + 1}`,
      gst_rate: gstRate,
      currency: "INR",
      report,
      totals,
    });
  } catch (error) {
    console.error("getGSTReport:", error);
    res.status(500).json({ error: "Failed to generate GST report" });
  }
};

export const getGSTReportCSV = async (req, res) => {
  try {
    const { year } = req.query;
    if (!year)
      return res.status(400).json({ error: "year parameter is required" });
    const gstRate = parseFloat(process.env.GST_RATE || 18);
    const startDate = `${year}-04-01`;
    const endDate = `${parseInt(year) + 1}-03-31`;
    const result = await pool.query(
      `SELECT EXTRACT(MONTH FROM payment_date) as month, EXTRACT(YEAR FROM payment_date) as payment_year, SUM(amount_paid) as total_collected, COUNT(*) as transaction_count FROM fee_payments WHERE payment_date >= $1 AND payment_date <= $2 AND amount_paid > 0 GROUP BY EXTRACT(YEAR FROM payment_date), EXTRACT(MONTH FROM payment_date) ORDER BY payment_year, month`,
      [startDate, endDate]
    );
    const months = ["April","May","June","July","August","September","October","November","December","January","February","March"];
    let csv ="Month,Year,Total Collected (INR),GST Rate (%),GST Amount (INR),Net Amount (INR),Transaction Count\n";
    result.rows.forEach((row) => {
      const totalCollected = parseFloat(row.total_collected);
      const gstAmount = parseFloat((totalCollected * gstRate / 100).toFixed(2));
      const netAmount = parseFloat((totalCollected - gstAmount).toFixed(2));
      const monthIndex = (parseInt(row.month) - 4 + 12) % 12;
      csv += `${months[monthIndex]},${row.payment_year},${totalCollected},${gstRate},${gstAmount},${netAmount},${row.transaction_count}\n`;
    });
    const totals = result.rows.reduce(
      (acc, row) => {
        acc.total_collected += parseFloat(row.total_collected);
        acc.gst_amount += (parseFloat(row.total_collected) * gstRate) / 100;
        acc.net_amount += parseFloat(row.total_collected) * (1 - gstRate / 100);
        acc.transaction_count += parseInt(row.transaction_count);
        return acc;
      },
      { total_collected: 0, gst_amount: 0, net_amount: 0, transaction_count: 0 }
    );
    csv += `TOTAL,,${totals.total_collected.toFixed(2)},,${totals.gst_amount.toFixed(2)},${totals.net_amount.toFixed(2)},${totals.transaction_count}\n`;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="gst_report_${year}-${parseInt(year) + 1}.csv"`
    );
    res.send(csv);
  } catch (error) {
    console.error("getGSTReportCSV:", error);
    res.status(500).json({ error: "Failed to generate GST report CSV" });
  }
};

// ── Student Ledger (Admin view) ───────────────────────────────
export const getStudentFeeLedger = async (req, res) => {
  try {
    const { studentId } = req.params;
    // Student info
    const stuRes = await pool.query(
      `SELECT s.*, u.name as student_name, u.email, u.phone,
              c.name as class_name, c.section, s.student_id as student_number
       FROM students s
       JOIN users u ON s.user_id=u.id
       LEFT JOIN classes c ON s.class_id=c.id
       WHERE s.id=$1`,
      [studentId]
    );
    if (!stuRes.rows.length)
      return res.status(404).json({ error: "Student not found" });
    const student = stuRes.rows[0];

    // All invoices
    const invRes = await pool.query(
      `SELECT fi.* FROM fee_invoices fi WHERE fi.student_id=$1 ORDER BY fi.invoice_date DESC`,
      [studentId]
    );

    // Items for all invoices
    const itemsMap = {};
    for (const inv of invRes.rows) {
      const ir = await pool.query(
        "SELECT * FROM fee_invoice_items WHERE invoice_id=$1",
        [inv.id]
      );
      itemsMap[inv.id] = ir.rows;
    }

    // All payments for this student
    const payRes = await pool.query(
      `SELECT fp.* FROM fee_payments fp
       JOIN fee_invoices fi ON fp.invoice_id=fi.id
       WHERE fi.student_id=$1 AND fp.amount_paid > 0
       ORDER BY fp.payment_date DESC, fp.id DESC`,
      [studentId]
    );

    // Summary totals
    const totalBilled = invRes.rows.reduce(
      (sum, inv) =>
        sum + parseNumber(inv.total_amount) + parseNumber(inv.late_fee),
      0
    );
    const totalPaid = payRes.rows.reduce(
      (sum, p) => sum + parseNumber(p.amount_paid),
      0
    );
    const totalDue = Math.max(0, totalBilled - totalPaid);

    res.json({
      student,
      invoices: invRes.rows,
      items: itemsMap,
      payments: payRes.rows,
      summary: { totalBilled, totalPaid, totalDue },
    });
  } catch (e) {
    console.error("getStudentFeeLedger:", e);
    res.status(500).json({ error: "Failed to get student fee ledger" });
  }
};

// ── My Invoices (Student / Parent) ───────────────────────────
export const getMyInvoices = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const role = req.user?.role;
    const uid = req.user?.uid;
    if (!userId && !uid) return res.status(401).json({ error: "Unauthorized" });

    let studentRes;
    if (role === "parent") {
      studentRes = await pool.query(
        `SELECT s.id FROM students s WHERE s.parent_id = $1 OR s.user_id = $2 LIMIT 1`,
        [userId || 0, userId || 0]
      );
    } else {
      studentRes = await pool.query(
        `SELECT s.id FROM students s WHERE s.user_id = $1 OR s.parent_id = $2 LIMIT 1`,
        [userId || 0, userId || 0]
      );
      if (!studentRes.rows.length && uid) {
        studentRes = await pool.query(
          `SELECT s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.uid = $1 LIMIT 1`,
          [uid]
        );
      }
    }

    if (!studentRes.rows.length) {
      return res.json({ invoices: [], items: {} });
    }
    const studentId = studentRes.rows[0].id;

    const invRes = await pool.query(
      `SELECT fi.*, c.name as class_name, c.section,
              COALESCE((SELECT SUM(amount_paid) FROM fee_payments WHERE invoice_id=fi.id AND amount_paid > 0),0) as amount_paid
       FROM fee_invoices fi
       LEFT JOIN students s ON fi.student_id = s.id
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE fi.student_id = $1
       ORDER BY fi.invoice_date DESC`,
      [studentId]
    );

    // Fetch items for each invoice
    const itemsMap = {};
    for (const inv of invRes.rows) {
      const itemsRes = await pool.query(
        `SELECT * FROM fee_invoice_items WHERE invoice_id = $1`,
        [inv.id]
      );
      itemsMap[inv.id] = itemsRes.rows;
    }

    // Summary
    const totalBilled = invRes.rows.reduce(
      (sum, inv) =>
        sum + parseNumber(inv.total_amount) + parseNumber(inv.late_fee),
      0
    );
    const totalPaid = invRes.rows.reduce(
      (sum, inv) => sum + parseNumber(inv.amount_paid),
      0
    );

    res.json({
      invoices: invRes.rows,
      items: itemsMap,
      summary: { totalBilled, totalPaid, totalDue: Math.max(0, totalBilled - totalPaid) },
    });
  } catch (e) {
    console.error("getMyInvoices error:", e);
    res.status(500).json({ error: "Failed to fetch your invoices" });
  }
};
