import { pool } from "../config/db.js";

export const up = async () => {
  try {
    // 1. Add allow_submissions column to posts table
    await pool.query(`
      ALTER TABLE posts
      ADD COLUMN allow_submissions BOOLEAN DEFAULT FALSE
    `);

    console.log("Added allow_submissions column to posts table");

    // 2. Create submissions table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        student_id INT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_url VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log("Created submissions table");

    // 3. Add an index for faster querying
    await pool.query(`
      CREATE INDEX idx_post_student ON submissions(post_id, student_id)
    `);

    console.log("Added index to submissions table");

    return true;
  } catch (error) {
    console.error("Migration failed:", error);
    return false;
  }
};

export const down = async () => {
  try {
    // 1. Drop submissions table
    await pool.query(`
      DROP TABLE IF EXISTS submissions
    `);

    console.log("Dropped submissions table");

    // 2. Remove allow_submissions column from posts table
    await pool.query(`
      ALTER TABLE posts
      DROP COLUMN allow_submissions
    `);

    console.log("Removed allow_submissions column from posts table");

    return true;
  } catch (error) {
    console.error("Migration rollback failed:", error);
    return false;
  }
};

export default { up, down };
