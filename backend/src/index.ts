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

app.get("/health", async (_req: Request, res: Response) => {
  try {
    await dbHealthCheck();
    res.status(200).json({ status: "ok" });
  } catch (e: any) {
    res.status(503).json({ status: "db_down", error: e?.message ?? "unknown" });
  }
});

app.use("/auth", authRouter);

const port = Number(process.env.PORT || 3000);

async function start(): Promise<void> {
  await dbHealthCheck();
  console.log("DB connection verified");
  
  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`Backend listening on port ${port}`);
    console.log("Backend startup complete");
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
