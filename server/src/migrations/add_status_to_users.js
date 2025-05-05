import { pool } from "../config/db.js";

const addStatusToUsers = async () => {
  try {
    // Check if status column exists
    const [columns] = await pool.query("SHOW COLUMNS FROM users LIKE 'status'");

    if (columns.length === 0) {
      // Add status column with default value 'active'
      await pool.query(
        "ALTER TABLE users ADD COLUMN status ENUM('active', 'inactive', 'suspended') DEFAULT 'active'"
      );
      console.log("Status column added to users table");
    } else {
      console.log("Status column already exists in users table");
    }
  } catch (error) {
    console.error("Error adding status column to users table:", error);
  }
};

// Run the migration
addStatusToUsers();
