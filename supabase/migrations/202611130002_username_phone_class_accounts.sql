-- Switch participant accounts from email credentials to username credentials.
alter table public.user_accounts
  add column if not exists username text,
  add column if not exists phone text not null default '',
  add column if not exists class_level text not null default '';

alter table public.user_accounts alter column email drop not null;

with account_bases as (
  select id,
         case
           when length(left(coalesce(nullif(regexp_replace(lower(split_part(email, '@', 1)), '[^a-z0-9_.-]', '', 'g'), ''), 'player'), 20)) < 3
             then 'user_' || coalesce(nullif(regexp_replace(lower(split_part(email, '@', 1)), '[^a-z0-9_.-]', '', 'g'), ''), 'player')
           else left(coalesce(nullif(regexp_replace(lower(split_part(email, '@', 1)), '[^a-z0-9_.-]', '', 'g'), ''), 'player'), 20)
         end as base,
         created_at
  from public.user_accounts
  where username is null
), ranked as (
  select id, base, row_number() over (partition by base order by created_at, id) as position,
         count(*) over (partition by base) as matches
  from account_bases
)
update public.user_accounts as accounts
set username = case
  when ranked.matches = 1 then ranked.base
  else left(ranked.base, 13) || '_' || right(replace(ranked.id::text, '-', ''), 6)
end
from ranked
where accounts.id = ranked.id;

update public.user_accounts
set username = 'player_' || right(replace(id::text, '-', ''), 8)
where username is null or btrim(username) = '';

create unique index if not exists user_accounts_username_lower_key
  on public.user_accounts (lower(username));

alter table public.participants
  add column if not exists username text not null default '',
  add column if not exists class_level text not null default '';

update public.participants as people
set username = accounts.username,
    class_level = accounts.class_level
from public.user_accounts as accounts
where people.account_id = accounts.id
  and (people.username = '' or people.class_level = '');

update public.user_accounts as accounts
set phone = people.phone
from (
  select distinct on (account_id) account_id, phone
  from public.participants
  where account_id is not null and phone <> ''
  order by account_id, created_at desc
) as people
where accounts.id = people.account_id and accounts.phone = '';

notify pgrst, 'reload schema';
