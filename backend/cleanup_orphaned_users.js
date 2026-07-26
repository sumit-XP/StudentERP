import pool from './src/config/db.js';

async function cleanup() {
  try {
    console.log("Starting database cleanup...");
    
    // Find how many orphaned users there are
    const selectQuery = `
      SELECT id, email, name FROM users 
      WHERE role_id = (SELECT id FROM roles WHERE name = 'student') 
      AND id NOT IN (SELECT user_id FROM students WHERE user_id IS NOT NULL)
    `;
    
    const { rows } = await pool.query(selectQuery);
    console.log(`Found ${rows.length} orphaned student user(s).`);
    
    if (rows.length > 0) {
      // Delete them
      const deleteQuery = `
        DELETE FROM users 
        WHERE role_id = (SELECT id FROM roles WHERE name = 'student') 
        AND id NOT IN (SELECT user_id FROM students WHERE user_id IS NOT NULL)
      `;
      const result = await pool.query(deleteQuery);
      console.log(`Successfully deleted ${result.rowCount} orphaned student user(s).`);
    } else {
      console.log("No orphaned users to delete.");
    }
  } catch (error) {
    console.error("Error during cleanup:", error);
  } finally {
    pool.end();
  }
}

cleanup();
