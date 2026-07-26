const { Client } = require('pg');

async function fixDb() {
  const client = new Client('postgresql://postgres:1234@localhost:5432/student_erp');
  await client.connect();

  const tables = [
    'academic_years', 'classes', 'subjects', 'class_subjects',
    'students', 'teachers', 'timetable', 'attendance',
    'assignments', 'assignment_submissions', 'learning_resources',
    'announcements', 'notifications', 'fee_structure', 'fee_invoices',
    'fee_invoice_items', 'razorpay_orders', 'fee_refunds', 'security_deposits',
    'leaves', 'messages'
  ];

  for (const table of tables) {
    try {
      await client.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;`);
      console.log(`Added school_id to ${table}`);
    } catch (e) {
      console.log(`Error adding to ${table}: ${e.message}`);
    }
  }

  await client.end();
}

fixDb();
