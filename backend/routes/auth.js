import express from "express";
import pool from "../db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { logAudit } from "../lib/audit.js";

const router = express.Router();

const userFields = `id, email, role, name, department, rank, employee_id, phone, position, created_at`;
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
  const normalizedEmail = String(email || "").toLowerCase().trim();

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

    const fakeReq = { user: { id: user.id }, ip: req.ip, headers: req.headers };
    await logAudit(fakeReq, {
      action: "login",
      entityType: "user",
      entityId: user.id,
    });

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
        position: user.position,
      },
    });
  } catch (err) {
    console.error("Error logging in:", err.message);
    return res.status(500).json({ error: "Login failed", reason: err.message });
  }
});

// GET /api/auth/me
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${userFields} FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// PUT /api/auth/me — update own profile (not role)
router.put("/me", authMiddleware, async (req, res) => {
  try {
    const {
      name,
      department,
      rank,
      phone,
      position,
      employee_id,
      employeeId,
      profile_photo_data_url,
      profilePhotoDataUrl,
    } = req.body;

    const photo = profile_photo_data_url ?? profilePhotoDataUrl;

    const result = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           department = COALESCE($2, department),
           rank = COALESCE($3, rank),
           phone = COALESCE($4, phone),
           position = COALESCE($5, position),
           employee_id = COALESCE($6, employee_id),
           profile_photo_data_url = COALESCE($7, profile_photo_data_url)
       WHERE id = $8
       RETURNING ${userFields}`,
      [
        name,
        department,
        rank,
        phone,
        position,
        employee_id ?? employeeId,
        photo != null ? String(photo).slice(0, 200000) : null,
        req.user.id,
      ]
    );

    await logAudit(req, {
      action: "profile_update",
      entityType: "user",
      entityId: req.user.id,
    });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// POST /api/auth/change-password
router.post("/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new password are required" });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const userRes = await pool.query(
      "SELECT id, password_hash FROM users WHERE id = $1",
      [req.user.id]
    );
    if (!userRes.rows.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userRes.rows[0];
    const match = await bcrypt.compare(String(currentPassword), user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const hash = await bcrypt.hash(String(newPassword), 10);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      hash,
      req.user.id,
    ]);

    await logAudit(req, {
      action: "password_change",
      entityType: "user",
      entityId: req.user.id,
    });

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
});

export default router;