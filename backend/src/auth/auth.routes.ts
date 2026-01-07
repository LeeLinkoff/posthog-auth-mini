import { Router } from "express";
import { registerUser, authenticateUser } from "./auth.service";
import { requireAuth, AuthRequest } from "../middleware/auth.middleware";
import { pool } from "../db";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const user = await registerUser(email, password);
    res.status(201).json({ id: user.id, email: user.email });
  } catch {
    res.status(400).json({ error: "User already exists" });
  }
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const token = await authenticateUser(email, password);
    res.json({ token });
  } catch {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

authRouter.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const result = await pool.query(
    `select id, email, created_at from users where id = $1`,
    [req.userId]
  );

  if (!result.rows[0]) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(result.rows[0]);
});
