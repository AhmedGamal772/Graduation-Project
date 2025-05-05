import { pool } from "../config/db.js";

export default {
  /**
   * Add a token to the blacklist
   * @param {string} token - The JWT token to blacklist
   * @param {number} userId - The ID of the user whose token is being blacklisted
   * @param {string} reason - Why the token was blacklisted (e.g., 'logout', 'suspended', 'deleted')
   * @param {Date} expiresAt - When the token would naturally expire
   * @returns {Promise<boolean>} - Success indicator
   */
  async add(token, userId, reason, expiresAt) {
    try {
      await pool.execute(
        "INSERT INTO token_blacklist (token, user_id, reason, expires_at) VALUES (?, ?, ?, ?)",
        [token, userId, reason, expiresAt]
      );
      return true;
    } catch (error) {
      console.error("Error adding token to blacklist:", error);
      return false;
    }
  },

  /**
   * Check if a token is blacklisted
   * @param {string} token - The JWT token to check
   * @returns {Promise<boolean>} - True if blacklisted, false otherwise
   */
  async isBlacklisted(token) {
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM token_blacklist WHERE token = ?",
        [token]
      );
      return rows.length > 0;
    } catch (error) {
      console.error("Error checking token blacklist:", error);
      return false; // If error occurs, don't block the token (fail open)
    }
  },

  /**
   * Blacklist all tokens for a specific user
   * @param {number} userId - The user ID whose tokens should be blacklisted
   * @param {string} reason - Why the tokens are being blacklisted
   * @returns {Promise<boolean>} - Success indicator
   */
  async blacklistAllUserTokens(userId, reason) {
    try {
      // Since we don't store active tokens, we'll just add a record to mark this user's tokens as invalid
      await pool.execute(
        "INSERT INTO token_blacklist (token, user_id, reason, expires_at) VALUES (?, ?, ?, ?)",
        [
          `USER_${userId}_ALL_TOKENS`, // Special marker for all user tokens
          userId,
          reason,
          new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days in the future
        ]
      );
      return true;
    } catch (error) {
      console.error("Error blacklisting all user tokens:", error);
      return false;
    }
  },

  /**
   * Check if all tokens for a user are blacklisted
   * @param {number} userId - The user ID to check
   * @returns {Promise<boolean>} - True if all tokens are blacklisted
   */
  async areAllUserTokensBlacklisted(userId) {
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM token_blacklist WHERE user_id = ? AND token LIKE 'USER_%_ALL_TOKENS' AND expires_at > NOW()",
        [userId]
      );
      return rows.length > 0;
    } catch (error) {
      console.error("Error checking user token blacklist:", error);
      return false;
    }
  },

  /**
   * Clean up expired blacklisted tokens
   * @returns {Promise<number>} - Number of records deleted
   */
  async cleanupExpired() {
    try {
      const [result] = await pool.execute(
        "DELETE FROM token_blacklist WHERE expires_at < NOW()"
      );
      return result.affectedRows;
    } catch (error) {
      console.error("Error cleaning up token blacklist:", error);
      return 0;
    }
  },
};
