create table if not exists public.participants (
  id uuid primary key,
  full_name text not null,
  email text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key,
  participant_id uuid not null unique references public.participants(id) on delete cascade,
  score integer not null check (score between 0 and 20),
  elapsed_seconds integer not null check (elapsed_seconds between 0 and 600),
  answers jsonb not null,
  submitted_at timestamptz not null default now()
);

create index if not exists submissions_leaderboard_idx
  on public.submissions (score desc, elapsed_seconds asc, submitted_at asc);

alter table public.participants enable row level security;
alter table public.submissions enable row level security;

revoke all on public.participants from anon, authenticated;
revoke all on public.submissions from anon, authenticated;
grant all on public.participants to service_role;
grant all on public.submissions to service_role;

notify pgrst, 'reload schema';
