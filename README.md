# MRTQuest (MRT Heritage Explorer)

This project is a Next.js app that is currently being built as a serverless MVP for exploring MRT stations and nearby heritage sites.

## Current Status

### ✅ Done
- Project initialized as a Next.js app using `create-next-app`.
- Package manager: `pnpm`.
- Core dependencies installed: `next`, `react`, `react-dom`, Supabase client packages.
- Supabase selected as the backend database for the MVP.
- A Supabase helper structure is being prepared under `src/utils/supabase/`.

### ⚠️ In progress
- Tailwind CSS setup is present but not fully configured for this project yet.
- `tailwindcss` is currently installed as v4, which does not support `tailwindcss init -p` the old way.
- Supabase auth and database schema still need to be connected and finalized.

## Tech Stack
- Next.js (App Router)
- React 19
- pnpm
- Supabase (Postgres, auth, storage)
- Tailwind CSS (pending final config)

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
2. Create Supabase tables: `stations`, `heritage_sites`, `users`, etc.
3. Build Supabase client helpers (`src/lib/supabase-client.ts` / `src/lib/supabase-server.ts`).
4. Add API routes for stations and heritage sites.
5. Render the MRT map and station discovery UI.

## Notes
- The app is intended to remain serverless; Supabase handles persistence.
- Use `pnpm` for installs and commands.
- The app will be deployed on a serverless host such as Vercel.
