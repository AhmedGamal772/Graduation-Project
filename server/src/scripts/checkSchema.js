import { pool } from "../config/db.js";

const checkSchema = async () => {
  try {
    // Get all columns from users table
    const [columns] = await pool.query("SHOW COLUMNS FROM users");
    console.log("Users table columns:");
    columns.forEach((column) => {
      console.log(`- ${column.Field} (${column.Type})`);
    });
  } catch (error) {
    console.error("Error checking schema:", error);
  }
};

// Run the check
checkSchema();
