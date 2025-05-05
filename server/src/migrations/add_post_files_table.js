import { pool } from "../config/db.js";

export const up = async () => {
  try {
    // Create post_files table if it doesn't exist
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

    console.log("Created post_files table");

    return true;
  } catch (error) {
    console.error("Migration failed:", error);
    return false;
  }
};

export const down = async () => {
  try {
    // Drop post_files table
    await pool.query(`
      DROP TABLE IF EXISTS post_files
    `);

    console.log("Dropped post_files table");

    return true;
  } catch (error) {
    console.error("Migration rollback failed:", error);
    return false;
  }
};

export default { up, down };
