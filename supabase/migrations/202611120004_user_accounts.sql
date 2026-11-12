create table if not exists public.user_accounts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_salt text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

alter table public.participants
  add column if not exists account_id uuid;

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'participants_account_id_fkey'
  ) then
    alter table public.participants add constraint participants_account_id_fkey
      foreign key (account_id) references public.user_accounts(id) on delete set null;
  end if;
end $$;

create index if not exists participants_account_id_idx
  on public.participants (account_id);

alter table public.user_accounts enable row level security;
revoke all on public.user_accounts from anon, authenticated;
grant all on public.user_accounts to service_role;

notify pgrst, 'reload schema';
