import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import employeeRoutes from "./routes/employees.js";
import teamRoutes from "./routes/teams.js";
import taskRoutes from "./routes/tasks.js";
import evaluationRoutes from "./routes/evaluations.js";
import complaintRoutes from "./routes/complaints.js";
import usersRoutes from "./routes/users.js";
import pool from "./db.js";
import attendanceRoutes from "./routes/attendance.js";
import { ensureSchema } from "./dbInit.js";
import efficiencyRoutes from "./routes/efficiency.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Log environment variables (without sensitive data)
console.log("Environment check:");
console.log("- NODE_ENV:", process.env.NODE_ENV);
console.log("- PORT:", PORT);
console.log("- JWT_SECRET:", process.env.JWT_SECRET ? "✅ Set" : "❌ Missing");
console.log("- DATABASE_URL:", process.env.DATABASE_URL ? "✅ Set" : "❌ Missing");

app.use(cors({
  origin: "*", // or "http://localhost:5173" if you want strict
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization"
}));

// increase body size limit
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Health check
app.get("/api/health", (req, res) =>
  res.json({ api: "online", time: new Date().toISOString() })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/evaluations", evaluationRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/efficiency", efficiencyRoutes);

// 404 fallback
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Wait for database connection before starting server
const startServer = async () => {
  try {
    await ensureSchema();
    console.log("✅ DB schema ensured");

    // Test database connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection verified');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to database:', err.message);
    console.log('⏳ Retrying in 5 seconds...');
    setTimeout(startServer, 5000);
  }
};

startServer();