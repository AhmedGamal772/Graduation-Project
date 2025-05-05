import { pool } from "../config/db.js";
import { upload } from "../middleware/upload.js";

export const createPost = async (req, res, next) => {
  try {
    upload.single("file")(req, res, async (err) => {
      if (err) return res.status(400).json({ message: err.message });

      const { course_id, title, content, link_url, allow_submissions } =
        req.body;
      const file_url = req.file ? `/uploads/${req.file.filename}` : null;

      // Validate course_id is not undefined
      if (!course_id) {
        return res.status(400).json({ message: "Course ID is required" });
      }

      // Convert string 'true'/'false' to boolean
      const allowSubmissions = allow_submissions === "true";

      // Insert the post with the allow_submissions field
      const [result] = await pool.query(
        "INSERT INTO posts (course_id, author_id, title, content, file_url, link_url, allow_submissions) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          course_id,
          req.user.id,
          title,
          content,
          file_url,
          link_url || null,
          allowSubmissions,
        ]
      );

      const postId = result.insertId;

      // Get the newly created post
      const [posts] = await pool.query(
        `SELECT p.*, u.name as author_name, u.last_name as author_last_name, u.email as author_email
         FROM posts p
         JOIN users u ON p.author_id = u.id
         WHERE p.id = ?`,
        [postId]
      );

      if (posts.length === 0) {
        return res
          .status(500)
          .json({ message: "Failed to retrieve created post" });
      }

      res.status(201).json(posts[0]);
    });
  } catch (err) {
    next(err);
  }
};

export const togglePinPost = async (req, res, next) => {
  try {
    const [posts] = await pool.query("SELECT * FROM posts WHERE id = ?", [
      req.params.id,
    ]);
    if (!posts.length)
      return res.status(404).json({ message: "Post not found" });

    await pool.query("UPDATE posts SET is_pinned = ? WHERE id = ?", [
      !posts[0].is_pinned,
      req.params.id,
    ]);

    res.json({
      message: "Post pin status updated",
      is_pinned: !posts[0].is_pinned,
    });
  } catch (err) {
    next(err);
  }
};

export const getCoursePosts = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    // Get posts with author information
    const [posts] = await pool.query(
      `
      SELECT p.*, u.name as author_name, u.last_name as author_last_name, u.email as author_email
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.course_id = ?
      ORDER BY p.is_pinned DESC, p.created_at DESC
    `,
      [courseId]
    );

    res.json(posts);
  } catch (err) {
    next(err);
  }
};

export const getPostById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get post with author information
    const [posts] = await pool.query(
      `
      SELECT p.*, u.name as author_name, u.last_name as author_last_name, u.email as author_email
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.id = ?
    `,
      [id]
    );

    if (!posts.length) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Get any files attached to the post
    const [files] = await pool.query(
      `SELECT id, filename as name, file_url as url, created_at
       FROM post_files
       WHERE post_id = ?`,
      [id]
    );

    // Add files to the post response
    const postWithFiles = {
      ...posts[0],
      files: files,
    };

    res.json(postWithFiles);
  } catch (err) {
    next(err);
  }
};

// Handle student submissions
export const submitAssignment = async (req, res, next) => {
  try {
    const { id: postId } = req.params;
    const studentId = req.user.id;

    // Check if post exists and allows submissions
    const [posts] = await pool.query(
      "SELECT * FROM posts WHERE id = ? AND allow_submissions = true",
      [postId]
    );

    if (!posts.length) {
      return res.status(404).json({
        message: "Post not found or does not accept submissions",
      });
    }

    // Check if student is enrolled in the course
    const [enrollments] = await pool.query(
      "SELECT * FROM enrollments WHERE course_id = ? AND user_id = ? AND role = 'student'",
      [posts[0].course_id, studentId]
    );

    if (!enrollments.length) {
      return res.status(403).json({
        message: "You are not enrolled in this course as a student",
      });
    }

    // Handle file upload
    upload.single("file")(req, res, async (err) => {
      if (err) return res.status(400).json({ message: err.message });

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const file_url = `/uploads/${req.file.filename}`;

      // Store the submission in the database
      const [result] = await pool.query(
        "INSERT INTO submissions (post_id, student_id, file_name, file_url) VALUES (?, ?, ?, ?)",
        [postId, studentId, req.file.originalname, file_url]
      );

      res.status(201).json({
        message: "Submission successful",
        submission_id: result.insertId,
        file_name: req.file.originalname,
        file_url: file_url,
      });
    });
  } catch (err) {
    next(err);
  }
};

// Get all submissions for a post (instructors only)
export const getSubmissions = async (req, res, next) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user.id;

    // Check if post exists
    const [posts] = await pool.query(
      "SELECT course_id FROM posts WHERE id = ?",
      [postId]
    );

    if (!posts.length) {
      return res.status(404).json({ message: "Post not found" });
    }

    const courseId = posts[0].course_id;

    // Check if user is an instructor for this course or an admin
    const [instructorCheck] = await pool.query(
      `SELECT * FROM enrollments 
       WHERE course_id = ? AND user_id = ? AND role = 'instructor'
       UNION
       SELECT e.* FROM enrollments e
       JOIN users u ON e.user_id = u.id
       WHERE u.id = ? AND u.role = 'admin'`,
      [courseId, userId, userId]
    );

    if (!instructorCheck.length) {
      return res.status(403).json({
        message: "You do not have permission to view submissions",
      });
    }

    // Get all submissions for this post with student info
    const [submissions] = await pool.query(
      `SELECT s.*, u.name as first_name, u.last_name, u.email
       FROM submissions s
       JOIN users u ON s.student_id = u.id
       WHERE s.post_id = ?
       ORDER BY s.created_at DESC`,
      [postId]
    );

    // Format the submissions for the frontend
    const formattedSubmissions = submissions.map((sub) => ({
      id: sub.id,
      file_name: sub.file_name,
      file_url: sub.file_url,
      created_at: sub.created_at,
      student: {
        id: sub.student_id,
        first_name: sub.first_name,
        last_name: sub.last_name,
        email: sub.email,
      },
    }));

    res.json(formattedSubmissions);
  } catch (err) {
    next(err);
  }
};

// Get current student's submissions for a post
export const getMySubmissions = async (req, res, next) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user.id;

    // Check if post exists
    const [posts] = await pool.query(
      "SELECT course_id FROM posts WHERE id = ?",
      [postId]
    );

    if (!posts.length) {
      return res.status(404).json({ message: "Post not found" });
    }

    const courseId = posts[0].course_id;

    // Check if student is enrolled in the course
    const [enrollments] = await pool.query(
      "SELECT * FROM enrollments WHERE course_id = ? AND user_id = ? AND role = 'student'",
      [courseId, userId]
    );

    if (!enrollments.length) {
      return res.status(403).json({
        message: "You are not enrolled in this course as a student",
      });
    }

    // Get all submissions from this student for this post
    const [submissions] = await pool.query(
      `SELECT s.*, u.name as first_name, u.last_name, u.email
       FROM submissions s
       JOIN users u ON s.student_id = u.id
       WHERE s.post_id = ? AND s.student_id = ?
       ORDER BY s.created_at DESC`,
      [postId, userId]
    );

    // Format the submissions for the frontend
    const formattedSubmissions = submissions.map((sub) => ({
      id: sub.id,
      file_name: sub.file_name,
      file_url: sub.file_url,
      created_at: sub.created_at,
      student: {
        id: sub.student_id,
        first_name: sub.first_name,
        last_name: sub.last_name,
        email: sub.email,
      },
    }));

    res.json(formattedSubmissions);
  } catch (err) {
    next(err);
  }
};
