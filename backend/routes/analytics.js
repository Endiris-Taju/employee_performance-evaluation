import express from "express";
import pool from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getActiveCycle } from "./cycles.js";

const router = express.Router();

function rangeToInterval(range) {
  const map = {
    week: "7 days",
    month: "30 days",
    quarter: "90 days",
    year: "365 days",
  };
  return map[range] || map.month;
}

// GET /api/analytics/overview?range=month
router.get("/overview", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role !== "admin" && req.user?.role !== "leader") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const interval = rangeToInterval(req.query.range);
    const cycle = await getActiveCycle();

    const [usersRes, attendanceRes, evalRes, deptRes, complaintsRes] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE role IN ('member', 'employee'))::int AS members
         FROM users`
      ),
      pool.query(
        `SELECT COUNT(DISTINCT employee_id)::int AS checked_in_today
         FROM attendance_events
         WHERE event_type = 'checkin'
           AND event_time::date = CURRENT_DATE`
      ),
      pool.query(
        `SELECT
           ROUND(AVG(percentage)::numeric, 1) AS avg_performance,
           COUNT(*) FILTER (WHERE percentage >= 90)::int AS excellent,
           COUNT(*) FILTER (WHERE percentage >= 75 AND percentage < 90)::int AS good,
           COUNT(*) FILTER (WHERE percentage >= 60 AND percentage < 75)::int AS satisfactory,
           COUNT(*) FILTER (WHERE percentage < 60)::int AS needs_improvement,
           COUNT(*)::int AS total_evals
         FROM evaluations_v2
         WHERE date >= NOW() - $1::interval
           ${cycle ? "AND (cycle_id = $2 OR cycle_id IS NULL)" : ""}`,
        cycle ? [interval, cycle.id] : [interval]
      ),
      pool.query(
        `SELECT
           COALESCE(department, 'Unassigned') AS name,
           COUNT(*)::int AS employees,
           ROUND(AVG(e.percentage)::numeric, 1) AS performance
         FROM users u
         LEFT JOIN evaluations_v2 e ON e.employee_id = u.id
           AND e.type = 'self'
           ${cycle ? "AND (e.cycle_id = $1 OR e.cycle_id IS NULL)" : ""}
         WHERE u.role IN ('member', 'employee')
         GROUP BY COALESCE(department, 'Unassigned')
         ORDER BY employees DESC`,
        cycle ? [cycle.id] : []
      ),
      pool.query(
        `SELECT COUNT(*) FILTER (WHERE status = 'pending')::int AS pending
         FROM complaints`
      ),
    ]);

    const totalEmployees = usersRes.rows[0]?.total || 0;
    const checkedInToday = attendanceRes.rows[0]?.checked_in_today || 0;
    const evalRow = evalRes.rows[0] || {};

    const departments = await Promise.all(
      deptRes.rows.map(async (d) => {
        const att = await pool.query(
          `SELECT
             COUNT(DISTINCT ae.employee_id)::int AS present
           FROM attendance_events ae
           JOIN users u ON u.id = ae.employee_id
           WHERE ae.event_type = 'checkin'
             AND ae.event_time >= NOW() - $1::interval
             AND COALESCE(u.department, 'Unassigned') = $2`,
          [interval, d.name]
        );
        const present = att.rows[0]?.present || 0;
        const attendancePct =
          d.employees > 0 ? Number(((present / d.employees) * 100).toFixed(1)) : 0;
        return {
          name: d.name,
          employees: d.employees,
          performance: Number(d.performance) || 0,
          attendance: attendancePct,
        };
      })
    );

    res.json({
      cycle,
      overview: {
        totalEmployees,
        activeToday: checkedInToday,
        averagePerformance: Number(evalRow.avg_performance) || 0,
        complianceRate:
          totalEmployees > 0
            ? Number(((checkedInToday / totalEmployees) * 100).toFixed(1))
            : 0,
        pendingComplaints: complaintsRes.rows[0]?.pending || 0,
      },
      performance: {
        excellent: evalRow.excellent || 0,
        good: evalRow.good || 0,
        satisfactory: evalRow.satisfactory || 0,
        needsImprovement: evalRow.needs_improvement || 0,
        total: evalRow.total_evals || 0,
      },
      attendance: {
        presentRate:
          totalEmployees > 0
            ? Number(((checkedInToday / totalEmployees) * 100).toFixed(1))
            : 0,
        checkedInToday,
      },
      departments,
    });
  } catch (err) {
    console.error("Analytics overview error:", err);
    res.status(500).json({ error: "Failed to load analytics" });
  }
});

export default router;
