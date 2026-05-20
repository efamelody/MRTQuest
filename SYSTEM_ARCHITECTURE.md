# MRTQuest — System Architecture

> **Stack:** Next.js 16 App Router · Prisma ORM · PostgreSQL (Supabase) · Better Auth · Google Gemini 2.5 Flash  
> **Domain:** Gamified urban-exploration journal — users check in at MRT station-adjacent attractions, verify via geofence or photo AI, earn badges, and accumulate quest points.

---

## 1. Core Architecture Pattern

### API-First Decoupled Service Layer

MRTQuest implements an **API-First Decoupled Service Layer Architecture** using Next.js 15+ App Router as the orchestration substrate and Prisma ORM for data access.

**Layer breakdown:**

| Layer | Location | Responsibility |
|---|---|---|
| **Presentation** | `app/(explore)/`, `app/passport/`, `app/station/[stationId]/`, `app/quiz/[attractionId]/` | Server-rendered pages + client hydration |
| **API Routes** | `app/api/{badges,passport,quiz,visits,suggestions,stations,debug-models}/route.ts` | Request deserialization, auth guard, validation, response serialization |
| **Auth Provider** | `src/utils/auth.ts`, `src/utils/auth-client.ts` | Better Auth server instance + client SDK (`useSession`, `signOut`) |
| **Data Access** | `src/utils/prisma.ts` | Singleton `PrismaClient` with global hot-reload guard |
| **Business Logic** | `src/utils/badges.ts`, `src/utils/useAttractionVerification.ts` | Pure/composable functions for badge evaluation, geolocation state machines |

**Key architectural properties:**

- **No hidden RPC.** Every server-state mutation flows through an explicit route handler. There is no direct ORM access from client components — the client never imports `prisma`.
- **Read-model projection.** API routes use explicit `.select()` / `.include()` cylinders rather than `findMany()` with post-filtering. This eliminates unnecessary column transfer and keeps the network boundary lean.
- **Singleton PrismaClient.** The `src/utils/prisma.ts` module caches the Prisma client on `globalThis` across hot reloads, preventing connection-pool exhaustion during development (`src/utils/prisma.ts:3-13`).

### Authorization: centralized application-layer guard

Authorization is **not** delegated to the database layer. Instead, every protected route follows a consistent three-step pattern:

```
1. Session extraction
   const session = await auth.api.getSession({ headers: request.headers });
   if (!session?.user?.id) → 401

2. User-scope injection
   const userId = session.user.id;
   const data = await prisma.visit.findMany({ where: { userId } });

3. Profile upsert (lazy initialization)
   await prisma.profile.upsert({ where: { id: userId }, create: { id: userId } });
```

This pattern is replicated identically across every mutating endpoint (`checkin`, `verify-photo`, `quiz/submit`, etc.), making the authorization surface uniform and auditable.

### RLS deprecation rationale

Row-Level Security (RLS) was considered and intentionally **deprecated** for the internal API path for the following reasons:

1. **Direct connection bypass.** Prisma connects via `DIRECT_URL` (a trusted PostgreSQL connection string). RLS policies enforced at the database are transparently bypassed when the connection uses a superuser or owner role — which is the standard deployment model for Prisma on platforms like Vercel + Supabase.

2. **Double-enforcement debt.** Maintaining identical access rules in both application code (`where: { userId }`) and database policies (`CREATE POLICY ... USING (user_id = current_setting('app.user_id'))`) creates a synchronization liability. Any drift between the two produces either false negatives (blocked legitimate access) or false positives (data leaks).

3. **Latency overhead per query.** RLS rewrites every query through a policy check, adding planner overhead for each `WHERE` clause injection. For a read-heavy, low-latency mobile-facing application, the application-layer filter is measurably faster.

4. **Single-tenant architecture.** MRTQuest serves a single organization's data. Multi-tenant isolation (which is RLS's primary value proposition) is not a requirement. The authorization boundary is between *authenticated users and their own data*, not between tenants.

