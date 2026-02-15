## Database Policy & Migration Guide

This project enforces a strict database policy to prevent data loss and environment conflicts.

1.  **No Migrations:** `prisma migrate` commands are **BANNED**.
    *   Do not use `migrate dev`, `migrate deploy`, or `migrate reset`.
    *   Use **`pnpm exec prisma db push`** for schema changes.
2.  **Credentials:**
    *   Real `DATABASE_URL` must only exist in `.env.local` (locally) or Vercel Env Vars (production).
    *   The committed `.env` file must only contain a placeholder URL.
3.  **Validation:**
    *   Git hooks will block commits containing migration commands in source code or real DB credentials.
    *   Markdown files are exempt (warnings only).
