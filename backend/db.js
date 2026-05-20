import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
  connectionTimeoutMillis: 10000,
});

pool.connect()
  .then((client) => {
    console.log("✅ PostgreSQL Connected");
    client.release();
  })
  .catch((err) => {
    console.error("❌ PostgreSQL Connection Error");
    console.error(err.message);
  });

export default pool;