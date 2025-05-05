import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import crypto from "crypto";
import readline from "readline";

// Load environment variables
dotenv.config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to prompt user for input
const prompt = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

// Function to generate a random password
const generateRandomPassword = (length = 10) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";

  // Generate cryptographically secure random bytes
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    // Use the random bytes to select characters from the charset
    const randomIndex = randomBytes[i] % chars.length;
    password += chars[randomIndex];
  }

  return password;
};

// Main admin management function
async function manageAdmin() {
  console.log("\n=== LMS Admin Account Manager ===\n");

  // Create a connection to the database
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "lms_db",
    });

    console.log("✅ Connected to database\n");

    // Check if admin exists
    const [users] = await connection.execute(
      "SELECT id, email, role, status, is_first_login FROM users WHERE id = 1 OR role = 'admin' LIMIT 10"
    );

    console.log(
      "Found admin accounts:",
      users.length > 0 ? users.length : "None"
    );
    if (users.length > 0) {
      users.forEach((user) => {
        console.log(
          `- ID: ${user.id}, Email: ${user.email}, Status: ${
            user.status
          }, First Login: ${user.is_first_login ? "Yes" : "No"}`
        );
      });
    }

    // Display menu options
    console.log("\nWhat would you like to do?");
    console.log("1. Create a new admin account");
    console.log("2. Reset an existing admin's password");
    console.log("3. Fix admin account issues (token blacklist cleanup)");
    console.log("4. Exit");

    const choice = await prompt("\nEnter your choice (1-4): ");

    switch (choice) {
      case "1":
        await createAdminAccount(connection);
        break;
      case "2":
        await resetAdminPassword(connection);
        break;
      case "3":
        await fixAdminAccount(connection);
        break;
      case "4":
        console.log("Exiting...");
        break;
      default:
        console.log("Invalid choice, please try again.");
        break;
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    if (connection) {
      await connection.end();
      console.log("Database connection closed");
    }
    rl.close();
  }
}

// Function to create a new admin account
async function createAdminAccount(connection) {
  try {
    const email = await prompt("Enter email for the new admin: ");
    let password = await prompt(
      "Enter password (or leave empty for auto-generated): "
    );

    // Generate password if not provided
    if (!password) {
      password = generateRandomPassword(12);
      console.log(`\nAuto-generated password: ${password}`);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(`\nPassword hash generated: ${hashedPassword}`);

    // Get first and last name
    const firstName = await prompt("Enter first name: ");
    const lastName = await prompt("Enter last name: ");

    // Check if email already exists
    const [existingUsers] = await connection.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      console.log(`\n❌ Error: An account with email ${email} already exists`);
      return;
    }

    // Insert the new admin
    const [result] = await connection.execute(
      `INSERT INTO users 
       (email, password, role, first_name, last_name, created_at, status, is_first_login)
       VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)`,
      [
        email,
        hashedPassword,
        "admin",
        firstName,
        lastName,
        "active",
        0, // Not requiring password change on first login
      ]
    );

    if (result.affectedRows > 0) {
      console.log(`\n✅ Admin account created successfully!`);
      console.log(`\nAdmin Account Details:`);
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
      console.log(`Role: admin`);
      console.log(`Status: active`);
      console.log(`First Login Required: No`);
    } else {
      console.log("\n❌ Failed to create admin account");
    }
  } catch (error) {
    console.error("Error creating admin account:", error);
  }
}

