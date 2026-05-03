# Row-Level Security (RLS) Migration: From Database to Application Layer

## Executive Summary

MRTQuest has migrated from **database-level RLS (Row-Level Security)** to **application-level session-based filtering**. This document explains why this change was necessary, how it works, and where to find the implementation.

**TL;DR:**
- ❌ Database RLS doesn't work with service role keys (which bypass RLS by design)
- ✅ We now enforce security at the application layer using Better Auth sessions
- ✅ All user-data queries filter by `userId` extracted from the authenticated session
- ✅ This approach is more transparent, auditable, and easier to test

---

## Why We Disabled RLS

### The Problem with Service Role Keys

In a traditional setup, RLS policies are enforced at the database level. However, **Supabase service role keys bypass RLS entirely**:

```
┌─────────────────────────────────────────────────┐
│  Supabase Authentication                        │
├─────────────────────────────────────────────────┤
│ User A logs in                                  │
│ ↓                                               │
│ Supabase creates JWT with user_id=A             │
│ ↓                                               │
│ API Route checks JWT, gets userId=A             │
│ ↓                                               │
│ PROBLEM: Service Role Key is used (not JWT)     │
│ ↓                                               │
│ RLS policies see service_role (admin)           │
│ ↓                                               │
│ RLS policies are **BYPASSED** (not enforced)    │
└─────────────────────────────────────────────────┘
```

### What We Had (Before)

```ts
// API Route using Supabase service role
const supabase = createServiceClient();  // ← Uses SERVICE_ROLE_KEY (bypasses RLS)

const { data } = await supabase
  .from('visits')
  .select('*');  // ← RLS policies NOT applied

// SECURITY HOLE: Returns ALL users' visits, not just current user
```

### The Reality

When you use a **service role key** in an API route:
1. The connection is authenticated as an admin
2. RLS policies check: "Is this a service role?" → **YES**
3. RLS policies automatically bypass (service role = trusted, privileged access)
4. All data is accessible regardless of RLS rules

**Result:** RLS implementation was wasted effort—it had no effect.

---

## The New Approach: Session-Based Filtering

### Core Principle

Instead of relying on the database to enforce security, we enforce it at the **application layer** by:

1. Extracting `userId` from the **authenticated Better Auth session**
2. Explicitly filtering all user-data queries with `where: { userId }`
3. Never trusting `userId` from request body—only from session

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│  Client → API Route (/api/visits/checkin)                │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  1. Extract Session (Better Auth)                        │
│     const session = await auth.api.getSession(...)       │
│                                                           │
│  2. Verify Auth                                          │
│     if (!session?.user?.id) return 401                   │
│                                                           │
│  3. Get userId (from session, not request body)          │
│     const userId = session.user.id  ← TRUSTED SOURCE     │
│                                                           │
│  4. Filter Query                                         │
│     const visits = await prisma.visit.findMany({         │
│       where: { userId }  ← SECURITY ENFORCED HERE        │
│     })                                                    │
│                                                           │
│  5. Return Response                                      │
│     All data belongs to authenticated user               │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### Why This Works

- **Cannot be spoofed**: `userId` comes from signed Better Auth session, not user input
- **Explicit & auditable**: Security logic is visible in code (not hidden in database policies)
- **Works with Prisma**: ORM doesn't support RLS, but filtering is straightforward
- **Testable**: Easy to verify that userId filters are applied

---

## Implementation: Where to Find It

### 1. Session Extraction Pattern

All API routes follow this structure:

```ts
// File: app/api/visits/checkin/route.ts
import { auth } from '@/utils/auth';

export async function POST(request: NextRequest) {
  // STEP 1: Extract session from Better Auth
  const session = await auth.api.getSession({ headers: request.headers });

  // STEP 2: Verify authentication
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // STEP 3: Get userId from session
  const userId = session.user.id;

  // STEP 4: Use userId in all user-data queries
  const visit = await prisma.visit.create({
    data: {
      userId,  // ← Session-based filtering: "New RLS"
      siteId: attractionId,
      verificationType: 'geofence',
    },
  });

  return NextResponse.json({ visitId: visit.id });
}
```

