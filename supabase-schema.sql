-- ============================================================
--  Mayen Family Hub — Supabase Schema
--  Paste this entire file into Supabase → SQL Editor → Run
-- ============================================================

-- CALENDAR EVENTS
create table if not exists calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date text not null,
  person text not null default 'Both',
  color text not null default 'bg-green-100 text-green-700 border-green-200',
  created_at timestamptz default now()
);
alter table calendar_events enable row level security;
create policy "Public access" on calendar_events for all using (true) with check (true);

-- TODO LISTS
create table if not exists todo_lists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);
alter table todo_lists enable row level security;
create policy "Public access" on todo_lists for all using (true) with check (true);

-- TODO ITEMS
create table if not exists todo_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid references todo_lists(id) on delete cascade,
  text text not null,
  done boolean default false,
  created_at timestamptz default now()
);
alter table todo_items enable row level security;
create policy "Public access" on todo_items for all using (true) with check (true);

-- SHOPPING ITEMS
create table if not exists shopping_items (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  category text not null default 'Other',
  done boolean default false,
  created_at timestamptz default now()
);
alter table shopping_items enable row level security;
create policy "Public access" on shopping_items for all using (true) with check (true);

-- NOTES
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text default '',
  tag text not null default 'General',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table notes enable row level security;
create policy "Public access" on notes for all using (true) with check (true);

-- IMMIGRATION STEPS
create table if not exists immigration_steps (
  id text primary key,
  status text not null default 'not-started',
  deadline text default '',
  updated_at timestamptz default now()
);
alter table immigration_steps enable row level security;
create policy "Public access" on immigration_steps for all using (true) with check (true);

-- IMMIGRATION DOCUMENTS
create table if not exists immigration_documents (
  id uuid primary key default gen_random_uuid(),
  step_id text references immigration_steps(id) on delete cascade,
  name text not null,
  done boolean default false,
  created_at timestamptz default now()
);
alter table immigration_documents enable row level security;
create policy "Public access" on immigration_documents for all using (true) with check (true);

-- SEED: Default todo lists
insert into todo_lists (name) values ('House Tasks'), ('Errands'), ('Work')
on conflict do nothing;

-- SEED: Immigration steps
insert into immigration_steps (id, status) values
  ('1', 'not-started'),
  ('2', 'not-started'),
  ('3', 'not-started'),
  ('4', 'not-started'),
  ('5', 'not-started')
on conflict (id) do nothing;

-- SEED: Default immigration documents
insert into immigration_documents (step_id, name, done) values
  ('1', 'Completed I-130 form', false),
  ('1', 'Marriage certificate (certified copy)', false),
  ('1', 'Passport photos', false),
  ('1', 'Filing fee payment', false),
  ('3', 'DS-261 (Online choice of agent)', false),
  ('3', 'Financial documents (I-864)', false),
  ('3', 'Civil documents (birth cert, police records)', false),
  ('4', 'I-693 Medical Examination form', false),
  ('4', 'Vaccination records', false),
  ('5', 'DS-260 (Immigrant Visa Application)', false),
  ('5', 'All original civil documents', false),
  ('5', 'Passport valid for 6+ months', false)
on conflict do nothing;