The application layer is therefore the **single source of truth** for authorization. Every Prisma query that touches user-scoped data (`visits`, `reviews`, `user_badges`, `user_quiz_attempts`, `profiles`) includes an explicit `.where({ userId })` clause derived from the verified Better Auth session — colloquially referred to in the codebase as **"New RLS"** (see `app/api/badges/route.ts:58`, `app/api/passport/route.ts:13-35`).

### Routes open to unauthenticated access

A small subset of endpoints intentionally bypasses the auth guard:

| Route | Reason | Auth pattern |
|---|---|---|
| `GET /api/stations` | Static reference data | No guard |
| `GET /api/badges` | Badge catalog is public; user badges appended conditionally | Optional `userId` |
| `POST /api/auth/signin-with-username` | Pre-authentication username lookup | No guard |
| `* /api/auth/[...auth]` | Better Auth catch-all (OAuth, session) | Delegated to Better Auth |

### Middleware pass-through

The Next.js middleware (`middleware.ts`) is a pass-through (`NextResponse.next()`). Auth-gated redirects (e.g., unauthenticated visitors on `/passport`) are handled client-side via the `useSession()` hook. This design decision was made because:

- Middleware runs on the Edge Runtime, which lacks Prisma client access
- Session validation requires a database round-trip that is better suited to the Node.js runtime
- Client-side hydration allows for granular loading states (skeleton, spinner, redirect CTA) rather than a hard redirect

---

## 2. Multimodal Photo Verification Pipeline (`POST /api/visits/verify-photo`)

This endpoint (`app/api/visits/verify-photo/route.ts`) implements a **Fast-Fail validation pipeline** that minimizes LLM token consumption and system latency by rejecting invalid requests at the earliest possible gate.

### Pipeline stages (in order of execution)

```
Request → [Auth] → [Body Parse] → [Geofence Pre-check] → [Attraction Lookup] → 
[Geofence Validation] → [Metadata Warning] → [Gemini AI] → [Confidence Gate] → 
[Visit Record] → Response
```

#### Stage 1: Auth gate (line 31-40)
Session extraction via `auth.api.getSession()`. Returns `401` immediately if no valid session token is present.

#### Stage 2: Body parse + field validation (line 43-87)
Coarse-grained type checks on `attractionId` (string), `base64Image` (string), `userLatitude`/`userLongitude` (number). Returns `400` for missing or malformed fields.

#### Stage 3: Geofence pre-check — prior visit required (line 63-73)
Before any LLM invocation, the route confirms the user has a prior geofence-based `Visit` record for this attraction. This prevents arbitrary photo uploads from users who have never been within proximity of the site. Returns `403` if missing.

#### Stage 4: Attraction lookup + business-rule gates (line 90-124)
Fetches the `Attraction` row with all fields needed for downstream validation. Three rejection paths at this stage:
- `404` — Attraction `id` not found
- `422` — `has_photo_challenge` is `false` (feature not enabled for this attraction)
- `422` — Attraction has null coordinates (cannot validate spatial proximity)

#### Stage 5: Geofence validation — spatial proximity (line 127-140)
Uses `geolib.getDistance()` to compute the Haversine distance between the user's reported coordinates and the attraction's stored coordinates. If the distance exceeds `attraction.checkInRadius` (default: 300m), the route returns `422` with the precise distance mismatch. **This is the critical cost-saving gate** — by rejecting out-of-range requests before the AI call, we avoid consuming LLM tokens for submissions that cannot succeed.

#### Stage 6: Metadata staleness check (line 142-145)
Optional heuristic warning. If the photo's `capturedAt` or `imageDateTaken` timestamp exceeds `METADATA_MAX_AGE_HOURS` (24h) from server time, a warning string is appended to the response. The verification still proceeds — this is advisory only, not a hard gate.

