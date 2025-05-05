import express from "express";
import enrollmentController from "../controllers/enrollmentController.js";
import { authenticate } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { userValidators } from "../utils/validators.js";

const router = express.Router();

// Student routes
router.post(
  "/student",
  authenticate(["student"]),
  validateRequest(userValidators.enrollStudent),
  enrollmentController.enrollStudent
);

router.get(
  "/student/courses",
  authenticate(["student"]),
  enrollmentController.getStudentCourses
);

// Admin routes
router.get(
  "/admin/available-users/:courseId",
  authenticate(["admin"]),
  enrollmentController.getAvailableUsers
);

router.post(
  "/admin/enroll/student",
  authenticate(["admin"]),
  validateRequest(userValidators.enrollStudent),
  enrollmentController.enrollStudentAsAdmin
);

router.post(
  "/admin/enroll/instructor",
  authenticate(["admin"]),
  validateRequest(userValidators.enrollInstructor),
  enrollmentController.enrollInstructorAsAdmin
);

router.post(
  "/admin/enroll/bulk",
  authenticate(["admin"]),
  validateRequest(userValidators.enrollUsersBulk),
  enrollmentController.enrollUsersBulk
);

// Remove enrollment
router.delete(
  "/admin/:enrollmentId",
  authenticate(["admin"]),
  enrollmentController.removeEnrollment
);

// Check enrollment status
router.get(
  "/check/:courseId",
  authenticate(["student"]),
  enrollmentController.checkEnrollment
);

export default router;
