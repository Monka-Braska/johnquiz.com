alter table public.competitions
  add column if not exists entry_code text;

update public.competitions
set entry_code = 'JQ-' || upper(right(replace(id::text, '-', ''), 6))
where entry_code is null or btrim(entry_code) = '';

alter table public.competitions
  alter column entry_code set not null;

create unique index if not exists competitions_entry_code_key
  on public.competitions (upper(entry_code));

notify pgrst, 'reload schema';
