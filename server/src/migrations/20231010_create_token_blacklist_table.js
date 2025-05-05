import { pool } from "../config/db.js";

export default {
  name: "Create token blacklist table",
  async up() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS token_blacklist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        token VARCHAR(512) NOT NULL,
        user_id INT,
        reason VARCHAR(50) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_token (token),
        INDEX idx_user_id (user_id),
        INDEX idx_expires_at (expires_at)
      )
    `);

    console.log("✅ Created token_blacklist table");
  },

  async down() {
    await pool.query(`DROP TABLE IF EXISTS token_blacklist`);
    console.log("❌ Dropped token_blacklist table");
  },
};
