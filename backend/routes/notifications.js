import express from "express";
import pool from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/notifications/me
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, body, link, read_at, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Notifications fetch error:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// PUT /api/notifications/read-all
router.put("/read-all", authMiddleware, async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications SET read_at = NOW()
       WHERE user_id = $1 AND read_at IS NULL`,
      [req.user.id]
    );
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update notifications" });
  }
});

// PUT /api/notifications/:id/read
router.put("/:id/read", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE notifications SET read_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to mark notification read" });
  }
});

export default router;
