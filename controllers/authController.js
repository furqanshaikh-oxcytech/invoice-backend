const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      res.status(400);
      return res.json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = crypto.randomInt(100000, 999999).toString();

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        verified: "N",
        verifyotp: otp,
        company_existing: "N",
      },
    });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false, // Ignore self-signed certificates
      },
    });

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: "Verify Email",
      html: `<p>Use this OTP-<strong>${otp}</strong> to verify your email. Use Link http://localhost:5173/verify-email</p>`,
    };

    await transporter.sendMail(mailOptions);

    res
      .status(201)
      .json({ message: "Sent email verification OTP successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    await prisma.$disconnect();
  }
};

exports.verifyEmail = async (req, res) => {
  const { otp } = req.body;
  console.log("otp", otp);
  try {
    // Find the user with the matching OTP
    const user = await prisma.user.updateMany({
      where: { verifyotp: otp },
      data: { verifyotp: null, verified: "Y" },
    });

    if (user.count === 0) {
      res.status(400).json({ message: "Invalid or expired OTP" });
      return;
    }

    res.status(200).json({ message: "User verified successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  } finally {
    await prisma.$disconnect();
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.verified === "N") {
      return res.status(400).json({ message: "User Email not verified" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.SECRET_KEY,
      {
        expiresIn: "24h",
      }
    );

    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  } finally {
    await prisma.$disconnect();
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    // Retrieve all users with only the username field
    const users = await prisma.user.findMany({
      select: {
        username: true,
      },
    });

    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  } finally {
    await prisma.$disconnect();
  }
};
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Update user with OTP
    await prisma.user.update({
      where: { email },
      data: { resetotp: otp },
    });

    // Set up the transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Mail options
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: "Password Reset",
      html: `<p>Use this OTP: <strong>${otp}</strong> to reset your password. Use the link: <a href="http://localhost:5173/reset-password">Reset Password</a></p>`,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Reset email sent successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await prisma.$disconnect();
  }
};
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Find user by email and OTP
    const user = await prisma.user.findFirst({
      where: {
        email: email,
        resetotp: otp,
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid email or OTP" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user with new password and clear OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetotp: null,
      },
    });

    res.status(200).json({ message: "Password reset successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await prisma.$disconnect();
  }
};
exports.getUser = async (req, res) => {
  const { token } = req.query;

  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const userId = decoded.id;

    // Find the user by ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Respond with user data
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  } finally {
    await prisma.$disconnect();
  }
};
