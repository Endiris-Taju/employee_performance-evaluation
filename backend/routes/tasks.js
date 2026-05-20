// backend/routes/tasks.js
import express from "express";
import pool from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET all tasks
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tasks ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// POST new task (match schema: title, description, assigned_to, status, priority, due_date)
router.post("/", authMiddleware, async (req, res) => {
  const { title, description, assigned_to, status, priority, due_date } = req.body;
  try {
    if (!title || !assigned_to) {
      return res.status(400).json({ error: "title and assigned_to are required" });
    }
    const result = await pool.query(
      "INSERT INTO tasks (title, description, assigned_to, status, priority, due_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [title, description || null, assigned_to, status || "pending", priority || "medium", due_date || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error adding task:", err);
    res.status(500).json({ error: "Failed to add task" });
  }
});

// PUT update task
router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { title, description, assigned_to, status, priority, due_date } = req.body;
  try {
    const result = await pool.query(
      "UPDATE tasks SET title=$1, description=$2, assigned_to=$3, status=$4, priority=$5, due_date=$6 WHERE id=$7 RETURNING *",
      [title, description, assigned_to, status, priority, due_date, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating task:", err);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// DELETE task
router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("Error deleting task:", err);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

export default router;