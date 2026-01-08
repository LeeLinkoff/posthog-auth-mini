/*
  Application entry point.

  This file is responsible for:
  - Process configuration and startup validation
  - HTTP server initialization
  - Route wiring and global middleware
  - Graceful shutdown coordination

  Design constraints:
  - Fail fast on missing critical configuration
  - Prefer explicit behavior over implicit framework defaults
  - Avoid leaking internal errors at process boundaries
*/

import "dotenv/config";

import express, { Request, Response } from "express";
import cors from "cors";
import { authRouter } from "./auth/auth.routes";
import { dbHealthCheck, shutdownDb } from "./db";
import { requireAuth, AuthRequest } from "./middleware/auth.middleware";


/*
 * Small helper to fail fast if required environment variables are missing.
 * Prevents partial startup and delayed runtime failures.
 */
function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} missing`);
  return v;
}

// Validate critical configuration at startup
mustGetEnv("DATABASE_URL");
mustGetEnv("JWT_SECRET");

const app = express();

// Global middleware applied once for all routes
app.use(cors());
app.use(express.json());


/*
 * Root informational route.
 * Exists to make service presence and API shape discoverable
 * without requiring authentication.
 */
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "Backend API is running",
    apiBase: "/api",
    availableEndpoints: {
      health: "GET /api/health",
      auth: "POST /api/auth/*"
    }
  });
});


/*
 * API routes are grouped under a common router
 * to keep transport concerns separate from startup wiring.
 */
const api = express.Router();

/*
 * Health endpoint used by:
 * - startup checks
 * - container orchestration
 * - external monitors
 *
 * Intentionally masks low-level database errors.
 */
api.get("/health", async (_req: Request, res: Response) => {
  try {
    await dbHealthCheck();
    res.status(200).json({ status: "ok" });
  } catch (e: any) {
    res.status(503).json({
      status: "db_down",
      error: e?.message ?? "unknown"
    });
  }
});

/*
 * Demo endpoint to prove authentication middleware reuse
 * outside of the /auth namespace.
 */
api.get("/session", requireAuth, (req: AuthRequest, res) => {
  res.json({
    authenticated: true,
    user: {
      id: req.userId
    }
  });
});

/*
 * Why this endpoint exists:
 *
 * Analytics ingestion often succeeds even when data quality is poor.
 * Events can be duplicated, delayed, or ambiguous, yet nothing crashes
 * and metrics still look reasonable.
 *
 * This endpoint makes those failure modes observable so they can be
 * reasoned about explicitly instead of hidden behind retries,
 * batching, or SDK abstractions.
 */
api.post("/events", async (req: Request, res: Response) => {
  const {
    event,
    properties,
    userId,
    forceDelayMs,
    forceDuplicate
  } = req.body ?? {};

  // Basic shape check only, no schema enforcement by design
  if (!event || typeof event !== "string") {
    return res.status(400).json({ error: "event name required" });
  }

  const record = {
    event,
    userId: userId ?? null,
    properties: properties ?? {},
    receivedAt: new Date().toISOString()
  };

  const processEvent = async () => {
    // Intentionally no deduplication or idempotency
    console.log("[analytics] event received", record);

    if (forceDuplicate === true) {
      console.log("[analytics] event received (duplicate)", record);
    }
  };

  if (typeof forceDelayMs === "number" && forceDelayMs > 0) {
    setTimeout(async () => {
      await processEvent();
    }, forceDelayMs);
  } else {
    await processEvent();
  }

  // Always succeed — even if data quality is questionable
  res.status(202).json({
    accepted: true,
    warning:
      forceDuplicate || forceDelayMs
        ? "event accepted with known data quality risks"
        : undefined
  });
});

// Auth routes are mounted under /api/auth
api.use("/auth", authRouter);

// Attach API router under a single base path
app.use("/api", api);


/*
 * Catch-all handler for unknown routes.
 * Intentionally returns minimal information.
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    method: req.method,
    path: req.originalUrl
  });
});


const port = Number(process.env.PORT || 3000);

/*
 * Application startup and shutdown coordination.
 */
async function start(): Promise<void> {
  if (process.env.SKIP_DB_CHECK !== "true") {
    await dbHealthCheck();
    console.log("DB connection verified");
  } else {
    console.log("DB check skipped (dev mode)");
  }

  const server = app.listen(port, "0.0.0.0", () => {
    console.log("");
    console.log("[server] Backend listening on port " + port);
    console.log("[server] API base: http://localhost:" + port + "/api");
    console.log("");
  });

  const shutdown = async (signal: string) => {
    console.log(`Shutting down on ${signal}`);
    server.close(async () => {
      try {
        await shutdownDb();
      } catch (e) {
        console.error("DB shutdown error", e);
      } finally {
        process.exit(0);
      }
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}


/*
 * Intentionally suppress internal error details at startup.
 * Low-level stack traces are not actionable here and may leak internals.
 */
start().catch(() => {
  console.error(
    "Startup failed: database connection could not be established. " +
    "Check DATABASE_URL and database credentials."
  );
  process.exit(1);
});