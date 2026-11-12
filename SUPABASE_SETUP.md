# Connect the quiz API to Supabase

1. In the Supabase dashboard, open **SQL Editor** and run `supabase/migrations/202611120001_create_quiz_tables.sql`.
2. Run `supabase/migrations/202611120002_create_competitions.sql` to connect participants to quizzes and enable the admin question bank, CSV import, winner records, and platform settings. It extends the existing competitions table to match the app.
3. Run `supabase/migrations/202611120003_competition_entry_codes.sql` to add unique participant entry codes.
4. Run `supabase/migrations/202611120004_user_accounts.sql` to enable participant email/password accounts and link registrations to accounts.
5. If you previously ran migration `202611120005_unique_event_registrations.sql`, run `supabase/migrations/202611120006_allow_shared_event_emails.sql` to allow multiple participants to use the same signed-in email for one competition. Account emails are still unique for signup and login.
6. Copy `.env.example` to `.env` and fill in your project's URL and **secret** API key, plus an admin email and password.
7. Restart the API with `npm run server`.

The API uses Supabase when both `SUPABASE_URL` and `SUPABASE_SECRET_KEY` are present. If they are missing, it uses the local JSON store in `backend/data/` so local development can continue. The Supabase secret key must stay in `.env`; never put it in frontend code or a `VITE_` environment variable.

Run the app in two terminal tabs:

```sh
npm run dev
```

```sh
npm run server
```
