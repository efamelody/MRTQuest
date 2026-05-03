# Auth Flow

MRTQuest uses **Better Auth** for authentication and **Supabase** (via `@supabase/ssr`) for database queries only. They are two separate concerns — Better Auth owns identity, Supabase owns data.

---

## Current State

| File | Purpose | Status |
|---|---|---|
| `src/utils/auth.ts` | Better Auth server instance (Google OAuth + email/password) | ✅ Active |
| `src/utils/auth-client.ts` | Better Auth browser client (`useSession`, `signOut`) | ✅ Active |
| `app/api/auth/[...auth]/route.ts` | Better Auth catch-all API handler | ✅ Active |
| `middleware.ts` | Reads `better-auth.session_token` cookie, redirects `/login` if authenticated | ✅ Active |
| `src/utils/supabase/client.ts` | Supabase browser client — data queries only | ✅ Active |
| `src/utils/supabase/server.ts` | Supabase server client — data queries only, no session cookies | ✅ Active |
| `src/utils/supabase/middleware.ts` | Unused stub | ⚠️ Unused |

---

## Sign-in Flow

```
User clicks "Continue with Google" on /login
  │
  ├── authClient.signIn.social({ provider: "google", callbackURL: "/passport" })
  │     └── Browser redirects to Google OAuth consent screen
  │
  ├── Google redirects back to /api/auth/callback/google
  │     └── Better Auth exchanges the OAuth code for tokens
  │         and creates a row in public.ba_user
  │
  └── Better Auth sets cookie: better-auth.session_token (HTTP-only)
        └── Browser is redirected to /passport
```

---

## Session on Subsequent Requests

```
Every page load / navigation
  │
  ├── middleware.ts
  │     ├── Reads better-auth.session_token cookie
  │     ├── If visiting /login while authenticated → redirect to /passport
  │     └── All other routes: pass through
  │
  └── Client Components (e.g. PassportPage, LoginPage)
        └── useSession() calls GET /api/auth/get-session
              └── Returns { user: { id, name, email, image }, session }
```

---

## Reading the Current User

### In Server Components or Async Server Pages

```ts
import { auth } from "@/utils/auth";
import { headers } from "next/headers";

export default async function QuizPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session) {
    notFound();  // or redirect to login
  }
  
  const userId = session.user.id;  // ba_user.id
  const userEmail = session.user.email;
  
  // Now fetch user-specific data with Prisma
  // ...
}
```

[Full example: app/quiz/[attractionId]/page.tsx](app/quiz/[attractionId]/page.tsx)

### In Client Components

```ts
import { useSession } from "@/utils/auth-client";

export function PassportPage() {
  const { data: session, isPending } = useSession();
  
  if (isPending) return <div>Loading...</div>;
  if (!session) return <LoginPrompt />;
  
  const userId = session.user.id;  // ba_user.id
  return <UserProfile userId={userId} />;
}
```

[Full example: app/badge/page.tsx](app/badge/page.tsx)

> `userId` is the Better Auth user ID (`ba_user.id`) which is also `profiles.id`.

---

## Sign-out Flow

```ts
import { signOut } from "@/utils/auth-client";

await signOut({
  fetchOptions: {
    onSuccess: () => router.push("/login"),
  },
});
```

Better Auth clears the `better-auth.session_token` cookie on the server.

---

## Database Identity Chain

Better Auth stores users in `public.ba_user`. All app user data hangs off `public.profiles`, which shares the same `id`:

```
ba_user.id (text)  ←  Better Auth manages this
  └── profiles.id (text)  ← Foreign key constraint
        ├── visits.user_id
        ├── reviews.user_id
        ├── user_badges.user_id
        └── user_quiz_attempts.user_id
```

> A `profiles` row **must** be created for each new user after their first sign-in, using the same `id` as `ba_user.id`. This is enforced by the FK constraint.

---

## Profile Initialization Pattern

Every API mutation that involves user data must first upsert a Profile row. This ensures the FK constraint is satisfied:

