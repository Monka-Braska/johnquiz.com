create unique index if not exists participants_account_competition_unique
  on public.participants (account_id, competition_id)
  where account_id is not null;

notify pgrst, 'reload schema';
