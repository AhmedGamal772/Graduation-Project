import Joi from "joi";
import { userRoles, courseTypes } from "../constants.js";
import { body } from "express-validator";
import { validationResult } from "express-validator";

// Common validation patterns
const email = Joi.string().email().lowercase().trim().required();
const password = Joi.string().min(8).max(128).required();
const name = Joi.string().min(2).max(100).trim().required();
const id = Joi.number().integer().positive().required();

export const authValidators = {
  register: Joi.object({
    email,
    password,
    name,
    role: Joi.string()
      .valid(...userRoles)
      .required(),
  }),
  login: Joi.object({
    email,
    password,
  }),
  changePassword: [
    body("currentPassword")
      .optional()
      .custom((value, { req }) => {
        if (req.user && req.user.is_first_login === 1 && value === "") {
          return true;
        }
        if (!value) {
          throw new Error("Current password is required");
        }
        return true;
      }),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters long")
      .matches(/^(?=.*[a-zA-Z])(?=.*[0-9])/)
      .withMessage(
        "New password must contain at least one letter and one number"
      ),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
  ],
};

export const courseValidators = {
  create: Joi.object({
    title: Joi.string().min(3).max(255).trim().required(),
    description: Joi.string().max(2000).trim().allow(""),
  }),

  update: Joi.object({
    title: Joi.string().min(3).max(255).trim(),
    description: Joi.string().max(2000).trim().allow(""),
    course_type: Joi.string().valid(...courseTypes),
  }),
};

export const postValidators = {
  create: Joi.object({
    course_id: Joi.string().required(),
    title: Joi.string().min(3).max(255).trim().required(),
    content: Joi.string().min(1).max(5000).trim().required(),
    file_url: Joi.string().uri().trim().allow(""),
    link_url: Joi.string().uri().trim().allow(""),
    allow_submissions: Joi.boolean().default(false),
  }),
};

export const enrollmentValidators = {
  enroll: Joi.object({
    user_id: Joi.string().required(),
    course_id: Joi.string().required(),
  }),
  bulkEnroll: Joi.array()
    .items(
      Joi.object({
        user_id: Joi.string().required(),
        course_id: Joi.string().required(),
      })
    )
    .min(1)
    .messages({
      "array.min": "At least one enrollment is required",
      "array.base": "Payload must be an array of enrollment objects",
    }),
};

export const userValidators = {
  create: [
    body("email").isEmail().withMessage("Invalid email address"),
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
    body("role")
      .isIn(["admin", "instructor", "student"])
      .withMessage("Invalid role"),
  ],
  updateRole: [
    body("role")
      .isIn(["admin", "instructor", "student"])
      .withMessage("Invalid role"),
  ],
  updateStatus: [
    body("status")
      .isIn(["active", "inactive", "suspended"])
      .withMessage("Invalid status value"),
  ],
  enrollStudent: [
    body("courseId")
      .isInt({ min: 1 })
      .withMessage("Course ID must be a positive integer"),
    body("userId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("User ID must be a positive integer"),
  ],
  enrollInstructor: [
    body("courseId")
      .isInt({ min: 1 })
      .withMessage("Course ID must be a positive integer"),
    body("userId")
      .isInt({ min: 1 })
      .withMessage("User ID must be a positive integer"),
  ],
  enrollUsersBulk: [
    body("courseId")
      .isInt({ min: 1 })
      .withMessage("Course ID must be a positive integer"),
    body("userIds")
      .isArray({ min: 1 })
      .withMessage("At least one user ID must be provided"),
    body("userIds.*")
      .isInt({ min: 1 })
      .withMessage("Each user ID must be a positive integer"),
    body("role")
      .isIn(["student", "instructor"])
      .withMessage("Role must be either student or instructor"),
  ],
};

// Validation middleware
export const validate = (validations) => {
  return async (req, res, next) => {
    try {
      // Check if validations is a Joi schema
      if (validations && validations.validate) {
        const { error } = validations.validate(req.body);
        if (error) {
          return res.status(400).json({
            errors: error.details.map((detail) => ({
              msg: detail.message,
              param: detail.path.join("."),
            })),
          });
        }
        return next();
      }

      // Handle express-validator array
      if (Array.isArray(validations)) {
        await Promise.all(validations.map((validation) => validation.run(req)));
        const errors = validationResult(req);
        if (errors.isEmpty()) {
          return next();
        }
        return res.status(400).json({ errors: errors.array() });
      }

      // If neither, return error
      return res
        .status(500)
        .json({ message: "Invalid validation configuration" });
    } catch (error) {
      console.error("Validation error:", error);
      return res.status(500).json({ message: "Validation error occurred" });
    }
  };
};
