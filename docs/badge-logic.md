# Badge Logic Documentation

This document defines the badge schema, business logic, and UI implementation for badge awarding in MRTQuest.

## Implementation Status

### ✅ Completed
- Badge display system with 5-tab filtering (All, Earned, Featured, Stamps, Quests)
- Three-category badge organization (Featured, Stamps, Quests)
- Better Auth integration for user session tracking
- Supabase schema with corrected field names (`criteria_target` instead of `criter_target`)
- Badge fetching and grouping logic

### 🚧 In Progress / To-Do
- Badge awarding engine (post-action evaluation)
- Integration points for award triggers (check-in, review, quiz submission)
- API routes for visits, reviews, and quiz attempts
- Toast/modal UI for newly earned badges

---

## Schema Reference

### `badges` Table

```sql
CREATE TABLE public.badges (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  icon text,
  criteria_type text NOT NULL,
  criteria_value smallint,
  criteria_target text,
  station_id uuid,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT badges_pkey PRIMARY KEY (id),
  CONSTRAINT badges_station_id_fkey FOREIGN KEY (station_id) REFERENCES public.stations(id)
);
```

**Fields:**
- `id`: Badge UUID
- `name`: Human-friendly badge label (e.g., "Kajang Conqueror")
- `description`: What the badge represents and how to unlock it
- `icon`: Emoji or Unicode icon identifier
- `criteria_type`: Category of unlock logic (see **Criteria Types** below)
- `criteria_value`: Numeric target for the criteria (threshold or count)
- `criteria_target`: Target metadata (line name, category, station UUID, time condition, etc.)
- `station_id`: Optional reference to specific station (for `station_stamp` badges)

### `user_badges` Table

```sql
CREATE TABLE public.user_badges (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL,
  earned_at timestamp without time zone DEFAULT now(),
  CONSTRAINT user_badges_pkey PRIMARY KEY (id),
  CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT user_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(id) ON DELETE CASCADE,
  CONSTRAINT user_badges_unique UNIQUE(user_id, badge_id)
);
```

**Fields:**
- `user_id`: The user who earned the badge (from Better Auth)
- `badge_id`: Reference to the badge definition
- `earned_at`: Timestamp when the badge was awarded (defaults to now)

---

## Badge Criteria Types

The system supports **8 criteria types** that can be mixed and matched to create flexible badge requirements:

| **Type** | **Trigger** | **criteria_value** | **criteria_target** | **Description** |
|----------|------------|-------------------|-------------------|---|
| `visit_count` | User visits attraction | N (count) | `null` or category/line | Award when user reaches N total/scoped visits |
| `line_master` | User visits attractions | All stations on line | `Kajang Line` / `Putrajaya Line` | Award when user visits all stations on a line |
| `station_stamp` | User visits station | 1 | Station UUID | Award for visiting a specific station |
| `quiz_master` | User answers quiz correctly | N (count) | `site_id` or `all` | Award after N correct quiz attempts |
| `first_review` | User submits review | 1 | `null` | Award after first review submission |
| `photo_review` | User submits photo review | N (count) | `has_image` | Award after N reviews with images |
| `time_check` | User checks in during time window | Hour (0-23) | `before` or `after` | Award for check-in before/after specific hour |
| `multi_line` | User checks in across lines | Line count | `line1, line2, ...` | Award when user visits N different lines |

---

## Frontend Display Organization

Badges are organized into **3 display categories** on the badge page for better UX:

### 1. Featured Achievements 👑
- **Criteria Types:** `line_master`, `milestone`
- **Purpose:** Major accomplishments and line mastery
- **Visual:** Crown icon, amber color
- **Examples:** "Kajang Conqueror", "Putrajaya Pioneer"

### 2. Station Stamps 🎫
- **Criteria Types:** `station_stamp`
- **Purpose:** Collect stamps from iconic stations
- **Visual:** Ticket icon, blue color
- **Examples:** "Pasar Seni Stamp", "TRX Trailblazer", "Merdeka Medal"

### 3. Special Quests ⚡
- **Criteria Types:** `time_check`, `multi_line`, `photo_review`, `quiz_master`
- **Purpose:** Challenge badges with special conditions
- **Visual:** Zap icon, purple color
- **Examples:** "Golden Hour Guest", "Mind The Gap", "Heritage Scholar"

### Tab Filtering System

**5 tabs** on the badge page for flexible viewing:

| **Tab** | **Shows** | **Purpose** |
|---------|-----------|-----------|
| **All** | All badges across all categories | See full collection |
| **Earned** | Only badges user has earned | View achievements |
| **Featured** | Line mastery badges only | Focus on major milestones |
| **Stamps** | Station-specific badges only | Collect station achievements |
| **Quests** | Challenge badges only | Track special quests |

**Implementation:** Sticky tab bar in `/app/badge/page.tsx` with dynamic filtering, no page reload

---

## Current Badge Examples

### Featured Achievements (Line Mastery)

| Badge Name | criteria_type | criteria_value | criteria_target | Icon |
|----------|---|---|---|---|
| Kajang Conqueror | `line_master` | 29 | `Kajang Line` | 🟢 |
| Putrajaya Pioneer | `line_master` | 36 | `Putrajaya Line` | 🟡 |

### Station Stamps (Collection)

| Badge Name | criteria_type | criteria_target | Icon |
|----------|---|---|---|
| Pasar Seni Stamp | `station_stamp` | `[pasar_seni_id]` | 🎨 |
| Merdeka Medal | `station_stamp` | `[merdeka_id]` | 🇲🇾 |
| TRX Trailblazer | `station_stamp` | `[trx_id]` | 💎 |
| Bukit Bintang Stamp | `station_stamp` | `[bukit_bintang_id]` | 🏙️ |

