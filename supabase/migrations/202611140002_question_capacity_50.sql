alter table public.questions
  drop constraint if exists questions_position_check;

alter table public.questions
  add constraint questions_position_check check (position between 0 and 49);

alter table public.competitions
  drop constraint if exists competitions_question_count_check;

alter table public.competitions
  add constraint competitions_question_count_check check (question_count between 1 and 50);

alter table public.submissions
  drop constraint if exists submissions_score_check;

alter table public.submissions
  add constraint submissions_score_check check (score between 0 and 50);

alter table public.submissions
  drop constraint if exists submissions_elapsed_seconds_check;

alter table public.submissions
  add constraint submissions_elapsed_seconds_check check (elapsed_seconds between 0 and 10800);

notify pgrst, 'reload schema';
