-- ============================================================
--  FINANCIAL PLAN — DATABASE SETUP
--  Safe to publish. No keys, no data, no real email addresses.
-- ============================================================
--
--  WHAT THIS FILE IS FOR
--
--  The app is a single HTML file that keeps the whole plan as one
--  JSON blob. This script builds the two tables that blob lives in,
--  plus the rules deciding who may read or write it.
--
--  You run it once per Supabase project. After that the app works
--  without it — but keep the file, because it is the only place
--  three things are written down:
--
--    1. REBUILDING. Starting a fresh Supabase project (a deleted
--       project, a test copy, a migrated account) means running
--       this again. Without it you would be reconstructing the
--       tables, policies and allowlist from memory.
--
--    2. UNDOING A BAD EDIT. Two people share one plan and the last
--       save wins. Every save keeps a snapshot; the restore query
--       is at the bottom of this file. You will want it while
--       mildly panicked, which is the worst time to look up syntax.
--
--    3. GRANTING ACCESS. Adding an accountant or a family member
--       means editing the email list in is_household() below.
--
--  HOW TO RUN IT
--
--    Supabase dashboard -> SQL Editor -> New query -> paste this,
--    replace the two placeholder emails, press Run.
--    "Success. No rows returned" is what success looks like.
--
--  HOW SECURITY WORKS HERE
--
--    The app is served from a public URL and carries the Supabase
--    anon key in plain text. That is normal and safe: the anon key
--    only reaches the front door. Row Level Security, defined
--    below, is the lock. Every read and write is checked against
--    the signed-in account's email, so anyone not on the list is
--    refused by the database itself rather than by the app.
--
--    Never put the service_role key in the HTML file. That key
--    bypasses all of this.
--
-- ============================================================


-- ---------- 1. The plan ----------
-- One row, id = 'household', holding the entire plan as JSON.
-- A blob rather than columns means adding new tabs to the app
-- never requires a schema migration.

create table if not exists public.plan (
  id          text primary key,
  data        jsonb       not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  updated_by  text
);


-- ---------- 2. Who is allowed in ----------
-- REPLACE THESE before running. They must match the accounts made
-- under Authentication -> Users exactly, or you lock yourself out
-- of your own plan.

create or replace function public.is_household()
returns boolean
language sql stable
as $$
  select auth.jwt() ->> 'email' in (
    'first.person@example.com',
    'second.person@example.com'
  );
$$;

-- To add someone later, edit the list above and run just this
-- function block again. Existing data and policies are unaffected.


-- ---------- 3. The lock ----------
-- Policies are additive: with RLS on and nothing matching, the
-- answer is no. Each policy re-checks is_household(), so access
-- can never be inherited from merely holding the anon key.

alter table public.plan enable row level security;

drop policy if exists "household reads plan"   on public.plan;
drop policy if exists "household writes plan"  on public.plan;
drop policy if exists "household updates plan" on public.plan;

create policy "household reads plan"
  on public.plan for select
  to authenticated
  using ( public.is_household() );

create policy "household writes plan"
  on public.plan for insert
  to authenticated
  with check ( public.is_household() and id = 'household' );

create policy "household updates plan"
  on public.plan for update
  to authenticated
  using ( public.is_household() )
  with check ( public.is_household() and id = 'household' );


-- ---------- 4. Version history ----------
-- The app saves about a second after typing stops, so a session of
-- edits is a handful of writes rather than one per keystroke. Each
-- write snapshots the previous state here. 200 snapshots is roughly
-- a few weeks of ordinary use.

create table if not exists public.plan_history (
  id          bigserial primary key,
  data        jsonb       not null,
  saved_at    timestamptz not null default now(),
  saved_by    text
);

alter table public.plan_history enable row level security;

drop policy if exists "household reads history" on public.plan_history;
create policy "household reads history"
  on public.plan_history for select
  to authenticated
  using ( public.is_household() );

-- security definer so the trigger can write history even though the
-- table has no insert policy: history is written by the database,
-- never by the app.
create or replace function public.snapshot_plan()
returns trigger
language plpgsql security definer
as $$
begin
  insert into public.plan_history (data, saved_by)
  values (old.data, old.updated_by);
  delete from public.plan_history
   where id < (select max(id) - 200 from public.plan_history);
  return new;
end;
$$;

drop trigger if exists plan_snapshot on public.plan;
create trigger plan_snapshot
  before update on public.plan
  for each row execute function public.snapshot_plan();


-- ============================================================
--  RECIPES
-- ============================================================
--
--  UNDO A BAD EDIT
--    Find the version you want, then restore it. The restore is
--    itself an update, so the state being replaced gets snapshotted
--    too — the undo is undoable.
--
--      select id, saved_at, saved_by
--        from public.plan_history
--       order by id desc
--       limit 20;
--
--      update public.plan
--         set data = (select data from public.plan_history where id = 123)
--       where id = 'household';
--
--    Reload the app afterwards. Anyone with it open picks the change
--    up within 45 seconds.
--
--
--  SEE WHAT CHANGED AND WHEN
--
--      select id, saved_at, saved_by,
--             jsonb_pretty(data -> 'tax') as tax_section
--        from public.plan_history
--       order by id desc
--       limit 5;
--
--
--  BACK UP OUTSIDE SUPABASE
--    The Export JSON button in the app does this in one click and is
--    the better habit. From SQL:
--
--      select jsonb_pretty(data) from public.plan where id = 'household';
--
--
--  START OVER WITHOUT DELETING THE PROJECT
--
--      delete from public.plan where id = 'household';
--
--    The app reseeds the row from its built-in defaults on next load.
--
--
--  ADD A THIRD PERSON
--    Edit the email list in is_household() and re-run that function
--    block. Then create their account under Authentication -> Users
--    with Auto Confirm User switched on.
--
-- ============================================================
