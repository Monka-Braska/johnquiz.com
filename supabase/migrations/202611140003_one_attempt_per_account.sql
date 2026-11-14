create table if not exists public.participant_attempts (
  account_id uuid not null references public.user_accounts(id) on delete cascade,
  competition_id uuid not null references public.competitions(id) on delete cascade,
  reserved_at timestamptz not null default now(),
  primary key (account_id, competition_id)
);

insert into public.participant_attempts (account_id, competition_id)
select distinct participants.account_id, participants.competition_id
from public.participants
join public.submissions on submissions.participant_id = participants.id
where participants.account_id is not null
on conflict (account_id, competition_id) do nothing;

alter table public.participant_attempts enable row level security;
revoke all on public.participant_attempts from anon, authenticated;
grant all on public.participant_attempts to service_role;

notify pgrst, 'reload schema';
