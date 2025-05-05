import { pool } from "../config/db.js";

export default {
  async getAll() {
    const [rows] = await pool.query(`
      SELECT c.*, u.first_name, u.last_name, c.created_by as instructor_id
      FROM courses c
      LEFT JOIN users u ON c.created_by = u.id
    `);
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query(
      `
      SELECT c.*, u.first_name, u.last_name, c.created_by as instructor_id
      FROM courses c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.id = ?
    `,
      [id]
    );
    return rows[0];
  },

  async create(title, description, createdBy) {
    const [result] = await pool.query(
      "INSERT INTO courses (title, description, created_by) VALUES (?, ?, ?)",
      [title, description, createdBy]
    );
    return result.insertId;
  },

  async getCoursePosts(courseId) {
    const [rows] = await pool.query(
      `
      SELECT p.*, u.first_name, u.last_name as author_last_name
      FROM posts p 
      JOIN users u ON p.author_id = u.id 
      WHERE p.course_id = ?
      ORDER BY p.is_pinned DESC, p.created_at DESC
    `,
      [courseId]
    );
    return rows;
  },

  async getByInstructorId(instructorId) {
    const [courses] = await pool.query(
      `SELECT DISTINCT c.*, u.first_name, u.last_name
       FROM courses c 
       JOIN enrollments e ON c.id = e.course_id
       JOIN users u ON c.created_by = u.id
       WHERE e.user_id = ? AND u.role = 'instructor'
       ORDER BY c.created_at DESC`,
      [instructorId]
    );
    return courses;
  },

  async getEnrolledCourses(userId) {
    try {
      // Get user's role
      const [userRows] = await pool.query(
        "SELECT role FROM users WHERE id = ?",
        [userId]
      );

      if (!userRows.length) {
        console.log(`No user found with ID ${userId}`);
        return [];
      }

      const role = userRows[0].role;
      let query;

      if (role === "student") {
        // For students, get all courses they are enrolled in
        query = `
          SELECT c.*, 
                CONCAT(IFNULL(u.first_name, ''), ' ', IFNULL(u.last_name, '')) as instructorName,
                e.enrolled_at, 
                e.role as enrollment_role,
                'enrolled' as relationshipType
          FROM courses c 
          JOIN enrollments e ON c.id = e.course_id 
          LEFT JOIN users u ON c.created_by = u.id 
          WHERE e.user_id = ? AND e.role = 'student'
          ORDER BY e.enrolled_at DESC
        `;
      } else if (role === "instructor") {
        // For instructors, get courses where they are enrolled as an instructor
        query = `
          SELECT c.*, 
                CONCAT(IFNULL(u.first_name, ''), ' ', IFNULL(u.last_name, '')) as instructorName,
                e.enrolled_at, 
                e.role as enrollment_role,
                'enrolled' as relationshipType
          FROM courses c 
          JOIN enrollments e ON c.id = e.course_id 
          LEFT JOIN users u ON c.created_by = u.id 
          WHERE e.user_id = ? AND e.role = 'instructor'
          ORDER BY e.enrolled_at DESC
        `;
      } else {
        // For admins or others, return empty set
        console.log(`User ${userId} with role ${role} has no enrollments view`);
        return [];
      }

      const [courses] = await pool.query(
        query,
        role === "instructor" ? [userId, userId] : [userId]
      );

      console.log(
        `Found ${courses.length} enrolled courses for user ${userId} with role ${role}`
      );
      return courses;
    } catch (error) {
      console.error("Error in getEnrolledCourses:", error);
      // Return empty array on error instead of throwing
      return [];
    }
  },

  async assignInstructor(courseId, instructorId) {
    const [result] = await pool.query(
      "UPDATE courses SET instructor_id = ? WHERE id = ?",
      [instructorId, courseId]
    );
    return result.affectedRows > 0;
  },
};
