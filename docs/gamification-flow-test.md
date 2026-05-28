# Gamification Flow Test

End-to-end test plan for verifying XP accumulation, level progression, and streak tracking.

> **Prerequisites:** A fresh user registration (or reset `profiles` row for an existing user to `total_xp=0`, `current_level=1`, `current_streak=0`, `last_visit_date=null`).

---

## Step 1 — Register / Sign In

- Navigate to `/login` and sign up or sign in with Google/email.
- **Verify:** A `profiles` row is created on first mutating action (check-in or quiz).
- Initial state: `total_xp=0`, `current_level=1`, `current_streak=0`.

---

## Step 2 — Geofence Check-in

- Navigate to a station page with an attraction.
- Walk within 300m (or mock coordinates), tap "Check In Now".
- **API:** `POST /api/visits/checkin  { "attractionId": "..." }`
- **Expected response:** `{ "visitId": "...", "alreadyCheckedIn": false, "newBadges": [...] }`
- **DB verification:**
  ```sql
  SELECT total_xp, current_level, current_streak, last_visit_date
  FROM profiles WHERE id = '<userId>';
  ```
  - `total_xp` = 5
  - `current_level` = 1 (5 XP is within 0–100 range)
  - `current_streak` = 1 (first check-in)
  - `last_visit_date` ≈ current timestamp

---

## Step 3 — Duplicate Check-in (Idempotency)

- Attempt the same check-in again.
- **API:** `POST /api/visits/checkin  { "attractionId": "..." }`
- **Expected response:** `{ "visitId": "...", "alreadyCheckedIn": true }`
- **DB verification:** `total_xp` still 5 (not incremented). No duplicate `Visit` row.

---

## Step 4 — Photo Verification

- (If the attraction has `has_photo_challenge = true`) Capture and submit a photo.
- **API:** `POST /api/visits/verify-photo  { "attractionId": "...", "base64Image": "...", "userLatitude": ..., "userLongitude": ... }`
- **Expected response:** `{ "success": true, "visitId": "...", "pointsAwarded": 8, ... }`
- **DB verification:**
  - `total_xp` = 13 (5 + 8)
  - `current_level` = 1 (13 XP, still in L1 range)

---

## Step 5 — Duplicate Photo Verification

- Submit the same photo again.
- **Expected response:** `{ "success": true, "visitId": "...", "alreadyVerified": true }`
- **DB verification:** `total_xp` still 13. No duplicate `Visit` with `verificationType: 'photo'`.

---

## Step 6 — Quiz Submission

- Navigate to the quiz page for an attraction, answer questions.
- **API:** `POST /api/quiz/submit  { "attractionId": "...", "answers": { "<quizId>": "<answer>", ... } }`
- **Expected response:**
  ```json
  {
    "success": true,
    "totalQuestions": <N>,
    "correctCount": <M>,
    "totalPoints": <sum of quiz.points for correct>,
    "results": [...],
    "newBadges": [...]
  }
  ```
- **DB verification (assuming 3 correct answers):**
  - `total_xp` = 13 + (3 × 2) = 19
  - `current_level` = 1 (19 XP)

---

## Step 7 — Level Progression Test

- Repeat steps 2–6 until `total_xp` crosses 100.
- **At `total_xp` = 101:**
  - `current_level` should switch to 2 ("Merdeka Wanderer")
- **At `total_xp` = 301:**
  - `current_level` should switch to 3 ("Klang Valley Master")

---

## Step 8 — Streak Continuation

**Day 1:**
- First check-in → `current_streak = 1`

**Day 2 (next calendar day):**
- Another check-in → `current_streak = 2`

**Same day (as Day 2):**
- Another check-in → `current_streak` stays 2 (no double-count)

**Day 4 (gap of 1 day skipped):**
- Check-in after 2-day gap → `current_streak` resets to 1

---

## Step 9 — Passport API Consistency

- **API:** `GET /api/passport`
- **Expected response check:**
  ```json
  {
    "totalXp": <matches DB>,
    "currentLevel": <matches calculateLevel(totalXp)>,
    "currentStreak": <matches DB>,
    "lastVisitDate": "<ISO string or null>",
    "visitCount": <count of distinct Visit rows>,
    "badgeCount": <count of UserBadge rows>,
    ...
  }
  ```
- **Verify level correctness:** `currentLevel` matches `calculateLevel(totalXp)` from `src/utils/gamification.ts`.

---

## Step 10 — Explore Page Display

- Navigate to `/` (explore page).
- **Verify:**
  - Level badge (top-right) shows `Lv.{currentLevel}` matching the API
  - EXP progress card shows `{totalXp} XP` with correct progress bar width
  - For Lv.3+: shows "Max Level" instead of "XP to go"
  - Badges stat card shows real `badgeCount` (not hardcoded 0)
  - Streak stat card shows real `currentStreak`

---

## Step 11 — Passport Page Display

- Navigate to `/passport`.
- **Verify:**
  - `LevelProgress` component shows the same level as the API's `currentLevel`
  - XP display matches `totalXp` from API
  - Progress bar shows correct percentage toward next level
  - Rank label (under user name) matches level name:
    - Lv.1 → "City Explorer"
    - Lv.2 → "Merdeka Wanderer"
    - Lv.3 → "Klang Valley Master"
  - Day Streak stat shows real `currentStreak` from API (not `recentVisits.length`)

---

## API Reference for Testing

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/passport` | Fetch XP, level, streak, visits, badges |
| `POST` | `/api/visits/checkin` | Geofence check-in (+5 XP, streak update) |
| `POST` | `/api/visits/verify-photo` | Photo verification (+8 XP) |
| `POST` | `/api/quiz/submit` | Quiz submission (+2 XP per correct) |
| `GET` | `/api/stations` | Station/attraction catalog |
