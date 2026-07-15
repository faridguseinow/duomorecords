# Duomo Records Website

React + Vite frontend for `duomorecords.com`.

## Stack

- React 19
- Vite 6
- react-router-dom
- JavaScript / JSX

## Routes

- `/az`, `/ru`, `/en`
- `/:lang/media-projects`
- `/:lang/blog`
- `/:lang/blog/:slug`
- `/:lang/profile`

## Current Stage

This stage connects the frontend to Supabase while keeping local fallback data:

- refreshed light-first visual system;
- dark theme with `localStorage` persistence;
- Supabase data layer for services, packages, projects, media, blog, Instagram and booking;
- local fallback data when Supabase env is missing or a section request fails;
- booking availability and creation through Supabase RPC;
- mobile bottom navigation;
- PWA meta preparation only.

Auth, admin panel, Telegram bot, courses backend and production PWA are intentionally not connected yet.

## Data

Mock data lives in:

- `src/data/site.js`

Supabase services and hooks live in:

- `src/lib/supabase.js`
- `src/services/`
- `src/hooks/`

Database setup lives in:

- `supabase/migrations/`
- `supabase/seed.sql`
- `supabase/README.md`

Create `.env` from `.env.example`:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Run

```bash
npm install
npm run dev
npm run build
```
