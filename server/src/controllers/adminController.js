import { pool } from "../config/db.js";
import User from "../models/User.js";
import {
  generateRandomPassword,
  generatePassword,
} from "../utils/passwordUtils.js";
import { sendWelcomeEmail, sendEmail } from "../utils/emailService.js";
import Course from "../models/Course.js";
import TokenBlacklist from "../models/TokenBlacklist.js";
import bcrypt from "bcryptjs";

export const createUser = async (req, res) => {
  try {
    const { email, firstName, lastName, role, status = "active" } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    // Generate random password
    const temporaryPassword = generateRandomPassword();

    // Create new user
    const userId = await User.create({
      email,
      password: temporaryPassword,
      role,
      status,
      firstName,
      lastName,
    });

    // Check if email sending is configured
    const isEmailConfigured =
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS;

    let emailSent = false;
    // Only attempt to send email if configured
    if (isEmailConfigured) {
      // Send welcome email with temporary password
      emailSent = await sendWelcomeEmail(email, temporaryPassword);

      if (emailSent) {
        // Send email with credentials
        await sendEmail({
          to: email,
          subject: "Your Account Details",
          text: `Your account has been created.\nEmail: ${email}\nPassword: ${temporaryPassword}\nPlease change your password upon first login.`,
        });
      }
    }

    // If email was not configured or failed to send, still return success with password
    if (!isEmailConfigured || !emailSent) {
      return res.status(201).json({
        message:
          "User created successfully, but email notification could not be sent.",
        user: {
          id: userId,
          email,
          role,
          temporaryPassword, // Include the password in the response since email wasn't sent
        },
      });
    }

    // If everything succeeded including email
    res.status(201).json({
      message: "User created successfully and welcome email sent",
      user: {
        id: userId,
        email,
        role,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Error creating user" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { search, courseId, role } = req.query;

    let query = `
      SELECT DISTINCT u.* 
      FROM users u
    `;

    const params = [];

    // Join with enrollments if searching by course
    if (courseId) {
      query += ` JOIN enrollments e ON u.id = e.user_id WHERE e.course_id = ?`;
      params.push(courseId);
    } else {
      query += ` WHERE 1=1`;
    }

    // Add role filter if provided
    if (role) {
      query += ` AND u.role = ?`;
      params.push(role);
    }

    // Add search filter if provided
    if (search) {
      query += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Order by name
    query += ` ORDER BY u.first_name, u.last_name`;

    const [users] = await pool.query(query, params);
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const success = await User.updateRole(userId, role);
    if (!success) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ message: "Error updating user role" });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    const validStatuses = ["active", "inactive", "suspended"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.updateStatus(userId, status);
    res.json({ message: `User status updated to ${status}` });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ message: "Error updating user status" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // First blacklist all user tokens
    await TokenBlacklist.blacklistAllUserTokens(userId, "deleted");

    // Then delete the user
    const success = await User.delete(userId);

    if (!success) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Error deleting user" });
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (err) {
    next(err);
  }
};

export const assignInstructor = async (req, res, next) => {
  try {
    const { instructor_id, course_id } = req.body;

    // Verify instructor exists
    const instructor = await User.findById(instructor_id);
    if (!instructor || instructor.role !== "instructor") {
      return res.status(400).json({ message: "Invalid instructor ID" });
    }

    // Update course instructor
    const success = await Course.assignInstructor(course_id, instructor_id);
    if (!success) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json({ message: "Instructor assigned successfully" });
  } catch (err) {
    next(err);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    const [[userCount], [courseCount], [enrollmentCount]] = await Promise.all([
      pool.query("SELECT COUNT(*) as count FROM users"),
      pool.query("SELECT COUNT(*) as count FROM courses"),
      pool.query("SELECT COUNT(*) as count FROM enrollments"),
    ]);

    res.json({
      total_users: userCount[0].count,
      total_courses: courseCount[0].count,
      total_enrollments: enrollmentCount[0].count,
    });
  } catch (err) {
    next(err);
  }
};

export const suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // First blacklist all user tokens
    await TokenBlacklist.blacklistAllUserTokens(userId, "suspended");

    // Then suspend the user
    const success = await User.suspend(userId);

    if (!success) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User suspended successfully" });
  } catch (error) {
    console.error("Error suspending user:", error);
    res.status(500).json({ message: "Error suspending user" });
  }
};

export const unsuspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const success = await User.unsuspend(userId);

    if (!success) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User unsuspended successfully" });
  } catch (error) {
    console.error("Error unsuspending user:", error);
    res.status(500).json({ message: "Error unsuspending user" });
  }
};

// Get a user's profile with enrollments
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(
      "UserProfile Request - userId from params:",
      userId,
      "type:",
      typeof userId
    );

    // Convert userId to a number if it's a string
    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId)) {
      console.log("UserProfile Error - Invalid userId format:", userId);
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    console.log(
      "UserProfile Processing - Looking up user with id:",
      numericUserId
    );

    // First, get the user's basic information
    const user = await User.findById(numericUserId);
    console.log("UserProfile Result - User found:", user ? "Yes" : "No");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get the user's enrollments
    console.log(
      "UserProfile Processing - Fetching enrollments for user:",
      numericUserId
    );
    try {
      const [enrollments] = await pool.query(
        `SELECT e.id, e.course_id, e.role, 
                c.title as course_title
         FROM enrollments e
         JOIN courses c ON e.course_id = c.id
         WHERE e.user_id = ?
         ORDER BY e.id DESC`,
        [numericUserId]
      );

      console.log(
        "UserProfile Result - Enrollments count:",
        enrollments.length
      );

      // Format enrollments for the frontend
      const formattedEnrollments = enrollments.map((enrollment) => ({
        id: enrollment.id,
        courseId: enrollment.course_id,
        courseTitle: enrollment.course_title,
        role: enrollment.role,
        enrolledAt: new Date().toISOString(), // Use current date as fallback since created_at is missing
      }));

      // Return the user profile with enrollments
      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          status: user.status,
          createdAt: user.created_at,
        },
        enrollments: formattedEnrollments,
      });
    } catch (dbError) {
      console.error(
        "UserProfile Error - Database error when fetching enrollments:",
        dbError
      );
      return res.status(500).json({
        message: "Error fetching user enrollments",
        error: dbError.message,
      });
    }
  } catch (error) {
    console.error("UserProfile Error - Main function error:", error);
    res
      .status(500)
      .json({ message: "Error fetching user profile", error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate random password
    const tempPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Update user in database - set new password and is_first_login=1
    const [result] = await pool.query(
      "UPDATE users SET password = ?, is_first_login = 1 WHERE id = ?",
      [hashedPassword, userId]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Failed to update user password" });
    }

    // Check if email sending is configured
    const isEmailConfigured =
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS;

    let emailSent = false;
    // Only attempt to send email if configured
    if (isEmailConfigured) {
      // Send email with new password
      emailSent = await sendEmail({
        to: user.email,
        subject: "Your Password Has Been Reset",
        text: `Your password has been reset by an administrator.\n\nYour new temporary password is: ${tempPassword}\n\nFor security reasons, you will be required to change this password when you next login.`,
      });
    }

    // Return appropriate response
    if (!isEmailConfigured || !emailSent) {
      return res.json({
        message:
          "Password reset successfully, but email notification could not be sent.",
        temporaryPassword:
          process.env.NODE_ENV === "development" ? tempPassword : undefined,
        userEmail: user.email,
      });
    }

    res.json({
      message: "Password reset successfully and notification email sent.",
      userEmail: user.email,
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Error resetting password" });
  }
};
