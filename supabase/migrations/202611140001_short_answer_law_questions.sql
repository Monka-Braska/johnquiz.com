alter table public.questions
  add column if not exists accepted_answers text[] not null default '{}';

alter table public.questions
  add column if not exists question_type text not null default 'short_answer';

alter table public.questions
  drop constraint if exists questions_question_type_check;

update public.questions q
set accepted_answers = converted.accepted,
    question_type = 'short_answer'
from (
  select question_id, array_agg(option_text order by position) as accepted
  from public.question_options
  where is_correct = true
  group by question_id
) converted
where converted.question_id = q.id
  and coalesce(cardinality(q.accepted_answers), 0) = 0;

update public.questions
set question_type = 'short_answer'
where question_type is distinct from 'short_answer';

notify pgrst, 'reload schema';
