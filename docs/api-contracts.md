# API Contracts

All Supabase data shapes used by the application, plus the internal REST API.

---

## Internal API Routes

### `POST /api/suggestions`

Submit a new attraction for review. Inserts into `attractions` with `is_verified: false`.

**Request body**

```json
{
  "name": "Masjid Negara",
  "description": "National mosque of Malaysia with capacity for 15,000 worshippers.",
  "stationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | `string` | Yes | Non-empty after trim |
| `description` | `string` | Yes | Non-empty after trim |
| `stationId` | `string` (UUID) | Yes | Must match a row in `stations` |

**Success response — 200**

```json
{
  "message": "Suggestion submitted successfully",
  "data": [
    {
      "id": "uuid",
      "name": "Masjid Negara",
      "description": "National mosque...",
      "station_id": "a1b2c3d4-...",
      "is_verified": false,
      "created_at": "2026-04-25T10:00:00.000Z"
    }
  ]
}
```

**Error responses**

| Status | Body | Cause |
|---|---|---|
| `400` | `{ "error": "Attraction name is required" }` | Missing or blank `name` |
| `400` | `{ "error": "Description is required" }` | Missing or blank `description` |
| `400` | `{ "error": "Station ID is required" }` | Missing `stationId` |
| `500` | `{ "error": "Failed to submit suggestion" }` | Supabase insert error |
| `500` | `{ "error": "Internal server error" }` | Unexpected thrown exception |

---

## Supabase Query Shapes

### Stations list — Explore page

**Query**
```ts
supabase
  .from('stations')
  .select('id, name, sequence_order, active')
  .eq('line', lineName)
  .order('sequence_order')
```

**Row shape**
```ts
{
  id: string            // UUID
  name: string          // e.g. "Kajang"
  sequence_order: number
  active: boolean
}
```

---

### Station name + attractions — Station detail page

**Station query**
```ts
supabase.from('stations').select('name').eq('id', stationId).single()
```
```ts
{ name: string }
```

**Attractions query**
```ts
supabase
  .from('attractions')
  .select('id, name, description, image_url, google_map')
  .eq('station_id', stationId)
  .order('name', { ascending: true })
```

**Row shape**
```ts
{
  id: string
  name: string
  description: string | null
  image_url: string | null   // absolute URL or null
  google_map: string | null  // Google Maps share URL or null
}
```

**Mapped to `AttractionCard` props**
```ts
{
  id: string
  name: string
  description: string   // falls back to "No description available."
  image?: string        // undefined when null
  googleMap?: string    // undefined when null
}
```

---

### Badges list — Badge page

**Query**
```ts
supabase
  .from('badges')
  .select('id, name, description, icon, criteria_type, criteria_value, criter_target, station_id, stations(active), user_badges(earned_at, user_id)')
```

**Row shape**
```ts
{
  id: string
  name: string
  description: string | null
  icon: string | null
  criteria_type: string | null  // "visit_count" | "line_master" | "quiz_master" | "first_review" | "frequent_traveler"
  criteria_value: number | null
  criter_target: string | null  // line name, category, or attraction id
  station_id: string | null
  stations: { active: boolean }[] | null
  user_badges: { earned_at: string; user_id: string }[]
}
```

A badge is **earned** when `user_badges` contains a row matching the current user's ID.
A badge is **visible** only when `stations[0].active === true` or `station_id` is null.

---

### Stations dropdown — Suggestion form

**Query**
```ts
supabase.from('stations').select('id, name').order('name')
```

**Row shape**
```ts
{ id: string; name: string }[]
```

---

## Planned Query Shapes (Not Yet Implemented)

### Check-in (visits insert)

```ts
supabase.from('visits').insert({ user_id: userId, site_id: attractionId })
```

### Review insert

```ts
supabase.from('reviews').insert({ user_id: userId, site_id: attractionId, rating, comment })
```

### User visits count (Passport page)

```ts
supabase
  .from('visits')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', userId)
```

### Earned badges (Passport page)

```ts
supabase
  .from('user_badges')
  .select('badge_id, earned_at, badges(name, icon)')
  .eq('user_id', userId)
  .order('earned_at', { ascending: false })
```
