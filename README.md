# RoomieMatch

Find your perfect roommate, not just a room. Students create a profile,
swipe on compatible roommates, and chat once they match.

This is a working vertical slice of the larger RoomieMatch product spec:
auth, profile creation, photo upload, an explainable rule-based
compatibility engine, swiping, matching, and text chat — all wired
end-to-end. GPS/maps, phone OTP, AI features, and an admin dashboard are
intentionally out of scope for now; see "What's not built yet" below.

## Tech stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma ORM + PostgreSQL (via `@prisma/adapter-pg`)
- Auth: email/password, JWT session cookie (`jose`), `bcryptjs` hashing
- Validation: Zod
- Photo storage: Vercel Blob (`@vercel/blob`) — requires `BLOB_READ_WRITE_TOKEN`
  in production (enable Blob storage in the Vercel project's Storage tab)

## Getting started

1. Have PostgreSQL running locally and create a database.
2. Copy the environment template and fill in your own values:

   ```bash
   cp .env.example .env
   ```

3. Install dependencies and set up the database:

   ```bash
   npm install
   npx prisma migrate dev
   npm run db:seed   # optional: 15 demo student profiles, password "password123"
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## How matching works

`src/lib/matching.ts` computes a 0–100 compatibility score between two
profiles from weighted factors (budget, cleanliness, sleep schedule,
smoking, food, preferred area, languages, interests, study habits) and
returns a breakdown explaining each factor's contribution — shown in the
UI as "why you matched". Same-city and mutual gender-preference are hard
filters applied before scoring, not part of the score itself.

## Project structure

- `src/app/api/*` — REST-ish API routes (auth, profile, discover, swipe, matches, messages)
- `src/app/*` — pages (landing, auth, profile setup, discover/swipe, matches, chat)
- `src/lib/` — Prisma client, auth helpers, validation schemas, matching engine
- `prisma/schema.prisma` — database schema
- `prisma/seed.ts` — demo data

## What's not built yet

Cut from this slice to keep it demoable and correct rather than broad and
shallow — worth adding as the product grows:

- Real-time chat (currently polls every 3s instead of WebSockets)
- Phone OTP, Google OAuth (only email/password today)
- Government/Student ID verification
- AI features (bio improvement, fake profile detection, icebreakers)
- GPS radius search / Google Maps
- Admin dashboard
- Automated test suite
