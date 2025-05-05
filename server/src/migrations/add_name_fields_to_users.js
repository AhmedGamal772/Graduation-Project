import { pool } from "../config/db.js";

const addNameFieldsToUsers = async () => {
  try {
    // Check if first_name column exists
    const [firstNameColumns] = await pool.query(
      "SHOW COLUMNS FROM users LIKE 'first_name'"
    );

    if (firstNameColumns.length === 0) {
      // Add first_name column
      await pool.query("ALTER TABLE users ADD COLUMN first_name VARCHAR(100)");
      console.log("first_name column added to users table");
    } else {
      console.log("first_name column already exists in users table");
    }

    // Check if last_name column exists
    const [lastNameColumns] = await pool.query(
      "SHOW COLUMNS FROM users LIKE 'last_name'"
    );

    if (lastNameColumns.length === 0) {
      // Add last_name column
      await pool.query("ALTER TABLE users ADD COLUMN last_name VARCHAR(100)");
      console.log("last_name column added to users table");
    } else {
      console.log("last_name column already exists in users table");
    }
  } catch (error) {
    console.error("Error adding name columns to users table:", error);
  }
};

// Run the migration
addNameFieldsToUsers();
