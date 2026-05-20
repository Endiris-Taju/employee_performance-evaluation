// backend/routes/complaints.js
import express from "express";
import pool from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET all complaints
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM complaints ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching complaints:", err);
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
});

// POST new complaint (match schema: employee_id, title, description, status)
router.post("/", authMiddleware, async (req, res) => {
  const { employee_id, title, description, status } = req.body;
  try {
    if (!employee_id || !title || !description) {
      return res.status(400).json({ error: "employee_id, title, and description are required" });
    }
    const result = await pool.query(
      "INSERT INTO complaints (employee_id, title, description, status) VALUES ($1, $2, $3, $4) RETURNING *",
      [employee_id, title, description, status || "pending"]
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
  const { title, description, status } = req.body;
  try {
    const result = await pool.query(
      "UPDATE complaints SET title=$1, description=$2, status=$3 WHERE id=$4 RETURNING *",
      [title, description, status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Complaint not found" });
    }
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
    const result = await pool.query("DELETE FROM complaints WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    res.json({ message: "Complaint deleted successfully" });
  } catch (err) {
    console.error("Error deleting complaint:", err);
    res.status(500).json({ error: "Failed to delete complaint" });
  }
});

export default router;