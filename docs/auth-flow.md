# Auth Flow

MRTQuest uses `@supabase/ssr` to handle authentication. As of the current build, auth is scaffolded but **not yet wired to the UI** — user identity is not passed through any page.

---

## Current State

| File | Status |
|---|---|
| `src/utils/supabase/client.ts` | `createBrowserClient` — ready for sign-in / sign-up calls |
| `src/utils/supabase/server.ts` | `createServerClient` — cookie handlers are **no-ops** (session persistence disabled) |
| `src/utils/supabase/middleware.ts` | Stub — returns `NextResponse.next()` with no auth logic |

Cookie handlers in `server.ts` are intentionally empty stubs:

```ts
cookies: {
  getAll() { return []; },   // never reads the session cookie
  setAll() {},               // never writes the session cookie
}
```

This means all server-side Supabase clients currently run as the **anon** (public) role regardless of whether the user is signed in.

---

## How @supabase/ssr Works (When Wired Up)

`@supabase/ssr` keeps the Supabase session in **HTTP-only cookies** rather than `localStorage`. This makes the session readable server-side — in Server Components, API Routes, and Middleware — without exposing the token to JavaScript.

```
User signs in (browser)
  │
  ├── supabase.auth.signInWithPassword({ email, password })
  │     └── Supabase returns access_token + refresh_token
  │
  └── @supabase/ssr writes tokens into Set-Cookie headers
        └── Cookies: sb-access-token, sb-refresh-token (HTTP-only, Secure)

Subsequent requests
  │
  ├── Next.js Middleware (middleware.ts)
  │     ├── createServerClient() reads cookies from request headers
  │     ├── supabase.auth.getUser()  ← validates token with Supabase servers
  │     ├── If token expired → auto-refreshes and sets new cookies on response
  │     └── Can redirect unauthenticated users to /login
  │
  └── Server Component / Route Handler
        ├── createServerClient() with real cookie read/write handlers
        ├── supabase.auth.getUser()  ← safe — verified server-side
        └── Pass userId down to child components as a prop
```

---

## Planned Implementation

### Step 1 — Wire real cookie handlers in `server.ts`

```ts
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export const createClient = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### Step 2 — Activate middleware session refresh

```ts
// src/utils/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refreshes the session if expired — required for Server Components
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### Step 3 — Read the user in pages

```ts
// In any async Server Component or page.tsx
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

// Pass userId as a prop — never trust client-provided IDs
const userId = user?.id ?? null
```

---

## Security Notes

- Always use `supabase.auth.getUser()` server-side to verify identity.
  `getSession()` trusts the cookie without re-validating with Supabase servers
  and **must not** be used for authorization decisions.
- The `anon` key is public and safe to expose. It only grants access to rows
  permitted by your Postgres **Row Level Security (RLS)** policies.
- Enable RLS on all user-data tables before going to production:
  `visits`, `reviews`, `user_badges`, `user_quiz_attempts`, `profiles`.
- Never pass raw user IDs from the client as trusted input — always derive
  `userId` from `supabase.auth.getUser()` on the server.
