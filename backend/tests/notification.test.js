import { notificationService } from "../src/utils/notification.service.js";

/**
 * Test file for NotificationService
 * Run with: node tests/notification.test.js
 */

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    failed++;
  }
}

async function runTests() {
  console.log("========================================");
  console.log("NOTIFICATION SERVICE TESTS");
  console.log("========================================\n");

  // Test 1: sendEmail with mock (no SMTP configured)
  await test("sendEmail returns mocked result when SMTP not configured", async () => {
    const result = await notificationService.sendEmail(
      "test@example.com",
      "Test Subject",
      "<p>Test body</p>"
    );
    assert(result.success === true, "Email should return success");
    assert(result.mocked === true, "Email should be mocked when SMTP not configured");
  });

  // Test 2: sendSMS stub
  await test("sendSMS returns mocked result when no provider configured", async () => {
    const result = await notificationService.sendSMS(
      "+1234567890",
      "Test SMS message"
    );
    assert(result.success === true, "SMS should return success");
    assert(result.mocked === true, "SMS should be mocked when no provider configured");
  });

  // Test 3: sendAttendanceAlert
  await test("sendAttendanceAlert returns results array", async () => {
    const parent = { name: "John Doe", email: "john@example.com", phone: "+1234567890" };
    const student = { name: "Jane Doe", student_id: "STU001" };
    
    const results = await notificationService.sendAttendanceAlert(parent, student, "2024-01-15");
    assert(Array.isArray(results), "Should return an array of promises");
    assert(results.length > 0, "Should have at least one notification result");
  });

  // Test 4: sendFeeReminder
  await test("sendFeeReminder returns results array", async () => {
    const parent = { name: "John Doe", email: "john@example.com", phone: "+1234567890" };
    const student = { name: "Jane Doe", student_id: "STU001" };
    
    const results = await notificationService.sendFeeReminder(parent, student, 5000.00, "2024-01-31");
    assert(Array.isArray(results), "Should return an array of promises");
    assert(results.length > 0, "Should have at least one notification result");
  });

  // Test 5: sendLeaveStatusNotification
  await test("sendLeaveStatusNotification returns result object", async () => {
    const teacher = { name: "Mr. Smith", email: "smith@school.edu" };
    const leave = { leave_type: "Sick", from_date: "2024-01-20", to_date: "2024-01-22", reason: "Flu" };
    
    const result = await notificationService.sendLeaveStatusNotification(teacher, leave, "Approved");
    assert(typeof result === "object", "Should return an object");
  });

  // Test 6: sendPayslipNotification
  await test("sendPayslipNotification returns result object", async () => {
    const teacher = { name: "Mr. Smith", email: "smith@school.edu" };
    const payslip = { gross: 50000, deductions: 5000, net: 45000 };
    
    const result = await notificationService.sendPayslipNotification(teacher, payslip, "January 2024");
    assert(typeof result === "object", "Should return an object");
  });

  // Test 7: sendPTMNotification
  await test("sendPTMNotification returns result object", async () => {
    const recipient = { name: "John Doe", email: "john@example.com" };
    const meeting = { scheduled_at: "2024-01-25 10:00", topic: "Progress Review", notes: "Bring report card" };
    
    const result = await notificationService.sendPTMNotification(recipient, meeting, "scheduled");
    assert(typeof result === "object", "Should return an object");
  });

  // Summary
  console.log("\n========================================");
  console.log("TEST SUMMARY");
  console.log("========================================");
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);

  if (failed === 0) {
    console.log("\n🎉 All tests passed!");
    process.exit(0);
  } else {
    console.log("\n⚠️  Some tests failed.");
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error("Test runner error:", error);
  process.exit(1);
});
