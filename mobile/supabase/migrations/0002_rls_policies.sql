-- Row Level Security: a coaché only ever sees their own data (plus their
-- coach's profile), a coach sees their own coachés' data, nobody sees
-- across unrelated coach/coaché pairs.

-- Security-definer helpers so policies can safely look up the relationship
-- without triggering recursive RLS evaluation on `profiles`.
create function public.my_coach_id() returns uuid
  language sql security definer stable
  set search_path = public
  as $$
    select coach_id from profiles where id = auth.uid();
  $$;

create function public.is_coach_of(target uuid) returns boolean
  language sql security definer stable
  set search_path = public
  as $$
    select exists (select 1 from profiles where id = target and coach_id = auth.uid());
  $$;

alter table profiles enable row level security;
alter table foods enable row level security;
alter table food_logs enable row level security;
alter table weight_logs enable row level security;
alter table training_programs enable row level security;
alter table program_exercises enable row level security;
alter table workout_logs enable row level security;
alter table workout_set_logs enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;

-- profiles ------------------------------------------------------------
create policy "profiles: read own, own coach, or own coachés" on profiles
  for select using (
    id = auth.uid() or coach_id = auth.uid() or id = my_coach_id()
  );

create policy "profiles: insert own row" on profiles
  for insert with check (id = auth.uid());

create policy "profiles: update own row" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- foods -----------------------------------------------------------------
create policy "foods: read own or shared with coach relationship" on foods
  for select using (
    created_by = auth.uid() or is_coach_of(created_by) or my_coach_id() = created_by
  );

create policy "foods: insert own" on foods
  for insert with check (created_by = auth.uid());

create policy "foods: update own" on foods
  for update using (created_by = auth.uid()) with check (created_by = auth.uid());

create policy "foods: delete own" on foods
  for delete using (created_by = auth.uid());

-- food_logs ---------------------------------------------------------------
create policy "food_logs: read own or coached" on food_logs
  for select using (user_id = auth.uid() or is_coach_of(user_id));

create policy "food_logs: insert own" on food_logs
  for insert with check (user_id = auth.uid());

create policy "food_logs: update own" on food_logs
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "food_logs: delete own" on food_logs
  for delete using (user_id = auth.uid());

-- weight_logs ---------------------------------------------------------------
create policy "weight_logs: read own or coached" on weight_logs
  for select using (user_id = auth.uid() or is_coach_of(user_id));

create policy "weight_logs: insert own" on weight_logs
  for insert with check (user_id = auth.uid());

create policy "weight_logs: update own" on weight_logs
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "weight_logs: delete own" on weight_logs
  for delete using (user_id = auth.uid());

-- training_programs ---------------------------------------------------------
create policy "training_programs: read as coach or coache" on training_programs
  for select using (coach_id = auth.uid() or coache_id = auth.uid());

create policy "training_programs: coach creates for own coache" on training_programs
  for insert with check (coach_id = auth.uid() and is_coach_of(coache_id));

create policy "training_programs: coach updates own" on training_programs
  for update using (coach_id = auth.uid()) with check (coach_id = auth.uid());

create policy "training_programs: coach deletes own" on training_programs
  for delete using (coach_id = auth.uid());

-- program_exercises -----------------------------------------------------
create policy "program_exercises: read via program access" on program_exercises
  for select using (
    exists (
      select 1 from training_programs tp
      where tp.id = program_exercises.program_id
        and (tp.coach_id = auth.uid() or tp.coache_id = auth.uid())
    )
  );

create policy "program_exercises: coach writes via own program" on program_exercises
  for all using (
    exists (
      select 1 from training_programs tp
      where tp.id = program_exercises.program_id and tp.coach_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from training_programs tp
      where tp.id = program_exercises.program_id and tp.coach_id = auth.uid()
    )
  );

-- workout_logs ------------------------------------------------------------
create policy "workout_logs: read own or coached" on workout_logs
  for select using (coache_id = auth.uid() or is_coach_of(coache_id));

create policy "workout_logs: insert own" on workout_logs
  for insert with check (coache_id = auth.uid());

create policy "workout_logs: update own" on workout_logs
  for update using (coache_id = auth.uid()) with check (coache_id = auth.uid());

create policy "workout_logs: delete own" on workout_logs
  for delete using (coache_id = auth.uid());

-- workout_set_logs --------------------------------------------------------
create policy "workout_set_logs: read via workout access" on workout_set_logs
  for select using (
    exists (
      select 1 from workout_logs wl
      where wl.id = workout_set_logs.workout_log_id
        and (wl.coache_id = auth.uid() or is_coach_of(wl.coache_id))
    )
  );

create policy "workout_set_logs: write via own workout" on workout_set_logs
  for all using (
    exists (
      select 1 from workout_logs wl
      where wl.id = workout_set_logs.workout_log_id and wl.coache_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from workout_logs wl
      where wl.id = workout_set_logs.workout_log_id and wl.coache_id = auth.uid()
    )
  );

-- conversations -------------------------------------------------------------
create policy "conversations: read own" on conversations
  for select using (coach_id = auth.uid() or coache_id = auth.uid());

create policy "conversations: create within own coaching relationship" on conversations
  for insert with check (
    (coach_id = auth.uid() and is_coach_of(coache_id))
    or (coache_id = auth.uid() and my_coach_id() = coach_id)
  );

-- messages --------------------------------------------------------------
create policy "messages: read within own conversation" on messages
  for select using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and (c.coach_id = auth.uid() or c.coache_id = auth.uid())
    )
  );

create policy "messages: send within own conversation" on messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and (c.coach_id = auth.uid() or c.coache_id = auth.uid())
    )
  );