#### Stage 7: AI verification via Google Gemini (line 148-152, 220-304)
The core verification delegates to the `verifyLandmarkWithGemini()` function:

```typescript
const result = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: [
    {
      role: 'user',
      parts: [
        { text: promptText },
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } }
      ],
    },
  ],
  config: {
    responseMimeType: 'application/json',
    responseSchema: {
      type: 'object',
      properties: {
        verified: { type: 'boolean' },
        confidence: { type: 'number' },
        reason: { type: 'string' }
      },
      required: ['verified', 'confidence', 'reason']
    },
  },
});
```

Notable implementation details:
- **Model:** `'gemini-3-flash-preview'` — a low-latency multimodal model optimized for structured extraction tasks. The model ID is defined in-line at line 232.
- **SDK:** `@google/genai` (the modern first-party Google Gen AI SDK), initialized with `GOOGLE_GENERATIVE_AI_API_KEY`.
- **Structured output:** Uses `responseMimeType: 'application/json'` with a `responseSchema` that constrains the LLM to produce type-safe JSON. This eliminates the need for fragile regex extraction on freeform text.
- **Prompt templating:** The `ai_prompt` field on the `Attraction` model supports a `{attraction_name}` interpolation token, enabling per-attraction verification criteria. Falls back to a generic prompt if `ai_prompt` is null.
- **Error resilience:** If the Gemini API call throws (network error, rate limit, invalid response), the function returns a degraded `{ verified: false, confidence: 0, reason: 'AI verification service error' }` rather than propagating the exception to the caller. The route then returns `422` with this degraded result.

#### Stage 8: Confidence threshold gate (line 166-182)
Two thresholds govern the response:
- `CONFIDENCE_THRESHOLD = 0.7` — strict pass/fail boundary. Below this: `422` with failure reason.
- `NEAR_THRESHOLD = 0.6` — hints boundary. Confidence between `0.6` and `0.7`: a `hints` field is appended to the failure response, generated by `buildHintText()`, which guides the user to re-frame the landmark more clearly.

Below `0.6`: bare rejection — no hints, no metadata warnings.

#### Stage 9: Visit record creation (line 185-192)
If all gates pass, a `Visit` row is created with `verificationType: 'photo'` and `verifiedAt: new Date()`. The response includes `pointsAwarded: 8`.

### Pipeline property summary

| Property | Value |
|---|---|
| Worst-case latency (full pipeline) | ~1.5-3s (dominated by Gemini inference) |
| Best-case rejection latency (missing auth) | <10ms |
| Token cost avoided per early rejection | ~800-1200 tokens |
| Idempotency | Not enforced per-photo (multiple photo visit rows can exist) |
| Threshold constants | `CONFIDENCE_THRESHOLD=0.7`, `NEAR_THRESHOLD=0.6`, `METADATA_MAX_AGE_HOURS=24` |

---

## 3. Data Model & Entity Relationships

### Prisma schema topology (`prisma/schema.prisma`)

```
ba_user (Better Auth)
  └── profiles (1:1, same id)
        ├── visits (M:1) → attractions (M:1) → stations (M:1)
        ├── reviews (M:1) → attractions
        ├── user_badges (M:1) → badges (M:1) → stations (optional)
        └── user_quiz_attempts (M:1) → quizzes (M:1) → attractions
```

### Key model responsibilities

