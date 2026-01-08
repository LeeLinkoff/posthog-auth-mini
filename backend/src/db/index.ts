import { Pool } from "pg";

/*
 * Small helper to fail fast if a required environment variable is missing.
 * Makes misconfiguration obvious instead of failing later.
 */
function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`${name} missing`);
  }
  return v;
}

// Single connection string used intentionally to keep configuration explicit
const rawUrl = mustGetEnv("DATABASE_URL");

/*
 * Development-only connection logging to help when cloud-based DB services go south.
 * Helps catch misconfigurations when changing environment variables,
 * but intentionally avoids logging credentials.
 */
if (process.env.NODE_ENV !== "production") {
  try {
    const u = new URL(rawUrl);
    console.log("DB CONNECTING TO:", {
      host: u.host,
      database: u.pathname.replace("/", "")
    });
  } catch {
    console.log("DB CONNECTING TO: <unparseable DATABASE_URL>");
  }
}

/*
 * Single shared connection pool.
 * This module is the sole owner of database connections.
 */
export const pool = new Pool({
  connectionString: rawUrl
});

/*
 * Health check used at startup and /api/health
 * Intentionally masks low-level driver errors.
 */
export async function dbHealthCheck(): Promise<void> {
  try {
    await pool.query("select 1");
  } catch {
    throw new Error("Database connection failed");
  }
}

/*
 * Graceful shutdown hook.
 * Called explicitly by the application during process termination.
 */
export async function shutdownDb(): Promise<void> {
  await pool.end();
}
