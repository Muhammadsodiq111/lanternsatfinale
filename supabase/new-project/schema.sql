-- =====================================================================
-- LanternSAT — COMPLETE SCHEMA for a fresh Supabase project
-- Target project: https://pgossdmcczrmabdjbupa.supabase.co
-- Paste into: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- Safe to run once on an empty project. Idempotent where practical.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------
create extension if not exists pgcrypto with schema public;

-- ---------------------------------------------------------------------
-- 1. Shared helpers
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. Roles (separate table — never store roles on profiles)
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'student');
  end if;
end
$$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

-- Security definer so RLS policies can call it without recursion.
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(auth.uid(), 'admin'::public.app_role);
$$;

grant execute on function public.has_role(uuid, public.app_role) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "Users can read their own roles" on public.user_roles;
create policy "Users can read their own roles"
  on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Admins manage roles" on public.user_roles;
create policy "Admins manage roles"
  on public.user_roles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 3. Profiles (application-side user record)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

drop policy if exists "Users read their own profile" on public.profiles;
create policy "Users read their own profile"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "Users insert their own profile" on public.profiles;
create policy "Users insert their own profile"
  on public.profiles for insert to authenticated
  with check (id = auth.uid());

drop policy if exists "Users update their own profile" on public.profiles;
create policy "Users update their own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile + default student role on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'student')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- 4. CONTENT TABLES (publicly readable, admin-writable)
-- =====================================================================

-- 4a. Practice question bank ------------------------------------------
create table if not exists public.practice_questions (
  id uuid primary key default gen_random_uuid(),
  subject text not null default 'math',
  module text not null,
  subtopic text not null default '',
  level text not null default 'medium',
  prompt text not null,
  choices jsonb not null default '[]'::jsonb,
  answer integer not null default 0,
  explanation jsonb not null default '[]'::jsonb,
  desmos jsonb not null default '[]'::jsonb,
  desmos_note text not null default '',
  sort_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint practice_questions_answer_check check (answer >= 0),
  constraint practice_questions_level_check
    check (level in ('easy', 'medium', 'hard', 'challenge'))
);

create index if not exists practice_questions_module_idx
  on public.practice_questions (subject, module, sort_index);

grant select on public.practice_questions to anon, authenticated;
grant insert, update, delete on public.practice_questions to authenticated;
grant all on public.practice_questions to service_role;
alter table public.practice_questions enable row level security;

drop policy if exists "Anyone can read practice questions" on public.practice_questions;
create policy "Anyone can read practice questions"
  on public.practice_questions for select to anon, authenticated using (true);

drop policy if exists "Admins manage practice questions" on public.practice_questions;
create policy "Admins manage practice questions"
  on public.practice_questions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop trigger if exists practice_questions_updated_at on public.practice_questions;
create trigger practice_questions_updated_at before update on public.practice_questions
  for each row execute function public.set_updated_at();

-- 4b. Mock exams -------------------------------------------------------
create table if not exists public.mock_exams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  sort_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.mock_exams to anon, authenticated;
grant insert, update, delete on public.mock_exams to authenticated;
grant all on public.mock_exams to service_role;
alter table public.mock_exams enable row level security;

drop policy if exists "Anyone can read mock exams" on public.mock_exams;
create policy "Anyone can read mock exams"
  on public.mock_exams for select to anon, authenticated using (true);

drop policy if exists "Admins manage mock exams" on public.mock_exams;
create policy "Admins manage mock exams"
  on public.mock_exams for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop trigger if exists mock_exams_updated_at on public.mock_exams;
create trigger mock_exams_updated_at before update on public.mock_exams
  for each row execute function public.set_updated_at();

-- 4c. Mock exam questions ---------------------------------------------
create table if not exists public.mock_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.mock_exams(id) on delete cascade,
  passage text not null default '',
  prompt text not null,
  choices jsonb not null default '[]'::jsonb,
  answer integer not null default 0,
  sort_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mock_questions_answer_check check (answer >= 0)
);

create index if not exists mock_questions_exam_idx
  on public.mock_questions (exam_id, sort_index);

grant select on public.mock_questions to anon, authenticated;
grant insert, update, delete on public.mock_questions to authenticated;
grant all on public.mock_questions to service_role;
alter table public.mock_questions enable row level security;

drop policy if exists "Anyone can read mock questions" on public.mock_questions;
create policy "Anyone can read mock questions"
  on public.mock_questions for select to anon, authenticated using (true);

drop policy if exists "Admins manage mock questions" on public.mock_questions;
create policy "Admins manage mock questions"
  on public.mock_questions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop trigger if exists mock_questions_updated_at on public.mock_questions;
create trigger mock_questions_updated_at before update on public.mock_questions
  for each row execute function public.set_updated_at();

-- 4d. Reading passages -------------------------------------------------
create table if not exists public.reading_passages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null default 'literature',
  difficulty text not null default 'medium',
  read_minutes integer not null default 3,
  body text not null default '',
  source text,
  is_daily_pick boolean not null default false,
  sort_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reading_passages_read_minutes_check check (read_minutes > 0)
);

