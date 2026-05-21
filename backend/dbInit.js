import pool from "./db.js";
import bcrypt from "bcrypt";

export async function ensureSchema() {
  // ---- Users ----
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'employee',
      name VARCHAR(255) NOT NULL,
      department VARCHAR(255),
      rank VARCHAR(255),
      employee_id VARCHAR(255),
      phone VARCHAR(50),
      position VARCHAR(255),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // ---- Teams ----
  await pool.query(`
    CREATE TABLE IF NOT EXISTS teams (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      leader_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // ---- Tasks ----
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      assigned_to INTEGER REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      priority VARCHAR(50) NOT NULL DEFAULT 'medium',
      due_date DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // ---- Complaints ----
  await pool.query(`
    CREATE TABLE IF NOT EXISTS complaints (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS evaluation_cycles (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'closed')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE evaluations_v2
    ADD COLUMN IF NOT EXISTS cycle_id INTEGER REFERENCES evaluation_cycles(id) ON DELETE SET NULL;
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_evaluations_v2_cycle
      ON evaluations_v2(cycle_id, employee_id, type);
  `);

  const cycleCheck = await pool.query("SELECT id FROM evaluation_cycles LIMIT 1");
  if (cycleCheck.rows.length === 0) {
    const year = new Date().getFullYear();
    await pool.query(
      `INSERT INTO evaluation_cycles (name, start_date, end_date, status)
       VALUES ($1, $2, $3, 'open')`,
      [
        `FY ${year} Evaluation`,
        `${year}-01-01`,
        `${year}-12-31`,
      ]
    );
    console.log(`✅ Default evaluation cycle seeded for ${year}`);
  }

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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS team_members (
      team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (team_id, user_id)
    );
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS profile_photo_data_url TEXT NULL;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      body TEXT NULL,
      link VARCHAR(512) NULL,
      read_at TIMESTAMPTZ NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
      ON notifications(user_id, read_at, created_at DESC);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGSERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50) NULL,
      entity_id VARCHAR(64) NULL,
      details JSONB NULL,
      ip_address VARCHAR(64) NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created
      ON audit_logs(created_at DESC);
  `);

  // ---- Seeding ----
  const userCheck = await pool.query("SELECT id FROM users LIMIT 1");
  if (userCheck.rows.length === 0) {
    console.log("Seeding default admin user...");
    const hashedPassword = await bcrypt.hash("password123", 10);
    await pool.query(
      `INSERT INTO users (email, password_hash, role, name, department, rank, employee_id, phone, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        "admin@example.com",
        hashedPassword,
        "admin",
        "Administrator",
        "Management",
        "Senior",
        "ADM001",
        "555-0100",
        "System Admin"
      ]
    );
    console.log("✅ Default admin seeded: admin@example.com / password123");
  }
}


