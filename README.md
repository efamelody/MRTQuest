# MRTQuest

A mobile-first gamified exploration application for Kuala Lumpur's MRT infrastructure. Users discover attractions, check in at physical locations, complete verification challenges, and earn achievement badges across the Kajang and Putrajaya lines.

**Coverage:** Kajang Line, Putrajaya Line, 16 operational stations, 24 mapped attractions.

---

## Features

| Feature | Description |
|---|---|
| **Authentication** | OAuth via Google and email-password credentials with persistent session management |
| **Station Explorer** | Browseable catalog of MRT stations organized by line with full attraction inventory per station |
| **Check-in System** | Progressive verification through geofence proximity detection, AI-powered landmark photo verification, and location-based trivia challenges |
| **Gamification** | Comprehensive badge system with eight criteria types including visit counts, station coverage, line mastery, and time-based achievements |
| **User Profile** | Passport dashboard displaying cumulative quest points, earned badges, recent visits, and user progression rankings |
| **Suggestions** | User-submitted attraction proposals for operator review and catalog expansion |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15+ (App Router) |
| UI Library | React 19 |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 (CSS-configured) |
| Icons | Lucide React |
| ORM | Prisma 6.19+ |
| Database | PostgreSQL (Supabase) |
| Authentication | Better Auth 1.6.9 (OAuth + email-password) |
| Image Verification | Google Gemini AI |
| Geolocation | geolib v3 |
| Package Manager | pnpm |

---

## Database Schema

Core application tables (managed via Prisma ORM):

| Model | Purpose | Key Fields |
|---|---|---|
| `Station` | MRT station metadata | `name`, `line`, `latitude`, `longitude`, `sequenceOrder`, `active` |
| `Attraction` | Points of interest linked to stations | `stationId`, `name`, `description`, `latitude`, `longitude`, `verificationType`, `checkInRadius` |
| `Profile` | User profile extension | `username`, `avatarUrl` |
| `Visit` | Check-in event log | `userId`, `siteId`, `visitedAt`, `verificationType` |
| `Quiz` | Trivia questions per attraction | `siteId`, `question`, `correctAnswer`, `points`, `options` |
| `UserQuizAttempt` | Quiz submission records | `userId`, `quizId`, `isCorrect`, `pointsEarned` |
| `Badge` | Achievement definitions | `name`, `criteriaType`, `criteriaValue`, `criteriaTarget`, `stationId` |
| `UserBadge` | User-earned badges | `userId`, `badgeId`, `earnedAt` |
| `Review` | User ratings and comments | `userId`, `siteId`, `rating` (1-5), `comment` |

Authentication tables (Better Auth managed):

| Model | Purpose |
|---|---|
| `User` (ba_user) | Authentication identity |
| `Account` (ba_account) | OAuth provider links |
| `Session` (ba_session) | Active session tokens |
| `Verification` (ba_verification) | Email OTP records |

Complete schema available in [prisma/schema.prisma](prisma/schema.prisma).

---

## Project Structure

```
app/                            # Next.js App Router pages and API routes
  api/
    auth/[...auth]/             # Better Auth handler
    badges/                     # GET badge definitions and user progress
    quiz/submit/                # POST quiz submission and grading
    stations/                   # GET stations and attractions
    visits/
      checkin/                  # POST check-in (geofence verification)
      verify-photo/             # POST photo verification via Gemini AI
      check-status/             # GET verification history for attraction
  badge/page.tsx                # Badge catalog with filtering
  explore/page.tsx              # Station browser with line selection
  login/page.tsx                # Authentication entry point
  passport/page.tsx             # User dashboard and stats
  station/[stationId]/page.tsx  # Station detail with attractions
  quiz/[attractionId]/page.tsx  # Quiz interface
  signup/page.tsx               # User registration

src/
  components/
    AttractionCard.tsx          # Attraction display with verification UI
    BadgeCard.tsx               # Badge tile (locked/earned states)
    BadgeModal.tsx              # Badge detail modal
    BadgeToast.tsx              # Achievement notification
    Button.tsx                  # Reusable button component
    Header.tsx                  # Sticky header navigation
    Modal.tsx                   # Reusable modal wrapper
    MRTMap.tsx                  # Interactive line visualization
    MrtSignupCard.tsx           # Registration form component
    PhotoCaptureButton.tsx      # Webcam capture interface
    ProximityBadge.tsx          # Distance indicator
    QuizCard.tsx                # Quiz question display
    RatingModal.tsx             # Review submission form
    StarRating.tsx              # Rating input control
    StationSitesList.tsx        # Attraction list for station
    SuggestionForm.tsx          # Attraction suggestion modal
    TabBar.tsx                  # Fixed bottom navigation
    Tooltip.tsx                 # Tooltip wrapper
  types/
    quiz.ts                     # TypeScript types for quiz model
  utils/
    auth.ts                     # Better Auth server configuration
    auth-client.ts              # Client-side session hook
    badges.ts                   # Badge evaluation logic and criteria
    prisma.ts                   # Prisma client instance
    useAttractionVerification.ts # Distance calculation hook
    supabase/
      client.ts                 # Supabase client (reference data reads)
      server.ts                 # Supabase server client
      middleware.ts             # Auth middleware configuration

prisma/
  schema.prisma                 # Data model and migrations

docs/
  badge-logic.md                # Badge criteria types and evaluation rules
  check-in.md                   # Check-in flow documentation
  auth-flow.md                  # Authentication flow overview
  dbschema.md                   # Database schema reference
```

---

## Environment Variables

