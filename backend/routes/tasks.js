// backend/routes/tasks.js
import express from "express";
import pool from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getLeaderMemberIds, leaderManagesUser } from "../lib/teamScope.js";
import { createNotification } from "../lib/notifications.js";

const router = express.Router();

// Helper to check if role is staff (admin/leader)
function isStaff(req) {
  const role = req.user?.role;
  return role === "admin" || role === "leader";
}

// GET all tasks (Admins/leaders get all, employees get only their assigned tasks)
router.get("/", authMiddleware, async (req, res) => {
  try {
    if (req.user?.role === "admin") {
      const result = await pool.query("SELECT * FROM tasks ORDER BY id ASC");
      return res.json(result.rows);
    } else if (req.user?.role === "leader") {
      const memberIds = await getLeaderMemberIds(req.user.id);
      if (memberIds.length === 0) {
        return res.json([]);
      }
      const result = await pool.query(
        "SELECT * FROM tasks WHERE assigned_to = ANY($1::int[]) ORDER BY id ASC",
        [memberIds]
      );
      return res.json(result.rows);
    } else {
      const result = await pool.query("SELECT * FROM tasks WHERE assigned_to = $1 ORDER BY id ASC", [req.user.id]);
      return res.json(result.rows);
    }
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// POST new task (restricted to admin/leader)
router.post("/", authMiddleware, async (req, res) => {
  if (!isStaff(req)) {
    return res.status(403).json({ error: "Forbidden: Only admins and leaders can assign tasks" });
  }

  const { title, description, assigned_to, assignedTo, status, priority, due_date, dueDate } = req.body;
  const targetAssignedTo = assigned_to ?? assignedTo;
  const targetDueDate = due_date ?? dueDate;

  try {
    if (!title || !targetAssignedTo) {
      return res.status(400).json({ error: "title and assigned_to are required" });
    }

    if (req.user?.role === "leader") {
      const ok = await leaderManagesUser(req.user.id, targetAssignedTo);
      if (!ok) {
        return res.status(403).json({ error: "You can only assign tasks to your team members" });
      }
    }

    const result = await pool.query(
      "INSERT INTO tasks (title, description, assigned_to, status, priority, due_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [title, description || null, targetAssignedTo, status || "pending", priority || "medium", targetDueDate || null]
    );
    const task = result.rows[0];
    await createNotification({
      userId: targetAssignedTo,
      title: "New task assigned",
      body: title,
      link: "/employee",
    });
    res.status(201).json(task);
  } catch (err) {
    console.error("Error adding task:", err);
    res.status(500).json({ error: "Failed to add task" });
  }
});

// PUT update task (restricted to admin/leader, or assigned employee updating status)
router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { title, description, assigned_to, assignedTo, status, priority, due_date, dueDate } = req.body;
  const targetAssignedTo = assigned_to ?? assignedTo;
  const targetDueDate = due_date ?? dueDate;

  try {
    // Check if task exists first
    const checkTask = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
    if (checkTask.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    const task = checkTask.rows[0];

    // Authorization check: Staff can update everything.
    // Assigned employee can only update the status.
    if (!isStaff(req)) {
      if (Number(task.assigned_to) !== Number(req.user.id)) {
        return res.status(403).json({ error: "Forbidden: You are not assigned to this task" });
      }
      // Employee updating status
      const result = await pool.query(
        "UPDATE tasks SET status=$1 WHERE id=$2 RETURNING *",
        [status || task.status, id]
      );
      return res.json(result.rows[0]);
    }

    // Staff updating everything
    const result = await pool.query(
      "UPDATE tasks SET title=$1, description=$2, assigned_to=$3, status=$4, priority=$5, due_date=$6 WHERE id=$7 RETURNING *",
      [
        title ?? task.title,
        description ?? task.description,
        targetAssignedTo ?? task.assigned_to,
        status ?? task.status,
        priority ?? task.priority,
        targetDueDate ?? task.due_date,
        id
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating task:", err);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// DELETE task (restricted to admin/leader)
router.delete("/:id", authMiddleware, async (req, res) => {
  if (!isStaff(req)) {
    return res.status(403).json({ error: "Forbidden" });
  }

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