# Devil's Advocate V2

Devil's Advocate is now a single Next.js app designed for Vercel deployment. The UI, server routes, Gemini integration, and optional Supabase share flow all live in one codebase.

## What is built

### Phase 1

- Next.js chat interface
- `POST /api/debate` Gemini route
- Intensity modes: `Casual`, `Intense`, `Savage`
- Topic picker with preset opening prompts

### Phase 2

- `POST /api/score` Gemini route
- Per-turn scoring for:
  - logic
  - evidence
  - clarity
- One-sentence improvement feedback under each user message

### Phase 3

- Supabase-backed debate saving
- Shareable debate URLs at `/debate/[id]`
- "Share this debate" button that saves the transcript and copies the link

## Project structure

```text
app/          Next.js pages and API routes
components/   UI components
lib/          Gemini and Supabase helpers
supabase/     SQL schema for the debates table

frontend/     legacy V1 Vite app
backend/      legacy V1 FastAPI app
```

The old `frontend/` and `backend/` folders are still present only as legacy V1 code. V2 runs from the repository root.

## Local setup

### 1. Install dependencies

```bash
cd "/Users/yousefwehbeh/Devil's Advocate"
npm install
```

### 2. Create a root environment file

Create a file named `.env.local` in the project root.

Use this template:

```env
GEMINI_API_KEY=your_real_gemini_key
GEMINI_MODEL=gemini-2.5-flash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Notes:

- Put the real Gemini key in `.env.local`, not in `.env.example`
- You do not need Supabase values yet to run chat and scoring locally
- Sharing will return an error until Supabase is configured

### 3. Run the app

```bash
npm run dev
```

Then open:

[http://localhost:3000](http://localhost:3000)

## Supabase setup

If you want Phase 3 sharing to work, create a Supabase project and run the SQL in:

[supabase/schema.sql](/Users/yousefwehbeh/Devil's%20Advocate/supabase/schema.sql)

You then need these root environment variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The app uses the service role key only on the server to save and load public debate transcripts.

## Vercel deployment

Deploy the repository root as a Next.js project on Vercel.

Set these environment variables in Vercel:

- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `NEXT_PUBLIC_SITE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Recommended values:

- `GEMINI_MODEL=gemini-2.5-flash`
- `NEXT_PUBLIC_SITE_URL=https://your-project-name.vercel.app`

If you are not using Supabase yet, you can leave the Supabase variables unset, but shared debate links will not work until they are added.

## API routes

- `/api/debate`
  - accepts conversation history plus intensity
  - returns the AI's opposing argument

- `/api/score`
  - accepts the user's message and AI reply
  - returns scores for logic, evidence, clarity, and one sentence of feedback

- `/api/debates`
  - saves a transcript to Supabase
  - returns a debate id for a shareable link

## Verification

The current root app passes:

- `npm install`
- `npm run build`

## Official references

- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/router-handlers)
- [Gemini generateContent API](https://ai.google.dev/api/generate-content)
- [Supabase JavaScript client](https://supabase.com/docs/reference/javascript/installing)
- [Vercel Supabase integration](https://vercel.com/integrations/supabase)
