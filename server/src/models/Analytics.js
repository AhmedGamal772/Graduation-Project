import { pool } from "../config/db.js";

export default {
  async recordMetric(metricName, value) {
    await pool.query(
      "INSERT INTO analytics (metric_name, value) VALUES (?, ?)",
      [metricName, value]
    );
  },

  async getMetrics() {
    const [userCount] = await pool.query("SELECT COUNT(*) as count FROM users");
    const [courseCount] = await pool.query(
      "SELECT COUNT(*) as count FROM courses"
    );
    const [enrollmentCount] = await pool.query(
      "SELECT COUNT(*) as count FROM enrollments"
    );
    const [postCount] = await pool.query("SELECT COUNT(*) as count FROM posts");

    return {
      total_users: userCount[0].count,
      total_courses: courseCount[0].count,
      total_enrollments: enrollmentCount[0].count,
      total_posts: postCount[0].count,
    };
  },

  async getRecentActivity(days = 7) {
    const [users] = await pool.query(
      `
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
    `,
      [days]
    );

    const [enrollments] = await pool.query(
      `
      SELECT DATE(enrolled_at) as date, COUNT(*) as count 
      FROM enrollments 
      WHERE enrolled_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(enrolled_at)
    `,
      [days]
    );

    const [posts] = await pool.query(
      `
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM posts 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
    `,
      [days]
    );

    return { users, enrollments, posts };
  },
};
