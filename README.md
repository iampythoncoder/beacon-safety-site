# LaunchLab

LaunchLab is a full-stack platform that helps high school founders convert ideas into executable startup plans, matched competitions, and AI mentor guidance.

## Structure
- `/Users/saatviksantosh/Documents/New project/web` Next.js App Router + Tailwind frontend (multi-page product UI)
- `/Users/saatviksantosh/Documents/New project/api` Express + TypeScript backend (legacy endpoints)
- `/Users/saatviksantosh/Documents/New project/db` Supabase schema
- `/Users/saatviksantosh/Documents/New project/scripts` Seed script

## Required routes (App Router)
- `/overview`
- `/roadmap`
- `/competitions`
- `/pitches`
- `/plan`
- `/mentor`
- `/progress`
- `/feedback`

## Setup
1. Create a Supabase project and run `/Users/saatviksantosh/Documents/New project/db/schema.sql` in SQL Editor.
2. Seed competitions/pitches:
```
cd /Users/saatviksantosh/Documents/New project
npx tsx scripts/seed.ts
```
3. Add environment variables:

`/Users/saatviksantosh/Documents/New project/api/.env`
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.3-70b-versatile
PORT=4000
```

`/Users/saatviksantosh/Documents/New project/web/.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.3-70b-versatile
```

Notes:
- `SUPABASE_SERVICE_ROLE_KEY` is required server-side for Next.js route handlers.
- `GROQ_API_KEY` is only used server-side.

## Run
Option A (root script):
```
npm install
npm run dev
```

Option B (separate terminals):
```
cd /Users/saatviksantosh/Documents/New project/api
npm install
npm run dev
```

```
cd /Users/saatviksantosh/Documents/New project/web
npm install
npm run dev
```

## Key API routes (Next.js)
- `POST /api/generate/plan`
- `POST /api/generate/roadmap`
- `POST /api/groq/chat`
- `GET /api/onboarding/status?user_id=`
- `GET /api/projects/latest?user_id=`
- `GET /api/roadmap?project_id=`
- `GET /api/competitions`
- `GET /api/pitches`
- `POST /api/progress/log`
- `POST /api/progress/completeTask`
- `POST /api/feedback`

## Auth
Signup uses Supabase Auth (email/password). Configure Site URL + redirect URLs in Supabase Auth settings.

## Deployment
- Frontend: Vercel or Replit Hosting
- Backend: Render, Fly, or Replit Hosting
