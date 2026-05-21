import express from "express";
import pool from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

export async function getActiveCycle() {
  const result = await pool.query(
    `SELECT * FROM evaluation_cycles
     WHERE status = 'open'
       AND CURRENT_DATE BETWEEN start_date AND end_date
     ORDER BY start_date DESC
     LIMIT 1`
  );
  if (result.rows[0]) return result.rows[0];

  const fallback = await pool.query(
    `SELECT * FROM evaluation_cycles
     WHERE status = 'open'
     ORDER BY start_date DESC
     LIMIT 1`
  );
  return fallback.rows[0] || null;
}

// GET /api/cycles/active
router.get("/active", authMiddleware, async (req, res) => {
  try {
    const cycle = await getActiveCycle();
    res.json(cycle);
  } catch (err) {
    console.error("Active cycle error:", err);
    res.status(500).json({ error: "Failed to fetch active cycle" });
  }
});

// GET /api/cycles — admin/leader
router.get("/", authMiddleware, async (req, res) => {
  try {
    const role = req.user?.role;
    if (role !== "admin" && role !== "leader") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const result = await pool.query(
      `SELECT * FROM evaluation_cycles ORDER BY start_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Cycles list error:", err);
    res.status(500).json({ error: "Failed to fetch cycles" });
  }
});

// POST /api/cycles — admin only
router.post("/", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { name, start_date, end_date, status } = req.body;
    if (!name || !start_date || !end_date) {
      return res.status(400).json({ error: "name, start_date, and end_date are required" });
    }
    const result = await pool.query(
      `INSERT INTO evaluation_cycles (name, start_date, end_date, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, start_date, end_date, status === "closed" ? "closed" : "open"]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create cycle error:", err);
    res.status(500).json({ error: "Failed to create cycle" });
  }
});

// PUT /api/cycles/:id/close — admin only
router.put("/:id/close", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const result = await pool.query(
      `UPDATE evaluation_cycles SET status = 'closed' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: "Cycle not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Close cycle error:", err);
    res.status(500).json({ error: "Failed to close cycle" });
  }
});

export default router;
