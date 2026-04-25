-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =========================
-- PROFILES (extends auth.users)
-- =========================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  avatar_url text,
  created_at timestamp default now()
);

-- =========================
-- STATIONS
-- =========================
create table stations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  line text not null,
  latitude double precision,
  longitude double precision,
  created_at timestamp default now()
);

-- =========================
-- ATTRACTIONS
-- =========================
create table attractions (
  id uuid primary key default uuid_generate_v4(),
  station_id uuid references stations(id),
  name text not null,
  description text,
  latitude double precision,
  longitude double precision,
  image_url text,
  created_at timestamp default now(),
  google_map text,
  is_verified boolean default false
);

-- =========================
-- REVIEWS
-- =========================
create table reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  site_id uuid references attractions(id) on delete cascade,
  rating int check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp default now()
);

-- =========================
-- VISITS
-- =========================
create table visits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  site_id uuid references attractions(id) on delete cascade,
  visited_at timestamp default now()
);

-- =========================
-- QUIZZES
-- =========================
create table quizzes (
  id uuid primary key default uuid_generate_v4(),
  site_id uuid references attractions(id) on delete cascade,
  question text not null,
  correct_answer text not null
);

-- =========================
-- USER QUIZ ATTEMPTS
-- =========================
create table user_quiz_attempts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  quiz_id uuid references quizzes(id) on delete cascade,
  is_correct boolean,
  attempted_at timestamp default now()
);

-- =========================
-- BADGES
-- =========================
create table badges (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  icon text
);

-- =========================
-- USER BADGES
-- =========================
create table user_badges (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  badge_id uuid references badges(id) on delete cascade,
  earned_at timestamp default now()
);