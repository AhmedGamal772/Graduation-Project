import express from "express";
import {
  register,
  login,
  getMe,
  changePassword,
  logout,
} from "../controllers/authController.js";
import {
  validate,
  authValidators,
  userValidators,
} from "../utils/validators.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.post("/register", validate(authValidators.register), register);
router.post("/login", validate(authValidators.login), login);

// Protected routes
router.get("/me", authenticate(), getMe);
router.post("/logout", authenticate(), logout);

// Change password route
router.post(
  "/change-password",
  authenticate(),
  async (req, res, next) => {
    try {
      // For first login, skip validation
      if (req.user && req.user.is_first_login === 1) {
        return next();
      }

      // Regular validation for non-first-login users
      await validate(userValidators.changePassword)(req, res, next);
    } catch (error) {
      console.error("Password change validation error:", error);
      return res.status(500).json({ message: "Validation error" });
    }
  },
  changePassword
);

export default router;
