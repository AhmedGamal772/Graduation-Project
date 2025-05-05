import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import User from "../models/User.js";
import TokenBlacklist from "../models/TokenBlacklist.js";

export const register = async (req, res, next) => {
  try {
    // Handle both old and new formats
    const { email, password, name, firstName, lastName, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // If using the old format with 'name', split it into first and last name
    let first = firstName;
    let last = lastName;

    if (name && !firstName && !lastName) {
      const nameParts = name.split(" ");
      first = nameParts[0];
      last = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
    }

    // Create the user
    const userId = await User.create({
      email,
      password,
      firstName: first,
      lastName: last,
      role: role || "student",
      status: "active",
    });

    // Generate token
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    });

    // Get the newly created user
    const user = await User.findById(userId);

    // Format the name consistently
    const fullName =
      user.first_name && user.last_name
        ? `${user.first_name} ${user.last_name}`
        : user.first_name || "";

    // Return the user in a format that's compatible with both old and new frontends
    res.status(201).json({
      token,
      user: {
        id: userId,
        email: user.email,
        name: fullName,
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        role: user.role,
        status: user.status || "active",
        is_first_login: true,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    next(err);
  }
};

// ... (rest of the auth controller remains the same)

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (!users.length || !(await bcrypt.compare(password, users[0].password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if the user is suspended
    if (users[0].status === "suspended") {
      return res.status(403).json({
        message:
          "Your account has been suspended. Please contact an administrator.",
        code: "ACCOUNT_SUSPENDED",
      });
    }

    const token = jwt.sign({ userId: users[0].id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    // Get the user's name properly (handle both old and new schema)
    const fullName =
      users[0].name ||
      (users[0].first_name && users[0].last_name
        ? `${users[0].first_name} ${users[0].last_name}`
        : users[0].first_name || "");

    // Return response in a format compatible with both old and new frontends
    res.json({
      token,
      user: {
        id: users[0].id,
        email: users[0].email,
        name: fullName,
        first_name: users[0].first_name || "",
        last_name: users[0].last_name || "",
        firstName: users[0].first_name || "",
        lastName: users[0].last_name || "",
        role: users[0].role,
        status: users[0].status || "active",
        is_first_login: users[0].is_first_login === 1,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    next(err);
  }
};

export const getMe = async (req, res) => {
  try {
    // Get the user's full profile from the database to ensure we have the latest data
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get the user's name properly (handle both old and new schema)
    const fullName =
      user.name ||
      (user.first_name && user.last_name
        ? `${user.first_name} ${user.last_name}`
        : user.first_name || "");

    // Return the user in a format compatible with both old and new frontends
    res.json({
      id: user.id,
      email: user.email,
      name: fullName,
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      role: user.role,
      status: user.status || "active",
      is_first_login: user.is_first_login === 1,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Error fetching user profile" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get user from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if this is first login
    const isFirstLogin = user.is_first_login === 1;

    // If this is first login, we can skip the current password check
    // Otherwise, verify current password
    if (!isFirstLogin) {
      const isPasswordValid = await User.comparePassword(
        currentPassword,
        user.password
      );
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
    }

    // Update password - this will also set is_first_login to 0
    await User.updatePassword(userId, newPassword);

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Error changing password" });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.token;
    const userId = req.user.id;

    if (token) {
      // Get token expiration from the JWT payload
      const decoded = jwt.decode(token);
      const expiresAt = new Date(decoded.exp * 1000); // Convert from UNIX timestamp to Date

      // Add token to blacklist
      await TokenBlacklist.add(token, userId, "logout", expiresAt);
    }

    res.json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ message: "Error during logout" });
  }
};
