import { pool } from "../config/db.js";

export const up = async () => {
  try {
    // Check if title column exists
    const [columns] = await pool.query(
      `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'posts' AND COLUMN_NAME = 'title'
    `,
      [process.env.DB_NAME]
    );

    // If title column doesn't exist, add it
    if (columns.length === 0) {
      await pool.query(`
        ALTER TABLE posts
        ADD COLUMN title VARCHAR(255) NOT NULL DEFAULT 'Untitled Post'
      `);

      console.log("Added title column to posts table");
    } else {
      console.log("Title column already exists in posts table");
    }

    return true;
  } catch (error) {
    console.error("Migration failed:", error);
    return false;
  }
};

export const down = async () => {
  try {
    // Check if title column exists
    const [columns] = await pool.query(
      `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'posts' AND COLUMN_NAME = 'title'
    `,
      [process.env.DB_NAME]
    );

    // If title column exists, remove it
    if (columns.length > 0) {
      await pool.query(`
        ALTER TABLE posts
        DROP COLUMN title
      `);

      console.log("Removed title column from posts table");
    } else {
      console.log("Title column doesn't exist in posts table");
    }

    return true;
  } catch (error) {
    console.error("Migration rollback failed:", error);
    return false;
  }
};

export default { up, down };
