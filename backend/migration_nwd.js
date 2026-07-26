import pool from "./src/config/db.js";

async function runMigration() {
  try {
    console.log("Creating non_working_days table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS non_working_days (
          id SERIAL PRIMARY KEY,
          class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(class_id, date)
      );
    `);
    console.log("Table created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
