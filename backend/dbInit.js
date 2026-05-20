import pool from "./db.js";

export async function ensureSchema() {
  // ---- Evaluations (v2) ----
  // Some environments already have a legacy `evaluations` table owned by another role.
  // To avoid ALTER permission issues, we write to a dedicated v2 table owned by the app user.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS evaluations_v2 (
      id BIGSERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL,
      evaluator_id INTEGER NULL,
      type TEXT NOT NULL,
      scores JSONB NULL,
      tasks JSONB NULL,
      criteria JSONB NULL,
      total_score NUMERIC(10,2) NOT NULL,
      max_score NUMERIC(10,2) NOT NULL,
      percentage NUMERIC(6,2) NULL,
      date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_evaluations_v2_employee_date
      ON evaluations_v2(employee_id, date DESC);
  `);

  // Attendance events: stores optional camera snapshot at check-in/out time.
  // Note: we store the image as a Data URL (base64) for simplicity.
  // For production, prefer object storage + a URL in DB.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS attendance_events (
      id BIGSERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL,
      event_type TEXT NOT NULL CHECK (event_type IN ('checkin', 'checkout')),
      event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      photo_data_url TEXT NULL,
      device_info JSONB NULL,
      created_by INTEGER NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT fk_attendance_employee
        FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_attendance_events_employee_time
      ON attendance_events(employee_id, event_time DESC);
  `);
}

