import express from "express";
import pool from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

const WEIGHTS = {
  self: 0.05,
  peer: 0.1,
  behavioral: 0.15, // leader/manager behavioral
  admin: 0.7, // admin/team overall (mapped from performance/workrate/admin)
};

function normalizeType(type) {
  const t = String(type || "").toLowerCase();
  if (t === "self") return "self";
  if (t === "peer") return "peer";
  if (t === "behavioral") return "behavioral";
  // Everything else contributes to the 70% bucket.
  return "admin";
}

// GET /api/efficiency/employee/:id
router.get("/employee/:id", authMiddleware, async (req, res) => {
  try {
    const role = req.user?.role;
    const employeeId = Number(req.params.id);
    if (!employeeId) return res.status(400).json({ error: "Invalid employee id" });

    if (role !== "admin" && role !== "leader" && Number(req.user?.id) !== employeeId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const result = await pool.query(
      `SELECT id, type, percentage, date
       FROM evaluations_v2
       WHERE employee_id = $1
       ORDER BY date DESC NULLS LAST, id DESC`,
      [employeeId]
    );

    const latestByBucket = {};
    for (const row of result.rows) {
      const bucket = normalizeType(row.type);
      if (!latestByBucket[bucket]) latestByBucket[bucket] = row;
      if (latestByBucket.self && latestByBucket.peer && latestByBucket.behavioral && latestByBucket.admin) break;
    }

    const breakdown = {
      self: latestByBucket.self ? Number(latestByBucket.self.percentage || 0) : null,
      peer: latestByBucket.peer ? Number(latestByBucket.peer.percentage || 0) : null,
      leader: latestByBucket.behavioral ? Number(latestByBucket.behavioral.percentage || 0) : null,
      admin: latestByBucket.admin ? Number(latestByBucket.admin.percentage || 0) : null,
    };

    const weighted =
      (breakdown.self ?? 0) * WEIGHTS.self +
      (breakdown.peer ?? 0) * WEIGHTS.peer +
      (breakdown.leader ?? 0) * WEIGHTS.behavioral +
      (breakdown.admin ?? 0) * WEIGHTS.admin;

    res.json({
      employee_id: employeeId,
      weights: { self: 5, peer: 10, leader: 15, admin: 70 },
      latest: latestByBucket,
      breakdown_percent: breakdown,
      efficiency_percent: Number(weighted.toFixed(2)),
    });
  } catch (err) {
    console.error("Efficiency error:", err);
    res.status(500).json({ error: "Failed to compute efficiency" });
  }
});

export default router;

