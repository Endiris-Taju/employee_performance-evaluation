import express from "express";
import pool from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getActiveCycle } from "./cycles.js";
import { getLeaderMemberIds } from "../lib/teamScope.js";
import { createNotification } from "../lib/notifications.js";
import { logAudit } from "../lib/audit.js";

const router = express.Router();

// Helper to check if role is staff (admin/leader)
function isStaff(req) {
  const role = req.user?.role;
  return role === "admin" || role === "leader";
}

/**
 * @route   GET /api/evaluations
 * @desc    Get all evaluations (admin/leader use)
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    if (!isStaff(req)) {
      return res.status(403).json({ error: "Forbidden: Only leaders and admins can view all evaluations" });
    }
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
      employeeId,
      evaluator_id,
      evaluatorId,
      type,
      scores,
      total_score,
      totalScore,
      max_score,
      maxScore,
      percentage,
      date
    } = req.body;

    const targetEmployeeId = employee_id ?? employeeId;
    const targetEvaluatorId = evaluator_id ?? evaluatorId ?? req.user.id;
    const targetTotalScore = total_score ?? totalScore;
    const targetMaxScore = max_score ?? maxScore;

    if (!targetEmployeeId || !type || targetTotalScore == null || targetMaxScore == null) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Role-based restrictions on evaluation submissions
    const empIdNum = Number(targetEmployeeId);
    const evaluatorNum = Number(targetEvaluatorId);

    if (type === "self" && empIdNum !== Number(req.user.id)) {
      return res.status(403).json({ error: "Forbidden: You can only submit self evaluations for yourself" });
    }
    if (type === "peer") {
      if (empIdNum === Number(req.user.id)) {
        return res.status(400).json({ error: "You cannot submit a peer evaluation for yourself" });
      }
      if (evaluatorNum !== Number(req.user.id)) {
        return res.status(403).json({ error: "Forbidden: Peer evaluator must be the logged-in user" });
      }
    }
    if ((type === "behavioral" || type === "workrate" || type === "performance") && !isStaff(req)) {
      return res.status(403).json({ error: "Forbidden: Only team leaders and admins can submit manager/workrate/performance evaluations" });
    }

    const cycle = await getActiveCycle();
    const cycleId = cycle?.id ?? null;

    if (cycleId) {
      if (type === "peer") {
        const dup = await pool.query(
          `SELECT id FROM evaluations_v2
           WHERE cycle_id = $1 AND employee_id = $2 AND evaluator_id = $3 AND type = 'peer'`,
          [cycleId, empIdNum, Number(req.user.id)]
        );
        if (dup.rows.length) {
          return res.status(409).json({
            error: "You already submitted a peer evaluation for this colleague in the current cycle",
          });
        }
      } else {
        const dup = await pool.query(
          `SELECT id FROM evaluations_v2
           WHERE cycle_id = $1 AND employee_id = $2 AND type = $3`,
          [cycleId, empIdNum, type]
        );
        if (dup.rows.length) {
          return res.status(409).json({
            error: `A ${type} evaluation already exists for this employee in the current cycle`,
          });
        }
      }
    }

    const insertQuery = `
      INSERT INTO evaluations_v2
        (employee_id, evaluator_id, type, scores, total_score, max_score, percentage, date, cycle_id)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;

    const values = [
      empIdNum,
      type === "peer" ? Number(req.user.id) : evaluatorNum,
      type,
      scores ? JSON.stringify(scores) : null,
      targetTotalScore,
      targetMaxScore,
      percentage,
      date || new Date().toISOString(),
      cycleId,
    ];

    const result = await pool.query(insertQuery, values);
    const saved = result.rows[0];

    if (type !== "self" && empIdNum !== Number(req.user.id)) {
      await createNotification({
        userId: empIdNum,
        title: `New ${type} evaluation submitted`,
        body: `Your ${type} evaluation was recorded.`,
        link: "/efficiency",
      });
    }

    await logAudit(req, {
      action: "evaluation_create",
      entityType: "evaluation",
      entityId: saved.id,
      details: { type, employee_id: empIdNum },
    });

    res.status(201).json(saved);
  } catch (err) {
    console.error("Error saving evaluation:", err);
    res.status(500).json({ error: "Failed to save evaluation" });
  }
});

/**
 * @route   GET /api/evaluations/completion
 * @desc    Evaluation completion status for active cycle
 */
