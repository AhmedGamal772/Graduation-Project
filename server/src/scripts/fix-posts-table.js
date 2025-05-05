import { pool } from "../config/db.js";

async function fixPostsTable() {
  try {
    console.log("Checking posts table structure...");

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
      console.log("Adding title column to posts table...");
      await pool.query(`
        ALTER TABLE posts
        ADD COLUMN title VARCHAR(255) NOT NULL DEFAULT 'Untitled Post'
      `);
      console.log("Title column added successfully!");
    } else {
      console.log("Title column already exists in posts table.");
    }

    // Check if allow_submissions column exists
    const [submitColumns] = await pool.query(
      `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'posts' AND COLUMN_NAME = 'allow_submissions'
    `,
      [process.env.DB_NAME]
    );

    // If allow_submissions column doesn't exist, add it
    if (submitColumns.length === 0) {
      console.log("Adding allow_submissions column to posts table...");
      await pool.query(`
        ALTER TABLE posts
        ADD COLUMN allow_submissions BOOLEAN DEFAULT FALSE
      `);
      console.log("Allow_submissions column added successfully!");
    } else {
      console.log("Allow_submissions column already exists in posts table.");
    }

    // Check if post_files table exists
    const [tables] = await pool.query(
      `
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'post_files'
    `,
      [process.env.DB_NAME]
    );

    // If post_files table doesn't exist, create it
    if (tables.length === 0) {
      console.log("Creating post_files table...");
      await pool.query(`
        CREATE TABLE IF NOT EXISTS post_files (
          id INT AUTO_INCREMENT PRIMARY KEY,
          post_id INT NOT NULL,
          filename VARCHAR(255) NOT NULL,
          file_url VARCHAR(512) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
          INDEX idx_post (post_id)
        )
      `);
      console.log("Post_files table created successfully!");
    } else {
      console.log("Post_files table already exists.");
    }

    console.log("Database fix completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error fixing database:", error);
    process.exit(1);
  }
}

fixPostsTable();
