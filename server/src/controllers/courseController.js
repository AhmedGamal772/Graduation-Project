import { pool } from "../config/db.js";
import Course from "../models/Course.js";

// Controller functions
export const getAllCourses = async (req, res, next) => {
  try {
    const [courses] = await pool.query("SELECT * FROM courses");
    res.json(courses);
  } catch (err) {
    next(err);
  }
};

export const createCourse = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { title, description } = req.body;
    const courseId = await Course.create(title, description, req.user.id);

    // If the creator is an instructor, automatically assign them as the instructor
    if (req.user.role === "instructor") {
      await Course.assignInstructor(courseId, req.user.id);
    }

    res.status(201).json({ id: courseId });
  } catch (err) {
    next(err);
  }
};

// ... other controller functions

export const getCourseById = async (req, res, next) => {
  try {
    const course = await Course.getById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if user has access to this course
    if (
      req.user &&
      req.user.role === "instructor" &&
      course.instructor_id !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(course);
  } catch (err) {
    next(err);
  }
};

export const getCoursePosts = async (req, res, next) => {
  try {
    // Verify course exists
    const [courses] = await pool.query("SELECT id FROM courses WHERE id = ?", [
      req.params.id,
    ]);
    if (!courses.length)
      return res.status(404).json({ message: "Course not found" });

    const [posts] = await pool.query(
      `
      SELECT p.*, u.name as author_name 
      FROM posts p 
      JOIN users u ON p.author_id = u.id 
      WHERE p.course_id = ?
      ORDER BY p.is_pinned DESC, p.created_at DESC
    `,
      [req.params.id]
    );

    res.json(posts);
  } catch (err) {
    next(err);
  }
};

export const getInstructorCourses = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const instructorId = req.user.id;

    // Get both:
    // 1. Courses created by the instructor
    // 2. Courses where the instructor is enrolled as an instructor
    const [courses] = await pool.query(
      `
      SELECT 
        c.*, 
        CONCAT(IFNULL(u.first_name, ''), ' ', IFNULL(u.last_name, '')) as creator_name,
        'assigned' as relationship_type
      FROM 
        courses c
      LEFT JOIN 
        users u ON c.created_by = u.id
      WHERE 
        c.created_by = ?
      
      UNION
      
      SELECT 
        c.*, 
        CONCAT(IFNULL(u.first_name, ''), ' ', IFNULL(u.last_name, '')) as creator_name,
        'enrolled' as relationship_type
      FROM 
        courses c
      JOIN 
        enrollments e ON c.id = e.course_id
      LEFT JOIN 
        users u ON c.created_by = u.id
      WHERE 
        e.user_id = ? AND e.role = 'instructor' AND c.created_by != ?
      
      ORDER BY 
        created_at DESC
      `,
      [instructorId, instructorId, instructorId]
    );

    console.log(
      `Found ${courses.length} courses for instructor ${instructorId}`
    );
    res.json(courses);
  } catch (error) {
    console.error("Error getting instructor courses:", error);
    res.status(500).json({ message: "Error getting instructor courses" });
  }
};

export const getEnrolledCourses = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user.id;
    console.log(
      `Fetching enrolled courses for user ${userId} with role ${req.user.role}`
    );

    const courses = await Course.getEnrolledCourses(userId);

    // Always return an array, even if empty
    res.json({
      courses: courses || [],
      count: courses ? courses.length : 0,
    });
  } catch (error) {
    console.error("Error getting enrolled courses:", error);
    // Return empty array instead of error for better UI experience
    res.status(200).json({
      courses: [],
      count: 0,
      message: "No enrolled courses found",
    });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const courseId = req.params.id;

    // Check if the course exists
    const [courseCheck] = await pool.query(
      "SELECT id FROM courses WHERE id = ?",
      [courseId]
    );

    if (courseCheck.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Delete the course
    await pool.query("DELETE FROM courses WHERE id = ?", [courseId]);

    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ message: "Error deleting course" });
  }
};

export const getCourseEnrolledUsers = async (req, res) => {
  try {
    const courseId = req.params.id;

    // Check if the course exists
    const [courseCheck] = await pool.query(
      "SELECT id FROM courses WHERE id = ?",
      [courseId]
    );

    if (courseCheck.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    // If user is an instructor, check if they have access to this course
    if (req.user.role === "instructor") {
      // First check if they are the course creator
      const [instructorCheck] = await pool.query(
        "SELECT id FROM courses WHERE id = ? AND created_by = ?",
        [courseId, req.user.id]
      );

      if (instructorCheck.length === 0) {
        // Then check if they are enrolled to teach this course
        const [enrollmentCheck] = await pool.query(
          "SELECT id FROM enrollments WHERE course_id = ? AND user_id = ? AND role = 'instructor'",
          [courseId, req.user.id]
        );

        if (enrollmentCheck.length === 0) {
          console.log(
            `Instructor ${req.user.id} denied access to course ${courseId}: not creator or enrolled instructor`
          );
          return res
            .status(403)
            .json({ message: "You don't have access to this course" });
        }
      }
    }

    // Get all enrolled users for the course
    const [users] = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.role, e.role as enrollment_role, e.enrolled_at
       FROM users u
       JOIN enrollments e ON u.id = e.user_id
       WHERE e.course_id = ?
       ORDER BY u.role, u.last_name, u.first_name`,
      [courseId]
    );

    res.json(users);
  } catch (error) {
    console.error("Error getting enrolled users:", error);
    res.status(500).json({ message: "Error getting enrolled users" });
  }
};
