import "dotenv/config";

import express, { Request, Response } from "express";
import cors from "cors";
import { authRouter } from "./auth/auth.routes";
import { dbHealthCheck, shutdownDb } from "./db";

function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} missing`);
  return v;
}

mustGetEnv("DATABASE_URL");
mustGetEnv("JWT_SECRET");

const app = express();

app.use(cors());
app.use(express.json());

/*
 * Root informational route
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
 * API routes
 */
const api = express.Router();

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

api.use("/auth", authRouter);
app.use("/api", api);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    method: req.method,
    path: req.originalUrl
  });
});


const port = Number(process.env.PORT || 3000);

async function start(): Promise<void> {
  await dbHealthCheck();
  console.log("DB connection verified");

  const server = app.listen(port, "0.0.0.0", () => {
	console.log("");
	console.log("[server] Backend listening on port 3000");
	console.log("[server] API base: http://localhost:3000/api");
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


start().catch((e) => {
  console.error("Startup failed", e);
  process.exit(1);
});
