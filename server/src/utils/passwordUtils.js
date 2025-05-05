import crypto from "crypto";

export const generateRandomPassword = (length = 12) => {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";

  // Ensure at least one of each required character type
  password += charset.match(/[A-Z]/)[0]; // uppercase
  password += charset.match(/[a-z]/)[0]; // lowercase
  password += charset.match(/[0-9]/)[0]; // number
  password += charset.match(/[!@#$%^&*]/)[0]; // special char

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
};

// Alias for generateRandomPassword for backward compatibility
export const generatePassword = generateRandomPassword;
