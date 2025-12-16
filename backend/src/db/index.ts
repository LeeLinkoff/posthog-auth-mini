import { Pool } from "pg";

function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} missing`);
  return v;
}

const rawUrl = mustGetEnv("DATABASE_URL");

// Safe, gated logging for dev only
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

export const pool = new Pool({
  connectionString: rawUrl,
  ssl: { rejectUnauthorized: false }
});

export async function dbHealthCheck(): Promise<void> {
  await pool.query("select 1");
}

export async function shutdownDb(): Promise<void> {
  await pool.end();
}
