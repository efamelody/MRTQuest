USER OPENS STATION PAGE
        │
        ▼
[StationPage — Server Component]
  • Fetches stations, attractions, quizzes from Supabase (service role key)
  • Groups quizzes by attraction ID
  • Passes data down as props to StationSitesList → AttractionCard
        │
        ▼
[AttractionCard — Client Component]
  • On mount, calls useAttractionVerification hook
        │
        ├─── CHECK 1: Restore persisted state ──────────────────────────┐
        │    POST /api/visits/check-status                              │
        │    (Prisma + better-auth session)                             │
        │    → returns { isCheckedIn, isPhotoVerified }                 │
        │    → if isCheckedIn → skip to PHASE: checked-in              │
        │                                                               │
        ├─── CHECK 2: Get user's GPS location                          │
        │    navigator.geolocation.getCurrentPosition()                 │
        │    → calculates distance to attraction lat/lng                │
        │                                                               ▼
        ▼                                                  ┌──────────────────────────┐
   distance > checkInRadius (default 300m)?                │  PHASE: checked-in       │
        │                                                  │  "Visit Confirmed" stamp │
        ├── YES → PHASE: outside                           │                          │
        │         Shows: "Get Directions" button           │  ⭐ Bonus Challenges      │
        │         Shows: distance in meters                │  (shown if available)    │
        │                                                  │                          │
        └── NO  → PHASE: inside                           │  ① Verify Landmark       │
                  Shows: "You have arrived!"               │     (hasPhotoChallenge)  │
                  Shows: "Check In Now" button             │     → renders inline     │
                       │                                   │       PhotoCaptureButton │
                       ▼                                   │     → POST /api/visits/  │
                  "Check In Now"                           │       verify-photo       │
                  POST /api/visits/checkin                 │     → Gemini AI validates│
                  (Prisma + better-auth session)           │     → +8 pts on success  │
                  • Ensures profile row exists (upsert)   │                          │
                  • Prevents duplicate geofence visits    │  ② Start Quiz Challenge  │
                  • verificationType: 'geofence'          │     (hasQuizChallenge)   │
                  • on success: isCheckedIn = true        │     → router.push to     │
                       │                                   │       /quiz/[id]         │
                       └──────────────────────────────────┘
                                                           
                                                           
[Quiz Page — /quiz/[attractionId]]
  • Server Component
  • Verifies better-auth session (redirects to /login if not authed)
  • Checks for geofence visit via Prisma (shows locked state if not checked in)
  • Fetches attraction + quizzes via createServiceClient
  • Renders QuizCard
        │
        ▼
[QuizCard — Client Component]
  • User picks answers
  • POST /api/quiz/submit
  • Ensures profile row exists (upsert) before writing
  • Upserts userQuizAttempt (userId_quizId compound key — allows re-attempts)
  • Shows correct/wrong + points earned per question