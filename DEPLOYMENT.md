# LanternSAT — Deploy to mutalibov.uz (cPanel) + content management guide

The app is a React single-page app. The database, login and content all live in
your Supabase project, so cPanel only has to serve static files — no Node.js,
no PHP, no server configuration.

---

## 0. One-time: finish the database (run this SQL first)

Open Supabase → SQL Editor → New query, paste and run:

```sql
-- Lesson content (admin-writable, publicly readable)
create table if not exists public.lesson_content (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  video_url text,
  blocks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.lesson_content to anon, authenticated;
grant insert, update, delete on public.lesson_content to authenticated;
grant all on public.lesson_content to service_role;

alter table public.lesson_content enable row level security;

drop policy if exists "Lesson content is readable by everyone" on public.lesson_content;
create policy "Lesson content is readable by everyone"
  on public.lesson_content for select to anon, authenticated using (true);

drop policy if exists "Admins manage lesson content" on public.lesson_content;
create policy "Admins manage lesson content"
  on public.lesson_content for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop trigger if exists lesson_content_updated_at on public.lesson_content;
create trigger lesson_content_updated_at
  before update on public.lesson_content
  for each row execute function public.set_updated_at();

-- Per-user lesson progress (owner-only)
create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug)
);

grant select, insert, update, delete on public.lesson_progress to authenticated;
grant all on public.lesson_progress to service_role;

alter table public.lesson_progress enable row level security;

drop policy if exists "Users manage their own lesson progress" on public.lesson_progress;
create policy "Users manage their own lesson progress"
  on public.lesson_progress for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop trigger if exists lesson_progress_updated_at on public.lesson_progress;
create trigger lesson_progress_updated_at
  before update on public.lesson_progress
  for each row execute function public.set_updated_at();

create index if not exists lesson_progress_user_idx on public.lesson_progress (user_id);
```

This SQL is safe to run more than once. PostgreSQL does not support
`create trigger if not exists`, so each trigger is dropped with
`drop trigger if exists` and then recreated.

Make yourself an admin (needed for the manage pages):

```sql
insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'you@example.com'
on conflict do nothing;
```

---

## 1. Get the code

Push the project to GitHub from Lovable (GitHub button → Connect / Push).
Then on your computer:

```sh
git clone https://github.com/<you>/<repo>.git
cd <repo>
npm install
```

You need Node.js 20+ installed.

## 2. Build the uploadable files

```sh
npm run build:static
```

This creates **`dist/client/`**. That folder is the entire website:

```
dist/client/
├── index.html      ← the app shell
├── .htaccess       ← routing rules (hidden file — must be uploaded!)
├── favicon.ico
├── robots.txt
└── assets/         ← JS, CSS, fonts
```

Note: `_shell.html` is also produced; it is a duplicate of `index.html` and can be ignored.

## 3. Point mutalibov.uz at cPanel (Arsenal D domain)

In your Arsenal D account → domain → DNS / nameservers:

- **Easiest:** set the nameservers to the two nameservers your cPanel host gave
  you (usually `ns1.<host>.uz` / `ns2.<host>.uz`). Found in cPanel under
  *Server Information*.
- **Or keep Arsenal D DNS** and add records instead:
  - `A` record, host `@` → your cPanel server IP (cPanel → Server Information → Shared IP Address)
  - `A` record, host `www` → same IP

DNS changes take 15 minutes to a few hours. Check with https://dnschecker.org.

In cPanel, make sure the domain is attached: *Domains* → mutalibov.uz should
exist with document root `public_html` (or `public_html/lanternsat` for a
subfolder).

## 4. Upload with cPanel File Manager

1. cPanel → **File Manager** → open `public_html`.
2. Click **Settings** (top right) → check **Show Hidden Files (dotfiles)** →
   Save. Without this `.htaccess` will not be visible/uploadable.
3. Delete the default `index.html` / `default.php` placeholder if present.
4. Fastest upload: on your computer zip the **contents** of `dist/client`
   (not the folder itself) → in File Manager click **Upload** → pick the zip →
   back in `public_html` right-click the zip → **Extract** → delete the zip.
   - On macOS/Linux: `cd dist/client && zip -r ../site.zip . -x '.DS_Store'`
   - Make sure `.htaccess` ends up inside the zip (the `.` above includes it).
5. Verify `public_html` now contains `index.html`, `.htaccess` and `assets/`.
6. cPanel → **SSL/TLS Status** → *Run AutoSSL* so https works.
7. Visit https://mutalibov.uz — the landing page should load, and
   https://mutalibov.uz/dashboard should work after a refresh (that's what
   `.htaccess` guarantees).

### Updating the site later

```sh
git pull
npm install
npm run build:static
```

Then re-upload `dist/client` (replace `assets/`, `index.html`, keep `.htaccess`).
Old files in `assets/` can safely be deleted first for a clean slate.

## 5. Supabase settings for the live domain

Supabase → Authentication → URL Configuration:

- **Site URL:** `https://mutalibov.uz`
- **Redirect URLs:** add `https://mutalibov.uz/**` and `https://www.mutalibov.uz/**`

Without this, sign-up confirmation and password-reset links will send users to
the old preview URL.

---

## 6. Managing content

Sign in with your admin account, then open these URLs directly (the buttons are
intentionally hidden from students):

| What | URL |
| --- | --- |
| Practice questions | `https://mutalibov.uz/practice/manage` |
| Lessons / courses | `https://mutalibov.uz/courses/manage` |
| Reading passages | `https://mutalibov.uz/reading/manage` |
| Vocabulary | `https://mutalibov.uz/vocab/manage` |
| Mock exams | `https://mutalibov.uz/mocks/manage` |

Notes:
- Write access is enforced in the database: only rows in `user_roles` with role
  `admin` can insert/update/delete content. Students can only read.
- The Mock Exams page shows a centered "Coming soon" message until the first
  mock exam exists; it disappears automatically once you create one.
- Student data (notes, stars, correct/incorrect, "I understand this problem",
  lesson completion) is stored per user in `tracker_progress` and
  `lesson_progress` and syncs across devices.

## 7. Troubleshooting

| Symptom | Fix |
| --- | --- |
| Blank white page | `assets/` folder missing or uploaded into a subfolder; the site must sit directly in the domain's document root |
| 404 when refreshing `/dashboard` | `.htaccess` missing (enable hidden files and re-upload) |
| "Failed to fetch" / no data | Supabase project paused, or the domain isn't in Supabase Redirect URLs |
| Login email links point to lovable.app | Update Site URL in Supabase (step 5) |
| Old version keeps showing | Hard refresh (Ctrl/Cmd+Shift+R); hashed asset names prevent this normally |
