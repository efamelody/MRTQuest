# Architecture

## Overview

MRTQuest is a Next.js 15 App Router application with:

- **Authentication:** Better Auth (manages sessions via `ba_user`, `ba_session` in Postgres)
- **Database:** Supabase PostgreSQL accessed via **Prisma ORM** for mutations + **Supabase client** for reference data reads
- **Deployment:** Serverless, mobile-first design with sticky header and fixed tab bar

> **Current State:** Partial migration from Supabase Auth to Better Auth + Prisma. Pages still fetch reference tables (stations, attractions, quizzes) via Supabase; mutations (visits, quiz attempts, badges) use Prisma.

---

## Database Schema & Relationships

### Better Auth Tables (Auto-Managed)

Better Auth automatically creates and manages these Prisma models:

```
User (ba_user)
  id, email, name, image, createdAt, updatedAt
  ├── Account (ba_account)          [OAuth provider link]
  ├── Session (ba_session)          [Session tokens]
  └── Profile (1:1 FK on profiles.id)
        ├── Visit (1:many)
        ├── Review (1:many)
        ├── UserBadge (1:many)
        └── UserQuizAttempt (1:many)

Verification (ba_verification)     [Email verification OTPs]
```

### MRTQuest Application Models

```
Station
  id, name, line, latitude, longitude, active
  ├── Attraction (1:many)
  │     ├── Review (1:many)           [User rating + comment]
  │     ├── Visit (1:many)            [Check-in log]
  │     ├── Quiz (1:many)             [Quiz questions]
  │     │     └── UserQuizAttempt (1:many) [Quiz submission + score]
  │     └── Badge (optional FK)
  └── Badge (optional, station-specific badge)

Badge
  id, name, criteria_type, criteria_value, station_id
  └── UserBadge (1:many)  [Badge earned by user]
```

### Table Purposes

| Table | Prisma Model | Purpose | Layer |
|---|---|---|---|
| `ba_user` | `User` | Better Auth user identity (email, OAuth). Primary key for sessions. | Auth |
| `ba_session` | `Session` | Session tokens. One per login. | Auth |
| `ba_account` | `Account` | OAuth provider accounts (Google, etc.). | Auth |
| `ba_verification` | `Verification` | Email verification OTPs. | Auth |
| `profiles` | `Profile` | App-specific user data (`username`, `avatar_url`). FK → `ba_user.id`. | Data |
| `stations` | `Station` | MRT stations on Kajang/Putrajaya lines. `active` flag gates visibility. | Reference |
| `attractions` | `Attraction` | Points of interest per station. Links to quizzes, reviews, visits. | Reference |
| `visits` | `Visit` | Immutable check-in log: `(user_id, site_id, verification_type)`. | User Data |
| `reviews` | `Review` | User rating (1–5) + optional comment per attraction. | User Data |
| `quizzes` | `Quiz` | Quiz question + correct answer per attraction. | Reference |
| `user_quiz_attempts` | `UserQuizAttempt` | Quiz submission: `(user_id, quiz_id, is_correct, points_earned)`. | User Data |
| `badges` | `Badge` | Badge definitions with unlock criteria (`criteria_type`, `criteria_value`, `criteria_target`). | Reference |
| `user_badges` | `UserBadge` | Which badges each user has earned. | User Data |

---

## Prisma Client Setup

### Initialization ([src/utils/prisma.ts](src/utils/prisma.ts))

**Singleton pattern** prevents hot-reload connection leaks in development:

```ts
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['warn', 'error'],
    errorFormat: 'pretty',  // dev only
  });
```

**Database connection:**
- `DATABASE_URL` = Supabase Postgres with connection pooling (PgBouncer)
- `DIRECT_URL` = Direct connection for migrations (no pooling)
- Prisma automatically uses `DATABASE_URL` at runtime, `DIRECT_URL` for `prisma migrate`

### Better Auth Adapter

[src/utils/auth.ts](src/utils/auth.ts) configures Prisma as the database:

```ts
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});
```

---

## Next.js Server Components & API Route Data Flow

