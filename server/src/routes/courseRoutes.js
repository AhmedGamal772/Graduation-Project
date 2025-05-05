import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  getAllCourses,
  createCourse,
  getCourseById,
  getCoursePosts,
  getInstructorCourses,
  getEnrolledCourses,
  deleteCourse,
  getCourseEnrolledUsers,
} from "../controllers/courseController.js";
import { validate, courseValidators } from "../utils/validators.js";

const router = express.Router();

// GET all courses (public)
router.get("/", getAllCourses);

// GET instructor courses (instructor only)
router.get("/instructor", authenticate(["instructor"]), getInstructorCourses);

// GET enrolled courses (students and instructors)
router.get(
  "/enrolled",
  authenticate(["student", "instructor"]),
  getEnrolledCourses
);

// GET single course (public)
router.get("/:id", getCourseById);

// POST create new course (admin only)
router.post(
  "/create",
  authenticate(["admin"]),
  validate(courseValidators.create),
  createCourse
);

// GET course posts (authenticated users only)
router.get("/:id/posts", authenticate(), getCoursePosts);

// GET enrolled users for a course (admin and instructor only)
router.get(
  "/:id/users",
  authenticate(["admin", "instructor"]),
  getCourseEnrolledUsers
);

// DELETE a course (admin only)
router.delete("/:id", authenticate(["admin"]), deleteCourse);

export default router;