| Model | Table | Purpose |
|---|---|---|
| `User` | `ba_user` | Better Auth identity (id, name, email, credentials). Not directly referenced by application FK constraints. |
| `Profile` | `profiles` | Application-level user identity. Shares `id` with `ba_user.id`. All application FKs point here. Created lazily on first mutation via `prisma.profile.upsert()`. |
| `Station` | `stations` | MRT station reference data (name, line, geographic coordinates, sequence). `active` boolean gates visibility on the explore map. |
| `Attraction` | `attractions` | A point of interest adjacent to a station. Contains spatial data (`latitude`, `longitude`, `checkInRadius`), feature flags (`has_photo_challenge`, `has_quiz_challenge`), and verification configuration (`ai_prompt`). |
| `Visit` | `visits` | A user check-in at an attraction. `verificationType` distinguishes `geofence` (GPS-based) from `photo` (AI-verified) check-ins. |
| `Badge` | `badges` | Achievement definition. `criteriaType` supports `visit_count`, `station_stamp`, `time_check`, `multi_line`, `line_master`, `quiz_master`, and `first_review`. |
| `Quiz` | `quizzes` | A multiple-choice question tied to an attraction. `options` is a `String[]` column. |
| `UserQuizAttempt` | `user_quiz_attempts` | Join table with `@@unique([userId, quizId])` enforcing one attempt per question (re-attempts upsert). |

### Feature flags vs nullable columns

The schema uses two patterns for boolean feature flags:
- **Type-safe booleans:** `is_verified` (`Boolean @default(false)`) on `attractions` — non-nullable, always present.
- **Opt-in nullable booleans:** `has_photo_challenge` and `has_quiz_challenge` are `Boolean? @default(false)` — nullable to distinguish _explicitly disabled_ from _not yet migrated_ rows. This is a temporary migration strategy that should be normalized to non-nullable once all existing rows are backfilled.

---

## 4. Quiz Submission Pipeline (`POST /api/quiz/submit`)

### Two-phase submission

The quiz endpoint (`app/api/quiz/submit/route.ts`) processes answers in two phases:

**Phase 1: Score computation (lines 83-132)**
1. Fetches `quizzes` for the given `attractionId`, ordered by `sortOrder`.
2. Iterates over the submitted `answers: Record<string, string>` map.
3. For each `(quizId, userAnswer)` pair, performs an exact string comparison (`userAnswer === quiz.correctAnswer`).
4. Upserts a `UserQuizAttempt` record using the `@@unique([userId, quizId])` composite key — this makes re-attempts additive rather than destructive.

**Phase 2: Badge evaluation (line 136)**
After all answers are persisted, calls `evaluateBadges(userId)` which queries accumulated visits, quiz attempts, and reviews to determine if any unearned badge criteria are now satisfied. Newly earned badges are bulk-inserted via `prisma.userBadge.createMany({ skipDuplicates: true })`.

### Idempotency guarantee

The `@@unique([userId, quizId])` constraint on `UserQuizAttempt` ensures that re-submitting the same quiz results in an upsert, not a duplicate. The `attemptedAt` timestamp is updated to reflect the latest attempt.

---

## 5. Badge Evaluation Engine (`src/utils/badges.ts`)

The `evaluateBadges(userId)` function implements a **criteria-based badge engine** with the following architecture:

### Data acquisition
Seven parallel Prisma queries:
1. All badge definitions (`prisma.badge.findMany()`)
2. Already-earned badge IDs (`prisma.userBadge.findMany({ where: { userId } })`)
3. Geofence visits with nested attraction/station data
4. Correct quiz count
5. Review count

### Criteria types and their evaluation

| `criteriaType` | Logic | Example |
|---|---|---|
| `visit_count` | `uniqueVisits.length >= criteriaValue`. Optional `criteriaTarget` scopes to a category. | "Visit 5 attractions" or "Visit 3 mosques" |
| `station_stamp` | `badge.stationId` is present in the set of visited station IDs. | "Visit Merdeka station" |
| `time_check` | Any geofence visit whose local hour (UTC+8) satisfies `>=` or `<` `criteriaValue` depending on `criteriaTarget`. | "Check in before 7 AM" |
| `multi_line` | All comma-separated line names in `criteriaTarget` are represented in the user's visited lines (case-insensitive partial match). | "Visit both Kajang and Putrajaya lines" |
| `line_master` | Count of distinct active stations visited on a specific line. | "Visit 10 Kajang Line stations" |
| `quiz_master` | Correct quiz count. | "Answer 20 quizzes correctly" |
| `first_review` | Review count. | "Leave your first review" |

