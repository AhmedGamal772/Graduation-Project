import { pool } from "../config/db.js";

async function createSubmissionsTable() {
  try {
    console.log("Checking if submissions table exists...");

    const [tables] = await pool.query(
      `
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'submissions'
    `,
      [process.env.DB_NAME]
    );

    if (tables.length === 0) {
      console.log("Creating submissions table...");
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

      console.log("Adding index to submissions table...");
      await pool.query(`
        CREATE INDEX idx_post_student ON submissions(post_id, student_id)
      `);

      console.log("Submissions table created successfully!");
    } else {
      console.log("Submissions table already exists.");
    }

    console.log("Submissions table setup completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error creating submissions table:", error);
    process.exit(1);
  }
}

createSubmissionsTable();
