import { pool } from "../config/db.js";

export default {
  async create(courseId, authorId, content, fileUrl = null, linkUrl = null) {
    const [result] = await pool.query(
      "INSERT INTO posts (course_id, author_id, content, file_url, link_url) VALUES (?, ?, ?, ?, ?)",
      [courseId, authorId, content, fileUrl, linkUrl]
    );
    return result.insertId;
  },

  async getById(id) {
    const [rows] = await pool.query(
      `
      SELECT p.*, u.name as author_name 
      FROM posts p 
      JOIN users u ON p.author_id = u.id 
      WHERE p.id = ?
    `,
      [id]
    );
    return rows[0];
  },

  async getByCourse(courseId) {
    const [rows] = await pool.query(
      `
      SELECT p.*, u.name as author_name 
      FROM posts p 
      JOIN users u ON p.author_id = u.id 
      WHERE p.course_id = ?
      ORDER BY p.is_pinned DESC, p.created_at DESC
    `,
      [courseId]
    );
    return rows;
  },

  async togglePin(id) {
    const [posts] = await pool.query(
      "SELECT is_pinned FROM posts WHERE id = ?",
      [id]
    );
    if (!posts.length) return null;

    const newPinStatus = !posts[0].is_pinned;
    await pool.query("UPDATE posts SET is_pinned = ? WHERE id = ?", [
      newPinStatus,
      id,
    ]);
    return newPinStatus;
  },
};