### 2. API Routes Using Session Filtering

| Route | Table | Filter | Security |
|-------|-------|--------|----------|
| **GET** `/api/visits/history` | `visit` | `where: { userId }` | ✅ User sees only their visits |
| **GET** `/api/passport` | `visit`, `review`, `userBadge` | `where: { userId }` | ✅ User sees only their stats |
| **GET** `/api/badges` | `userBadge` | `where: { userId }` | ✅ User sees only their badges |
| **POST** `/api/visits/checkin` | `visit` | Creates with `userId` | ✅ Cannot spoof user |
| **POST** `/api/visits/verify-photo` | `visit` | Creates with `userId` | ✅ Cannot spoof user |
| **POST** `/api/quiz/submit` | `userQuizAttempt` | `where: { userId_quizId }` | ✅ User's answers only |

### 3. Service Layer Example

The `evaluateBadges` utility demonstrates how session-based filtering propagates:

```ts
// File: src/utils/badges.ts
export async function evaluateBadges(userId: string): Promise<EarnedBadge[]> {
  const [allBadges, earnedUserBadges, geofenceVisits, ...] = await Promise.all([
    // Reference data (no filter)
    prisma.badge.findMany(),

    // User-owned data (filtered by userId)
    prisma.userBadge.findMany({
      where: { userId },  // ← Session-based filtering
      select: { badgeId: true },
    }),

    // User-owned data (filtered by userId)
    prisma.visit.findMany({
      where: { userId, verificationType: 'geofence' },  // ← userId filter
      select: { siteId: true, visitedAt: true, attraction: {...} },
    }),

    // ...other queries with userId filter
  ]);

  // Process badges...
  return newlyEarned;
}
```

### 4. Frontend: No Direct Database Access

Components **do not** use Supabase directly:

```ts
// ❌ BAD (not used anymore)
import { createClient } from '@/utils/supabase/client';
const supabase = createClient();
const { data } = await supabase.from('visits').select('*');

// ✅ GOOD (current pattern)
const response = await fetch('/api/visits/history');  // API enforces security
const { visits } = await response.json();
```

All frontend data flows through `/api/*` endpoints that enforce session-based filtering.

---

## Security Comparison: RLS vs Session-Based Filtering

| Aspect | Database RLS | Session-Based Filtering |
|--------|--------------|-------------------------|
| **Enforcement** | Database layer | Application layer |
| **With Service Role** | ❌ Bypassed | ✅ Still enforced |
| **Code Visibility** | Hidden in policies | Explicit in queries |
| **Auditability** | Requires policy review | Visible in git commits |
| **Testing** | Requires database setup | Easy unit tests |
| **Performance** | Database overhead | ORM handles filtering |
| **Works with Prisma** | ❌ No | ✅ Yes |

---

## Migration Checklist

### Phase 1: Frontend → API Endpoints
- [x] Remove Supabase client calls from components
- [x] Create `/api/*` endpoints for all data access
- [x] Update components to `fetch('/api/*')`

### Phase 2: Server Pages → Prisma
- [x] Replace Supabase queries with Prisma in server components
- [x] Add session-based filtering where needed
- [x] Test that pages still render correctly

### Phase 3: API Routes → Prisma + Session Filtering
- [x] Migrate all API routes to use Prisma
- [x] Add session extraction to every user-data route
- [x] Apply `where: { userId }` to all user-owned queries
- [x] Test that users only see their own data

### Phase 4: Database Cleanup (Optional)
- [ ] Log in to Supabase Dashboard
- [ ] Go to Authentication → Policies
- [ ] Disable RLS for tables that only use API access:
  - `visits` (API-only)
  - `reviews` (API-only)
  - `user_quiz_attempts` (API-only)
  - `user_badges` (API-only)
  - `profiles` (API-only)
- [ ] Keep reference data open (or disable RLS):
  - `stations` (public)
  - `attractions` (public)
  - `quizzes` (public)
  - `badges` (public)

---

## Validation: How to Verify Security

