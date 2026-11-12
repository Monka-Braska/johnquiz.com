# John quiz.com

John quiz.com is a React and Vite quiz competition platform with a Node API and Supabase storage. It includes public competition pages, participant accounts, timed quizzes, leaderboards, and a separate administrator area.

## Run locally

Install dependencies with `npm install`, then start the frontend and API in separate terminals:

```sh
npm run dev
```

```sh
npm run server
```

The frontend runs on the Vite development port. The API uses port `3001` by default.

## Configure Supabase

Copy `.env.example` to `.env`, add the Supabase project URL and secret key, and set unique admin credentials and session secrets. Keep `.env` private; it is excluded from Git. Follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md) to apply the database migrations.

Without Supabase settings, the API uses a local JSON store under `backend/data/`.
