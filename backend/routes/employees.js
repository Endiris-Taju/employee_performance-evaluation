// backend/routes/employees.js
import express from "express";
import pool from "../db.js";   // your PostgreSQL connection
import { authMiddleware } from "../middleware/authMiddleware.js";
import bcrypt from "bcrypt";

const router = express.Router();

// ✅ Get all employees (all users for admin view)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        u.id, u.name, u.email, u.role, u.department, u.rank, u.employee_id, u.phone, u.position,
        COALESCE(u.employee_id, 'N/A') as idNumber,
        COALESCE(u.phone, 'N/A') as phone,
        COALESCE(u.position, 'N/A') as position
       FROM users u 
       ORDER BY u.id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching employees:", err.message);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

// ✅ Add new employee (insert into users)
router.post("/", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== "admin" && req.user?.role !== "leader") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { name, email, department, rank, employeeId, phone, position, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(String(password || "password123"), 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department, rank, employee_id, phone, position)
       VALUES ($1, $2, $3, 'member', $4, $5, $6, $7, $8)
       RETURNING id, name, email, role, department, rank, employee_id, phone, position`,
      [name, email, hashedPassword, department || null, rank || null, employeeId || null, phone || null, position || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error adding employee:", err.message);
    res.status(500).json({ error: "Failed to add employee" });
  }
});

// ✅ Update employee (update users)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, department, rank, employeeId, phone, position } = req.body;

    const normalizedRole =
      role === "employee" ? "member" : role;

    const result = await pool.query(
      `UPDATE users
       SET name=$1, email=$2, role=$3, department=$4, rank=$5, employee_id=$6, phone=$7, position=$8
       WHERE id=$9
       RETURNING id, name, email, role, department, rank, employee_id, phone, position`,
      [name, email, normalizedRole, department, rank, employeeId || null, phone || null, position || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating employee:", err.message);
    res.status(500).json({ error: "Failed to update employee" });
  }
});

export default router;