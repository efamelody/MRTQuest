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

Only use this pattern in `'use client'` components:

```ts
import { useSession } from "@/utils/auth-client";

const { data: session, isPending } = useSession();
const userId = session?.user?.id ?? null;
```

`userId` is the Better Auth user ID (`ba_user.id`) which is also `profiles.id`.

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
  └── profiles.id (text)
        ├── visits.user_id
        ├── reviews.user_id
        ├── user_badges.user_id
        └── user_quiz_attempts.user_id
```

> A `profiles` row must be created for each new user after their first sign-in, using the same `id` as `ba_user.id`.

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
