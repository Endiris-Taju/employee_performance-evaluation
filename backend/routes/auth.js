import express from "express";
import pool from "../db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const router = express.Router();
// Register new employee
router.post("/register", async (req, res) => {
  const { name, email, password, department, rank, employeeId, phone, position, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  // FIX: create normalized email HERE
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const normalizedRole =
      role && ["admin", "leader", "employee", "member"].includes(role)
        ? role === "employee"
          ? "member"
          : role
        : "member";

    const existing = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
      [normalizedEmail]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users (email, password_hash, role, name, department, rank, employee_id, phone, position)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        normalizedEmail,
        hashedPassword,
        normalizedRole,
        name,
        department,
        rank,
        employeeId,
        phone,
        position
      ]
    );

    res.status(201).json({ message: "Employee registered successfully" });

  } catch (err) {
    console.error("Error registering employee:", err.message);
    res.status(500).json({ error: "Registration failed", reason: err.message });
  }
});
// Login
 

router.post("/login", async (req, res) => {

  const { email, password } = req.body;
    console.log("LOGIN BODY:", req.body);
  console.log("EMAIL:", email);
console.log("PASSWORD:", password);
    const normalizedEmail = email.toLowerCase().trim();

  try {
    // Fetch user with all fields from users table
   const userResult = await pool.query(
  `SELECT id, email, password_hash, role, name, department, rank, employee_id, phone, position
   FROM users
   WHERE LOWER(email) = LOWER($1)`,
  [normalizedEmail]
);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = userResult.rows[0];

    // Support both hashed and legacy-plaintext passwords (auto-upgrade on login)
    let isMatch = false;
    const stored = user.password_hash || "";
    try {
      isMatch = await bcrypt.compare(String(password), String(stored));
    } catch {
      isMatch = false;
    }
    if (!isMatch) {
      // Legacy fallback: if an old account stored plaintext, allow login once and re-hash.
      if (String(password) === String(stored)) {
        const newHash = await bcrypt.hash(String(password), 10);
        await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [newHash, user.id]);
        isMatch = true;
      }
    }
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    // Safe JWT (fallback secret)
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "6h" }
    );

    // Return user data directly from users table
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        department: user.department,
        rank: user.rank,
        employee_id: user.employee_id,
        phone: user.phone,
        position: user.position
      }
    });
  } catch (err) {
    console.error("Error logging in:", err.message);
    return res.status(500).json({ error: "Login failed", reason: err.message });
  }
});

export default router;