```ts
import { prisma } from "@/utils/prisma";
import { auth } from "@/utils/auth";

export async function POST(request: NextRequest) {
  // 1. Extract user from session
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // 2. Ensure profile exists (before any user data mutations)
  await prisma.profile.upsert({
    where: { id: userId },
    update: {},  // No-op if exists
    create: { id: userId },
  });

  // 3. Now safe to create visits, quiz attempts, badges, etc.
  const visit = await prisma.visit.create({
    data: {
      userId,
      siteId: attractionId,
      verificationType: 'geofence',
    },
  });

  return NextResponse.json({ visitId: visit.id });
}
```

[Example: app/api/visits/checkin/route.ts](app/api/visits/checkin/route.ts)

---

## API Route Authentication Pattern

### Template

```ts
import { auth } from "@/utils/auth";
import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // 1. Get session from request headers
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. Parse and validate request
    const body = await request.json();
    if (!body.attractionId) {
      return NextResponse.json(
        { error: 'Missing required field: attractionId' },
        { status: 400 }
      );
    }

    // 3. Ensure profile exists
    await prisma.profile.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId },
    });

    // 4. Perform mutation
    const result = await prisma.visit.create({
      data: {
        userId,
        siteId: body.attractionId,
        verificationType: 'geofence',
      },
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[api-route-name]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## End-to-End: Quiz Submission with Badge Evaluation

Here's how a quiz submission flows through authentication, profile initialization, data storage, and badge evaluation:

```
1. Browser → POST /api/quiz/submit { attractionId, answers }
   └── Client Component collected quiz answers from form

2. API Route (app/api/quiz/submit/route.ts)
   ├── Extract session: await auth.api.getSession({ headers })
   ├── Verify userId (throw 401 if missing)
   │
   ├── Upsert Profile:
   │   await prisma.profile.upsert({
   │     where: { id: userId },
   │     create: { id: userId }
   │   })
   │
   ├── Score each answer:
   │   for each quizId in answers:
   │     const quiz = await prisma.quiz.findUnique({ ... })
   │     const isCorrect = (userAnswer === quiz.correctAnswer)
   │     const pointsEarned = isCorrect ? 50 : 0
   │
   ├── Create UserQuizAttempt records:
   │   await prisma.userQuizAttempt.create({
   │     data: { userId, quizId, isCorrect, pointsEarned }
   │   })
   │
   ├── Evaluate badges (async, not awaited):
   │   await evaluateBadges(userId)
   │     ├── Query all badges
   │     ├── Check user's visit count, quiz attempts, etc.
   │     ├── Determine if user qualifies for any new badges
   │     └── Create UserBadge rows for newly earned badges
   │
   └── Return: { results: [ ... ], newBadges: [ ... ] }

3. Browser receives response
   └── Display quiz results + newly earned badges (if any)
```

[See the full implementation: app/api/quiz/submit/route.ts](app/api/quiz/submit/route.ts)

---

## Key Config

### `src/utils/auth.ts`

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

### Required environment variables

| Variable | Purpose |
|---|---|
| `BETTER_AUTH_SECRET` | Signs session tokens — keep private |
| `BETTER_AUTH_URL` | Server-side base URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Client-side base URL |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (ends in `.apps.googleusercontent.com`) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret (starts with `GOCSPX-`) |
| `DATABASE_URL` | Supabase Postgres connection string used by Prisma |

---

## Security Notes

- Never trust a `userId` from the client request body — always derive it from `useSession()` or the verified Better Auth session endpoint.
- `BETTER_AUTH_SECRET` must stay private — it signs session tokens.
- The Supabase `anon` key is safe to expose client-side. Enable RLS on all user-data tables (`visits`, `reviews`, `user_badges`, `user_quiz_attempts`, `profiles`) before going to production.
- `src/utils/supabase/server.ts` runs as the `anon` role with no session. Do not use it for anything that requires the current user's identity.
