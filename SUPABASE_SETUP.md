# Connect the quiz API to Supabase

1. In the Supabase dashboard, open **SQL Editor** and run `supabase/migrations/202611120001_create_quiz_tables.sql`.
2. Run `supabase/migrations/202611120002_create_competitions.sql` to connect participants to quizzes and enable the admin question bank, CSV import, winner records, and platform settings. It extends the existing competitions table to match the app.
3. Run `supabase/migrations/202611120003_competition_entry_codes.sql` to add unique participant entry codes.
4. Run `supabase/migrations/202611120004_user_accounts.sql` to enable participant accounts and link registrations to accounts.
5. If you previously ran migration `202611120005_unique_event_registrations.sql`, run `supabase/migrations/202611120006_allow_shared_event_emails.sql` to allow multiple participant entries from one signed-in account for a competition.
6. Run `supabase/migrations/202611130002_username_phone_class_accounts.sql` to switch participant accounts to unique usernames and store phone and class/level details.
7. Run `supabase/migrations/202611140001_short_answer_law_questions.sql` to convert existing question keys and enable written-answer questions for law quizzes.
8. Run `supabase/migrations/202611140002_question_capacity_50.sql` to allow up to 50 questions per quiz and submission.
9. Run `supabase/migrations/202611140003_one_attempt_per_account.sql` to enforce one competition entry per signed-in account and competition.
10. Copy `.env.example` to `.env` and fill in your project's URL and **secret** API key, admin credentials, and session secrets.
11. Restart the API with `npm run server`.

The API uses Supabase when both `SUPABASE_URL` and `SUPABASE_SECRET_KEY` are present. If they are missing, it uses the local JSON store in `backend/data/` so local development can continue. The Supabase secret key must stay in `.env`; never put it in frontend code or a `VITE_` environment variable.

Run the app in two terminal tabs:

```sh
npm run dev
```

```sh
npm run server
```
