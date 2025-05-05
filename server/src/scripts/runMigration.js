import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Configure environment
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "../../../.env") });

// Run migrations
console.log("Running migrations...");

// Import and run each migration
import "../migrations/add_status_to_users.js";
import "../migrations/add_name_fields_to_users.js";
import "../migrations/add_role_to_enrollments.js";
import "../migrations/20231010_create_token_blacklist_table.js";
import "../migrations/add_title_to_posts.js";
import "../migrations/add_post_files_table.js";
import "../migrations/add_submissions_feature.js";

console.log("Migrations completed successfully.");
