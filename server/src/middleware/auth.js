import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import TokenBlacklist from "../models/TokenBlacklist.js";

export const authenticate = (roles = []) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token)
        return res.status(401).json({ message: "Authentication required" });

      // Check if the token is blacklisted - skip if table doesn't exist
      try {
        const isBlacklisted = await TokenBlacklist.isBlacklisted(token);
        if (isBlacklisted) {
          return res.status(401).json({
            message: "Authentication session expired or revoked",
            code: "TOKEN_BLACKLISTED",
          });
        }

        // Check if all tokens for this user are blacklisted
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const areAllTokensBlacklisted =
          await TokenBlacklist.areAllUserTokensBlacklisted(decoded.userId);
        if (areAllTokensBlacklisted) {
          return res.status(401).json({
            message: "User account has been modified. Please login again",
            code: "ALL_TOKENS_BLACKLISTED",
          });
        }
      } catch (blacklistError) {
        // If there's an error with the token blacklist (like missing table),
        // log it but continue processing
        console.warn(
          "Token blacklist check error (continuing):",
          blacklistError.message
        );
      }

      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const [users] = await pool.query("SELECT * FROM users WHERE id = ?", [
        decoded.userId,
      ]);

      if (!users.length)
        return res.status(401).json({ message: "User not found" });

      // Check if the user is suspended
      if (users[0].status === "suspended") {
        return res.status(403).json({
          message:
            "Your account has been suspended. Please contact an administrator.",
          code: "ACCOUNT_SUSPENDED",
        });
      }

      if (roles.length && !roles.includes(users[0].role)) {
        return res.status(403).json({ message: "Unauthorized access" });
      }

      req.user = users[0];
      // Attach the token to the request in case we need it
      req.token = token;
      next();
    } catch (err) {
      return res.status(401).json({
        message: "Invalid token",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
      });
    }
  };
};

export const blacklistToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token && req.user?.id) {
      const decoded = jwt.decode(token);
      const expiresAt = new Date(decoded.exp * 1000); // Convert from UNIX timestamp to Date
      await TokenBlacklist.add(token, req.user.id, "logout", expiresAt);
    }
    next();
  } catch (error) {
    console.error("Error blacklisting token:", error);
    next(); // Continue even if there's an error
  }
};