```
Browser
  │
  │  HTTP GET /station/[stationId]
  ▼
Next.js Node runtime (Server Component)
  │
  ├── app/station/[stationId]/page.tsx   (async, no 'use client')
  │     │
  │     ├── const supabase = createClient()  ← src/utils/supabase/server.ts
  │     │
  │     ├── Promise.all([
  │     │     supabase.from('stations').select('name').eq('id', stationId).single(),
  │     │     supabase.from('attractions').select('id,name,...')
  │     │       .eq('station_id', stationId).order('name')
  │     │   ])  ← Fetch reference data only (not mutations)
  │     │
  │     └── <StationSitesList sites={attractions} />
  │           └── <AttractionCard />        (Server Component, no state)
  │
  └── Rendered HTML streamed to browser (zero JS for static content)
```

**Note:** Reference data (stations, attractions, quizzes) is still fetched via Supabase client to avoid N+1 queries. User data (visits, reviews) is fetched via Prisma in API routes.

### Client Component Islands

Components that opt into the browser runtime with `'use client'`:

| Component | Why it needs the browser |
|---|---|
| `TabBar` | `usePathname()` to highlight the active tab |
| `explore/page.tsx` | `useState` for active line toggle + modal open state; calls `useSession()` to check auth |
| `badge/page.tsx` | `useState` for category filter; `useSession()` to fetch user's earned badges |
| `SuggestionForm` | Form state; POST to `/api/suggestions`; success/error feedback |
| `MRTMap` | Router push on station click |
| `RatingModal` | Controlled star rating + comment state; POST to `/api/reviews` |
| `PassportPage` | `useSession()` to display user profile; `signOut()` handler |

---

## API Route Authentication & Mutation Pattern

### Typical Flow: Check-in Request

```
Browser (Client Component)
  │
  │  POST /api/visits/checkin  { attractionId }
  ▼
app/api/visits/checkin/route.ts
  │
  ├── const session = await auth.api.getSession({ headers })  ← Extract user
  │     └── Throws 401 if missing
  │
  ├── const userId = session.user.id
  │
  ├── Ensure profile exists:
  │     await prisma.profile.upsert({
  │       where: { id: userId },
  │       create: { id: userId },  ← FK links to ba_user.id
  │     })
  │
  ├── Check for duplicate visits (prevent double check-ins):
  │     const existing = await prisma.visit.findFirst({
  │       where: { userId, siteId: attractionId }
  │     })
  │
  ├── Create visit record:
  │     const visit = await prisma.visit.create({
  │       data: { userId, siteId: attractionId, verificationType: 'geofence' }
  │     })
  │
  ├── Evaluate badges (async, not awaited for speed):
  │     const newBadges = await evaluateBadges(userId)
  │
  └── NextResponse.json({ visitId, newBadges })
```

[Full example: app/api/visits/checkin/route.ts](app/api/visits/checkin/route.ts)

---

## Client Selection & Import Rules

### For Authentication

| Context | Import | Purpose |
|---|---|---|
| **Server Component** (fetch user in page) | `import { auth } from '@/utils/auth'` | Get session: `await auth.api.getSession({ headers: request.headers })` |
| **Client Component** | `import { useSession } from '@/utils/auth-client'` | Hook: `const { data: session } = useSession()` |
| **API Route Handler** | `import { auth } from '@/utils/auth'` | Extract session: same as Server Component |

### For Data Access

| Context | Import | Use Case |
|---|---|---|
| **Server Component (reads only)** | `import { createClient } from '@/utils/supabase/server'` | Fetch reference tables (stations, attractions, quizzes) |
| **Client Component** | `import { createClient } from '@/utils/supabase/client'` | Browser-side reads only (no mutations) |
| **API Route (mutations)** | `import { prisma } from '@/utils/prisma'` | Create visits, quiz attempts, badges |
| **API Route (complex reads)** | `import { prisma } from '@/utils/prisma'` | Complex queries with user data |

### Prisma Import

```ts
// Available in all contexts (server-only)
import { prisma } from '@/utils/prisma';

// Common patterns:
await prisma.visit.create({ data: { userId, siteId } });
await prisma.userBadge.findMany({ where: { userId } });
await prisma.profile.upsert({ where: { id }, create: { id }, update: {} });
```

> **Never** import Prisma in Client Components. Prisma client is server-only.
