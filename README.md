# ICONIC Residences — Broker Registration

Public registration site for the "First in Place Reveal" broker preview event (13–15 October 2026, Al Salam Tower, Dubai Internet City). Brokers pick a time slot and register their group; an admin panel manages bookings and exports attendee lists.

See [`brokers-registration-tz.md`](./brokers-registration-tz.md) for the full spec.

## Stack

- Nuxt 3 (Vue 3, TypeScript), Nitro server routes for the API
- PostgreSQL + Drizzle ORM
- Zod validation (shared between client and server)
- Tailwind CSS

## Local development

1. Copy `.env.example` to `.env` and adjust if needed.
2. Start Postgres:
   ```bash
   docker compose up -d
   ```
3. Install dependencies and run migrations + seed:
   ```bash
   npm install
   npm run db:migrate
   npm run db:seed
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```

Public site: `http://localhost:3000/`. Admin panel: `http://localhost:3000/admin` (password from `ADMIN_PASSWORD` in `.env`).

## Other scripts

- `npm run typecheck` — Vue/TypeScript type checking
- `npm run db:generate` — generate a new Drizzle migration after schema changes
- `npm run db:studio` — browse the database with Drizzle Studio
- `npm run build` — production build