### Deduplication strategy
Visits are deduplicated by `siteId` before counting. If a user checks in at the same attraction twice (geofence + photo), only the first visit contributes to badge criteria. This is explicitly noted as a defensive measure since the check-in route already prevents duplicates (`app/api/visits/checkin/route.ts:29-36`).

### Write-through on evaluation
Newly earned badges are immediately persisted via `prisma.userBadge.createMany({ skipDuplicates: true })` and returned in the response. The `skipDuplicates` guard handles race conditions where two concurrent badge evaluations might attempt to insert the same row.

---

## 6. Geolocation State Machine (`src/utils/useAttractionVerification.ts`)

The custom hook `useAttractionVerification` (referenced in `AttractionCard.tsx:50-66`) manages a **four-phase state machine**:

```
loading → outside ─→ inside → checkedIn
              ↑         │
              └─────────┘
              (user walks away)
```

- **`loading`** — Browser Geolocation API pending. Shows skeleton placeholder.
- **`outside`** — User is beyond `checkInRadius`. Shows "Get Directions" + distance.
- **`inside`** — User is within proximity. Shows "Check In Now" + navigation button.
- **`checkedIn`** — Visit record created. Shows confirmation banner + bonus challenges (photo/quiz).

The `currentPhase` string drives the conditional rendering in `AttractionCard.renderActionHub()`. Distance is computed on every location update using `geolib.getDistance()`.

---

## 7. DevOps & Environment Isolation (Vercel + Supabase)

### Branch-based environment pipeline

MRTQuest utilizes **Vercel's Preview Deployment scoping** to maintain two fully isolated environments:

| Environment | Vercel Branch | Database | Purpose |
|---|---|---|---|
| **Production** | `main` | `MRTQuest-prod` PostgreSQL cluster | Live user data, no destructive operations |
| **Staging** | `staging` | `MRTQuest-staging` PostgreSQL cluster | Migration testing, QA, volatile test suites |

### Isolation guarantees

- **Database-level isolation.** The `staging` branch is bound to a physically separate Supabase project with its own `DATABASE_URL` and `DIRECT_URL`. No staging query can read or write production data.
- **Migration sandbox.** `prisma migrate dev` on the `staging` branch operates against the sandbox database. Schema changes are validated here before being applied to production via `prisma migrate deploy`.
- **Environment variable segregation.** Each Vercel environment (Production, Preview) maintains its own set of environment variables (`BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_GENERATIVE_AI_API_KEY`, etc.). The `staging` branch uses a separate Google OAuth client to avoid redirect URI collisions.

### Direct connection architecture

The Prisma datasource block (`prisma/schema.prisma:5-9`) specifies both `url` (connection pooler, used by Prisma Client) and `directUrl` (direct connection, used by `prisma migrate`).

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

- **`DATABASE_URL`** — Points to Supabase's connection pooler (`{project}.pooler.supabase.com`). Used at runtime by Prisma Client. Pooling prevents connection exhaustion in serverless environments where each invocation creates a new Prisma Client instance.
- **`DIRECT_URL`** — Points directly to the database host. Used exclusively by Prisma Migrate for DDL operations that require a direct session (e.g., `CREATE INDEX CONCURRENTLY`).

### Migration workflow

```
Developer → prisma/schema.prisma edit
  → pnpm prisma migrate dev --name <change>   [creates migration file]
  → Commit + push to staging                   [Vercel Preview builds, runs migrate deploy]
  → QA validation on staging
  → PR to main                                 [Vercel Production builds, runs migrate deploy]
```

---

## 8. Type Safety & SDK Boundaries

### Structured AI output via `responseSchema`

The Gemini integration uses the `responseSchema` configuration parameter to enforce type-safe JSON output at the SDK level (lines 265-273):