### Special Quests (Challenges)

| Badge Name | criteria_type | criteria_value | criteria_target | Icon |
|----------|---|---|---|---|
| Heritage Scholar | `quiz_master` | 10 | `all` | 🎓 |
| Golden Hour Guest | `time_check` | 18 | `after` | 🌅 |
| Mind The Gap | `multi_line` | 2 | `Kajang, Putrajaya` | 🚇 |
| Aesthetic Alchemist | `photo_review` | 5 | `has_image` | 📸 |

### Visit Count Badges (Progress)

| Badge Name | criteria_type | criteria_value | criteria_target | Icon |
|----------|---|---|---|---|
| First Stamp | `visit_count` | 1 | `null` | 🎫 |
| Urban Legend | `visit_count` | 50 | `null` | 🏆 |
| Masjid Hopper | `visit_count` | 3 | `Mosque` | 🕌 |
| Stair Master | `visit_count` | 3 | `Deep Stations` | 🧗 |

---

## Badge Display Logic (Current Implementation)

**File:** `/app/badge/page.tsx`

### User Authentication

Uses **Better Auth** for session management (not Supabase auth):

```typescript
import { useSession } from '@/utils/auth-client';

const { data: session } = useSession();
const currentUserId = session?.user?.id ?? '';
```

### Badge Fetching

Fetches from Supabase with relationships:

```typescript
const supabase = createClient();

const query = supabase
  .from('badges')
  .select('id,name,description,icon,criteria_type,criteria_value,criteria_target,station_id,stations(active),user_badges(earned_at,user_id)')
  .order('name', { ascending: true });

const { data: badges } = await query;
```

### Badge Categorization

```typescript
const categorizedBadges = useMemo(() => {
  return {
    featured: badges.filter((b) => ['line_master', 'milestone'].includes(b.criteria_type ?? '')),
    stamps: badges.filter((b) => b.criteria_type === 'station_stamp'),
    quests: badges.filter((b) => ['time_check', 'multi_line', 'photo_review', 'quiz_master'].includes(b.criteria_type ?? '')),
  };
}, [badges]);
```

### Tab Filtering

Dynamic filtering based on selected tab:

```typescript
const filteredBadgesForTab = useMemo(() => {
  switch (activeTab) {
    case 'earned': {
      const earned = badges.filter((b) => b.user_badges?.length);
      return categorizeByType(earned);
    }
    case 'featured':
      return { featured: categorizedBadges.featured, stamps: [], quests: [] };
    case 'stamps':
      return { featured: [], stamps: categorizedBadges.stamps, quests: [] };
    case 'quests':
      return { featured: [], stamps: [], quests: categorizedBadges.quests };
    default:
      return categorizedBadges;
  }
}, [activeTab, badges]);
```

### Earned Badge Detection

A badge is marked as "earned" if it has at least one `user_badges` record:

```typescript
badge.user_badges?.length > 0
```

---

## Badge Awarding Workflow (To Be Implemented)

The badge awarding system will follow a **"Post-Action Check"** pattern for efficiency:

1. **User performs action** → Check-in, review submission, or quiz attempt
2. **Record inserted** → Data added to `visits`, `reviews`, or `user_quiz_attempts`
3. **Evaluation triggered** → Call `evaluateBadges(userId)` server action
4. **Criteria evaluated** → Each badge type checked against user data
5. **Award badge** → Insert new row to `user_badges` if criteria met
6. **Notify user** → Return newly earned badges to frontend

### Files to Create

- `/src/utils/badges.ts` — Badge evaluation engine with `evaluateBadges()` function
- `/app/api/visits/route.ts` — Trigger on check-in
- `/app/api/reviews/route.ts` — Trigger on review submission
- `/app/api/quizzes/attempt/route.ts` — Trigger on quiz attempt

### Pseudo-code Example

```typescript
export async function evaluateBadges(userId: string) {
  const { data: badges } = await supabase.from('badges').select('*');
  const newBadges = [];

  for (const badge of badges) {
    // Skip if already earned
    const { data: existing } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', userId)
      .eq('badge_id', badge.id)
      .limit(1);
    
    if (existing?.length) continue;

    // Evaluate badge criteria
    const isMet = await evaluateCriteria(userId, badge);
    
    if (isMet) {
      await supabase.from('user_badges').insert({
        user_id: userId,
        badge_id: badge.id,
      });
      newBadges.push(badge);
    }
  }

  return newBadges; // Return to frontend for notification
}
```

---

## Architecture Notes

### Best Practices

- **Don't recalculate on view:** Only award badges when users take actions. Keep the display page fast by reading from `user_badges`.
- **Use `active` field:** Filter stations by `active=true` when evaluating `line_master` and `station_stamp` badges.
- **Use `sequence_order`:** Display stations in correct order using the `sequence_order` field from stations table.
- **Avoid complex workers:** Post-action evaluation is sufficient for this app scale.

### Extensibility

Add new badge types without UI changes:
1. Insert badge record in database with new `criteria_type`
2. Add evaluation function to `evaluateCriteria()` switch statement
3. **Done!** The display system automatically handles categorization based on `criteria_type`

### Field Naming

- ✅ `criteria_target` (corrected from legacy `criter_target`)
- All code and documentation updated to use correct field name

### Authentication

- ✅ Better Auth integrated for session management
- Uses `session?.user?.id` for user identification
- Not using Supabase auth for this feature
