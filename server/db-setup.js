#!/usr/bin/env node
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Configure environment
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

// Database configuration
const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 3306,
};

// SQL statements
const SQL = [
  `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME} 
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,

  `USE ${process.env.DB_NAME}`,

  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'instructor', 'admin') NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
  )`,

  `CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    course_type ENUM('General Education', 'Major-Specific', 'Elective', 'Faculty-Specific') NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_created_by (created_by),
    FULLTEXT idx_search (title, description)
  )`,

  `CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_enrollment (user_id, course_id),
    INDEX idx_user (user_id),
    INDEX idx_course (course_id)
  )`,

  `CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    author_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    file_url VARCHAR(512),
    link_url VARCHAR(512),
    is_pinned BOOLEAN DEFAULT FALSE,
    allow_submissions BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_course (course_id),
    INDEX idx_author (author_id),
    INDEX idx_pinned (is_pinned)
  )`,

  `CREATE TABLE IF NOT EXISTS analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    metric_name VARCHAR(255) NOT NULL,
    value INT NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_metric (metric_name),
    INDEX idx_recorded (recorded_at)
  )`,
];

// Create admin user if not exists
const ADMIN_SQL = `
  INSERT IGNORE INTO users (email, password, name, role)
  VALUES (?, ?, ?, 'admin')
`;

async function setupDatabase() {
  let conn;
  try {
    // Connect to MySQL server
    conn = await mysql.createConnection(config);
    console.log("🔌 Connected to MySQL server");

    // Execute each SQL statement
    for (const sql of SQL) {
      await conn.query(sql);
      console.log(`✓ Executed: ${sql.split("\n")[0].trim()}...`);
    }

    // Create admin user with hashed password
    const adminPassword = await bcrypt.hash(
      process.env.ADMIN_PASSWORD || "admin123",
      parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12
    );
    await conn.query(ADMIN_SQL, [
      process.env.ADMIN_EMAIL || "admin@lms.com",
      adminPassword,
      "System Admin",
    ]);

    console.log("✅ Database setup completed successfully");
    console.log(`Admin credentials: 
      Email: ${process.env.ADMIN_EMAIL || "admin@lms.com"}
      Password: ${process.env.ADMIN_PASSWORD || "admin123"}`);
  } catch (err) {
    console.error("❌ Database setup failed:", err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

setupDatabase();