```typescript
responseSchema: {
  type: 'object',
  properties: {
    verified: { type: 'boolean' },
    confidence: { type: 'number' },
    reason: { type: 'string' }
  },
  required: ['verified', 'confidence', 'reason']
}
```

This eliminates the need for regex-based JSON extraction (though a fallback regex `/\{[\s\S]*\}/` at line 285 exists for backward compatibility with model versions that do not support structured output).

### Client-server type alignment

The `GeminiResponse` interface (lines 18-22) mirrors the `responseSchema` structure:

```typescript
interface GeminiResponse {
  verified: boolean;
  confidence: number;
  reason?: string;
}
```

This ensures that the parsed response from the LLM matches the application's type expectations without runtime coercion.

### Input boundary validation

Every API route performs coarse-grained type assertions on request body fields before using them:

```typescript
if (typeof userLatitude !== 'number' || typeof userLongitude !== 'number') {
  return NextResponse.json({ error: 'User coordinates are required' }, { status: 400 });
}
```

This pattern provides a defense-in-depth layer against malformed requests reaching the business logic or database layer.

---

## 9. Auth Integration Detail

### Better Auth topology

| Component | File | Function |
|---|---|---|
| Server instance | `src/utils/auth.ts` | Configures `betterAuth()` with Prisma adapter, email/password, and Google OAuth provider |
| Client SDK | `src/utils/auth-client.ts` | `createAuthClient()` returns `useSession` hook + `signOut` function |
| API handler | `app/api/auth/[...auth]/route.ts` | Catch-all route delegating to `toNextJsHandler(auth)` |
| Session cookie | `better-auth.session_token` | HTTP-only, set on OAuth callback, cleared on sign-out |

### Database identity chain

```
ba_user.id (text)    ← Better Auth manages this (created on OAuth callback)
  └── profiles.id (text)    ← FK constraint; same value as ba_user.id
        ├── visits.user_id
        ├── reviews.user_id
        ├── user_badges.user_id
        └── user_quiz_attempts.user_id
```

The `Profile` row is **not** created at sign-up. It is lazily initialized on the first mutating API call via `prisma.profile.upsert({ where: { id: userId }, create: { id: userId } })`. This is done in both `POST /api/visits/checkin` and `POST /api/quiz/submit`.

### Auth flow sequence

```
1. User initiates Google OAuth
   → authClient.signIn.social({ provider: "google", callbackURL: "/passport" })
   → Browser redirects to Google consent screen

2. Google redirects back to /api/auth/callback/google
   → Better Auth exchanges code for tokens
   → Creates ba_user row
   → Sets better-auth.session_token cookie

3. User lands on /passport
   → useSession() calls GET /api/auth/get-session
   → Returns { user: { id, name, email, image }, session }

4. User triggers a check-in
   → POST /api/visits/checkin
   → auth.api.getSession({ headers }) extracts user
   → prisma.profile.upsert({ id: userId }) creates Profile if missing
   → Visit record created
```

### Auth flow for username-based login

For users without Google, a two-step username flow exists:
1. `POST /api/auth/signin-with-username { username }` — looks up `ba_user` by `name`, returns associated `email`
2. Client calls `authClient.signIn.email({ email, password })` with the retrieved email

---

## 10. Component Hierarchy & Data Flow

