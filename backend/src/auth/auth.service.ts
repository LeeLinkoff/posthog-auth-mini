import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db";
import { User } from "../types/user";

const SALT_ROUNDS = 12;

function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} missing`);
  return v;
}

/*
  Goals
  - No leaking whether email exists (login errors are generic)
  - Signup should be deterministic (unique email handled cleanly)
  - Never return password hashes to callers
  - JWT payload minimal
*/

export async function registerUser(email: string, password: string): Promise<Omit<User, "password_hash">> {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    const result = await pool.query<User>(
      `
      insert into users (email, password_hash)
      values ($1, $2)
      returning id, email, created_at
      `,
      [email, passwordHash]
    );

    return result.rows[0] as Omit<User, "password_hash">;
  } catch (e: any) {
    // Unique violation on users.email
    if (e?.code === "23505") {
      // For signup, it is fine to tell them it already exists.
      // If you want "no leak" here too, change this to a generic error.
      throw new Error("Email already registered");
    }
    throw e;
  }
}

export async function authenticateUser(email: string, password: string): Promise<string> {
  const result = await pool.query<User>(
    `
    select id, email, password_hash, created_at
    from users
    where email = $1
    limit 1
    `,
    [email]
  );

  const user = result.rows[0];
  if (!user) {
    throw new Error("Invalid credentials");
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    { userId: user.id },
    mustGetEnv("JWT_SECRET"),
    { expiresIn: "7d" }
  );

  return token;
}
