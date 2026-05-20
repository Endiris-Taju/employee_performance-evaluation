// backend/routes/teams.js
import express from "express";
import pool from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET all teams
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, u.name as leader_name 
      FROM teams t 
      LEFT JOIN users u ON t.leader_id = u.id 
      ORDER BY t.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching teams:", err);
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

// POST new team
router.post("/", authMiddleware, async (req, res) => {
  const { name, description, leader_id } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO teams (name, description, leader_id) VALUES ($1, $2, $3) RETURNING *",
      [name, description, leader_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error adding team:", err);
    res.status(500).json({ error: "Failed to add team" });
  }
});

// PUT update team
router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, description, leader_id } = req.body;
  try {
    const result = await pool.query(
      "UPDATE teams SET name=$1, description=$2, leader_id=$3 WHERE id=$4 RETURNING *",
      [name, description, leader_id, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating team:", err);
    res.status(500).json({ error: "Failed to update team" });
  }
});

// DELETE team
router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM teams WHERE id = $1", [id]);
    res.json({ message: "Team deleted" });
  } catch (err) {
    console.error("Error deleting team:", err);
    res.status(500).json({ error: "Failed to delete team" });
  }
});

export default router;