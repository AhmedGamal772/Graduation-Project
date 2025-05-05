import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  createPost,
  togglePinPost,
  getCoursePosts,
  getPostById,
  submitAssignment,
  getSubmissions,
  getMySubmissions,
} from "../controllers/postController.js";
import { validate, postValidators } from "../utils/validators.js";

const router = express.Router();

router.post(
  "/",
  authenticate(["instructor", "admin"]),
  validate(postValidators.create),
  createPost
);

router.patch("/:id/pin", authenticate(["instructor", "admin"]), togglePinPost);

router.get(
  "/course/:courseId",
  authenticate(["instructor", "student", "admin"]),
  getCoursePosts
);

router.get(
  "/:id",
  authenticate(["instructor", "student", "admin"]),
  getPostById
);

// Student submission routes
router.post("/:id/submissions", authenticate(["student"]), submitAssignment);

// Get submissions - instructor only
router.get(
  "/:id/submissions",
  authenticate(["instructor", "admin"]),
  getSubmissions
);

// Get student's own submissions
router.get("/:id/submissions/my", authenticate(["student"]), getMySubmissions);

export default router;
