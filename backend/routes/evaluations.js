import express from "express";
import pool from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/evaluations
 * @desc    Get all evaluations (admin use)
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM evaluations_v2 ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching evaluations:", err);
    res.status(500).json({ error: "Failed to fetch evaluations" });
  }
});

/**
 * @route   POST /api/evaluations
 * @desc    Create a new evaluation (self, peer, workRate, etc.)
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      employee_id,
      type,
      scores,
      total_score,
      max_score,
      percentage,
      date
    } = req.body;

    if (!employee_id || !type || total_score == null || max_score == null) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const insertQuery = `
      INSERT INTO evaluations_v2
        (employee_id, type, scores, total_score, max_score, percentage, date)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const values = [
      employee_id,
      type,
      scores ? JSON.stringify(scores) : null,
      total_score,
      max_score,
      percentage,
      date || new Date().toISOString()
    ];

    const result = await pool.query(insertQuery, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error saving evaluation:", err);
    res.status(500).json({ error: "Failed to save evaluation" });
  }
});

/**
 * @route   GET /api/evaluations/employee/:id
 * @desc    Get all evaluations for a specific employee
 */
router.get("/employee/:id", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM evaluations_v2 WHERE employee_id = $1 ORDER BY date DESC",
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching employee evaluations:", err);
    res.status(500).json({ error: "Failed to fetch employee evaluations" });
  }
});

/**
 * @route   PUT /api/evaluations/:id
 * @desc    Update an evaluation
 */
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      employee_id,
      type,
      scores,
      total_score,
      max_score,
      percentage,
      date
    } = req.body;

    const updateQuery = `
      UPDATE evaluations_v2
      SET employee_id=$1, type=$2, scores=$3, total_score=$4, max_score=$5, percentage=$6, date=$7
      WHERE id=$8
      RETURNING *;
    `;

    const values = [
      employee_id,
      type,
      scores ? JSON.stringify(scores) : null,
      total_score,
      max_score,
      percentage,
      date || new Date().toISOString(),
      id
    ];

    const result = await pool.query(updateQuery, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Evaluation not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating evaluation:", err);
    res.status(500).json({ error: "Failed to update evaluation" });
  }
});

/**
 * @route   DELETE /api/evaluations/:id
 * @desc    Delete an evaluation (admin only)
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM evaluations_v2 WHERE id = $1", [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Evaluation not found" });
    }
    res.json({ message: "Evaluation deleted successfully" });
  } catch (err) {
    console.error("Error deleting evaluation:", err);
    res.status(500).json({ error: "Failed to delete evaluation" });
  }
});

export default router;