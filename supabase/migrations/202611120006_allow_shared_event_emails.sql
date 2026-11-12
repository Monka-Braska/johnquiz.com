-- A shared account/email may register multiple participants for one competition.
-- Login accounts remain unique by email; this only removes the one-entry index.
drop index if exists public.participants_account_competition_unique;

notify pgrst, 'reload schema';