create index if not exists reading_passages_sort_idx
  on public.reading_passages (sort_index, title);

grant select on public.reading_passages to anon, authenticated;
grant insert, update, delete on public.reading_passages to authenticated;
grant all on public.reading_passages to service_role;
alter table public.reading_passages enable row level security;

drop policy if exists "Anyone can read passages" on public.reading_passages;
create policy "Anyone can read passages"
  on public.reading_passages for select to anon, authenticated using (true);

drop policy if exists "Admins manage passages" on public.reading_passages;
create policy "Admins manage passages"
  on public.reading_passages for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop trigger if exists reading_passages_updated_at on public.reading_passages;
create trigger reading_passages_updated_at before update on public.reading_passages
  for each row execute function public.set_updated_at();

-- 4e. Vocabulary word bank --------------------------------------------
create table if not exists public.vocab_words (
  id uuid primary key default gen_random_uuid(),
  word text not null,
  definition text not null,
  example_sentence text,
  part_of_speech text not null default '',
  difficulty text not null default 'medium',
  category text not null default 'vocabulary',
  sort_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- required by the app's bulk import upsert (onConflict: "category,word")
  constraint vocab_words_category_word_key unique (category, word)
);

create index if not exists vocab_words_category_idx
  on public.vocab_words (category, sort_index, word);

grant select on public.vocab_words to anon, authenticated;
grant insert, update, delete on public.vocab_words to authenticated;
grant all on public.vocab_words to service_role;
alter table public.vocab_words enable row level security;

drop policy if exists "Anyone can read vocab words" on public.vocab_words;
create policy "Anyone can read vocab words"
  on public.vocab_words for select to anon, authenticated using (true);

drop policy if exists "Admins manage vocab words" on public.vocab_words;
create policy "Admins manage vocab words"
  on public.vocab_words for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop trigger if exists vocab_words_updated_at on public.vocab_words;
create trigger vocab_words_updated_at before update on public.vocab_words
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 5. PER-USER PROGRESS TABLES (owner-only access)
-- =====================================================================

-- 5a. Reading progress -------------------------------------------------
create table if not exists public.reading_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  passage_id uuid not null references public.reading_passages(id) on delete cascade,
  is_read boolean not null default false,
  highlights jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- required by the app's upsert (onConflict: "user_id,passage_id")
  constraint reading_progress_user_passage_key unique (user_id, passage_id)
);

create index if not exists reading_progress_user_idx on public.reading_progress (user_id);

grant select, insert, update, delete on public.reading_progress to authenticated;
grant all on public.reading_progress to service_role;
alter table public.reading_progress enable row level security;

drop policy if exists "Users manage their own reading progress" on public.reading_progress;
create policy "Users manage their own reading progress"
  on public.reading_progress for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop trigger if exists reading_progress_updated_at on public.reading_progress;
create trigger reading_progress_updated_at before update on public.reading_progress
  for each row execute function public.set_updated_at();

-- 5b. Vocabulary progress ---------------------------------------------
create table if not exists public.vocab_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  word_id uuid not null references public.vocab_words(id) on delete cascade,
  known boolean not null default false,
  flagged boolean not null default false,
  own_sentence text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- required by the app's upsert (onConflict: "user_id,word_id")
  constraint vocab_progress_user_word_key unique (user_id, word_id)
);

create index if not exists vocab_progress_user_idx on public.vocab_progress (user_id);

grant select, insert, update, delete on public.vocab_progress to authenticated;
grant all on public.vocab_progress to service_role;
alter table public.vocab_progress enable row level security;

drop policy if exists "Users manage their own vocab progress" on public.vocab_progress;
create policy "Users manage their own vocab progress"
  on public.vocab_progress for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop trigger if exists vocab_progress_updated_at on public.vocab_progress;
create trigger vocab_progress_updated_at before update on public.vocab_progress
  for each row execute function public.set_updated_at();

-- 5c. Vocabulary daily goal -------------------------------------------
create table if not exists public.vocab_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  daily_goal integer not null default 15,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- required by the app's upsert (onConflict: "user_id")
  constraint vocab_goals_user_key unique (user_id),
  constraint vocab_goals_daily_goal_check check (daily_goal between 1 and 500)
);

grant select, insert, update, delete on public.vocab_goals to authenticated;
grant all on public.vocab_goals to service_role;
alter table public.vocab_goals enable row level security;

drop policy if exists "Users manage their own vocab goals" on public.vocab_goals;
create policy "Users manage their own vocab goals"
  on public.vocab_goals for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop trigger if exists vocab_goals_updated_at on public.vocab_goals;
create trigger vocab_goals_updated_at before update on public.vocab_goals
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 6. Grant your own account admin rights (run AFTER you sign up once)
--    Replace the email below with your admin account's email.
-- =====================================================================
-- insert into public.user_roles (user_id, role)
-- select id, 'admin'::public.app_role from auth.users where email = 'you@example.com'
-- on conflict (user_id, role) do nothing;
