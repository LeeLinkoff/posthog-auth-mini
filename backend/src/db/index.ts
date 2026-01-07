import { Pool } from "pg";

/**
 * Small helper to fail fast if a required env var is missing.
 * Helps with debugging if crash early versus mmisconfigured
 */
function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`${name} missing`);
  }
  return v;
}

const rawUrl = mustGetEnv("DATABASE_URL");

/*
 * Development only connection logging to help if cloud based db services goes south
 * Helps catch misconfigurations when changing environment variables, but intentionally avoids logging credentials.
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
 * Single shared connection pool
 */
export const pool = new Pool({
  connectionString: rawUrl
});

/*
 * Health check used at startup and /api/health
 */
export async function dbHealthCheck(): Promise<void> {
  await pool.query("select 1");
}

/*
 * Graceful shutdown hook
 */
export async function shutdownDb(): Promise<void> {
  await pool.end();
}
