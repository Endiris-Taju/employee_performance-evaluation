// backend/routes/complaints.js
import express from "express";
import pool from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET all complaints (Admin gets all, regular user gets only their own)
router.get("/", authMiddleware, async (req, res) => {
  try {
    let query;
    const values = [];
    if (req.user?.role === "admin") {
      query = `SELECT id, employee_id, employee_id AS "employeeId", title, title AS reason, description, status, created_at, created_at AS date FROM complaints ORDER BY id DESC`;
    } else {
      query = `SELECT id, employee_id, employee_id AS "employeeId", title, title AS reason, description, status, created_at, created_at AS date FROM complaints WHERE employee_id = $1 ORDER BY id DESC`;
      values.push(req.user.id);
    }
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching complaints:", err);
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
});

// POST new complaint (match schema: employee_id, title, description, status)
router.post("/", authMiddleware, async (req, res) => {
  const { employee_id, employeeId, title, reason, description, status } = req.body;
  const targetEmployeeId = employee_id ?? employeeId ?? req.user.id;
  const targetTitle = title ?? reason;

  try {
    if (!targetEmployeeId || !targetTitle || !description) {
      return res.status(400).json({ error: "employee_id, title/reason, and description are required" });
    }
    // Security check: non-admin can only create complaints for themselves
    if (req.user?.role !== "admin" && Number(targetEmployeeId) !== Number(req.user.id)) {
      return res.status(403).json({ error: "Forbidden: Cannot submit complaint for another user" });
    }

    const result = await pool.query(
      `INSERT INTO complaints (employee_id, title, description, status) VALUES ($1, $2, $3, $4) 
       RETURNING id, employee_id, employee_id AS "employeeId", title, title AS reason, description, status, created_at, created_at AS date`,
      [targetEmployeeId, targetTitle, description, status || "pending"]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error submitting complaint:", err);
    res.status(500).json({ error: "Failed to submit complaint" });
  }
});

// PUT update complaint
router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { title, reason, description, status } = req.body;
  const targetTitle = title ?? reason;

  try {
    const checkResult = await pool.query("SELECT * FROM complaints WHERE id = $1", [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    const complaint = checkResult.rows[0];

    // Security check: only admin or the filing employee can update
    if (req.user?.role !== "admin" && Number(complaint.employee_id) !== Number(req.user.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const result = await pool.query(
      `UPDATE complaints 
       SET title=$1, description=$2, status=$3 
       WHERE id=$4 
       RETURNING id, employee_id, employee_id AS "employeeId", title, title AS reason, description, status, created_at, created_at AS date`,
      [targetTitle ?? complaint.title, description ?? complaint.description, status ?? complaint.status, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating complaint:", err);
    res.status(500).json({ error: "Failed to update complaint" });
  }
});

// DELETE complaint
router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const checkResult = await pool.query("SELECT * FROM complaints WHERE id = $1", [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    const complaint = checkResult.rows[0];

    // Security check: only admin or the filing employee can delete
    if (req.user?.role !== "admin" && Number(complaint.employee_id) !== Number(req.user.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await pool.query("DELETE FROM complaints WHERE id = $1", [id]);
    res.json({ message: "Complaint deleted successfully" });
  } catch (err) {
    console.error("Error deleting complaint:", err);
    res.status(500).json({ error: "Failed to delete complaint" });
  }
});

export default router;