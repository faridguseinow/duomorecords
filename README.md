# Duomo Records Website

React + Vite website for `duomorecords.com` with multilingual routing and Google integrations.

## Live structure

- Languages: `/az` (default), `/ru`, `/en`
- Main sections:
- Services
- Packages (with booking CTA)
- Portfolio (Google Sheets, carousel on desktop/tablet, vertical on mobile)
- Collaborations (Google Sheets)
- Booking (Google Calendar availability + booking form)
- Contact
- Extra page: `/:lang/media-projects` (Google Sheets)

## Design setup

- Font: `Onest`
- Main colors:
- `--cream: #f2ede4`
- `--gold: #d4a853`
- `--gold-bright: #f0c870`
- Desktop: top navbar with dropdown burger menu
- Mobile: bottom nav (Home / Book / Media)

## Google integrations

### 1) Google Calendar

Two parts are used:

1. Keep booking calendar private (do not expose event details publicly).
2. Apps Script webhook (`VITE_GOOGLE_CALENDAR_WEBHOOK_URL`) for:
- `GET ?action=availability&date=YYYY-MM-DD`
- `POST { action: "book", name, phone, service, date, slot, details }`

The website now shows only free dates/slots for the next 30 days and does not render public event details.

Ready starter script: [docs/google-apps-script-calendar.js](/Users/a1111/Documents/My projects/Github/duomorecords/docs/google-apps-script-calendar.js)

### 2) Google Sheets (one spreadsheet, multiple sheets)

Expected worksheets:
- `portfolio`
- `media_projects`
- `collaborations`

Column structure: [docs/google-sheets-structure.md](/Users/a1111/Documents/My projects/Github/duomorecords/docs/google-sheets-structure.md)

## Environment variables

Create `.env` from `.env.example`.

## Run

```bash
npm install
npm run dev
npm run build
```

## Deploy to Vercel

1. Push repository to GitHub.
2. Import project in Vercel.
3. Add all `VITE_...` env vars.
4. Deploy.
