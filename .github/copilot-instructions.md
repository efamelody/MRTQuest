# Copilot Instructions for MRTQuest

## Project Context

MRTQuest is a **Next.js 15+ App Router** application using:
- **Supabase** (Postgres + SSR auth via `@supabase/ssr`)
- **Tailwind CSS v4** (no `tailwind.config.js` — configured via CSS)
- **TypeScript** strict mode
- **pnpm** as the package manager
- Mobile-first layout: max content width `max-w-lg`, sticky header, fixed bottom tab bar

Read `node_modules/next/dist/docs/` before writing any Next.js code. This is not the Next.js you may know — App Router conventions apply throughout.

---

## Code Style Rules

### General
- Write the **simplest code that solves the problem**. No over-engineering.
- One file = one clear responsibility. Never mix data fetching, UI, and business logic in one component.
- Prefer **small, focused components** over large monolithic ones.
- No `console.log` in production code. Use proper error state or throw.
- No hardcoded user IDs, magic strings, or magic numbers — use named constants or derive from data.
- No commented-out code blocks left in files.
- No inline styles (`style={{...}}`). Use Tailwind utility classes only.

### TypeScript
- Always define prop types inline with the component using `interface` or `type`.
- No `any`. Use proper types or `unknown` with a type guard.
- Export types alongside the component if they're needed by parent components.
- Use `satisfies` when narrowing object literals against a type.

### React & Next.js
- Default to **Server Components** (no directive needed). Only add `'use client'` when the component needs:
  - `useState` / `useReducer`
  - `useEffect` / browser APIs
  - Event listeners / interactive handlers
- Do **not** add `'use client'` to a page just to fetch data — use `async` Server Components for that.
- Fetch data in the page/layout, then pass it down as props. Do not fetch inside leaf components.
- For parallel independent fetches, use `Promise.all([ ... ])`.
- Use `notFound()` from `next/navigation` for missing resources (404 handling).

### File & Folder Conventions
```
app/                   → pages and API routes (Next.js App Router)
app/api/               → Route Handlers (server-side API endpoints)
src/components/        → Reusable UI components
src/utils/supabase/    → Supabase client factories (do not put queries here)
```
- Component filenames: `PascalCase.tsx`
- Utility filenames: `camelCase.ts`
- Keep API route handlers thin — validate input, call a utility, return response.

---

## Supabase Patterns

### Which client to use

| Context | Import |
|---|---|
| Client Component (`'use client'`) | `import { createClient } from '@/utils/supabase/client'` |
| Server Component / `page.tsx` | `import { createClient } from '@/utils/supabase/server'` |
| API Route Handler (`app/api/`) | `import { createClient } from '@/utils/supabase/server'` |

### Query style
- Always destructure `{ data, error }` and handle `error` explicitly.
- Select only the columns you need: `.select('id, name, description')` — never `.select('*')`.
- Filter at the database level, not in JavaScript (use `.eq()`, `.in()`, `.filter()`).
- Order results at the database level with `.order('column_name')`.

```ts
// ✅ Good
const { data, error } = await supabase
  .from('stations')
  .select('id, name, active')
  .eq('line', line)
  .order('sequence_order')

if (error) throw new Error(error.message)

// ❌ Bad
const { data } = await supabase.from('stations').select('*')
const filtered = data?.filter(s => s.line === line)
```

### Auth
- The current user is retrieved via `supabase.auth.getUser()` — never trust client-provided user IDs.
- Pass `userId` down from the page as a prop after authenticating server-side.
- Never hardcode user IDs or leave them as empty strings in production paths.

---

## UI Conventions

### Colors (match existing design)
- Primary green: `#00A959` (`bg-[#00A959]`, `text-[#00A959]`)
- Accent yellow: `#FFD520`
- Heading text: `text-fuchsia-300`
- Card backgrounds: `bg-white/70 backdrop-blur-sm`
- Page gradient: `from-pink-50 via-purple-50 to-blue-50`

### Component structure order
```tsx
// 1. Imports
// 2. Types / interfaces
// 3. Component function
//    a. Hooks (top of function body)
//    b. Derived state / computed values
//    c. Handlers
//    d. Early returns (loading, error, empty)
//    e. JSX return
// 4. Export
```

### Modals
- Use `fixed inset-0 z-50 bg-slate-950/70` for the backdrop.
- Always include a close button and handle `Escape` key if the modal has interactive content.
- Do not put data-fetching logic inside a modal — pass data in via props.

### Forms
- Validate all required fields before calling any API.
- Show a loading state on the submit button while the request is in flight.
- Display inline error messages next to the relevant field or at the top of the form.
- On success, provide clear feedback before closing/resetting.

---

## What to Avoid

- ❌ God components — one component doing fetching, state management, and complex rendering all at once
- ❌ Prop drilling more than 2 levels — consider restructuring or colocating state
- ❌ Duplicating fetch logic — if two components need the same data, fetch it once in the parent
- ❌ `useEffect` for data fetching in Server Component pages — use `async` components instead
- ❌ Tailwind class strings longer than ~6 utilities without extracting a named component
- ❌ Adding features, refactoring, or "improvements" that were not asked for
- ❌ Guessing at missing data — if a value is undefined, handle it explicitly

---

## Database Tables Quick Reference

| Table | Purpose |
|---|---|
| `stations` | MRT stations on Kajang / Putrajaya lines |
| `attractions` | Points of interest linked to a station |
| `profiles` | User profiles (extends `auth.users`) |
| `reviews` | User ratings (1–5) and comments on attractions |
| `visits` | Check-in log — user visited an attraction |
| `quizzes` | Quiz questions linked to an attraction |
| `user_quiz_attempts` | Whether a user answered a quiz correctly |
| `badges` | Badge definitions with unlock criteria |
| `user_badges` | Badges earned by each user |
