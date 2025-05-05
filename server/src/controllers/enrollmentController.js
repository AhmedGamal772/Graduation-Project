import { pool } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { validationResult } from "express-validator";

const enrollmentController = {
  // Student enrollment
  async enrollStudent(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, "Validation error", errors.array());
      }

      const { courseId } = req.body;
      const userId = req.user.id;

      // Check if already enrolled
      const [existing] = await pool.query(
        "SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?",
        [userId, courseId]
      );

      if (existing.length > 0) {
        throw new ApiError(400, "Already enrolled in this course");
      }

      // Enroll student
      await pool.query(
        "INSERT INTO enrollments (user_id, course_id, role) VALUES (?, ?, 'student')",
        [userId, courseId]
      );

      return res
        .status(201)
        .json(new ApiResponse(201, "Successfully enrolled in course"));
    } catch (error) {
      console.error("Enrollment error:", error);
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json(error.toJSON());
      }
      return res
        .status(500)
        .json(new ApiError(500, "Error enrolling in course").toJSON());
    }
  },

  // Get student's enrolled courses
  async getStudentCourses(req, res) {
    try {
      const userId = req.user.id;

      const [courses] = await pool.query(
        `
        SELECT c.*, u.first_name, u.last_name
        FROM courses c
        JOIN enrollments e ON c.id = e.course_id
        JOIN users u ON c.created_by = u.id
        WHERE e.user_id = ? AND e.role = 'student'
        ORDER BY c.created_at DESC
      `,
        [userId]
      );

      return res
        .status(200)
        .json(new ApiResponse(200, "Student courses retrieved", { courses }));
    } catch (error) {
      console.error("Error getting student courses:", error);
      return res
        .status(500)
        .json(new ApiError(500, "Error retrieving student courses").toJSON());
    }
  },

  // Admin enrollment of student
  async enrollStudentAsAdmin(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, "Validation error", errors.array());
      }

      console.log("Enrollment request body:", req.body);

      // Ensure we're working with numbers
      const courseId = Number(req.body.courseId);
      const userId = Number(req.body.userId);

      if (isNaN(courseId) || isNaN(userId)) {
        throw new ApiError(400, "Course ID and User ID must be valid numbers");
      }

      // Check if course exists
      const [course] = await pool.query("SELECT id FROM courses WHERE id = ?", [
        courseId,
      ]);

      if (course.length === 0) {
        throw new ApiError(404, "Course not found");
      }

      // Check if user is a student
      const [user] = await pool.query("SELECT role FROM users WHERE id = ?", [
        userId,
      ]);

      if (user.length === 0) {
        throw new ApiError(404, "User not found");
      }

      if (user[0].role !== "student") {
        throw new ApiError(400, "User must be a student");
      }

      // Check if already enrolled as a student
      try {
        const [existing] = await pool.query(
          "SELECT * FROM enrollments WHERE user_id = ? AND course_id = ? AND role = 'student'",
          [userId, courseId]
        );

        if (existing.length > 0) {
          throw new ApiError(
            400,
            "User already enrolled in this course as a student"
          );
        }

        // Check if enrolled in a different role, and delete that enrollment
        const [existingDifferentRole] = await pool.query(
          "SELECT * FROM enrollments WHERE user_id = ? AND course_id = ? AND role != 'student'",
          [userId, courseId]
        );

        if (existingDifferentRole.length > 0) {
          console.log(
            `User ${userId} previously enrolled with a different role. Updating to student role.`
          );
          await pool.query(
            "DELETE FROM enrollments WHERE user_id = ? AND course_id = ?",
            [userId, courseId]
          );
        }
      } catch (dbError) {
        if (dbError instanceof ApiError) {
          throw dbError;
        }
        console.error("Database error checking enrollment:", dbError);
        throw new ApiError(
          500,
          "Database error when checking existing enrollment"
        );
      }

      // Enroll student - with proper error handling
      try {
        await pool.query(
          "INSERT INTO enrollments (user_id, course_id, role) VALUES (?, ?, 'student')",
          [userId, courseId]
        );
      } catch (dbError) {
        console.error("Database error enrolling student:", dbError);
        // Check for specific MySQL errors
        if (dbError.code === "ER_DUP_ENTRY") {
          throw new ApiError(400, "User already enrolled in this course");
        } else if (dbError.code === "ER_NO_REFERENCED_ROW_2") {
          throw new ApiError(400, "Invalid course or user ID");
        } else {
          throw new ApiError(
            500,
            "Database error when enrolling student: " + dbError.message
          );
        }
      }

      return res
        .status(201)
        .json(new ApiResponse(201, "Successfully enrolled student in course"));
    } catch (error) {
      console.error("Student enrollment error:", error);
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json(error.toJSON());
      }
      return res
        .status(500)
        .json(
          new ApiError(
            500,
            "Error enrolling student: " + (error.message || "Unknown error")
          ).toJSON()
        );
    }
  },

  // Admin enrollment of instructor
  async enrollInstructorAsAdmin(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, "Validation error", errors.array());
      }

      // Ensure we're working with numbers
      const courseId = Number(req.body.courseId);
      const userId = Number(req.body.userId);

      if (isNaN(courseId) || isNaN(userId)) {
        throw new ApiError(400, "Course ID and User ID must be valid numbers");
      }

      // Check if course exists
      const [course] = await pool.query("SELECT id FROM courses WHERE id = ?", [
        courseId,
      ]);

      if (course.length === 0) {
        throw new ApiError(404, "Course not found");
      }

      // Check if user is an instructor
      const [user] = await pool.query("SELECT role FROM users WHERE id = ?", [
        userId,
      ]);

      if (user.length === 0) {
        throw new ApiError(404, "User not found");
      }

      if (user[0].role !== "instructor") {
        throw new ApiError(400, "User must be an instructor");
      }

      // Check if already enrolled as an instructor
      try {
        const [existing] = await pool.query(
          "SELECT * FROM enrollments WHERE user_id = ? AND course_id = ? AND role = 'instructor'",
          [userId, courseId]
        );

        if (existing.length > 0) {
          throw new ApiError(400, "Instructor already enrolled in this course");
        }

        // Check if enrolled in a different role, and delete that enrollment
        const [existingDifferentRole] = await pool.query(
          "SELECT * FROM enrollments WHERE user_id = ? AND course_id = ? AND role != 'instructor'",
          [userId, courseId]
        );

        if (existingDifferentRole.length > 0) {
          console.log(
            `User ${userId} previously enrolled with a different role. Updating to instructor role.`
          );
          await pool.query(
            "DELETE FROM enrollments WHERE user_id = ? AND course_id = ?",
            [userId, courseId]
          );
        }
      } catch (dbError) {
        if (dbError instanceof ApiError) {
          throw dbError;
        }
        console.error("Database error checking enrollment:", dbError);
        throw new ApiError(
          500,
          "Database error when checking existing enrollment"
        );
      }

      // Enroll instructor
      try {
        await pool.query(
          "INSERT INTO enrollments (user_id, course_id, role) VALUES (?, ?, 'instructor')",
          [userId, courseId]
        );
      } catch (dbError) {
        console.error("Database error enrolling instructor:", dbError);
        // Check for specific MySQL errors
        if (dbError.code === "ER_DUP_ENTRY") {
          throw new ApiError(400, "Instructor already enrolled in this course");
        } else if (dbError.code === "ER_NO_REFERENCED_ROW_2") {
          throw new ApiError(400, "Invalid course or user ID");
        } else {
          throw new ApiError(
            500,
            "Database error when enrolling instructor: " + dbError.message
          );
        }
      }

      return res
        .status(201)
        .json(
          new ApiResponse(201, "Successfully enrolled instructor in course")
        );
    } catch (error) {
      console.error("Instructor enrollment error:", error);
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json(error.toJSON());
      }
      return res
        .status(500)
        .json(
          new ApiError(
            500,
            "Error enrolling instructor: " + (error.message || "Unknown error")
          ).toJSON()
        );
    }
  },

  // Bulk enrollment
  async enrollUsersBulk(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, "Validation error", errors.array());
      }

      console.log("Bulk enrollment request:", req.body);

      // Ensure we're working with numbers
      const courseId = Number(req.body.courseId);
      const userIds = req.body.userIds.map((id) => Number(id));
      const { role } = req.body;

      if (isNaN(courseId) || userIds.some((id) => isNaN(id))) {
        throw new ApiError(400, "Course ID and User IDs must be valid numbers");
      }

      if (!["student", "instructor"].includes(role)) {
        throw new ApiError(400, "Invalid role specified");
      }

      // Check if course exists
      const [course] = await pool.query("SELECT id FROM courses WHERE id = ?", [
        courseId,
      ]);

      if (course.length === 0) {
        throw new ApiError(404, "Course not found");
      }

      // Check if any users are already enrolled with the same role
      try {
        const [existing] = await pool.query(
          "SELECT user_id FROM enrollments WHERE course_id = ? AND user_id IN (?) AND role = ?",
          [courseId, userIds, role]
        );

        if (existing.length > 0) {
          const existingIds = existing.map((e) => e.user_id);
          throw new ApiError(
            400,
            `Some users are already enrolled as ${role}`,
            {
              existingIds,
            }
          );
        }

        // Check if any users are enrolled with a different role and remove those enrollments
        const [existingDifferentRole] = await pool.query(
          "SELECT user_id FROM enrollments WHERE course_id = ? AND user_id IN (?) AND role != ?",
          [courseId, userIds, role]
        );

        if (existingDifferentRole.length > 0) {
          const existingDifferentRoleIds = existingDifferentRole.map(
            (e) => e.user_id
          );
          console.log(
            `Users ${existingDifferentRoleIds.join(
              ", "
            )} previously enrolled with a different role. Updating to ${role} role.`
          );

          // Delete existing enrollments with different roles
          await pool.query(
            "DELETE FROM enrollments WHERE course_id = ? AND user_id IN (?)",
            [courseId, existingDifferentRoleIds]
          );
        }
      } catch (dbError) {
        if (dbError instanceof ApiError) {
          throw dbError;
        }
        console.error("Database error checking existing enrollments:", dbError);
        throw new ApiError(
          500,
          "Database error when checking existing enrollments: " +
            dbError.message
        );
      }

      // Check if all users have the correct role
      try {
        const [allUsers] = await pool.query(
          "SELECT id, role FROM users WHERE id IN (?)",
          [userIds]
        );

        if (allUsers.length !== userIds.length) {
          throw new ApiError(400, "Some user IDs are invalid or do not exist");
        }

        const incorrectRoleUsers = allUsers.filter(
          (user) => user.role !== role
        );

        if (incorrectRoleUsers.length > 0) {
          const incorrectIds = incorrectRoleUsers.map((u) => u.id);
          throw new ApiError(400, "Some users do not have the correct role", {
            incorrectUserIds: incorrectIds,
          });
        }
      } catch (dbError) {
        if (dbError instanceof ApiError) {
          throw dbError;
        }
        console.error("Database error checking user roles:", dbError);
        throw new ApiError(
          500,
          "Database error when checking user roles: " + dbError.message
        );
      }

      // Enroll users with their roles
      try {
        const values = userIds.map((userId) => [userId, courseId, role]);
        await pool.query(
          "INSERT INTO enrollments (user_id, course_id, role) VALUES ?",
          [values]
        );
      } catch (dbError) {
        console.error("Database error enrolling users:", dbError);
        // Check for specific MySQL errors
        if (dbError.code === "ER_DUP_ENTRY") {
          throw new ApiError(400, "Some users are already enrolled");
        } else if (dbError.code === "ER_NO_REFERENCED_ROW_2") {
          throw new ApiError(400, "Invalid course or user ID");
        } else {
          throw new ApiError(
            500,
            "Database error when enrolling users: " + dbError.message
          );
        }
      }

      return res
        .status(201)
        .json(new ApiResponse(201, "Successfully enrolled users in course"));
    } catch (error) {
      console.error("Bulk enrollment error:", error);
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json(error.toJSON());
      }
      return res
        .status(500)
        .json(
          new ApiError(
            500,
            "Error enrolling users in bulk: " +
              (error.message || "Unknown error")
          ).toJSON()
        );
    }
  },

  // Get available users for enrollment
  async getAvailableUsers(req, res) {
    try {
      const { courseId } = req.params;
      const { role } = req.query;

      console.log(
        "Getting available users for course:",
        courseId,
        "role:",
        role
      );

      // Ensure courseId is a number
      const courseIdNum = Number(courseId);
      if (isNaN(courseIdNum)) {
        throw new ApiError(400, "Course ID must be a valid number");
      }

      if (!role) {
        throw new ApiError(400, "Role parameter is required");
      }

      if (!["student", "instructor"].includes(role)) {
        throw new ApiError(400, "Invalid role specified");
      }

      // First check if the course exists
      const [courseCheck] = await pool.query(
        "SELECT id FROM courses WHERE id = ?",
        [courseIdNum]
      );

      if (courseCheck.length === 0) {
        throw new ApiError(404, "Course not found");
      }

      // Get users that match the role and are not enrolled in the course
      // Updated to correctly handle role changes
      try {
        const [users] = await pool.query(
          `
          SELECT u.id, u.email, u.first_name as firstName, u.last_name as lastName, u.role
          FROM users u
          WHERE u.role = ?
          AND (
            u.id NOT IN (
              SELECT e.user_id 
              FROM enrollments e 
              WHERE e.course_id = ?
            )
            OR u.id IN (
              SELECT e.user_id
              FROM enrollments e
              WHERE e.course_id = ? AND e.role != ?
            )
          )
          ORDER BY u.first_name, u.last_name
        `,
          [role, courseIdNum, courseIdNum, role]
        );

        // Ensure consistent field naming (either camelCase or snake_case)
        const formattedUsers = users.map((user) => ({
          id: user.id,
          email: user.email,
          firstName: user.firstName || user.first_name,
          lastName: user.lastName || user.last_name,
          role: user.role,
        }));

        // Use the ApiResponse format consistently
        return res.status(200).json(
          new ApiResponse(200, "Available users retrieved", {
            users: formattedUsers,
          })
        );
      } catch (dbError) {
        console.error("Database error fetching users:", dbError);
        throw new ApiError(
          500,
          "Database error when fetching users: " + dbError.message
        );
      }
    } catch (error) {
      console.error("Error getting available users:", error);
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json(error.toJSON());
      }
      return res
        .status(500)
        .json(
          new ApiError(
            500,
            "Error retrieving available users: " +
              (error.message || "Unknown error")
          ).toJSON()
        );
    }
  },

  // Check enrollment status
  async checkEnrollment(req, res) {
    try {
      const { courseId } = req.params;
      const userId = req.user.id;

      const [enrollment] = await pool.query(
        "SELECT e.*, u.role FROM enrollments e JOIN users u ON e.user_id = u.id WHERE e.user_id = ? AND e.course_id = ?",
        [userId, courseId]
      );

      return res.status(200).json(
        new ApiResponse(200, "Enrollment status retrieved", {
          isEnrolled: enrollment.length > 0,
          role: enrollment[0]?.role,
        })
      );
    } catch (error) {
      console.error("Error checking enrollment:", error);
      return res
        .status(500)
        .json(new ApiError(500, "Error checking enrollment status").toJSON());
    }
  },

  // Add this new method to handle unenrolling a user
  async removeEnrollment(req, res) {
    try {
      const { enrollmentId } = req.params;

      // First, check if the enrollment exists
      const [enrollments] = await pool.query(
        `SELECT * FROM enrollments WHERE id = ?`,
        [enrollmentId]
      );

      if (enrollments.length === 0) {
        return res.status(404).json({
          message: "Enrollment not found",
        });
      }

      // Delete the enrollment
      await pool.query(`DELETE FROM enrollments WHERE id = ?`, [enrollmentId]);

      res.json({
        message: "User successfully unenrolled from course",
        enrollmentId,
      });
    } catch (error) {
      console.error("Error removing enrollment:", error);
      res.status(500).json({
        message: "Failed to remove enrollment",
      });
    }
  },
};

export default enrollmentController;
