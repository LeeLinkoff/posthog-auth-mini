/*
  Authentication middleware enforcing request-level access control.

  Design constraints:
  - All authentication failures return a generic 401 to avoid leaking signal
  - JWT verification is treated as a hard gate, not a recoverable step
  - Only the minimal identity (userId) is attached to the request
*/

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extended request shape populated by authentication middleware only
export interface AuthRequest extends Request {
  userId?: string;
}

// Missing auth secrets are treated as fatal configuration errors
function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} missing`);
  return v;
}

// Secret is resolved once at startup to fail fast on misconfiguration
const JWT_SECRET = mustGetEnv("JWT_SECRET");

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  // Expect standard "Authorization: Bearer <token>" header format
  const header = req.headers.authorization;

  // All auth failures intentionally collapse to a generic 401 response
  if (!header) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const [, token] = header.split(" ");
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };

    // Attach minimal identity context for downstream handlers
    req.userId = payload.userId;

    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
