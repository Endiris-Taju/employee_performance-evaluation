// backend/routes/employees.js
import express from "express";
import pool from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import bcrypt from "bcrypt";
import { getLeaderMemberIds } from "../lib/teamScope.js";
import { logAudit } from "../lib/audit.js";

const router = express.Router();

const employeeSelect = `
  u.id, u.name, u.email, u.role, u.department, u.rank, u.employee_id, u.phone, u.position,
  COALESCE(u.employee_id, 'N/A') as idNumber,
  COALESCE(u.phone, 'N/A') as phone,
  COALESCE(u.position, 'N/A') as position
`;

// GET employees — staff see all; members see colleagues (same department)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const role = req.user?.role;
    let result;

    if (role === "admin") {
      result = await pool.query(
        `SELECT ${employeeSelect} FROM users u ORDER BY u.id DESC`
      );
    } else if (role === "leader") {
      const memberIds = await getLeaderMemberIds(req.user.id);
      if (memberIds.length > 0) {
        result = await pool.query(
          `SELECT ${employeeSelect} FROM users u
           WHERE u.id = ANY($1::int[])
           ORDER BY u.name ASC`,
          [memberIds]
        );
      } else {
        const me = await pool.query(
          "SELECT department FROM users WHERE id = $1",
          [req.user.id]
        );
        const department = me.rows[0]?.department;
        if (department) {
          result = await pool.query(
            `SELECT ${employeeSelect} FROM users u
             WHERE u.department = $1 AND u.role IN ('member', 'employee')
             ORDER BY u.name ASC`,
            [department]
          );
        } else {
          result = { rows: [] };
        }
      }
      const selfRow = await pool.query(
        `SELECT ${employeeSelect} FROM users u WHERE u.id = $1`,
        [req.user.id]
      );
      if (selfRow.rows[0]) {
        const ids = new Set(result.rows.map((r) => r.id));
        if (!ids.has(selfRow.rows[0].id)) {
          result.rows = [selfRow.rows[0], ...result.rows];
        }
      }
    } else {
      const me = await pool.query(
        "SELECT department FROM users WHERE id = $1",
        [req.user.id]
      );
      const department = me.rows[0]?.department;

      if (department) {
        result = await pool.query(
          `SELECT ${employeeSelect}
           FROM users u
           WHERE u.department = $1 AND u.id != $2
           ORDER BY u.name ASC`,
          [department, req.user.id]
        );
      } else {
        result = await pool.query(
          `SELECT ${employeeSelect}
           FROM users u
           WHERE u.id != $1 AND u.role IN ('member', 'employee')
           ORDER BY u.name ASC`,
          [req.user.id]
        );
      }

      // Include self for profile / self-eval lookups
      const selfRow = await pool.query(
        `SELECT ${employeeSelect} FROM users u WHERE u.id = $1`,
        [req.user.id]
      );
      if (selfRow.rows[0]) {
        result.rows = [selfRow.rows[0], ...result.rows];
      }
    }

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

    const {
      name,
      email,
      department,
      rank,
      employeeId,
      phone,
      position,
      password,
      role,
      profile_photo_data_url,
      profilePhotoDataUrl,
    } = req.body;
    const photo = profile_photo_data_url ?? profilePhotoDataUrl;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    let targetRole = role === "employee" ? "member" : role || "member";
    if (!["member", "leader", "admin"].includes(targetRole)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    if (req.user?.role === "leader") {
      targetRole = "member";
    }
    if (req.user?.role !== "admin" && targetRole === "admin") {
      return res.status(403).json({ error: "Only admins can create admin accounts" });
    }

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(String(password || "password123"), 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department, rank, employee_id, phone, position, profile_photo_data_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, name, email, role, department, rank, employee_id, phone, position`,
      [
        name,
        email,
        hashedPassword,
        targetRole,
        department || null,
        rank || null,
        employeeId || null,
        phone || null,
        position || null,
        photo ? String(photo).slice(0, 200000) : null,
      ]
    );

    await logAudit(req, {
      action: "employee_create",
      entityType: "user",
      entityId: result.rows[0].id,
      details: { email: result.rows[0].email },
    });

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
    const {
      name,
      email,
      role,
      department,
      rank,
      employeeId,
      phone,
      position,
      profile_photo_data_url,
      profilePhotoDataUrl,
    } = req.body;

    const normalizedRole = role === "employee" ? "member" : role;
    const photo = profile_photo_data_url ?? profilePhotoDataUrl;

    const result = await pool.query(
      `UPDATE users
       SET name=$1, email=$2, role=$3, department=$4, rank=$5, employee_id=$6, phone=$7, position=$8,
           profile_photo_data_url = COALESCE($9, profile_photo_data_url)
       WHERE id=$10
       RETURNING id, name, email, role, department, rank, employee_id, phone, position`,
      [
        name,
        email,
        normalizedRole,
        department,
        rank,
        employeeId || null,
        phone || null,
        position || null,
        photo != null ? String(photo).slice(0, 200000) : null,
        id,
      ]
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