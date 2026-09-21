-- Bookable sessions (coach publishes open slots, coachés book them) and
-- pricing plans (showcase only — no payment processing in-app yet).

create type session_status as enum ('open', 'booked', 'cancelled');

create table sessions (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references profiles (id) on delete cascade,
  coache_id uuid references profiles (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  status session_status not null default 'open',
  notes text,
  created_at timestamptz not null default now()
);

create index sessions_coach_id_starts_at_idx on sessions (coach_id, starts_at);
create index sessions_coache_id_idx on sessions (coache_id);

create table pricing_plans (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references profiles (id) on delete cascade,
  name text not null,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'EUR',
  interval text not null default 'monthly' check (interval in ('once', 'monthly', 'quarterly', 'yearly')),
  description text,
  created_at timestamptz not null default now()
);

create index pricing_plans_coach_id_idx on pricing_plans (coach_id);

alter table sessions enable row level security;
alter table pricing_plans enable row level security;

-- sessions ----------------------------------------------------------------
-- Read: the coach sees all of their own slots; a coaché sees their coach's
-- open slots (to book) plus any slot already booked under their own id.
create policy "sessions: read own or coach's open slots" on sessions
  for select using (
    coach_id = auth.uid()
    or coache_id = auth.uid()
    or (status = 'open' and coach_id = my_coach_id())
  );

create policy "sessions: coach creates own slots" on sessions
  for insert with check (coach_id = auth.uid());

-- The coach can fully manage (edit/cancel) their own slots.
create policy "sessions: coach manages own slots" on sessions
  for update using (coach_id = auth.uid()) with check (coach_id = auth.uid());

create policy "sessions: coach deletes own slots" on sessions
  for delete using (coach_id = auth.uid());

-- A coaché can book one of their coach's open slots...
create policy "sessions: coache books an open slot" on sessions
  for update using (status = 'open' and coach_id = my_coach_id())
  with check (coache_id = auth.uid() and status = 'booked' and coach_id = my_coach_id());

-- ...and can cancel a slot they previously booked.
create policy "sessions: coache cancels own booking" on sessions
  for update using (coache_id = auth.uid())
  with check (coache_id = auth.uid());

-- pricing_plans -------------------------------------------------------------
create policy "pricing_plans: read own or coach's plans" on pricing_plans
  for select using (coach_id = auth.uid() or coach_id = my_coach_id());

create policy "pricing_plans: coach manages own plans" on pricing_plans
  for all using (coach_id = auth.uid()) with check (coach_id = auth.uid());
