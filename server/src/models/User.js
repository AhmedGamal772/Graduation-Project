import { pool } from "../config/db.js";
import bcrypt from "bcryptjs";

export default {
  async create({
    email,
    password,
    role = "user",
    status = "active",
    firstName,
    lastName,
  }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      "INSERT INTO users (email, password, role, status, first_name, last_name, is_first_login) VALUES (?, ?, ?, ?, ?, ?, 1)",
      [email, hashedPassword, role, status, firstName, lastName]
    );
    return result.insertId;
  },

  async findByEmail(email) {
    const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    return rows[0];
  },

  async findById(id) {
    const [rows] = await pool.execute("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0];
  },

  async getAll() {
    const [rows] = await pool.execute("SELECT * FROM users");
    return rows;
  },

  async updateRole(id, role) {
    const [result] = await pool.execute("UPDATE users SET role = ? WHERE id = ?", [role, id]);
    return result.affectedRows > 0;
  },

  async updateStatus(userId, status) {
    const [result] = await pool.execute(
      "UPDATE users SET status = ? WHERE id = ?",
      [status, userId]
    );
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await pool.execute("DELETE FROM users WHERE id = ?", [id]);
    return result.affectedRows > 0;
  },

  async updatePassword(id, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.execute(
      "UPDATE users SET password = ?, is_first_login = 0 WHERE id = ?",
      [hashedPassword, id]
    );
  },

  async comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  },

  async suspend(id) {
    return this.updateStatus(id, "suspended");
  },

  async unsuspend(id) {
    return this.updateStatus(id, "active");
  },
};
