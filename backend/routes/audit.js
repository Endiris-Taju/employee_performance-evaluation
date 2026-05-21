import express from "express";
import pool from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/audit?limit=100
router.get("/", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const result = await pool.query(
      `SELECT a.*, u.name as user_name, u.email as user_email
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.user_id
       ORDER BY a.created_at DESC
       LIMIT $1`,
      [limit]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Audit fetch error:", err);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

export default router;
