# Architecture

## Overview

MRTQuest is a Next.js 15 App Router application backed by Supabase (Postgres). The app is serverless and mobile-first. There is no custom backend — all data access goes directly through the Supabase client libraries.

---

## Supabase Table Relationships

```
auth.users
    │
    └─── profiles (1:1)
              │
              ├─── visits (1:many) ──────────────────┐
              ├─── reviews (1:many) ─────────────────┤
              ├─── user_quiz_attempts (1:many) ───────┤
              └─── user_badges (1:many)               │
                                                      │
stations (1:many)                                     │
    │                                                 │
    └─── attractions (1:many) ◄────────────────────── ┘
              │
              ├─── reviews (1:many)
              ├─── visits (1:many)
              └─── quizzes (1:many)
                        │
                        └─── user_quiz_attempts (1:many)

badges ──── user_badges (many:1)
  │
  └─── stations (optional FK — station-specific badges)
```

### Table Purposes

| Table | Role |
|---|---|
| `auth.users` | Supabase-managed identity store. Never queried directly — use `profiles`. |
| `profiles` | Public user data (`username`, `avatar_url`). Row created on signup. |
| `stations` | MRT stations. `active` flag controls whether a station is visible in the UI. |
| `attractions` | Points of interest per station. `is_verified` flag gates community suggestions. |
| `reviews` | Star rating (1–5) + optional comment per user per attraction. |
| `visits` | Immutable check-in log: one row per user visit to an attraction. |
| `quizzes` | One question + correct answer per attraction. |
| `user_quiz_attempts` | Records each quiz attempt with an `is_correct` boolean. |
| `badges` | Badge definitions: `criteria_type`, `criteria_value`, `criter_target`. |
| `user_badges` | Join table: which user earned which badge, and when. |

---

## Next.js Server Components Data Flow

```
Browser
  │
  │  HTTP GET /station/[stationId]
  ▼
Next.js Edge / Node runtime
  │
  ├── app/station/[stationId]/page.tsx   (async Server Component)
  │     │
  │     ├── createClient()               ← src/utils/supabase/server.ts
  │     │     └── createServerClient()   ← @supabase/ssr (no cookie persistence yet)
  │     │
  │     ├── Promise.all([
  │     │     supabase.from('stations').select('name').eq('id', stationId).single(),
  │     │     supabase.from('attractions').select('id,name,description,image_url,google_map')
  │     │                                .eq('station_id', stationId).order('name')
  │     │   ])
  │     │
  │     └── <StationSitesList sites={attractions} />   (Server Component)
  │           └── <AttractionCard />                   (Server Component, no state)
  │
  └── Rendered HTML streamed to browser (zero JS for static parts)
```

### Client Component Islands

Components that opt into the browser runtime with `'use client'`:

| Component | Why it needs the browser |
|---|---|
| `TabBar` | `usePathname()` to highlight the active tab |
| `explore/page.tsx` | `useState` for active line toggle + modal open state |
| `badge/page.tsx` | `useState` for category filter + fetching badges on mount |
| `SuggestionForm` | Form state, POST to `/api/suggestions`, success/error feedback |
| `MRTMap` | Router push on station click |
| `RatingModal` | Controlled star rating + comment state |

---

## API Route Flow

```
Browser
  │
  │  POST /api/suggestions  { name, description, stationId }
  ▼
app/api/suggestions/route.ts   (Next.js Route Handler — runs on server)
  │
  ├── Validate request body (name, description, stationId required)
  │
  ├── createServerClient()     ← @supabase/ssr (stateless, no cookies)
  │
  ├── supabase.from('attractions').insert({ ..., is_verified: false })
  │
  └── NextResponse.json({ message, data })  or  { error }  + status code
```

---

## Supabase Client Selection Rule

| Runtime context | File to import from |
|---|---|
| `'use client'` component | `src/utils/supabase/client.ts` → `createBrowserClient` |
| `async` Server Component | `src/utils/supabase/server.ts` → `createServerClient` |
| Route Handler (`app/api/`) | `src/utils/supabase/server.ts` → `createServerClient` |
| `middleware.ts` | `src/utils/supabase/middleware.ts` (when auth is wired up) |

> **Never** import the server client in a Client Component — it will throw at runtime because `next/headers` is not available in the browser bundle.
