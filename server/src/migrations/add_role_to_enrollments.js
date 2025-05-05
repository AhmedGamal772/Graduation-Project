import { pool } from "../config/db.js";

/**
 * Add role column to enrollments table
 *
 * This migration adds a role column to the enrollments table to make it
 * easier to distinguish between student and instructor enrollments.
 */
async function migrate() {
  try {
    console.log("Starting migration: Add role column to enrollments table");

    // First check if the column already exists
    const [columns] = await pool.query(
      "SHOW COLUMNS FROM enrollments LIKE 'role'"
    );

    if (columns.length === 0) {
      // Column doesn't exist, add it
      await pool.query(
        `ALTER TABLE enrollments 
         ADD COLUMN role ENUM('student', 'instructor') NOT NULL AFTER course_id`
      );
      console.log("Added 'role' column to 'enrollments' table");

      // Now update existing enrollments based on users' roles
      await pool.query(`
        UPDATE enrollments e
        JOIN users u ON e.user_id = u.id
        SET e.role = u.role
        WHERE u.role IN ('student', 'instructor')
      `);
      console.log("Updated existing enrollments with user roles");
    } else {
      console.log(
        "The 'role' column already exists in the 'enrollments' table"
      );
    }

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

migrate()
  .then(() => console.log("Migration script completed"))
  .catch((err) => console.error("Migration script failed:", err))
  .finally(() => process.exit());
