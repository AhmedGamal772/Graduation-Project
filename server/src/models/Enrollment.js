import { pool } from "../config/db.js";

export default {
  async enroll(studentId, courseId) {
    try {
      const [result] = await pool.query(
        "INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)",
        [studentId, courseId]
      );
      return result.insertId;
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        throw new Error("User already enrolled in this course");
      }
      throw err;
    }
  },

  async isEnrolled(studentId, courseId) {
    const [rows] = await pool.query(
      "SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?",
      [studentId, courseId]
    );
    return rows.length > 0;
  },

  async getEnrollmentsByUser(userId) {
    const [rows] = await pool.query(
      `
      SELECT c.* 
      FROM courses c
      JOIN enrollments e ON c.id = e.course_id
      WHERE e.user_id = ?
    `,
      [userId]
    );
    return rows;
  },

  async getEnrollmentsByCourse(courseId) {
    const [rows] = await pool.query(
      `
      SELECT u.id, u.email, u.name 
      FROM users u
      JOIN enrollments e ON u.id = e.user_id
      WHERE e.course_id = ? AND u.role = 'student'
    `,
      [courseId]
    );
    return rows;
  },
};
