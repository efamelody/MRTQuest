# MRTQuest

> Discover hidden gems, heritage sites, and local culture along Kuala Lumpur's MRT lines.

MRTQuest is a mobile-first web application for urban explorers. Riders can browse attractions near each MRT station, check in at sites, earn badges, track their journey in a personal passport, and suggest new places to visit — all without leaving their browser.

**Scope:** Kajang Line · Putrajaya Line · 16 active stations · 24 attractions

---

## Features

| Page | What it does |
|---|---|
| **Home** (`/`) | Landing page with app tagline and live stats (sites, stations, lines) |
| **Explore** (`/explore`) | Browse stations by MRT line via an interactive map; open suggestion form |
| **Station** (`/station/[id]`) | View all attractions at a specific station with check-in and directions |
| **Badge** (`/badge`) | See all available badges, track earned vs locked, filter by category |
| **Passport** (`/passport`) | Personal summary of visited sites, reviews left, and badges earned |
| **Suggestions API** (`POST /api/suggestions`) | Submit a new attraction suggestion for review |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15+ (App Router) |
| UI Library | React 19 |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 (CSS-configured, no `tailwind.config.js`) |
| Icons | Lucide React |
| Database & Auth | Supabase (Postgres + `@supabase/ssr`) |
| Package Manager | pnpm |

---

## Database Schema

| Table | Purpose | Key Columns |
|---|---|---|
| `stations` | MRT stations on both lines | `name`, `line`, `sequence_order`, `active` |
| `attractions` | Points of interest near a station | `station_id`, `name`, `category`, `google_map`, `image_url` |
| `profiles` | User profiles extending `auth.users` | `username`, `avatar_url` |
| `reviews` | Star ratings and comments on attractions | `user_id`, `site_id`, `rating` (1–5), `comment` |
| `visits` | Check-in log per user per attraction | `user_id`, `site_id`, `visited_at` |
| `quizzes` | Quiz questions linked to an attraction | `site_id`, `question`, `correct_answer` |
| `user_quiz_attempts` | Records of quiz answers per user | `user_id`, `quiz_id`, `is_correct` |
| `badges` | Badge definitions and unlock criteria | `criteria_type`, `criteria_value`, `criter_target`, `station_id` |
| `user_badges` | Badges earned by each user | `user_id`, `badge_id`, `earned_at` |

See [`docs/badge-logic.md`](docs/badge-logic.md) for badge criteria details and [`docs/dbschema.md`](docs/dbschema.md) for the full ER diagram.

---

## Project Structure

```
app/
  layout.tsx                  # Root layout: Header + TabBar + page slot
  page.tsx                    # Home / landing page
  globals.css                 # Tailwind v4 CSS config + global styles
  badge/page.tsx              # Badge hub
  explore/page.tsx            # MRT line explorer
  passport/page.tsx           # User journey tracker
  station/[stationId]/page.tsx  # Station detail (SSR)
  api/suggestions/route.ts    # POST endpoint for attraction suggestions

src/
  components/
    AttractionCard.tsx        # Card UI for a single attraction
    BadgeCard.tsx             # Badge tile (earned / locked states)
    BadgeModal.tsx            # Badge detail overlay
    Header.tsx                # Sticky top navigation bar
    HeritageSite.tsx          # (Legacy — see AttractionCard)
    MRTMap.tsx                # Visual MRT line with clickable stations
    RatingModal.tsx           # Star rating + comment form modal
    StationSitesList.tsx      # Renders list of AttractionCards for a station
    SuggestionForm.tsx        # Modal form to submit new attraction suggestion
    TabBar.tsx                # Fixed bottom navigation (Explore / Badge / Passport)
    Tooltip.tsx               # Hover tooltip wrapper
  utils/
    supabase/
      client.ts               # Browser-side Supabase client (use in 'use client' components)
      server.ts               # Server-side Supabase client (use in Server Components + API routes)
      middleware.ts           # Next.js middleware stub (prepared for auth redirects)

docs/
  badge-logic.md              # Badge criteria types and award logic
  dbschema.md                 # ER diagram for all tables

supabase/
  schema.sql                  # Full Postgres schema reference (read-only context)
```

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase — public (safe to expose to the browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# Supabase — secret (server-side only, never expose to the browser)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> `SUPABASE_SERVICE_ROLE_KEY` is only needed for privileged server-side operations (e.g., admin data seeding). Do **not** reference it in client components or expose it in browser bundles.

---

## Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/MRTQuest.git
cd MRTQuest

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env.local   # then fill in your Supabase credentials

# 4. Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start Next.js development server with hot reload |
| `pnpm build` | Create a production build |
| `pnpm start` | Serve the production build locally |
| `pnpm lint` | Run ESLint across all source files |

---

## Architecture Notes

### Client vs Server Components
- **Server Components** (default, no directive): used for data-fetching pages like `station/[stationId]/page.tsx`. Runs on the server, never ships JS to the browser.
- **Client Components** (`'use client'`): used only when interactivity is needed — `useState`, `useEffect`, event handlers. Examples: `explore/page.tsx`, `badge/page.tsx`, `TabBar.tsx`, `SuggestionForm.tsx`.

### Supabase Data Flow
1. Pages fetch data server-side using `createClient()` from `src/utils/supabase/server.ts`.
2. Client components fetch using `createClient()` from `src/utils/supabase/client.ts`.
3. Data flows down as props — leaf components never fetch independently.
4. Parallel independent queries use `Promise.all([...])`.

### Badge System
Badges are defined in the `badges` table with a `criteria_type` field:

| `criteria_type` | Unlock condition |
|---|---|
| `visit_count` | User visits N attractions (with optional category/line filter) |
| `line_master` | User visits all stations on a given MRT line |
| `quiz_master` | User answers all quizzes for a site correctly |
| `first_review` | User submits their first review |
| `frequent_traveler` | User accumulates 20+ visits overall |

See [`docs/badge-logic.md`](docs/badge-logic.md) for the full specification and recommended SQL query patterns.

---

## Roadmap

- [ ] Wire up Supabase Auth (email/password or magic link)
- [ ] Connect check-in button to `visits` table insert
- [ ] Integrate `RatingModal` with `reviews` table
- [ ] Implement badge awarding logic (evaluate criteria on check-in)
- [ ] Replace hardcoded passport stats with real user data
- [ ] Add quiz flow per attraction
- [ ] Moderate and approve attraction suggestions (`is_verified` flag)

---

## Local development

From the `mrtquest` folder, use:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase setup

### Required environment variables
Create a `.env.local` file in `mrtquest` with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> Do not commit `.env.local`.

### Current Supabase status
- Supabase is chosen for the database backend.
- The project is prepared to use Supabase from the serverless Next.js app.
- Auth and data queries still need final wiring.

## Project files to review
- `package.json` — current dependency and script configuration.
- `src/utils/supabase/middleware.ts` — currently a placeholder Next.js middleware file.
- `src/app/page.tsx` — app entry page for the home screen.

## Next steps
1. Finalize Tailwind CSS configuration.
2. Create Supabase tables: `stations`, `attractions`, `users`, etc.
3. Build Supabase client helpers (`src/lib/supabase-client.ts` / `src/lib/supabase-server.ts`).
4. Add API routes for stations and attractions.
5. Render the MRT map and station discovery UI.

## Notes
- The app is intended to remain serverless; Supabase handles persistence.
- Use `pnpm` for installs and commands.
- The app will be deployed on a serverless host such as Vercel.
