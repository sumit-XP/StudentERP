import cron from "node-cron";
import pool from "../config/db.js";
import { notificationService } from "../utils/notification.service.js";

/**
 * Cron Jobs for Automated Notifications
 * - Attendance alerts: Daily at 8:00 AM
 * - Fee reminders: 1st of every month at 9:00 AM
 */

/**
 * Send attendance alerts to parents of students marked absent today
 */
async function sendAttendanceAlerts() {
  console.log("[CRON] Running attendance alert job at", new Date().toISOString());

  try {
    const today = new Date().toISOString().split("T")[0];

    // Query students marked absent today with their parent contact info
    const absentStudentsQuery = `
      SELECT 
        s.id as student_id,
        s.student_id as student_code,
        u.name as student_name,
        p.id as parent_id,
        p.name as parent_name,
        p.email as parent_email,
        p.phone as parent_phone,
        sg.name as guardian_name,
        sg.email as guardian_email,
        sg.phone as guardian_phone,
        sg.is_primary
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN users p ON s.parent_id = p.id
      LEFT JOIN student_guardians sg ON s.id = sg.student_id AND sg.is_primary = true
      WHERE a.date = $1
        AND a.status = 'absent'
        AND (p.email IS NOT NULL OR p.phone IS NOT NULL OR sg.email IS NOT NULL OR sg.phone IS NOT NULL)
    `;

    const result = await pool.query(absentStudentsQuery, [today]);

    console.log(`[CRON] Found ${result.rows.length} absent students with contact info`);

    const notifications = [];

    for (const row of result.rows) {
      const student = {
        id: row.student_id,
        student_id: row.student_code,
        name: row.student_name,
      };

      // Notify primary parent
      if (row.parent_email || row.parent_phone) {
        const parent = {
          name: row.parent_name,
          email: row.parent_email,
          phone: row.parent_phone,
        };
        notifications.push(notificationService.sendAttendanceAlert(parent, student, today));
      }

      // Notify primary guardian (if different from parent)
      if (row.guardian_email || row.guardian_phone) {
        const guardian = {
          name: row.guardian_name,
          email: row.guardian_email,
          phone: row.guardian_phone,
        };
        notifications.push(notificationService.sendAttendanceAlert(guardian, student, today));
      }
    }

    await Promise.all(notifications);
    console.log(`[CRON] Attendance alerts sent: ${notifications.length} notifications`);
  } catch (error) {
    console.error("[CRON] Error in attendance alert job:", error);
  }
}

/**
 * Send fee reminders to parents of students with unpaid fees
 */
async function sendFeeReminders() {
  console.log("[CRON] Running fee reminder job at", new Date().toISOString());

  try {
    // Query students with unpaid/partial invoices
    const unpaidFeesQuery = `
      SELECT 
        s.id as student_id,
        s.student_id as student_code,
        u.name as student_name,
        p.id as parent_id,
        p.name as parent_name,
        p.email as parent_email,
        p.phone as parent_phone,
        sg.name as guardian_name,
        sg.email as guardian_email,
        sg.phone as guardian_phone,
        fi.id as invoice_id,
        fi.total_amount - COALESCE(
          (SELECT SUM(amount_paid) FROM fee_payments WHERE invoice_id = fi.id), 
          0
        ) as amount_due,
        fi.due_date
      FROM fee_invoices fi
      JOIN students s ON fi.student_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN users p ON s.parent_id = p.id
      LEFT JOIN student_guardians sg ON s.id = sg.student_id AND sg.is_primary = true
      WHERE fi.status IN ('unpaid', 'partial')
        AND fi.due_date <= CURRENT_DATE + INTERVAL '7 days'
        AND (p.email IS NOT NULL OR p.phone IS NOT NULL OR sg.email IS NOT NULL OR sg.phone IS NOT NULL)
    `;

    const result = await pool.query(unpaidFeesQuery);

    console.log(`[CRON] Found ${result.rows.length} students with unpaid fees`);

    const notifications = [];

    for (const row of result.rows) {
      const student = {
        id: row.student_id,
        student_id: row.student_code,
        name: row.student_name,
      };

      const amountDue = parseFloat(row.amount_due);
      const dueDate = row.due_date.toISOString().split("T")[0];

      // Notify primary parent
      if (row.parent_email || row.parent_phone) {
        const parent = {
          name: row.parent_name,
          email: row.parent_email,
          phone: row.parent_phone,
        };
        notifications.push(notificationService.sendFeeReminder(parent, student, amountDue, dueDate));
      }

      // Notify primary guardian
      if (row.guardian_email || row.guardian_phone) {
        const guardian = {
          name: row.guardian_name,
          email: row.guardian_email,
          phone: row.guardian_phone,
        };
        notifications.push(notificationService.sendFeeReminder(guardian, student, amountDue, dueDate));
      }
    }

    await Promise.all(notifications);
    console.log(`[CRON] Fee reminders sent: ${notifications.length} notifications`);
  } catch (error) {
    console.error("[CRON] Error in fee reminder job:", error);
  }
}

/**
 * Initialize all cron jobs
 */
export function initCronJobs() {
  console.log("[CRON] Initializing notification cron jobs...");

  // Attendance alerts: Daily at 8:00 AM
  const attendanceJob = cron.schedule("0 8 * * *", sendAttendanceAlerts, {
    scheduled: true,
    timezone: process.env.TIMEZONE || "Asia/Kolkata",
  });

  // Fee reminders: 1st of every month at 9:00 AM
  const feeReminderJob = cron.schedule("0 9 1 * *", sendFeeReminders, {
    scheduled: true,
    timezone: process.env.TIMEZONE || "Asia/Kolkata",
  });

  console.log("[CRON] Jobs scheduled:");
  console.log("  - Attendance alerts: Daily at 8:00 AM");
  console.log("  - Fee reminders: 1st of every month at 9:00 AM");

  return {
    attendanceJob,
    feeReminderJob,
  };
}

/**
 * Manually trigger attendance alerts (for testing)
 */
export async function triggerAttendanceAlertsManually() {
  console.log("[CRON] Manual trigger: Attendance alerts");
  return sendAttendanceAlerts();
}

/**
 * Manually trigger fee reminders (for testing)
 */
export async function triggerFeeRemindersManually() {
  console.log("[CRON] Manual trigger: Fee reminders");
  return sendFeeReminders();
}

export default {
  initCronJobs,
  triggerAttendanceAlertsManually,
  triggerFeeRemindersManually,
};
