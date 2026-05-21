// backend/routes/users.js
import express from "express";
import pool from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import bcrypt from "bcrypt";

const router = express.Router();

// GET /api/users - list users (admin only)
router.get("/", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const result = await pool.query(
      "SELECT id, email, role, name, department, rank, employee_id, phone, position, created_at FROM users ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching users:", err.message);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// GET /api/users/:id - get specific user (self or admin)
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (
      req.user?.role !== "admin" &&
      Number(id) !== Number(req.user?.id)
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const result = await pool.query(
      "SELECT id, email, role, name, department, rank, employee_id, phone, position, created_at FROM users WHERE id = $1",
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching user:", err.message);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// POST /api/users/add - create user (admin only)
router.post("/add", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const {
      name,
      email,
      password,
      role,
      department,
      rank,
      employeeId,
      phone,
      position
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    const userRole = (role && ["admin", "leader", "employee"].includes(role)) ? role : "employee";

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

  const hashedPassword = await bcrypt.hash(password, 10);

const userResult = await pool.query(
  `INSERT INTO users (email, password_hash, role, name, department, rank, employee_id, phone, position)
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
   RETURNING id, email, role, name, department, rank, employee_id, phone, position, created_at`,
  [
    email,
    hashedPassword,
    userRole,
    name,
    department || null,
    rank || null,
    employeeId || null,
    phone || null,
    position || null
  ]
);

    res.status(201).json({ message: "User created successfully", user: userResult.rows[0] });
  } catch (err) {
    console.error("Error creating user:", err.message);
    res.status(500).json({ error: "Failed to create user", reason: err.message });
  }
});

// PUT /api/users/:id - update user
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      role,
      department,
      rank,
      employeeId,
      phone,
      position
    } = req.body;

    const userRole = (role && ["admin", "leader", "employee"].includes(role)) ? role : "employee";

    const result = await pool.query(
      `UPDATE users 
       SET name=$1, email=$2, role=$3, department=$4, rank=$5, employee_id=$6, phone=$7, position=$8
       WHERE id=$9
       RETURNING id, email, role, name, department, rank, employee_id, phone, position, created_at`,
      [name, email, userRole, department || null, rank || null, employeeId || null, phone || null, position || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User updated successfully", user: result.rows[0] });
  } catch (err) {
    console.error("Error updating user:", err.message);
    res.status(500).json({ error: "Failed to update user", reason: err.message });
  }
});

// DELETE /api/users/:id - delete user
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { id } = req.params;
    const result = await pool.query("DELETE FROM users WHERE id = $1", [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err.message);
    res.status(500).json({ error: "Failed to delete user", reason: err.message });
  }
});

export default router;