# Google Sheets Structure (Duomo Records)

Single spreadsheet, 3 worksheets:

## 1) Sheet: `portfolio`
Columns:
- `id`
- `title`
- `description`
- `image_url`
- `youtube_url`

Update frequency: 2 times per month.

## 2) Sheet: `media_projects`
Columns:
- `id`
- `title`
- `image_url`
- `project_url`

Update frequency: 2-3 times per month.

## 3) Sheet: `collaborations`
Columns:
- `id`
- `name`
- `description`
- `logo_url`
- `link_url`

Update frequency: 1 time per month.

## Important publication settings

1. Share spreadsheet access to "Anyone with the link" as Viewer.
2. Keep the first row as header names exactly as above.
3. Put each sheet gid in `.env`:
- `VITE_GOOGLE_SHEET_PORTFOLIO_GID`
- `VITE_GOOGLE_SHEET_MEDIA_GID`
- `VITE_GOOGLE_SHEET_COLLAB_GID`
