# Duomo Records Website

React JS sayt layihəsi (`duomorecords.com`) üçün başlanğıc versiya.

## Hazır funksionallıq

- Çoxdilli routing: `/az`, `/ru`, `/en`
- Default açılış: `/az`
- Bölmələr: xidmətlər, paketlər, portfel, rezervasiya, əlaqə
- Google Calendar embed (env ilə dəyişir)
- Google Sheets webhook forması (env ilə işləyir)
- Vercel üçün SPA rewrite (`vercel.json`)

## Quraşdırma

```bash
npm install
npm run dev
```

## Environment variables

`.env` faylı yaradın (`.env.example` əsasında):

```bash
VITE_GOOGLE_CALENDAR_EMBED_URL=...
VITE_GOOGLE_SHEETS_WEBHOOK_URL=...
```

## Google Sheets inteqrasiyası

1. Google Sheet açın
2. Extensions -> Apps Script
3. `doPost(e)` endpoint yazın
4. Web app kimi deploy edin
5. URL-i `VITE_GOOGLE_SHEETS_WEBHOOK_URL` dəyişəninə əlavə edin

## Deploy (Vercel)

1. Repo-nu GitHub-a push edin
2. Vercel-də `New Project` -> GitHub repo seçin
3. Framework: `Vite`
4. Env variables əlavə edin
5. Deploy
# duomorecords
