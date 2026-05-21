import express from "express";
import pool from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { logAudit } from "../lib/audit.js";

const router = express.Router();

async function attachMembers(teams) {
  if (!teams.length) return [];
  const teamIds = teams.map((t) => t.id);
  const membersRes = await pool.query(
    `SELECT tm.team_id, u.id, u.name, u.email, u.department, u.position, u.role
     FROM team_members tm
     JOIN users u ON u.id = tm.user_id
     WHERE tm.team_id = ANY($1::int[])`,
    [teamIds]
  );
  const byTeam = {};
  for (const row of membersRes.rows) {
    if (!byTeam[row.team_id]) byTeam[row.team_id] = [];
    byTeam[row.team_id].push({
      id: row.id,
      name: row.name,
      email: row.email,
      department: row.department,
      position: row.position,
      role: row.role,
    });
  }
  return teams.map((t) => ({
    ...t,
    member_ids: (byTeam[t.id] || []).map((m) => m.id),
    members: byTeam[t.id] || [],
  }));
}

// GET all teams (leaders see only their teams)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const role = req.user?.role;
    let result;

    if (role === "leader") {
      result = await pool.query(
        `SELECT t.*, u.name as leader_name
         FROM teams t
         LEFT JOIN users u ON t.leader_id = u.id
         WHERE t.leader_id = $1
         ORDER BY t.id DESC`,
        [req.user.id]
      );
    } else if (role === "admin") {
      result = await pool.query(
        `SELECT t.*, u.name as leader_name
         FROM teams t
         LEFT JOIN users u ON t.leader_id = u.id
         ORDER BY t.id DESC`
      );
    } else {
      // Members/employees: only teams they belong to
      result = await pool.query(
        `SELECT DISTINCT t.*, u.name as leader_name
         FROM teams t
         LEFT JOIN users u ON t.leader_id = u.id
         INNER JOIN team_members tm ON tm.team_id = t.id AND tm.user_id = $1
         ORDER BY t.name ASC`,
        [req.user.id]
      );
    }

    res.json(await attachMembers(result.rows));
  } catch (err) {
    console.error("Error fetching teams:", err);
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

// GET /teams/mine — teams the current user belongs to (member or leader)
router.get("/mine", authMiddleware, async (req, res) => {
  try {
    const uid = Number(req.user.id);
    const result = await pool.query(
      `SELECT DISTINCT t.*, u.name as leader_name
       FROM teams t
       LEFT JOIN users u ON t.leader_id = u.id
       LEFT JOIN team_members tm ON tm.team_id = t.id AND tm.user_id = $1
       WHERE t.leader_id = $1 OR tm.user_id = $1
       ORDER BY t.name ASC`,
      [uid]
    );
    res.json(await attachMembers(result.rows));
  } catch (err) {
    console.error("Error fetching my teams:", err);
    res.status(500).json({ error: "Failed to fetch your teams" });
  }
});

// PUT /teams/:id/members — set team roster (admin, or leader of that team)
router.put("/:id/members", authMiddleware, async (req, res) => {
  const teamId = Number(req.params.id);
  const { user_ids: userIds } = req.body;

  if (!Array.isArray(userIds)) {
    return res.status(400).json({ error: "user_ids array is required" });
  }

  try {
    const teamRes = await pool.query("SELECT * FROM teams WHERE id = $1", [teamId]);
    if (!teamRes.rows.length) {
      return res.status(404).json({ error: "Team not found" });
    }
    const team = teamRes.rows[0];

    if (req.user?.role === "leader" && team.leader_id !== Number(req.user.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (req.user?.role !== "admin" && req.user?.role !== "leader") {
      return res.status(403).json({ error: "Forbidden" });
    }

    await pool.query("DELETE FROM team_members WHERE team_id = $1", [teamId]);

    const uniqueIds = [...new Set(userIds.map(Number).filter(Boolean))];
    for (const uid of uniqueIds) {
      await pool.query(
        `INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [teamId, uid]
      );
    }

    const updated = await pool.query(
      `SELECT t.*, u.name as leader_name
       FROM teams t
       LEFT JOIN users u ON t.leader_id = u.id
       WHERE t.id = $1`,
      [teamId]
    );
    const [withMembers] = await attachMembers(updated.rows);

    await logAudit(req, {
      action: "team_members_update",
      entityType: "team",
      entityId: teamId,
      details: { member_count: uniqueIds.length },
    });

    res.json(withMembers);
  } catch (err) {
    console.error("Error updating team members:", err);
    res.status(500).json({ error: "Failed to update team members" });
  }
});

// POST new team
router.post("/", authMiddleware, async (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Only admins can create teams" });
  }

  const { name, description, leader_id, leaderId, member_ids, memberIds } = req.body;
  const targetLeaderId = leader_id ?? leaderId;

  try {
    const result = await pool.query(
      "INSERT INTO teams (name, description, leader_id) VALUES ($1, $2, $3) RETURNING *",
      [name, description, targetLeaderId]
    );
    const team = result.rows[0];
    const members = member_ids ?? memberIds ?? [];
    if (Array.isArray(members) && members.length) {
      for (const uid of members) {
        await pool.query(
          `INSERT INTO team_members (team_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [team.id, uid]
        );
      }
    }
    const [withMembers] = await attachMembers([team]);
    res.status(201).json(withMembers);
  } catch (err) {
    console.error("Error adding team:", err);
    res.status(500).json({ error: "Failed to add team" });
  }
});

// PUT update team
router.put("/:id", authMiddleware, async (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Only admins can edit teams" });
  }

  const { id } = req.params;
  const { name, description, leader_id, leaderId } = req.body;
  const targetLeaderId = leader_id ?? leaderId;

  try {
    const result = await pool.query(
      "UPDATE teams SET name=$1, description=$2, leader_id=$3 WHERE id=$4 RETURNING *",
      [name, description, targetLeaderId, id]
    );
    const [withMembers] = await attachMembers(result.rows);
    res.json(withMembers);
  } catch (err) {
    console.error("Error updating team:", err);
    res.status(500).json({ error: "Failed to update team" });
  }
});

// DELETE team
router.delete("/:id", authMiddleware, async (req, res) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Only admins can delete teams" });
  }

  try {
    await pool.query("DELETE FROM teams WHERE id = $1", [req.params.id]);
    res.json({ message: "Team deleted" });
  } catch (err) {
    console.error("Error deleting team:", err);
    res.status(500).json({ error: "Failed to delete team" });
  }
});

export default router;