### Test 1: Session-Based Filtering Works

```bash
# Get your session token
curl -X GET "http://localhost:3000/api/visits/history" \
  -H "Cookie: better-auth.session_token=YOUR_TOKEN"

# Should return YOUR visits only
# {
#   "visits": [
#     { "siteId": "...", "name": "MRT Station A", "visitedAt": "..." },
#     ...
#   ]
# }
```

### Test 2: Unauthorized Access Blocked

```bash
# Request without session
curl -X GET "http://localhost:3000/api/visits/history"

# Should return 401
# { "error": "Unauthorized" }
```

### Test 3: Cannot Spoof User ID

```bash
# Try to create a visit for another user
curl -X POST "http://localhost:3000/api/visits/checkin" \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=USER_A_TOKEN" \
  -d '{ "attractionId": "site-123", "userId": "USER_B_ID" }'

# The userId from request body is IGNORED
# Visit is created with userId from session (USER_A)
# User A's token → Visit created for User A (not User B)
```

---

## Code Review Checklist

When adding new user-data endpoints, ensure:

- [ ] Route has auth check: `if (!session?.user?.id) return 401`
- [ ] `userId` extracted from session: `const userId = session.user.id`
- [ ] All user-data queries filtered: `where: { userId, ... }`
- [ ] No `userId` from request body: `const userId = body.userId` ❌
- [ ] Reference data has no filter: `prisma.badge.findMany()`
- [ ] Error handling includes logging: `console.error('[route] Error:', error)`

### Example: Adding a New API Route

```ts
// app/api/reviews/create/route.ts
import { auth } from '@/utils/auth';
import { prisma } from '@/utils/prisma';

export async function POST(request: NextRequest) {
  try {
    // ✅ Extract session
    const session = await auth.api.getSession({ headers: request.headers });

    // ✅ Verify auth
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Get userId from session
    const userId = session.user.id;

    // Parse request
    const { attractionId, rating, comment } = await request.json();

    // ✅ Validate input
    if (!attractionId || !rating) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // ✅ Create with userId filter
    const review = await prisma.review.create({
      data: {
        userId,  // ← From session, not request body
        siteId: attractionId,
        rating,
        comment,
      },
    });

    return NextResponse.json({ reviewId: review.id });
  } catch (error) {
    console.error('[reviews/create] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

---

## FAQ

### Q: Why not just use Supabase's built-in user context?

**A:** Supabase's user context only works when using a **user JWT**, not a service role key. Since we're using Prisma (which requires a connection string) in API routes, we use Better Auth's session extraction instead. This is equivalent but more framework-agnostic.

### Q: Is session-based filtering as secure as RLS?

**A:** Yes, arguably **more secure** because:
1. Code is explicit (easier to audit)
2. Works consistently across all routes (no bypasses)
3. Testable without database setup
4. No risk of policy misconfiguration

### Q: Can we still use Supabase client in some places?

**A:** Not for user data. Supabase client bypasses authentication in API routes. Use Prisma for all data access and extract `userId` from Better Auth session.

### Q: Do we need to update @supabase/ssr?

**A:** Not anymore. We've migrated to Prisma + Better Auth. The Supabase utilities (`client.ts`, `server.ts`, `middleware.ts`) are legacy and can be removed in a future cleanup.

### Q: How do I add a new table to this security model?

**A:** 
1. If user-owned: Always filter by `where: { userId }` in all queries
2. If reference data: No filter needed
3. Test that users can't access other users' data
4. Add to code review checklist above

---

## References

- [Better Auth Documentation](https://better-auth.com)
- [Prisma ORM Guide](https://www.prisma.io/docs)
- [MRTQuest Architecture](./architecture.md)
- [API Contracts](./api-contracts.md)

---

## Timeline

| Date | Event |
|------|-------|
| Phase 1-3 | Migrated all components, pages, and API routes to Prisma + session filtering |
| Phase 4 | Optional: Disable RLS policies in Supabase (already not being used) |

All changes maintain backward compatibility. No breaking changes for frontend or database schema.
