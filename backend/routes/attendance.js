import express from "express";
import pool from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

function requireStaff(req, res) {
  const role = req.user?.role;
  if (role !== "admin" && role !== "leader") {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

// POST /api/attendance/checkin
router.post("/checkin", authMiddleware, async (req, res) => {
  try {
    const { employee_id, photo_data_url, device_info } = req.body || {};
    const role = req.user?.role;

    const targetEmployeeId =
      role === "admin" || role === "leader"
        ? Number(employee_id || req.user?.id)
        : Number(req.user?.id);

    if (!targetEmployeeId) {
      return res.status(400).json({ error: "Missing employee_id" });
    }

    const result = await pool.query(
      `INSERT INTO attendance_events (employee_id, event_type, photo_data_url, device_info, created_by)
       VALUES ($1, 'checkin', $2, $3, $4)
       RETURNING *`,
      [
        targetEmployeeId,
        photo_data_url || null,
        device_info ? JSON.stringify(device_info) : null,
        req.user?.id ?? null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Attendance checkin error:", err);
    res.status(500).json({ error: "Failed to check in" });
  }
});

// POST /api/attendance/checkout
router.post("/checkout", authMiddleware, async (req, res) => {
  try {
    const { employee_id, photo_data_url, device_info } = req.body || {};
    const role = req.user?.role;

    const targetEmployeeId =
      role === "admin" || role === "leader"
        ? Number(employee_id || req.user?.id)
        : Number(req.user?.id);

    if (!targetEmployeeId) {
      return res.status(400).json({ error: "Missing employee_id" });
    }

    const result = await pool.query(
      `INSERT INTO attendance_events (employee_id, event_type, photo_data_url, device_info, created_by)
       VALUES ($1, 'checkout', $2, $3, $4)
       RETURNING *`,
      [
        targetEmployeeId,
        photo_data_url || null,
        device_info ? JSON.stringify(device_info) : null,
        req.user?.id ?? null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Attendance checkout error:", err);
    res.status(500).json({ error: "Failed to check out" });
  }
});

// GET /api/attendance/me?date=YYYY-MM-DD
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const employeeId = Number(req.user?.id);
    const { date } = req.query;

    let query = `SELECT * FROM attendance_events WHERE employee_id = $1`;
    const values = [employeeId];

    if (date) {
      // compare by day in server timezone (good enough for MVP)
      query += ` AND event_time::date = $2::date`;
      values.push(date);
    }

    query += ` ORDER BY event_time DESC LIMIT 200`;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error("Attendance me error:", err);
    res.status(500).json({ error: "Failed to fetch attendance" });
  }
});

// GET /api/attendance?employee_id=&from=&to=
router.get("/", authMiddleware, async (req, res) => {
  try {
    if (!requireStaff(req, res)) return;
    const { employee_id, from, to } = req.query;

    const where = [];
    const values = [];

    if (employee_id) {
      values.push(Number(employee_id));
      where.push(`employee_id = $${values.length}`);
    }
    if (from) {
      values.push(from);
      where.push(`event_time >= $${values.length}::timestamptz`);
    }
    if (to) {
      values.push(to);
      where.push(`event_time <= $${values.length}::timestamptz`);
    }

    const sql =
      `SELECT ae.*, u.name as employee_name, u.email as employee_email
       FROM attendance_events ae
       LEFT JOIN users u ON u.id = ae.employee_id` +
      (where.length ? ` WHERE ${where.join(" AND ")}` : "") +
      ` ORDER BY ae.event_time DESC LIMIT 500`;

    const result = await pool.query(sql, values);
    res.json(result.rows);
  } catch (err) {
    console.error("Attendance list error:", err);
    res.status(500).json({ error: "Failed to fetch attendance logs" });
  }
});

export default router;

