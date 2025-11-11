import pool from "../../config/db.js";
import PDFDocument from "pdfkit";
import crypto from "crypto";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const Razorpay = require("razorpay");

function parseNumber(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

async function updateInvoiceStatus(invoiceId) {
  const invRes = await pool.query("SELECT total_amount, COALESCE(late_fee,0) as late_fee FROM fee_invoices WHERE id=$1", [invoiceId]);
  if (invRes.rows.length === 0) return null;
  const total = parseNumber(invRes.rows[0].total_amount) + parseNumber(invRes.rows[0].late_fee);
  const payRes = await pool.query("SELECT COALESCE(SUM(amount_paid),0) as paid FROM fee_payments WHERE invoice_id=$1", [invoiceId]);
  const paid = parseNumber(payRes.rows[0].paid);
  let status = "unpaid";
  if (paid <= 0) status = "unpaid"; else if (paid < total) status = "partial"; else status = "paid";
  await pool.query("UPDATE fee_invoices SET status=$1 WHERE id=$2", [status, invoiceId]);
  return status;
}

export const createFeeStructure = async (req, res) => {
  try {
    const { classId, feeType, amount, dueDate, academicYearId } = req.body;
    if (!classId || !feeType || amount === undefined) return res.status(400).json({ error: "classId, feeType, amount are required" });
    const result = await pool.query(
      `INSERT INTO fee_structure (class_id, fee_type, amount, due_date, academic_year_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [classId, feeType, amount, dueDate, academicYearId]
    );
    res.status(201).json({ feeStructure: result.rows[0] });
  } catch (e) { res.status(500).json({ error: "Failed to create fee structure" }); }
};

export const listFeeStructure = async (req, res) => {
  try {
    const { classId, academicYearId } = req.query;
    let q = `SELECT fs.*, c.name as class_name, c.section FROM fee_structure fs LEFT JOIN classes c ON fs.class_id=c.id WHERE 1=1`;
    const p = [];
    let i = 0;
    if (classId) { i++; q += ` AND fs.class_id=$${i}`; p.push(classId); }
    if (academicYearId) { i++; q += ` AND fs.academic_year_id=$${i}`; p.push(academicYearId); }
    q += ` ORDER BY fs.class_id, fs.fee_type`;
    const r = await pool.query(q, p);
    res.json({ feeStructure: r.rows });
  } catch (e) { res.status(500).json({ error: "Failed to list fee structure" }); }
};

async function getTargets({ classId, studentId }) {
  if (studentId) {
    const r = await pool.query("SELECT id FROM students WHERE id=$1", [studentId]);
    return r.rows.map(x => x.id);
  }
  const r = await pool.query("SELECT id FROM students WHERE class_id=$1", [classId]);
  return r.rows.map(x => x.id);
}

export const generateInvoices = async (req, res) => {
  const client = await pool.connect();
  try {
    const { classId, studentId, academicYearId, dueDate } = req.body;
    if (!classId && !studentId) return res.status(400).json({ error: "classId or studentId is required" });
    const sids = await getTargets({ classId, studentId });
    if (!sids.length) return res.json({ invoices: [] });

    await client.query("BEGIN");
    const fp = [];
    let fq = `SELECT * FROM fee_structure WHERE 1=1`;
    let i = 0;
    if (classId) { i++; fq += ` AND class_id=$${i}`; fp.push(classId); }
    if (academicYearId) { i++; fq += ` AND academic_year_id=$${i}`; fp.push(academicYearId); }
    const fs = await client.query(fq, fp);

    const created = [];
    for (const sid of sids) {
      let total = 0;
      for (const row of fs.rows) total += parseNumber(row.amount);
      const invRes = await client.query(
        `INSERT INTO fee_invoices (student_id, invoice_number, invoice_date, due_date, total_amount, academic_year_id, status)
         VALUES ($1, CONCAT('INV-', to_char(NOW(),'YYYYMMDD'), '-', floor(random()*100000)::text), CURRENT_DATE, $2, $3, $4, 'unpaid') RETURNING *`,
        [sid, dueDate || null, total, academicYearId || null]
      );
      const inv = invRes.rows[0];
      for (const row of fs.rows) {
        await client.query(
          `INSERT INTO fee_invoice_items (invoice_id, fee_type, amount) VALUES ($1, $2, $3)`,
          [inv.id, row.fee_type, row.amount]
        );
      }
      created.push(inv);
    }

    await client.query("COMMIT");
    res.json({ invoices: created });
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    res.status(500).json({ error: "Failed to generate invoices" });
  } finally { client.release(); }
};

export const listInvoices = async (req, res) => {
  try {
    const { studentId, classId, status } = req.query;
    let q = `SELECT fi.*, s.student_id as student_number, u.name as student_name, c.name as class_name, c.section
             FROM fee_invoices fi
             JOIN students s ON fi.student_id=s.id
             JOIN users u ON s.user_id=u.id
             LEFT JOIN classes c ON s.class_id=c.id
             WHERE 1=1`;
    const p = [];
    let i = 0;
    if (studentId) { i++; q += ` AND fi.student_id=$${i}`; p.push(studentId); }
    if (classId) { i++; q += ` AND s.class_id=$${i}`; p.push(classId); }
    if (status) { i++; q += ` AND fi.status=$${i}`; p.push(status); }
    q += ` ORDER BY fi.invoice_date DESC`;
    const r = await pool.query(q, p);
    res.json({ invoices: r.rows });
  } catch (e) { res.status(500).json({ error: "Failed to list invoices" }); }
};

export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const inv = await pool.query(
      `SELECT fi.*, s.student_id as student_number, u.name as student_name, u.email as student_email
       FROM fee_invoices fi
       JOIN students s ON fi.student_id=s.id
       JOIN users u ON s.user_id=u.id
       WHERE fi.id=$1`, [id]
    );
    if (!inv.rows.length) return res.status(404).json({ error: "Invoice not found" });
    const items = await pool.query("SELECT * FROM fee_invoice_items WHERE invoice_id=$1", [id]);
    const pays = await pool.query("SELECT * FROM fee_payments WHERE invoice_id=$1 ORDER BY payment_date DESC, id DESC", [id]);
    res.json({ invoice: inv.rows[0], items: items.rows, payments: pays.rows });
  } catch (e) { res.status(500).json({ error: "Failed to get invoice" }); }
};

export const recordPayment = async (req, res) => {
  try {
    const { invoiceId, amountPaid, paymentMethod, transactionId } = req.body;
    if (!invoiceId || !amountPaid) return res.status(400).json({ error: "invoiceId and amountPaid are required" });
    const inv = await pool.query("SELECT id, student_id FROM fee_invoices WHERE id=$1", [invoiceId]);
    if (!inv.rows.length) return res.status(404).json({ error: "Invoice not found" });
    const receipt = `RCPT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*100000)}`;
    const r = await pool.query(
      `INSERT INTO fee_payments (student_id, fee_structure_id, invoice_id, amount_paid, payment_method, transaction_id, receipt_number)
       VALUES ($1, NULL, $2, $3, $4, $5, $6) RETURNING *`,
      [inv.rows[0].student_id, invoiceId, amountPaid, paymentMethod || 'cash', transactionId || null, receipt]
    );
    const status = await updateInvoiceStatus(invoiceId);
    res.status(201).json({ payment: r.rows[0], invoiceStatus: status });
  } catch (e) { res.status(500).json({ error: "Failed to record payment" }); }
};

export const generateReceiptPdf = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const pay = await pool.query(
      `SELECT p.*, fi.invoice_number, fi.student_id as inv_student_id, fi.total_amount, u.name as student_name, s.student_id as student_number
       FROM fee_payments p
       LEFT JOIN fee_invoices fi ON p.invoice_id=fi.id
       LEFT JOIN students s ON fi.student_id=s.id
       LEFT JOIN users u ON s.user_id=u.id
       WHERE p.id=$1`, [paymentId]
    );
    if (!pay.rows.length) return res.status(404).json({ error: "Payment not found" });
    const row = pay.rows[0];
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=receipt-${row.receipt_number || paymentId}.pdf`);
    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);
    doc.fontSize(18).text("Fee Receipt", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Receipt No: ${row.receipt_number || ''}`);
    doc.text(`Invoice No: ${row.invoice_number || ''}`);
    doc.text(`Student: ${row.student_name || ''} (${row.student_number || ''})`);
    doc.text(`Payment Date: ${row.payment_date || ''}`);
    doc.text(`Payment Method: ${row.payment_method || ''}`);
    doc.moveDown();
    doc.fontSize(14).text(`Amount Paid: ₹${parseNumber(row.amount_paid).toFixed(2)}`);
    doc.end();
  } catch (e) { res.status(500).json({ error: "Failed to generate receipt" }); }
};

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
    if (!rz) return res.status(400).json({ error: "Razorpay not configured" });
    const inv = await pool.query("SELECT id, total_amount, COALESCE(late_fee,0) as late_fee, student_id FROM fee_invoices WHERE id=$1", [invoiceId]);
    if (!inv.rows.length) return res.status(404).json({ error: "Invoice not found" });
    const paidRes = await pool.query("SELECT COALESCE(SUM(amount_paid),0) as paid FROM fee_payments WHERE invoice_id=$1", [invoiceId]);
    const due = Math.max(0, parseNumber(inv.rows[0].total_amount) + parseNumber(inv.rows[0].late_fee) - parseNumber(paidRes.rows[0].paid));
    const amount = Math.round(due * 100);
    if (amount <= 0) return res.status(400).json({ error: "No dues for this invoice" });
    const order = await rz.orders.create({ amount, currency: "INR", receipt: `INV-${invoiceId}`, notes: { invoiceId: String(invoiceId) } });
    await pool.query(
      `INSERT INTO razorpay_orders (invoice_id, razorpay_order_id, amount_paise, currency, status)
       VALUES ($1, $2, $3, $4, 'created') ON CONFLICT (razorpay_order_id) DO NOTHING`,
      [invoiceId, order.id, amount, 'INR']
    );
    res.json({ orderId: order.id, amount, currency: 'INR', keyId: process.env.RAZORPAY_KEY_ID });
  } catch (e) { res.status(500).json({ error: "Failed to create Razorpay order" }); }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { invoiceId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return res.status(400).json({ error: "Razorpay not configured" });
    const h = crypto.createHmac('sha256', secret);
    h.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const expected = h.digest('hex');
    if (expected !== razorpaySignature) return res.status(400).json({ error: "Invalid signature" });

    const ord = await pool.query("SELECT amount_paise FROM razorpay_orders WHERE razorpay_order_id=$1", [razorpayOrderId]);
    const amount = ord.rows.length ? ord.rows[0].amount_paise : null;
    await pool.query(
      `UPDATE razorpay_orders SET status='paid', razorpay_payment_id=$1, razorpay_signature=$2 WHERE razorpay_order_id=$3`,
      [razorpayPaymentId, razorpaySignature, razorpayOrderId]
    );

    const inv = await pool.query("SELECT id, student_id FROM fee_invoices WHERE id=$1", [invoiceId]);
    if (!inv.rows.length) return res.status(404).json({ error: "Invoice not found" });
    const receipt = `RCPT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*100000)}`;
    const paidAmt = amount ? amount/100 : null;
    const payRes = await pool.query(
      `INSERT INTO fee_payments (student_id, fee_structure_id, invoice_id, amount_paid, payment_method, transaction_id, receipt_number)
       VALUES ($1, NULL, $2, $3, 'online', $4, $5) RETURNING *`,
      [inv.rows[0].student_id, invoiceId, paidAmt, razorpayPaymentId, receipt]
    );
    const status = await updateInvoiceStatus(invoiceId);
    res.json({ payment: payRes.rows[0], invoiceStatus: status });
  } catch (e) { res.status(500).json({ error: "Failed to verify Razorpay payment" }); }
};

export const collectionReport = async (req, res) => {
  try {
    const { startDate, endDate, by = 'day' } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: "startDate and endDate are required" });
    if (by === 'method') {
      const r = await pool.query(
        `SELECT payment_method, SUM(amount_paid) as total FROM fee_payments WHERE payment_date BETWEEN $1 AND $2 GROUP BY payment_method`,
        [startDate, endDate]
      );
      return res.json({ data: r.rows });
    }
    const r = await pool.query(
      `SELECT payment_date::date as date, SUM(amount_paid) as total FROM fee_payments WHERE payment_date BETWEEN $1 AND $2 GROUP BY payment_date::date ORDER BY date`,
      [startDate, endDate]
    );
    res.json({ data: r.rows });
  } catch (e) { res.status(500).json({ error: "Failed to get collection report" }); }
};

export const duesReport = async (req, res) => {
  try {
    const { classId } = req.query;
    const r = await pool.query(
      `WITH inv AS (
         SELECT fi.student_id, SUM(fi.total_amount + COALESCE(fi.late_fee,0)) AS total
         FROM fee_invoices fi
         GROUP BY fi.student_id
       ), pay AS (
         SELECT fp.invoice_id, SUM(fp.amount_paid) AS paid FROM fee_payments fp GROUP BY fp.invoice_id
       )
       SELECT s.id as student_id, u.name as student_name, s.student_id as student_number, c.name as class_name, c.section,
              COALESCE(inv.total,0) - COALESCE((SELECT SUM(amount_paid) FROM fee_payments p JOIN fee_invoices fi ON p.invoice_id=fi.id WHERE fi.student_id=s.id),0) AS due
       FROM students s
       JOIN users u ON s.user_id=u.id
       LEFT JOIN classes c ON s.class_id=c.id
       LEFT JOIN inv ON inv.student_id=s.id
       WHERE ($1::int IS NULL OR s.class_id=$1)
       ORDER BY due DESC`,
      [classId || null]
    );
    res.json({ data: r.rows });
  } catch (e) { res.status(500).json({ error: "Failed to get dues report" }); }
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
  } catch (e) { res.status(500).json({ error: "Failed to get defaulters report" }); }
};

export const createRefund = async (req, res) => {
  try {
    const { paymentId, amount, reason } = req.body;
    if (!paymentId || !amount) return res.status(400).json({ error: "paymentId and amount are required" });
    const pay = await pool.query("SELECT * FROM fee_payments WHERE id=$1", [paymentId]);
    if (!pay.rows.length) return res.status(404).json({ error: "Payment not found" });
    const row = pay.rows[0];
    if (amount <= 0 || amount > Number(row.amount_paid)) return res.status(400).json({ error: "Invalid refund amount" });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const ref = await client.query(
        `INSERT INTO fee_refunds (payment_id, amount, reason) VALUES ($1, $2, $3) RETURNING *`,
        [paymentId, amount, reason || null]
      );
      const receipt = `RCPT-RF-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*100000)}`;
      await client.query(
        `INSERT INTO fee_payments (student_id, fee_structure_id, invoice_id, amount_paid, payment_method, transaction_id, receipt_number)
         VALUES ($1, NULL, $2, $3, 'refund', $4, $5)`,
        [row.student_id, row.invoice_id, -Math.abs(Number(amount)), `refund:${ref.rows[0].id}`, receipt]
      );
      await client.query("COMMIT");
      await updateInvoiceStatus(row.invoice_id);
      res.status(201).json({ refund: ref.rows[0] });
    } catch (err) {
      try { await client.query("ROLLBACK"); } catch {}
      throw err;
    } finally { client.release(); }
  } catch (e) { res.status(500).json({ error: "Failed to create refund" }); }
};

export const createDeposit = async (req, res) => {
  try {
    const { studentId, amount, receivedAt } = req.body;
    if (!studentId || !amount) return res.status(400).json({ error: "studentId and amount are required" });
    const r = await pool.query(
      `INSERT INTO security_deposits (student_id, amount, received_at) VALUES ($1, $2, $3) RETURNING *`,
      [studentId, amount, receivedAt || null]
    );
    res.status(201).json({ deposit: r.rows[0] });
  } catch (e) { res.status(500).json({ error: "Failed to create deposit" }); }
};

export const refundDeposit = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    if (!amount) return res.status(400).json({ error: "amount is required" });
    const dep = await pool.query("SELECT * FROM security_deposits WHERE id=$1", [id]);
    if (!dep.rows.length) return res.status(404).json({ error: "Deposit not found" });
    const row = dep.rows[0];
    if (Number(row.refunded_amount) + Number(amount) > Number(row.amount)) {
      return res.status(400).json({ error: "Refund exceeds deposit amount" });
    }
    const r = await pool.query(
      `UPDATE security_deposits SET refunded_amount = refunded_amount + $1 WHERE id=$2 RETURNING *`,
      [amount, id]
    );
    res.json({ deposit: r.rows[0] });
  } catch (e) { res.status(500).json({ error: "Failed to refund deposit" }); }
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
    if (studentId) { q += ` AND sd.student_id=$1`; p.push(studentId); }
    q += ` ORDER BY sd.received_at DESC, sd.id DESC`;
    const r = await pool.query(q, p);
    res.json({ deposits: r.rows });
  } catch (e) { res.status(500).json({ error: "Failed to list deposits" }); }
};
