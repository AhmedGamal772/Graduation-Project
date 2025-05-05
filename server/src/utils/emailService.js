import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendWelcomeEmail = async (email, password) => {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Welcome to Our Platform - Your Temporary Password",
    html: `
      <h1>Welcome to Our Platform!</h1>
      <p>Your account has been created successfully.</p>
      <p>Here is your temporary password: <strong>${password}</strong></p>
      <p>For security reasons, you will be required to change this password on your first login.</p>
      <p>Please login and change your password immediately.</p>
      <br>
      <p>Best regards,</p>
      <p>Your Platform Team</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return false;
  }
};

export const sendEmail = async ({ to, subject, text }) => {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to,
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};