Create a `.env.local` file in the project root with the following configuration:

```env
# Database connection (Prisma)
DATABASE_URL="postgresql://user:password@host:5432/mrtquest"
DIRECT_URL="postgresql://user:password@host:5432/mrtquest"

# Better Auth configuration
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-random-secret-key

# OAuth providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# External APIs
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
GOOGLE_AI_API_KEY=your-gemini-api-key

# Supabase (reference data reads only)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Note: Do not commit `.env.local` to version control.

---

## Getting Started

### Prerequisites
- Node.js 18 or later
- pnpm package manager
- PostgreSQL database (or Supabase project)
- Google OAuth credentials
- Google Gemini API key

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/MRTQuest.git
cd MRTQuest

# Install dependencies
pnpm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
pnpm prisma migrate dev

# Start development server
pnpm dev
```

Access the application at [http://localhost:3000](http://localhost:3000).

---

## Available Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Start development server with hot module reloading |
| `pnpm build` | Build production bundle |
| `pnpm start` | Serve production build locally |
| `pnpm lint` | Run ESLint validation |
| `pnpm prisma generate` | Generate Prisma client |
| `pnpm prisma migrate dev` | Create and apply database migration |
| `pnpm prisma studio` | Open Prisma Studio web interface |

---

## Architecture

### Authentication System

The application uses Better Auth for identity management with support for multiple authentication methods:

- **Email and Password**: Direct credential-based authentication with profile creation
- **OAuth (Google)**: Social login integration via Google OAuth 2.0
- **Session Management**: HTTP-only cookie-based sessions with automatic refresh handling
- **User Context**: Session data passed down through Server Components via `auth.api.getSession()`

Authentication flow enforces redirects (authenticated users directed to `/passport`) via [middleware.ts](middleware.ts).

### Data Architecture

**Data Fetching Pattern:**
- Server Components retrieve data at the page level using Prisma client
- Data flows down to child components via props
- Client Components use fetch-on-mount for state updates only
- Parallel independent queries utilize `Promise.all([...])`

**Data Persistence:**
- Prisma ORM handles all mutations and schema-enforced validations
- Supabase PostgreSQL backend
- Supabase client used selectively for reference data reads to optimize query patterns

**Security Model:**
- Session-based user isolation (all queries filtered by authenticated userId)
- No database-level row-level security; application layer enforces access control
- Service role keys used only for administrative aggregations (badge counts, stats)

### Check-in Verification System

Three-phase progressive verification workflow:

**Phase 1: Geofence Detection**
- User location calculated via browser Geolocation API
- Distance computed using haversine formula (geolib library)
- Check-in enabled when user is within 300m radius
- Visit record created with `verificationType: 'geofence'`

**Phase 2: Landmark Photo Verification (Optional)**
- User captures photo via webcam
- Image sent to Google Gemini AI for landmark recognition
- Verification confirms user proximity at photo capture time
- Confidence threshold (default 70%) determines success
- Additional Visit record created with `verificationType: 'photo'`
- Awards bonus points on successful verification

**Phase 3: Trivia Quiz Challenge (Optional)**
- Multi-choice questions presented after check-in
- User attempts quiz questions specific to the attraction
- Submissions recorded in UserQuizAttempt with correctness validation
- Points awarded based on answer accuracy

**Badge Evaluation**: Triggered automatically after each phase completion to evaluate all badge criteria against user's activity history.

### Badge System

Flexible criteria-based achievement framework supporting multiple unlock patterns:

| Criteria Type | Unlock Condition |
|---|---|
| `visit_count` | User accumulates N total visits (optionally scoped by category or line) |
| `station_stamp` | User visits specific designated station |
| `line_master` | User visits all active stations on a given MRT line |
| `quiz_master` | User achieves N correct quiz submissions |
| `first_review` | User submits initial review |
| `photo_review` | User submits N reviews including photos |
| `time_check` | User check-in occurs before/after specific hour (Malaysia Standard Time) |
| `multi_line` | User accumulates visits across multiple MRT lines |

Badge evaluation maintains deduplication (counts unique attractions only) and uses batch creation to handle multiple badge awards in single transaction.

### Component Patterns

**Server Components** (default, no directive):
- Data-fetching pages such as `station/[stationId]/page.tsx`
- Server-side rendering with no client-side JavaScript
- Direct Prisma queries with session-based filtering

**Client Components** (`'use client'`):
- Components requiring React state management (`useState`, `useReducer`)
- Components using browser APIs (`useEffect`, event handlers, Geolocation)
- Interactive elements requiring immediate user feedback

### API Route Handlers

All API routes follow consistent patterns:

1. Extract authenticated user from session
2. Validate request parameters
3. Execute database operations via Prisma
4. Evaluate badges post-action (for mutations)
5. Return structured JSON response

---

## Development Notes

- The application requires a PostgreSQL database (Supabase recommended for managed hosting)
- Deployment targets serverless environments such as Vercel or AWS Lambda
- Use `pnpm` exclusively for dependency management
- Database migrations handled via `pnpm prisma migrate dev`
- Type generation from schema executed automatically on `pnpm dev`

## Documentation

Additional technical documentation available in the `docs/` directory:

- [Badge Logic](docs/badge-logic.md) - Badge criteria types and evaluation rules
- [Check-in Flow](docs/check-in.md) - Detailed check-in process documentation  
- [Authentication Flow](docs/auth-flow.md) - Better Auth integration details
- [Database Schema](docs/dbschema.md) - Full data model reference
- [Architecture Overview](docs/architecture.md) - System design and patterns