router.get("/completion", authMiddleware, async (req, res) => {
  try {
    const cycle = await getActiveCycle();
    if (!cycle) {
      return res.json({
        cycle: null,
        summary: { total: 0, selfDone: 0, fullyComplete: 0 },
        employees: [],
        myStatus: null,
      });
    }

    let usersSql = `
      SELECT id, name, department, role
      FROM users
      WHERE role IN ('member', 'employee')
    `;
    const userParams = [];

    if (req.user?.role === "leader") {
      const memberIds = await getLeaderMemberIds(req.user.id);
      if (memberIds.length > 0) {
        usersSql += ` AND id = ANY($1::int[])`;
        userParams.push(memberIds);
      } else {
        const deptRes = await pool.query(
          "SELECT department FROM users WHERE id = $1",
          [req.user.id]
        );
        const dept = deptRes.rows[0]?.department;
        if (dept) {
          usersSql += ` AND department = $1`;
          userParams.push(dept);
        } else {
          return res.json({
            cycle,
            summary: { total: 0, selfDone: 0, fullyComplete: 0 },
            employees: [],
            myStatus: null,
          });
        }
      }
    } else if (!isStaff(req)) {
      usersSql += ` AND id = $1`;
      userParams.push(req.user.id);
    }
    usersSql += ` ORDER BY name ASC`;

    const usersRes = await pool.query(usersSql, userParams);
    const evalsRes = await pool.query(
      `SELECT employee_id, evaluator_id, type
       FROM evaluations_v2
       WHERE cycle_id = $1`,
      [cycle.id]
    );

    const byEmployee = {};
    for (const row of evalsRes.rows) {
      const eid = row.employee_id;
      if (!byEmployee[eid]) {
        byEmployee[eid] = { self: false, peerReceived: false, leader: false, admin: false };
      }
      const bucket = byEmployee[eid];
      if (row.type === "self") bucket.self = true;
      if (row.type === "peer") bucket.peerReceived = true;
      if (row.type === "behavioral") bucket.leader = true;
      if (["performance", "workrate"].includes(row.type)) bucket.admin = true;
    }

    const employees = usersRes.rows.map((u) => {
      const flags = byEmployee[u.id] || {
        self: false,
        peerReceived: false,
        leader: false,
        admin: false,
      };
      const complete = flags.self && flags.peerReceived && flags.leader && flags.admin;
      return {
        id: u.id,
        name: u.name,
        department: u.department,
        ...flags,
        complete,
      };
    });

    const summary = {
      total: employees.length,
      selfDone: employees.filter((e) => e.self).length,
      fullyComplete: employees.filter((e) => e.complete).length,
    };

    let myStatus = null;
    if (!isStaff(req)) {
      const uid = Number(req.user.id);
      const flags = byEmployee[uid] || {
        self: false,
        peerReceived: false,
        leader: false,
        admin: false,
      };
      const peerGiven = evalsRes.rows.some(
        (r) => r.evaluator_id === uid && r.type === "peer"
      );
      myStatus = {
        id: uid,
        ...flags,
        peerGiven,
        complete: flags.self && flags.peerReceived && flags.leader && flags.admin,
      };
    }

    res.json({ cycle, summary, employees, myStatus });
  } catch (err) {
    console.error("Completion error:", err);
    res.status(500).json({ error: "Failed to fetch completion status" });
  }
});

/**
 * @route   GET /api/evaluations/employee/:id
 * @desc    Get all evaluations for a specific employee
 */
router.get("/employee/:id", authMiddleware, async (req, res) => {
  try {
    const targetId = Number(req.params.id);
    if (!isStaff(req) && targetId !== Number(req.user.id)) {
      return res.status(403).json({ error: "Forbidden: You can only view your own evaluations" });
    }

    const result = await pool.query(
      "SELECT * FROM evaluations_v2 WHERE employee_id = $1 ORDER BY date DESC",
      [targetId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching employee evaluations:", err);
    res.status(500).json({ error: "Failed to fetch employee evaluations" });
  }
});

/**
 * @route   PUT /api/evaluations/:id
 * @desc    Update an evaluation (restricted to staff)
 */
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    if (!isStaff(req)) {
      return res.status(403).json({ error: "Forbidden: Only staff can edit evaluations" });
    }

    const { id } = req.params;
    const {
      employee_id,
      employeeId,
      evaluator_id,
      evaluatorId,
      type,
      scores,
      total_score,
      totalScore,
      max_score,
      maxScore,
      percentage,
      date
    } = req.body;

    const targetEmployeeId = employee_id ?? employeeId;
    const targetEvaluatorId = evaluator_id ?? evaluatorId;
    const targetTotalScore = total_score ?? totalScore;
    const targetMaxScore = max_score ?? maxScore;

    const updateQuery = `
      UPDATE evaluations_v2
      SET employee_id=$1, evaluator_id=$2, type=$3, scores=$4, total_score=$5, max_score=$6, percentage=$7, date=$8
      WHERE id=$9
      RETURNING *;
    `;

    const values = [
      targetEmployeeId,
      targetEvaluatorId,
      type,
      scores ? JSON.stringify(scores) : null,
      targetTotalScore,
      targetMaxScore,
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
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Only admins can delete evaluations" });
    }

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