import pool from "../db.js";

export async function createNotification({ userId, title, body, link }) {
  if (!userId || !title) return null;
  const result = await pool.query(
    `INSERT INTO notifications (user_id, title, body, link)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, title, body || null, link || null]
  );
  return result.rows[0];
}