// Function to reset an admin's password
async function resetAdminPassword(connection) {
  try {
    // List admin accounts for selection
    const [admins] = await connection.execute(
      "SELECT id, email FROM users WHERE role = 'admin'"
    );

    if (admins.length === 0) {
      console.log("\n❌ No admin accounts found");
      return;
    }

    console.log("\nAdmin accounts:");
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.email} (ID: ${admin.id})`);
    });

    const selection = await prompt(
      `\nSelect admin to reset (1-${admins.length}): `
    );
    const selectedIndex = parseInt(selection) - 1;

    if (
      isNaN(selectedIndex) ||
      selectedIndex < 0 ||
      selectedIndex >= admins.length
    ) {
      console.log("\n❌ Invalid selection");
      return;
    }

    const admin = admins[selectedIndex];

    let password = await prompt(
      "Enter new password (or leave empty for auto-generated): "
    );

    // Generate password if not provided
    if (!password) {
      password = generateRandomPassword(12);
      console.log(`\nAuto-generated password: ${password}`);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the password
    const [result] = await connection.execute(
      "UPDATE users SET password = ?, is_first_login = 0 WHERE id = ?",
      [hashedPassword, admin.id]
    );

    if (result.affectedRows > 0) {
      console.log(`\n✅ Password reset successfully for ${admin.email}`);
      console.log(`New password: ${password}`);

      // Clean up any blacklisted tokens for this admin
      await cleanupTokenBlacklist(connection, admin.id);
    } else {
      console.log("\n❌ Failed to reset password");
    }
  } catch (error) {
    console.error("Error resetting admin password:", error);
  }
}

// Function to fix admin account issues
async function fixAdminAccount(connection) {
  try {
    // List admin accounts for selection
    const [admins] = await connection.execute(
      "SELECT id, email, is_first_login, status FROM users WHERE role = 'admin'"
    );

    if (admins.length === 0) {
      console.log("\n❌ No admin accounts found");
      return;
    }

    console.log("\nAdmin accounts:");
    admins.forEach((admin, index) => {
      console.log(
        `${index + 1}. ${admin.email} (ID: ${admin.id}, Status: ${
          admin.status
        }, First Login: ${admin.is_first_login ? "Yes" : "No"})`
      );
    });

    const selection = await prompt(
      `\nSelect admin to fix (1-${admins.length}): `
    );
    const selectedIndex = parseInt(selection) - 1;

    if (
      isNaN(selectedIndex) ||
      selectedIndex < 0 ||
      selectedIndex >= admins.length
    ) {
      console.log("\n❌ Invalid selection");
      return;
    }

    const admin = admins[selectedIndex];

    // Clean up token blacklist
    await cleanupTokenBlacklist(connection, admin.id);

    // Fix first login flag if needed
    if (admin.is_first_login === 1) {
      const setFirstLoginFlag = await prompt(
        "Set first login requirement to false? (y/n): "
      );

      if (setFirstLoginFlag.toLowerCase() === "y") {
        const [result] = await connection.execute(
          "UPDATE users SET is_first_login = 0 WHERE id = ?",
          [admin.id]
        );

        if (result.affectedRows > 0) {
          console.log(
            `\n✅ First login requirement disabled for ${admin.email}`
          );
        } else {
          console.log("\n❌ Failed to update first login requirement");
        }
      }
    }

    // Fix status if needed
    if (admin.status !== "active") {
      const fixStatus = await prompt("Set account status to active? (y/n): ");

      if (fixStatus.toLowerCase() === "y") {
        const [result] = await connection.execute(
          "UPDATE users SET status = 'active' WHERE id = ?",
          [admin.id]
        );

        if (result.affectedRows > 0) {
          console.log(`\n✅ Account status set to active for ${admin.email}`);
        } else {
          console.log("\n❌ Failed to update account status");
        }
      }
    }

    console.log(`\n✅ Admin account ${admin.email} has been fixed`);
  } catch (error) {
    console.error("Error fixing admin account:", error);
  }
}

// Helper function to clean up token blacklist
async function cleanupTokenBlacklist(connection, userId) {
  try {
    // Check if the token_blacklist table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'token_blacklist'"
    );

    if (tables.length === 0) {
      console.log(
        "\n❕ token_blacklist table does not exist, skipping cleanup"
      );
      return;
    }

    // Check if the admin account has blacklisted tokens
    const [blacklistedTokens] = await connection.execute(
      "SELECT * FROM token_blacklist WHERE user_id = ?",
      [userId]
    );

    console.log(`\nFound ${blacklistedTokens.length} blacklisted tokens`);

    if (blacklistedTokens.length > 0) {
      // Delete all blacklisted tokens
      const [result] = await connection.execute(
        "DELETE FROM token_blacklist WHERE user_id = ?",
        [userId]
      );

      console.log(`✅ Deleted ${result.affectedRows} blacklisted tokens`);
    } else {
      console.log("✅ No blacklisted tokens found");
    }
  } catch (error) {
    console.error("Error cleaning up token blacklist:", error);
  }
}

// Run the main function
manageAdmin();
