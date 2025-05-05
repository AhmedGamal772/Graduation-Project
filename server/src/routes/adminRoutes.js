import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  createUser,
  getAllUsers,
  updateUserRole,
  deleteUser,
  assignInstructor,
  getAnalytics,
  suspendUser,
  unsuspendUser,
  updateUserStatus,
  getUserProfile,
  resetPassword,
} from "../controllers/adminController.js";
import {
  validate,
  enrollmentValidators,
  userValidators,
} from "../utils/validators.js";

const router = express.Router();

// All routes require admin role
router.use(authenticate(["admin"]));

// User management routes
router.post("/users", validate(userValidators.create), createUser);
router.get("/users", getAllUsers);
router.get("/users/:userId/profile", getUserProfile);
router.patch(
  "/users/:userId/role",
  validate(userValidators.updateRole),
  updateUserRole
);
router.patch(
  "/users/:userId/status",
  validate(userValidators.updateStatus),
  updateUserStatus
);
router.delete("/users/:userId", deleteUser);
router.post("/users/:userId/suspend", suspendUser);
router.post("/users/:userId/unsuspend", unsuspendUser);
router.post("/users/:userId/reset-password", resetPassword);

router.post(
  "/courses/assign",
  validate(enrollmentValidators.enroll), // Reusing enrollment validator
  assignInstructor
);

router.get("/analytics", getAnalytics);

export default router;
