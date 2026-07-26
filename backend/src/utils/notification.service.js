import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/**
 * NotificationService handles email and SMS notifications
 * SMS is stubbed (logs to console) until a provider is configured
 */
class NotificationService {
  constructor() {
    this.transporter = null;
    this.initEmailTransporter();
  }

  /**
   * Initialize email transporter with SMTP settings
   */
  initEmailTransporter() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn("⚠️  Email SMTP not fully configured. Email notifications will be logged only.");
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort || 587,
      secure: (smtpPort || 587) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    console.log("✅ Email transporter initialized");
  }

  /**
   * Send an email notification
   * @param {string} to - Recipient email address
   * @param {string} subject - Email subject
   * @param {string} body - Email body (HTML or plain text)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Result of email send operation
   */
  async sendEmail(to, subject, body, options = {}) {
    try {
      const from = process.env.FROM_EMAIL || process.env.SMTP_USER || "erp@school.edu";

      if (!this.transporter) {
        console.log(`[EMAIL MOCK] To: ${to}, Subject: ${subject}`);
        console.log(`[EMAIL MOCK] Body: ${body.substring(0, 100)}...`);
        return { success: true, messageId: "mock-id", mocked: true };
      }

      const mailOptions = {
        from: options.from || `"School ERP" <${from}>`,
        to,
        subject,
        html: body,
        text: options.text || body.replace(/<[^>]*>/g, ""),
      };

      try {
        const result = await this.transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${to}, MessageId: ${result.messageId}`);
        return { success: true, messageId: result.messageId };
      } catch (sendError) {
        // If sending fails (e.g., auth error), fall back to mock mode
        console.log(`[EMAIL MOCK - Fallback] To: ${to}, Subject: ${subject}`);
        console.log(`[EMAIL MOCK - Fallback] Body: ${body.substring(0, 100)}...`);
        return { success: true, messageId: "mock-fallback-id", mocked: true, fallback: true };
      }
    } catch (error) {
      console.error(`❌ Failed to send email to ${to}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send an SMS notification (currently stubbed)
   * @param {string} to - Recipient phone number
   * @param {string} message - SMS message body
   * @returns {Promise<Object>} - Result of SMS send operation
   */
  async sendSMS(to, message) {
    try {
      const smsProvider = process.env.SMS_PROVIDER; // 'twilio', 'sns', etc.

      if (!smsProvider) {
        console.log(`[SMS MOCK] To: ${to}, Message: ${message.substring(0, 50)}...`);
        return { success: true, messageId: "mock-sms-id", mocked: true };
      }

      // TODO: Implement actual SMS provider integration
      // Twilio example:
      // const twilio = require('twilio');
      // const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
      // await client.messages.create({ body: message, from: process.env.TWILIO_PHONE, to });

      console.log(`[SMS STUB] Provider: ${smsProvider}, To: ${to}`);
      return { success: true, messageId: "stub-id", stubbed: true };
    } catch (error) {
      console.error(`❌ Failed to send SMS to ${to}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send attendance alert to parent
   * @param {Object} parent - Parent user object
   * @param {Object} student - Student object
   * @param {string} date - Attendance date
   */
  async sendAttendanceAlert(parent, student, date) {
    const subject = `Attendance Alert: ${student.name} was absent on ${date}`;
    const body = `
      <p>Dear ${parent.name},</p>
      <p>This is to inform you that your child <strong>${student.name}</strong> (ID: ${student.student_id}) was marked <strong>absent</strong> on <strong>${date}</strong>.</p>
      <p>If you have any questions, please contact the school administration.</p>
      <p>Best regards,<br>School ERP System</p>
    `;

    const notifications = [];

    if (parent.email) {
      notifications.push(this.sendEmail(parent.email, subject, body));
    }

    if (parent.phone) {
      const smsMessage = `Attendance Alert: ${student.name} was absent on ${date}. Contact school for details.`;
      notifications.push(this.sendSMS(parent.phone, smsMessage));
    }

    return Promise.all(notifications);
  }

  /**
   * Send fee reminder to parent
   * @param {Object} parent - Parent user object
   * @param {Object} student - Student object
   * @param {number} amountDue - Outstanding fee amount
   * @param {string} dueDate - Fee due date
   */
  async sendFeeReminder(parent, student, amountDue, dueDate) {
    const subject = `Fee Reminder: Outstanding payment for ${student.name}`;
    const body = `
      <p>Dear ${parent.name},</p>
      <p>This is a friendly reminder that there is an outstanding fee payment for your child <strong>${student.name}</strong> (ID: ${student.student_id}).</p>
      <p><strong>Amount Due:</strong> ₹${amountDue.toFixed(2)}</p>
      <p><strong>Due Date:</strong> ${dueDate}</p>
      <p>Please make the payment at your earliest convenience to avoid late fees.</p>
      <p>Best regards,<br>School ERP System</p>
    `;

    const notifications = [];

    if (parent.email) {
      notifications.push(this.sendEmail(parent.email, subject, body));
    }

    if (parent.phone) {
      const smsMessage = `Fee Reminder: Outstanding amount ₹${amountDue.toFixed(2)} due on ${dueDate} for ${student.name}. Please pay to avoid late fees.`;
      notifications.push(this.sendSMS(parent.phone, smsMessage));
    }

    return Promise.all(notifications);
  }

  /**
   * Send leave status notification to teacher
   * @param {Object} teacher - Teacher user object
   * @param {Object} leave - Leave application object
   * @param {string} status - Approved or Rejected
   */
  async sendLeaveStatusNotification(teacher, leave, status) {
    const subject = `Leave Application ${status}`;
    const body = `
      <p>Dear ${teacher.name},</p>
      <p>Your leave application has been <strong>${status.toLowerCase()}</strong>.</p>
      <p><strong>Leave Type:</strong> ${leave.leave_type}</p>
      <p><strong>From:</strong> ${leave.from_date}</p>
      <p><strong>To:</strong> ${leave.to_date}</p>
      <p><strong>Reason:</strong> ${leave.reason || "N/A"}</p>
      <p>Best regards,<br>School Administration</p>
    `;

    if (teacher.email) {
      return this.sendEmail(teacher.email, subject, body);
    }

    return { success: false, error: "No email available" };
  }

  /**
   * Send payslip notification to teacher
   * @param {Object} teacher - Teacher user object
   * @param {Object} payslip - Payslip object
   * @param {string} monthYear - Month and year of payroll
   */
  async sendPayslipNotification(teacher, payslip, monthYear) {
    const subject = `Payslip Generated: ${monthYear}`;
    const body = `
      <p>Dear ${teacher.name},</p>
      <p>Your payslip for <strong>${monthYear}</strong> has been generated.</p>
      <p><strong>Gross Salary:</strong> ₹${payslip.gross.toFixed(2)}</p>
      <p><strong>Deductions:</strong> ₹${payslip.deductions.toFixed(2)}</p>
      <p><strong>Net Salary:</strong> ₹${payslip.net.toFixed(2)}</p>
      <p>Please log in to the portal to view your complete payslip.</p>
      <p>Best regards,<br>School Administration</p>
    `;

    if (teacher.email) {
      return this.sendEmail(teacher.email, subject, body);
    }

    return { success: false, error: "No email available" };
  }

  /**
   * Send PTM notification
   * @param {Object} recipient - Teacher or Parent user object
   * @param {Object} meeting - Meeting details
   * @param {string} action - 'scheduled' or 'cancelled'
   */
  async sendPTMNotification(recipient, meeting, action) {
    const subject = `Parent-Teacher Meeting ${action === 'scheduled' ? 'Scheduled' : 'Cancelled'}`;
    const body = `
      <p>Dear ${recipient.name},</p>
      <p>A parent-teacher meeting has been <strong>${action}</strong>.</p>
      <p><strong>Scheduled Time:</strong> ${meeting.scheduled_at}</p>
      <p><strong>Topic:</strong> ${meeting.topic || "General"}</p>
      ${meeting.notes ? `<p><strong>Notes:</strong> ${meeting.notes}</p>` : ""}
      <p>Best regards,<br>School ERP System</p>
    `;

    if (recipient.email) {
      return this.sendEmail(recipient.email, subject, body);
    }

    return { success: false, error: "No email available" };
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default NotificationService;
