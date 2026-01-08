/*
  User persistence model.

  This type represents the database shape of a user record, not a DTO
  and not a public API contract.

  Design constraints:
  - Field names intentionally match database column names
  - password_hash is included for internal use only and must never be returned to callers
  - Consumers are expected to explicitly omit sensitive fields at boundaries
*/

export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
}
