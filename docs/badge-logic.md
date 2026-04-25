# Badge Logic Documentation

This document defines the badge schema and the business logic for badge awarding in MRTQuest.

> WARNING: This schema is for context only and is not meant to be run. Table order and constraints may not be valid for execution.

## Schema Reference

### `badges`

```sql
CREATE TABLE public.badges (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  icon text,
  criteria_type text,
  criteria_value smallint,
  criter_target text,
  CONSTRAINT badges_pkey PRIMARY KEY (id)
);
```

- `id`: Badge UUID.
- `name`: Human-friendly badge label.
- `description`: What the badge represents or how to unlock it.
- `icon`: Optional emoji or icon identifier.
- `criteria_type`: The category of unlock logic.
- `criteria_value`: Numeric target for the criteria.
- `criter_target`: Target metadata for the criteria (line name, site ID, category, etc.).

### `user_badges`

```sql
CREATE TABLE public.user_badges (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  badge_id uuid,
  earned_at timestamp without time zone DEFAULT now(),
  CONSTRAINT user_badges_pkey PRIMARY KEY (id),
  CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(id)
);
```

- `user_id`: The user who earned the badge.
- `badge_id`: The badge definition.
- `earned_at`: Timestamp when the badge was awarded.

## Supporting Tables

### `stations`

```sql
CREATE TABLE public.stations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  line text NOT NULL,
  latitude double precision,
  longitude double precision,
  created_at timestamp without time zone DEFAULT now(),
  sequence_order integer,
  CONSTRAINT stations_pkey PRIMARY KEY (id)
);
```

### `attractions`

```sql
CREATE TABLE public.attractions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  station_id uuid,
  name text NOT NULL,
  description text,
  latitude double precision,
  longitude double precision,
  image_url text,
  created_at timestamp without time zone DEFAULT now(),
  google_map text,
  category text,
  CONSTRAINT attractions_pkey PRIMARY KEY (id),
  CONSTRAINT attractions_station_id_fkey FOREIGN KEY (station_id) REFERENCES public.stations(id)
);
```

### `visits`

```sql
CREATE TABLE public.visits (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  site_id uuid,
  visited_at timestamp without time zone DEFAULT now(),
  CONSTRAINT visits_pkey PRIMARY KEY (id),
  CONSTRAINT visits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT visits_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.attractions(id)
);
```

### `quizzes`

```sql
CREATE TABLE public.quizzes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  site_id uuid,
  question text NOT NULL,
  correct_answer text NOT NULL,
  CONSTRAINT quizzes_pkey PRIMARY KEY (id),
  CONSTRAINT quizzes_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.attractions(id)
);
```

### `user_quiz_attempts`

```sql
CREATE TABLE public.user_quiz_attempts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  quiz_id uuid,
  is_correct boolean,
  attempted_at timestamp without time zone DEFAULT now(),
  CONSTRAINT user_quiz_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT user_quiz_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_quiz_attempts_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id)
);
```

## Badge Criteria Types

This schema supports flexible badge requirements using `criteria_type`, `criteria_value`, and `criter_target`.

### Common badge criteria

- `visit_count`
  - award after a user visits a number of attractions.
  - `criteria_value`: number of unique attraction visits.
  - `criter_target`: optional category or line.

- `line_master`
  - award when a user has visited every station or every attraction on a line.
  - `criteria_value`: total number of required stations or sites.
  - `criter_target`: line name (e.g. `Kajang Line` or `Putrajaya Line`).

- `quiz_master`
  - award when a user answers a site quiz correctly.
  - `criteria_value`: number of correct attempts required.
  - `criter_target`: site ID or site category.

- `first_review`
  - award after the first review is submitted.
  - `criteria_value`: typically `1`.
  - `criter_target`: optional site ID or category.

- `frequent_traveler`
  - award after visiting multiple sites or returning multiple times.
  - `criteria_value`: threshold count.
  - `criter_target`: optional time frame or line.

## Example Badge Definitions

```sql
INSERT INTO public.badges (name, description, icon, criteria_type, criteria_value, criter_target)
VALUES
  ('Kajang Line Master', 'Visit every station on the Kajang Line.', '🥇', 'line_master', 10, 'Kajang Line'),
  ('Putrajaya Explorer', 'Visit 5 attractions on the Putrajaya Line.', '🥈', 'visit_count', 5, 'Putrajaya Line'),
  ('Attraction Scholar', 'Answer all quizzes correctly for one attraction.', '🎓', 'quiz_master', 1, 'site'),
  ('Frequent Traveler', 'Visit 20 attractions overall.', '✈️', 'visit_count', 20, NULL);
```

## Badge Fetch Logic

The app should fetch all badge definitions and overlay user progress from `user_badges`.

### Recommended query pattern

```sql
SELECT
  b.*,
  ub.earned_at
FROM public.badges b
LEFT JOIN public.user_badges ub
  ON ub.badge_id = b.id
  AND ub.user_id = :current_user_id;
```

In Supabase JavaScript:

```js
const { data, error } = await supabase
  .from('badges')
  .select('*, user_badges(earned_at)')
  .eq('user_badges.user_id', currentUserId);
```

## Awarding Logic Examples

### 1. Visit count badge

Check if user has `criteria_value` unique visits.

```sql
SELECT COUNT(DISTINCT v.site_id) AS visit_count
FROM public.visits v
WHERE v.user_id = :current_user_id;
```

### 2. Line master badge

For a line-based badge, compare visited stations against the lines station count.

```sql
WITH line_stations AS (
  SELECT id
  FROM public.stations
  WHERE line = 'Kajang Line'
), visited_sites AS (
  SELECT DISTINCT hs.station_id
  FROM public.visits v
  JOIN public.attractions hs ON hs.id = v.site_id
  WHERE v.user_id = :current_user_id
    AND hs.station_id IN (SELECT id FROM line_stations)
)
SELECT COUNT(*) AS visited_count
FROM visited_sites;
```

If `visited_count` matches the lines station count, award the badge.

### 3. Quiz master badge

Award when the user has a correct quiz attempt for the target site or category.

```sql
SELECT COUNT(DISTINCT uqa.quiz_id) AS correct_quizzes
FROM public.user_quiz_attempts uqa
JOIN public.quizzes q ON q.id = uqa.quiz_id
WHERE uqa.user_id = :current_user_id
  AND uqa.is_correct = TRUE
  AND q.site_id = :target_site_id;
```

### 4. First review or frequent traveler

```sql
SELECT COUNT(*) AS review_count
FROM public.reviews
WHERE user_id = :current_user_id;
```

```sql
SELECT COUNT(DISTINCT site_id) AS unique_visits
FROM public.visits
WHERE user_id = :current_user_id;
```

## Badge Awarding Workflow

1. Evaluate each badge definition.
2. Calculate the matching progress.
3. If the user meets or exceeds `criteria_value` and does not already have a `user_badges` row, insert a new badge record.

```sql
INSERT INTO public.user_badges (user_id, badge_id)
VALUES (:current_user_id, :badge_id);
```

## Notes

- `criter_target` has a spelling mismatch in the schema: it should likely be `criteria_target`.
- Use `sequence_order` in `stations` to display line station order correctly in the UI.
- The badge logic can be extended by adding structured criteria metadata or JSON payloads for richer rules.