```
RootLayout (app/layout.tsx)
├── Header
├── {children} (page content)
│   ├── ExplorePage (app/(explore)/page.tsx)
│   │   ├── MRTMap
│   │   └── SuggestionForm → POST /api/suggestions
│   │
│   ├── StationPage (app/station/[stationId]/page.tsx)  [Server Component]
│   │   └── StationSitesList (client)
│   │       └── AttractionCard (client)
│   │           ├── useSession() → auth guard
│   │           ├── useAttractionVerification() → geolocation state machine
│   │           ├── handleCheckIn → POST /api/visits/checkin
│   │           ├── handleGetDirections → window.open(googleMap)
│   │           ├── verifyLandmark → POST /api/visits/verify-photo
│   │           └── Quizzes → router.push(/quiz/${id})
│   │
│   ├── PassportPage (app/passport/page.tsx) [Client Component]
│   │   ├── useSession() → auth guard
│   │   └── GET /api/passport → fetch visit/badge/review aggregates
│   │
│   ├── QuizPage (app/quiz/[attractionId]/page.tsx) [Server Component]
│   │   └── Quiz form → POST /api/quiz/submit
│   │
│   └── BadgePage (app/badge/page.tsx)
│
└── TabBar
```

### Data flow for a complete check-in journey

```
1. User opens station page
   → Server component fetches attractions + quizzes via Prisma (no API route)
   → Renders StationSitesList → AttractionCard

2. User walks near attraction
   → useAttractionVerification detects proximity
   → Phase: inside → shows "Check In Now"

3. User taps "Check In Now"
   → POST /api/visits/checkin { attractionId }
   → Auth guard → Profile upsert → Visit create → Badge evaluation
   → Response: { visitId, alreadyCheckedIn, newBadges }

4. User taps "Verify Landmark" (bonus challenge)
   → Captures photo via react-webcam
   → POST /api/visits/verify-photo { attractionId, base64Image, lat, lng }
   → Fast-fail pipeline → Gemini verification → Visit create

5. User takes quiz (bonus challenge)
   → Navigates to /quiz/${attractionId}
   → POST /api/quiz/submit { attractionId, answers }
   → Score computation → Upsert attempts → Badge evaluation
```

---

## 11. Error Handling Strategy

### Route-level error boundaries

Every API route wraps its handler body in a `try/catch`:

```typescript
try {
  // handler logic
} catch (error) {
  console.error('[route-name]', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

Errors are logged server-side for observability and return a generic message to the client — no stack traces or internal details are leaked in production responses.

### Validation error granularity

| HTTP status | Meaning | Example |
|---|---|---|
| `400` | Malformed request body | Missing `attractionId`, invalid coordinate types |
| `401` | Unauthenticated | Missing or expired session cookie |
| `403` | Authenticated but not authorized | Prior geofence check-in required for photo verification |
| `404` | Resource not found | Attraction ID does not exist in database |
| `422` | Business rule violation | Outside geofence radius, AI confidence below threshold, photo challenge not enabled |
| `500` | Internal server error | Gemini API failure, database connection error |

### AI error degradation

The `verifyLandmarkWithGemini()` function wraps its entire Gemini invocation in a try/catch and returns a degraded response (`verified: false, confidence: 0, reason: 'AI verification service error'`) rather than propagating the exception. This ensures that transient AI service disruptions result in a graceful `422` with an actionable error message rather than a `500`.

---

## 12. Key Dependencies & Versions

| Dependency | Version | Purpose |
|---|---|---|
| `next` | `16.2.3` | App Router, server components, API routes |
| `react` / `react-dom` | `19.2.4` | UI rendering |
| `@prisma/client` | `^6.19.3` | ORM — database access |
| `prisma` | `^6.19.3` | Schema management, migrations, client generation |
| `better-auth` | `^1.6.9` | Authentication — OAuth, email/password, session management |
| `@google/genai` | `^1.51.0` | Google Gemini SDK — multimodal AI verification |
| `geolib` | `^3.3.14` | Haversine distance computation for geofence checks |
| `lucide-react` | `^1.8.0` | Icon library |
| `react-webcam` | `^7.2.0` | Browser camera capture for photo verification |
| `tailwindcss` | `^4.2.2` | Utility-first CSS framework |
| `typescript` | `^5` | Type safety across the full stack |
| `@supabase/supabase-js` | `^2.103.0` | Supabase client (data queries only; auth is handled by Better Auth) |
