const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { message: "Too many login attempts. Please try again in 15 minutes." },
});

// POST /api/auth/admin-login
router.post("/admin-login", loginLimiter, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: "Password required" });

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ isAdmin: true }, process.env.JWT_SECRET, { expiresIn: "8h" });
    res.json({ token, expiresIn: "8h" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
