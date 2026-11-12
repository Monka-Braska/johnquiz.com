alter table public.competitions
  add column if not exists question_count integer not null default 20 check (question_count between 1 and 20),
  add column if not exists max_participants integer not null default 1000 check (max_participants > 0),
  add column if not exists rules text not null default '';

insert into public.competitions (id, title, slug, description, duration_seconds, status, shuffle_questions, shuffle_options, question_count, max_participants, rules, prize_description)
values ('00000000-0000-4000-8000-000000000048', 'The Ultimate Knowledge Sprint', 'ultimate-knowledge-sprint', 'General knowledge · Advanced', 600, 'active', false, false, 20, 1000, 'One correct answer per question. Highest score wins; ties are broken by fastest completion time.', '₵2,500')
on conflict (id) do nothing;

alter table public.participants
  add column if not exists competition_id uuid not null default '00000000-0000-4000-8000-000000000048';

alter table public.questions
  add column if not exists category text not null default 'General knowledge',
  add column if not exists status text not null default 'published' check (status in ('draft', 'published'));

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'participants_competition_id_fkey'
  ) then
    alter table public.participants add constraint participants_competition_id_fkey
      foreign key (competition_id) references public.competitions(id) on delete cascade;
  end if;
end $$;

alter table public.competitions enable row level security;
revoke all on public.competitions from anon, authenticated;
grant all on public.competitions to service_role;

create table if not exists public.competition_winners (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  submission_id uuid not null unique references public.submissions(id) on delete cascade,
  declared_at timestamptz not null default now(),
  unique (competition_id, participant_id)
);

create table if not exists public.platform_settings (
  singleton boolean primary key default true check (singleton),
  platform_name text not null default 'John quiz.com',
  support_email text not null default 'hello@johnquiz.com',
  timezone text not null default 'Africa/Accra',
  date_format text not null default 'DD/MM/YYYY',
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (singleton) values (true) on conflict (singleton) do nothing;

alter table public.competition_winners enable row level security;
alter table public.platform_settings enable row level security;
revoke all on public.competition_winners from anon, authenticated;
revoke all on public.platform_settings from anon, authenticated;
grant all on public.competition_winners to service_role;
grant all on public.platform_settings to service_role;

notify pgrst, 'reload schema';
