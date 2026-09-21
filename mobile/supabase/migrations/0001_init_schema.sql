-- Diete Coaching: initial schema
-- Run this in the Supabase SQL editor, or via `supabase db push`.

create extension if not exists "pgcrypto";

create type role as enum ('coach', 'coache');
create type meal as enum ('breakfast', 'lunch', 'dinner', 'snack');

-- One row per auth.users row, created right after sign-up by the app.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role role not null,
  full_name text not null,
  avatar_url text,
  coach_id uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index profiles_coach_id_idx on profiles (coach_id);

-- Foods: a per-user editable catalog. Entries can be forked from Open Food
-- Facts (off_code set, is_custom = false initially) or created from scratch
-- by a coach/coaché (is_custom = true). Nutrition values are per 100g.
create table foods (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references profiles (id) on delete cascade,
  off_code text,
  name text not null,
  brand text,
  image_url text,
  calories_per_100g numeric not null default 0,
  protein_per_100g numeric not null default 0,
  carbs_per_100g numeric not null default 0,
  fat_per_100g numeric not null default 0,
  is_custom boolean not null default true,
  created_at timestamptz not null default now()
);

create index foods_created_by_idx on foods (created_by);
create index foods_name_idx on foods using gin (to_tsvector('simple', name));

create table food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  food_id uuid not null references foods (id) on delete restrict,
  quantity_g numeric not null check (quantity_g > 0),
  meal meal not null,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index food_logs_user_id_logged_at_idx on food_logs (user_id, logged_at);

create table weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  weight_kg numeric not null check (weight_kg > 0),
  logged_at date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

create index weight_logs_user_id_logged_at_idx on weight_logs (user_id, logged_at);

create table training_programs (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references profiles (id) on delete cascade,
  coache_id uuid not null references profiles (id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create index training_programs_coache_id_idx on training_programs (coache_id);
create index training_programs_coach_id_idx on training_programs (coach_id);

create table program_exercises (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references training_programs (id) on delete cascade,
  name text not null,
  sets integer not null check (sets > 0),
  reps text not null,
  rest_seconds integer,
  order_index integer not null default 0,
  notes text
);

create index program_exercises_program_id_idx on program_exercises (program_id);

create table workout_logs (
  id uuid primary key default gen_random_uuid(),
  coache_id uuid not null references profiles (id) on delete cascade,
  program_id uuid references training_programs (id) on delete set null,
  performed_at timestamptz not null default now(),
  notes text
);

create index workout_logs_coache_id_idx on workout_logs (coache_id);

create table workout_set_logs (
  id uuid primary key default gen_random_uuid(),
  workout_log_id uuid not null references workout_logs (id) on delete cascade,
  exercise_name text not null,
  set_index integer not null,
  reps integer,
  weight_kg numeric
);

create index workout_set_logs_workout_log_id_idx on workout_set_logs (workout_log_id);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references profiles (id) on delete cascade,
  coache_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (coach_id, coache_id)
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  sender_id uuid not null references profiles (id) on delete cascade,
  body text not null check (char_length(body) > 0),
  created_at timestamptz not null default now()
);

create index messages_conversation_id_created_at_idx on messages (conversation_id, created_at);
