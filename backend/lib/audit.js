import pool from "../db.js";

export async function logAudit(req, { action, entityType, entityId, details }) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.user?.id ?? null,
        action,
        entityType || null,
        entityId != null ? String(entityId) : null,
        details ? JSON.stringify(details) : null,
        req.ip || req.headers["x-forwarded-for"] || null,
      ]
    );
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
}
